package com.laststats.market.dto;

<<<<<<< HEAD
import lombok.*;
import java.math.BigDecimal;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class StockQuoteDto {
    private String symbol;
    private String name;
    private BigDecimal price;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal weekHigh52;
    private BigDecimal weekLow52;
=======
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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
}
