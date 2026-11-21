package com.laststats.market.dto;

import java.math.BigDecimal;

/**
 * value/price/changePercent are null whenever dataAvailable is false —
 * NEVER a placeholder number. The frontend must render "Data not available"
 * in that case, not a zero or a stale figure.
 *
 * delayed distinguishes "real, current data" from "real, but not real-time"
 * data. dataSource records which provider actually answered, so the UI can
 * show it. lastUpdated is the epoch-millis timestamp the provider itself
 * reported (or when we fetched it), null when there's no data to time-stamp.
 */
public record MarketIndexDto(
        String symbol,
        String name,
        String region,
        BigDecimal value,
        BigDecimal price,
        BigDecimal changePercent,
        boolean dataAvailable,
        boolean delayed,
        String dataSource,
        Long lastUpdated
) {
    public static MarketIndexDto unavailable(String symbol, String name, String region) {
        return new MarketIndexDto(symbol, name, region, null, null, null, false, false, null, null);
    }

    public static MarketIndexDto available(String symbol, String name, String region, BigDecimal value,
                                            BigDecimal changePercent, boolean delayed, String dataSource) {
        return new MarketIndexDto(symbol, name, region, value, value, changePercent, true, delayed, dataSource,
                System.currentTimeMillis());
    }
}
