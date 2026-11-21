package com.laststats.market.service.news;

import java.util.List;

/**
 * Abstraction over "somewhere we can pull real financial headlines from"
 * (spec §28) — RssNewsProvider is the only implementation today, but a
 * future keyed news API (NewsAPI.org, GNews, etc.) can implement this same
 * interface and drop straight into NewsFeedRegistry's list without
 * NewsIngestionService, NewsController, or the frontend changing at all.
 */
public interface NewsProvider {
    /** Display name stored on every article this provider produces, e.g. "BBC Business". */
    String sourceName();

    /** Country tag applied to every article from this provider, e.g. "United Kingdom". May be null for region-wide/global sources. */
    String defaultCountry();

    /** Broader region tag, e.g. "Europe", "Asia", "Global". */
    String defaultRegion();

    /**
     * Fetches the current headlines from this provider. Must NEVER throw —
     * implementations catch their own errors and return an empty list, so
     * one broken/rate-limited/unreachable source can never take down the
     * rest of a refresh run (spec §27).
     */
    List<RawNewsItem> fetch();
}
