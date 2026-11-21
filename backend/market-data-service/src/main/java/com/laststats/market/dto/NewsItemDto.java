package com.laststats.market.dto;

/**
 * One real headline from Yahoo Finance's search endpoint (v1/finance/search,
 * newsCount param) — same unofficial-but-live Yahoo Finance family the rest
 * of this service already relies on for index/stock quotes. publishedAt is
 * epoch seconds as returned by Yahoo (providerPublishTime); the frontend
 * formats it into a relative time.
 */
public record NewsItemDto(String title, String publisher, String link, long publishedAt) {}
