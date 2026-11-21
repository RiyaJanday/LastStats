package com.laststats.market.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class MarketIndexDto {
    private String symbol;
    private String name;
    private String region;
    private BigDecimal price;
    private BigDecimal changePercent;
}
