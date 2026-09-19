package com.laststats.market.dto;

import java.math.BigDecimal;

/**
 * price/change/changePercent/weekHigh52/weekLow52 are null whenever
 * dataAvailable is false — NEVER a hash-derived or otherwise invented
 * number. See MarketIndexDto for the same contract applied to indices.
 */
public record StockQuoteDto(
        String symbol,
        String name,
        BigDecimal price,
        BigDecimal lastPrice,
        BigDecimal change,
        BigDecimal changePercent,
        BigDecimal weekHigh52,
        BigDecimal weekLow52,
        boolean dataAvailable,
        boolean delayed,
        String dataSource,
        Long lastUpdated
) {
    public static StockQuoteDto unavailable(String symbol, String name) {
        return new StockQuoteDto(symbol, name, null, null, null, null, null, null, false, false, null, null);
    }
}
