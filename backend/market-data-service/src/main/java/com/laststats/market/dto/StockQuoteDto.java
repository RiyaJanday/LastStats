package com.laststats.market.dto;

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
}
