package com.laststats.market.dto;

import java.math.BigDecimal;

/**
 * One row of the exchange master reference list (src/main/resources/exchanges.json),
 * merged with a live quote when the exchange has a trackingKey we actually poll.
 *
 * Three distinct states the frontend must render differently:
 *  - marketDataSupported=false            -> "No live data source for this exchange"
 *                                             (we don't even attempt a fetch)
 *  - marketDataSupported=true, dataAvailable=false -> "Data not available"
 *                                             (we tried a real provider and it failed)
 *  - marketDataSupported=true, dataAvailable=true   -> real value/changePercent
 *
 * value/changePercent are null unless dataAvailable is true — never a placeholder.
 */
public record ExchangeDto(
        String id,
        String name,
        String country,
        String countryCode,
        String region,
        String exchangeType,
        boolean marketDataSupported,
        String trackingKey,
        String indexName,
        String regionalGroup,
        BigDecimal value,
        BigDecimal changePercent,
        boolean dataAvailable,
        boolean delayed,
        String dataSource,
        Long lastUpdated
) {
    public static ExchangeDto unsupported(ExchangeMasterEntry e) {
        return new ExchangeDto(e.id(), e.name(), e.country(), e.countryCode(), e.region(), e.exchangeType(),
                false, e.trackingKey(), e.indexName(), e.regionalGroup(),
                null, null, false, false, null, null);
    }

    public static ExchangeDto from(ExchangeMasterEntry e, MarketIndexDto quote) {
        return new ExchangeDto(e.id(), e.name(), e.country(), e.countryCode(), e.region(), e.exchangeType(),
                true, e.trackingKey(), e.indexName(), e.regionalGroup(),
                quote.value(), quote.changePercent(), quote.dataAvailable(), quote.delayed(),
                quote.dataSource(), quote.lastUpdated());
    }
}
