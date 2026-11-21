package com.laststats.market.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laststats.market.dto.ExchangeDto;
import com.laststats.market.dto.ExchangeMasterEntry;
import com.laststats.market.dto.MarketIndexDto;
import com.laststats.market.dto.NewsItemDto;
import com.laststats.market.dto.StockQuoteDto;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Pulls quotes from Twelve Data (https://api.twelvedata.com) — a real, official
 * market-data API with a free tier and India-market coverage — and from
 * Yahoo Finance's unofficial-but-real chart/search endpoints for symbols
 * Twelve Data's free tier doesn't cover.
 *
 * HARD RULE: if no real provider answers for a symbol, this service returns
 * a DTO with dataAvailable=false and every numeric field null. It never
 * invents a price (no Math.random(), no symbol.hashCode()-derived numbers,
 * no hardcoded "looks current" values). Callers/UI must render
 * "Data not available" for dataAvailable=false rather than treating null as
 * zero.
 */
@Service
public class MarketDataService {
    private static final Logger log = LoggerFactory.getLogger(MarketDataService.class);

    private static final String SOURCE_TWELVE_DATA = "Twelve Data";
    private static final String SOURCE_YAHOO = "Yahoo Finance";

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.twelvedata.com")
            .build();

    // Twelve Data's free tier doesn't expose /quote for NSE/BSE ETFs or indices
    // (confirmed via /symbol_search: NIFTYBEES exists in their instrument DB but
    // /quote 404s regardless of symbol:exchange formatting — it's a plan-tier
    // gate, not a request-format bug). Yahoo Finance's unofficial chart endpoint
    // still serves the real indices (^NSEI, ^BSESN) directly, no key needed.
    // This is undocumented/unofficial and could change without notice, but it's
    // the only free source that actually returns this data right now.
    private final WebClient yahooClient = WebClient.builder()
            .baseUrl("https://query1.finance.yahoo.com")
            .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${twelvedata.api.key:}")
    private String apiKey;

    // The full exchange master reference list (150+ exchanges, every region,
    // whether or not we can pull live data for them) — loaded once at
    // startup from the static classpath resource. This is reference data
    // about *which exchanges exist*, never price data, so it's safe to
    // load once and keep in memory for the life of the service.
    private List<ExchangeMasterEntry> exchangeMaster = List.of();

    @PostConstruct
    void loadExchangeMaster() {
        try (InputStream in = getClass().getResourceAsStream("/exchanges.json")) {
            if (in == null) {
                log.error("exchanges.json not found on classpath — GET /api/market/exchanges will return an empty list");
                return;
            }
            ExchangeMasterEntry[] entries = mapper.readValue(in, ExchangeMasterEntry[].class);
            exchangeMaster = List.of(entries);
            log.info("Loaded {} exchanges from exchanges.json ({} with live data support)",
                    exchangeMaster.size(), exchangeMaster.stream().filter(ExchangeMasterEntry::marketDataSupported).count());
        } catch (Exception e) {
            log.error("Failed to load exchanges.json: {}", e.getMessage(), e);
        }
    }

    // Index definitions carry no price data of their own — just identity.
    // Real values are fetched live on every call; if a fetch fails the
    // entry comes back with dataAvailable=false, it is never dropped and
    // never backfilled with a stale/fake number.
    private record IndexDef(String key, String name, String region, String yahooSymbol) {}

    private static final List<IndexDef> HOME_INDEX_DEFS = List.of(
            new IndexDef("NIFTY50", "Nifty 50", "India", "^NSEI"),
            new IndexDef("SENSEX", "Sensex", "India", "^BSESN"),
            new IndexDef("SPX", "S&P 500", "USA", "^GSPC"),
            new IndexDef("IXIC", "NASDAQ", "USA", "^IXIC")
    );

    private static final List<IndexDef> WORLD_INDEX_DEFS = List.of(
            new IndexDef("NIFTY50", "Nifty 50", "India", "^NSEI"),
            new IndexDef("SENSEX", "Sensex", "India", "^BSESN"),
            new IndexDef("SPX", "S&P 500", "USA", "^GSPC"),
            new IndexDef("IXIC", "NASDAQ", "USA", "^IXIC"),
            new IndexDef("FTSE", "FTSE 100", "United Kingdom", "^FTSE"),
            new IndexDef("GDAXI", "DAX", "Germany", "^GDAXI"),
            new IndexDef("FCHI", "CAC 40", "France", "^FCHI"),
            new IndexDef("N225", "Nikkei 225", "Japan", "^N225"),
            new IndexDef("HSI", "Hang Seng", "Hong Kong", "^HSI"),
            new IndexDef("SSEC", "Shanghai Composite", "China", "000001.SS"),
            new IndexDef("BVSP", "Bovespa", "Brazil", "^BVSP"),
            new IndexDef("AXJO", "ASX 200", "Australia", "^AXJO")
    );

    /** Home/dashboard ticker — a small subset of worldIndices(). */
    public List<MarketIndexDto> indices() {
        List<MarketIndexDto> result = new ArrayList<>();
        for (IndexDef def : HOME_INDEX_DEFS) {
            result.add(fetchYahooIndex(def));
        }
        return result;
    }

    /** Full index set for the Markets page grid + world map. Every entry is
     * returned even when unavailable — the caller decides how to display
     * dataAvailable=false, we never just omit a tracked index. */
    public List<MarketIndexDto> worldIndices() {
        List<MarketIndexDto> result = new ArrayList<>();
        for (IndexDef def : WORLD_INDEX_DEFS) {
            result.add(fetchYahooIndex(def));
        }
        return result;
    }

    /**
     * Full exchange master list (every exchange in exchanges.json, every
     * region) merged with live quotes for the subset that has a
     * trackingKey we actually poll. Three distinct outcomes per exchange:
     *   - marketDataSupported=false: no attempt is made, no numeric fields
     *   - marketDataSupported=true, dataAvailable=false: we tried a real
     *     provider (Yahoo Finance) and it didn't return a usable price
     *   - marketDataSupported=true, dataAvailable=true: real value/changePercent
     * Every entry from the master list is returned — this endpoint never
     * drops an exchange just because live data isn't available for it.
     */
    public List<ExchangeDto> exchanges() {
        Map<String, IndexDef> byTrackingKey = WORLD_INDEX_DEFS.stream()
                .collect(Collectors.toMap(IndexDef::key, def -> def, (a, b) -> a));

        List<ExchangeDto> result = new ArrayList<>();
        for (ExchangeMasterEntry entry : exchangeMaster) {
            if (!entry.marketDataSupported() || entry.trackingKey() == null) {
                result.add(ExchangeDto.unsupported(entry));
                continue;
            }
            IndexDef def = byTrackingKey.get(entry.trackingKey());
            if (def == null) {
                log.warn("exchanges.json declares trackingKey {} for exchange {} but no matching live-data " +
                        "definition exists — treating as unavailable rather than fabricating a value",
                        entry.trackingKey(), entry.id());
                result.add(ExchangeDto.unsupported(entry));
                continue;
            }
            MarketIndexDto quote = fetchYahooIndex(def);
            result.add(ExchangeDto.from(entry, quote));
        }
        return result;
    }

    /**
     * Fetches one index from Yahoo Finance's unofficial chart endpoint
     * (query1.finance.yahoo.com/v8/finance/chart/{symbol}). Returns a
     * dataAvailable=false DTO (never a fake number) if the call fails or
     * the response doesn't contain a usable price.
     */
    private MarketIndexDto fetchYahooIndex(IndexDef def) {
        try {
            String response = yahooClient.get()
                    .uri("/v8/finance/chart/{symbol}", def.yahooSymbol())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = mapper.readTree(response);
            JsonNode result = root.path("chart").path("result");
            if (!result.isArray() || result.isEmpty()) {
                log.warn("Yahoo Finance returned no result for {}: {}", def.yahooSymbol(), response);
                return MarketIndexDto.unavailable(def.key(), def.name(), def.region());
            }
            JsonNode meta = result.get(0).path("meta");
            if (meta.path("regularMarketPrice").isMissingNode()) {
                log.warn("Yahoo Finance response for {} had no regularMarketPrice", def.yahooSymbol());
                return MarketIndexDto.unavailable(def.key(), def.name(), def.region());
            }
            double rawPrice = meta.path("regularMarketPrice").asDouble();
            double previousClose = meta.path("previousClose").asDouble(meta.path("chartPreviousClose").asDouble());
            BigDecimal price = BigDecimal.valueOf(rawPrice).setScale(2, java.math.RoundingMode.HALF_UP);
            double changePercent = previousClose != 0 ? ((rawPrice - previousClose) / previousClose) * 100 : 0;
            return MarketIndexDto.available(
                    def.key(), def.name(), def.region(), price,
                    BigDecimal.valueOf(changePercent).setScale(2, java.math.RoundingMode.HALF_UP),
                    // Yahoo's unofficial chart endpoint is not a guaranteed
                    // real-time feed, so we label it delayed rather than
                    // overclaiming "live".
                    true,
                    SOURCE_YAHOO
            );
        } catch (Exception e) {
            log.warn("Yahoo Finance call failed for {} ({}): {}", def.key(), def.yahooSymbol(), e.getMessage());
            return MarketIndexDto.unavailable(def.key(), def.name(), def.region());
        }
    }

    /**
     * Real financial headlines via Yahoo Finance's search endpoint
     * (v1/finance/search?newsCount=N) — this genuinely returns a "news"
     * array (title/publisher/link/providerPublishTime) alongside the quote
     * matches; we only use the news half here. Same unofficial-but-live
     * Yahoo Finance family the rest of this service already depends on.
     * Returns an empty list (not fabricated headlines) if the call fails.
     */
    public List<NewsItemDto> news() {
        try {
            String response = yahooClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/finance/search")
                            .queryParam("q", "stock market")
                            .queryParam("newsCount", 16)
                            .queryParam("quotesCount", 0)
                            .queryParam("lang", "en-US")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = mapper.readTree(response);
            JsonNode newsArray = root.path("news");
            List<NewsItemDto> items = new ArrayList<>();
            if (newsArray.isArray()) {
                for (JsonNode n : newsArray) {
                    String title = text(n, "title", "");
                    String link = text(n, "link", "");
                    if (title.isBlank() || link.isBlank()) continue;
                    items.add(new NewsItemDto(
                            title,
                            text(n, "publisher", "Unknown"),
                            link,
                            n.path("providerPublishTime").asLong(0)
                    ));
                }
            }
            return items;
        } catch (Exception e) {
            log.warn("Yahoo Finance news search failed: {}", e.getMessage());
            return List.of();
        }
    }

    public List<StockQuoteDto> search(String query) {
        String normalized = query == null || query.isBlank() ? "RELIANCE" : query.trim().toUpperCase(Locale.ROOT);
        List<String> symbols = normalized.contains(",") ? List.of(normalized.split(",")) : expandSymbol(normalized);
        return symbols.stream().map(String::trim).map(this::quote).flatMap(Optional::stream).toList();
    }

    /** Always returns a populated Optional: real data (dataAvailable=true)
     * or an explicit "not available" marker — never a fabricated price. */
    public Optional<StockQuoteDto> quote(String symbol) {
        // Twelve Data's free tier 404s on every NSE/BSE symbol we've tried
        // (indices, ETFs, and individual stocks) — this isn't a formatting
        // issue, that tier just doesn't serve Indian market data on /quote.
        // Route those to Yahoo Finance instead, which covers NSE (.NS) and
        // BSE (.BO) directly with no key required.
        if (symbol.contains(":NSE") || symbol.contains(":BSE") || symbol.endsWith(".NS") || symbol.endsWith(".BO")) {
            return Optional.of(yahooStockQuote(symbol));
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("TWELVEDATA_API_KEY is not set — returning dataAvailable=false for {}", symbol);
            return Optional.of(StockQuoteDto.unavailable(symbol, symbol));
        }
        // Twelve Data's /quote endpoint wants exchange as its own query param
        // rather than the SYMBOL:EXCHANGE shorthand (that shorthand is mainly
        // documented for batch/time_series requests and 404s here in practice).
        String tickerOnly = symbol.contains(":") ? symbol.substring(0, symbol.indexOf(':')) : symbol;
        String exchange = symbol.contains(":") ? symbol.substring(symbol.indexOf(':') + 1) : null;
        String uri = "/quote?symbol=" + tickerOnly + (exchange != null ? "&exchange=" + exchange : "") + "&apikey=" + apiKey;
        try {
            String response = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode q = mapper.readTree(response);

            if (q.has("code") || (q.has("status") && "error".equals(text(q, "status", "")))) {
                log.warn("Twelve Data returned an error for symbol {}: {}", symbol, response);
                return Optional.of(StockQuoteDto.unavailable(symbol, symbol));
            }
            if (q.get("close") == null) {
                log.warn("Twelve Data response for {} had no close price. Raw response: {}", symbol, response);
                return Optional.of(StockQuoteDto.unavailable(symbol, symbol));
            }

            BigDecimal price = decimal(q, "close");
            BigDecimal weekLow = q.has("fifty_two_week") ? decimal(q.get("fifty_two_week"), "low") : null;
            BigDecimal weekHigh = q.has("fifty_two_week") ? decimal(q.get("fifty_two_week"), "high") : null;

            return Optional.of(new StockQuoteDto(
                    text(q, "symbol", symbol),
                    text(q, "name", symbol),
                    price,
                    price,
                    decimal(q, "change"),
                    decimal(q, "percent_change"),
                    weekHigh,
                    weekLow,
                    true,
                    false,
                    SOURCE_TWELVE_DATA,
                    System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.warn("Twelve Data call failed for symbol {} (uri: {}): {}", symbol, uri.replace(apiKey, "***"), e.getMessage());
            return Optional.of(StockQuoteDto.unavailable(symbol, symbol));
        }
    }

    /**
     * Fetches an Indian stock quote from Yahoo Finance's chart endpoint.
     * Accepts either Twelve Data-style (RELIANCE:NSE) or Yahoo-style
     * (RELIANCE.NS) symbols and normalizes to Yahoo's suffix format.
     * Returns dataAvailable=false (never a fabricated price) on failure.
     */
    private StockQuoteDto yahooStockQuote(String originalSymbol) {
        String yahooSymbol;
        if (originalSymbol.contains(":")) {
            String ticker = originalSymbol.substring(0, originalSymbol.indexOf(':'));
            String exchange = originalSymbol.substring(originalSymbol.indexOf(':') + 1);
            yahooSymbol = ticker + ("NSE".equalsIgnoreCase(exchange) ? ".NS" : ".BO");
        } else {
            yahooSymbol = originalSymbol; // already .NS / .BO
        }

        try {
            String response = yahooClient.get()
                    .uri("/v8/finance/chart/{symbol}", yahooSymbol)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = mapper.readTree(response);
            JsonNode result = root.path("chart").path("result");
            if (!result.isArray() || result.isEmpty()) {
                log.warn("Yahoo Finance returned no result for {}: {}", yahooSymbol, response);
                return StockQuoteDto.unavailable(originalSymbol, originalSymbol);
            }
            JsonNode meta = result.get(0).path("meta");
            if (meta.path("regularMarketPrice").isMissingNode()) {
                log.warn("Yahoo Finance response for {} had no regularMarketPrice", yahooSymbol);
                return StockQuoteDto.unavailable(originalSymbol, originalSymbol);
            }
            double rawPrice = meta.path("regularMarketPrice").asDouble();
            double previousClose = meta.path("previousClose").asDouble(meta.path("chartPreviousClose").asDouble());
            double change = rawPrice - previousClose;
            double changePercent = previousClose != 0 ? (change / previousClose) * 100 : 0;
            BigDecimal price = BigDecimal.valueOf(rawPrice).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal weekHigh = meta.has("fiftyTwoWeekHigh")
                    ? BigDecimal.valueOf(meta.path("fiftyTwoWeekHigh").asDouble()).setScale(2, java.math.RoundingMode.HALF_UP)
                    : null;
            BigDecimal weekLow = meta.has("fiftyTwoWeekLow")
                    ? BigDecimal.valueOf(meta.path("fiftyTwoWeekLow").asDouble()).setScale(2, java.math.RoundingMode.HALF_UP)
                    : null;

            return new StockQuoteDto(
                    meta.path("symbol").asText(yahooSymbol),
                    meta.path("symbol").asText(yahooSymbol),
                    price,
                    price,
                    BigDecimal.valueOf(change).setScale(2, java.math.RoundingMode.HALF_UP),
                    BigDecimal.valueOf(changePercent).setScale(2, java.math.RoundingMode.HALF_UP),
                    weekHigh,
                    weekLow,
                    true,
                    true,
                    SOURCE_YAHOO,
                    System.currentTimeMillis()
            );
        } catch (Exception e) {
            log.warn("Yahoo Finance call failed for symbol {} (yahoo symbol: {}): {}", originalSymbol, yahooSymbol, e.getMessage());
            return StockQuoteDto.unavailable(originalSymbol, originalSymbol);
        }
    }

    public List<StockQuoteDto> quotes(List<String> symbols) {
        return symbols.stream().map(this::quote).flatMap(Optional::stream).toList();
    }

    /**
     * Converts Yahoo-style suffixed symbols (HDFCBANK.NS / HDFCBANK.BO) coming
     * from the frontend/search box into Twelve Data's SYMBOL:EXCHANGE format
     * (HDFCBANK:NSE / HDFCBANK:BSE). Plain symbols with no suffix are expanded
     * to try both Indian exchanges, matching the old Yahoo behaviour.
     */
    private List<String> expandSymbol(String symbol) {
        if (symbol.endsWith(".NS")) return List.of(symbol.substring(0, symbol.length() - 3) + ":NSE");
        if (symbol.endsWith(".BO")) return List.of(symbol.substring(0, symbol.length() - 3) + ":BSE");
        if (symbol.contains(":")) return List.of(symbol);
        return List.of(symbol + ":NSE", symbol + ":BSE");
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? fallback : value.asText();
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        try {
            return new BigDecimal(value.asText()).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
