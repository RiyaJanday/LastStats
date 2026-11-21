package com.laststats.market.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Raw shape of one entry in the static exchanges.json reference file
 * (src/main/resources/exchanges.json). This is the MASTER REFERENCE LIST —
 * every stock exchange we know about, whether or not we can pull live data
 * for it. trackingKey/indexName/regionalGroup are null when not applicable.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExchangeMasterEntry(
        String id,
        String name,
        String country,
        String countryCode,
        String region,
        String exchangeType,
        boolean marketDataSupported,
        String trackingKey,
        String indexName,
        String regionalGroup
) {
}
