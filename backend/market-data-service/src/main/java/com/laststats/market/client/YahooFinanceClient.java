package com.laststats.market.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laststats.market.dto.StockQuoteDto;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.math.BigDecimal;
import java.util.Optional;

// Calls Yahoo Finance's public quote endpoint
// No API key needed, but Yahoo requires a browser-like User-Agent
@Component
public class YahooFinanceClient {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://query1.finance.yahoo.com")
            .defaultHeader("User-Agent", "Mozilla/5.0")
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public Optional<StockQuoteDto> getQuote(String symbol) {
        try {
            String url = "/v8/finance/quote?symbols=" + symbol;
            String response = webClient.get().uri(url)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = mapper.readTree(response);
            JsonNode results = root.path("quoteResponse").path("result");
            if (results.isEmpty()) return Optional.empty();

            JsonNode q = results.get(0);
            return Optional.of(StockQuoteDto.builder()
                    .symbol(symbol)
                    .name(text(q, "shortName"))
                    .price(decimal(q, "regularMarketPrice"))
                    .change(decimal(q, "regularMarketChange"))
                    .changePercent(decimal(q, "regularMarketChangePercent"))
                    .weekHigh52(decimal(q, "fiftyTwoWeekHigh"))
                    .weekLow52(decimal(q, "fiftyTwoWeekLow"))
                    .build());

        } catch (Exception e) {
            return Optional.empty();   // if Yahoo fails, just return nothing
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode n = node.get(field);
        return (n != null && !n.isNull()) ? n.asText() : "";
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode n = node.get(field);
        if (n == null || n.isNull()) return null;
        try { return new BigDecimal(n.asText()); }
        catch (Exception e) { return null; }
    }
}
