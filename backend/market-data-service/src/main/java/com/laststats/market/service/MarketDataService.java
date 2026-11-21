package com.laststats.market.service;

import com.laststats.market.client.YahooFinanceClient;
import com.laststats.market.dto.MarketIndexDto;
import com.laststats.market.dto.StockQuoteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MarketDataService {

    private final YahooFinanceClient yahooClient;

    // World indices we always show on the Markets page
    private static final List<Map<String, String>> INDICES = List.of(
        Map.of("symbol", "%5ENSEI",  "name", "Nifty 50", "region", "India"),
        Map.of("symbol", "%5EBSESN", "name", "Sensex",   "region", "India"),
        Map.of("symbol", "%5EGSPC",  "name", "S&P 500",  "region", "USA"),
        Map.of("symbol", "%5EIXIC",  "name", "NASDAQ",   "region", "USA")
    );

    public List<MarketIndexDto> getWorldIndices() {
        List<MarketIndexDto> result = new ArrayList<>();
        for (Map<String, String> idx : INDICES) {
            yahooClient.getQuote(idx.get("symbol")).ifPresent(q ->
                result.add(MarketIndexDto.builder()
                        .symbol(idx.get("symbol"))
                        .name(idx.get("name"))
                        .region(idx.get("region"))
                        .price(q.getPrice())
                        .changePercent(q.getChangePercent())
                        .build())
            );
        }
        return result;
    }

    public Optional<StockQuoteDto> getQuote(String symbol) {
        return yahooClient.getQuote(symbol);
    }

    public List<StockQuoteDto> getMultipleQuotes(List<String> symbols) {
        List<StockQuoteDto> result = new ArrayList<>();
        for (String s : symbols) {
            yahooClient.getQuote(s).ifPresent(result::add);
        }
        return result;
    }
}
