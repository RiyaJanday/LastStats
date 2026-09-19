package com.laststats.market.service.news;

import java.time.Instant;

/**
 * One headline as fetched from a provider, before it's classified into a
 * category or persisted. `imageUrl` is nullable — RSS feeds don't reliably
 * carry a usable image, and the frontend must handle its absence gracefully
 * (spec §27: "Handle... Missing images... Gracefully").
 */
public record RawNewsItem(String title, String description, String link, String imageUrl, Instant publishedAt) {}
