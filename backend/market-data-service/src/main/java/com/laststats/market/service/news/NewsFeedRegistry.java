package com.laststats.market.service.news;

import java.util.List;

/**
 * The list of RSS sources ingested for the Markets page's global news
 * (spec §5/§6/§28). Each entry is a real, publicly documented RSS feed —
 * no invented endpoints. That said, publishers change feed paths without
 * notice and this list wasn't live-verified from this environment (no
 * outbound network access here) — if a source consistently logs a fetch
 * warning in NewsIngestionService, check the outlet's current RSS URL and
 * update the entry below. A dead feed only removes that one source; it
 * never breaks ingestion for the others (see RssNewsProvider's per-feed
 * try/catch) or crashes the Markets page (spec §27).
 *
 * Reuters deliberately isn't included — Reuters discontinued its public
 * RSS feeds in 2020, so there is no legitimate free feed to point at.
 *
 * To add a source: add one line here. Nothing else needs to change —
 * NewsIngestionService iterates this list generically.
 */
public final class NewsFeedRegistry {
    private NewsFeedRegistry() {}

    public static List<NewsProvider> all() {
        return List.of(
                // United States
                rss("https://feeds.marketwatch.com/marketwatch/topstories/", "MarketWatch", "United States", "North America"),
                rss("https://finance.yahoo.com/news/rssindex", "Yahoo Finance", "United States", "North America"),
                rss("https://www.cnbc.com/id/100003114/device/rss/rss.html", "CNBC", "United States", "North America"),

                // United Kingdom / Europe
                rss("https://feeds.bbci.co.uk/news/business/rss.xml", "BBC Business", "United Kingdom", "Europe"),
                rss("https://www.theguardian.com/uk/business/rss", "The Guardian Business", "United Kingdom", "Europe"),
                rss("https://rss.dw.com/rdf/rss-en-bus", "DW Business", "Germany", "Europe"),

                // India
                rss("https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", "Economic Times Markets", "India", "Asia"),
                rss("https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms", "Economic Times Economy", "India", "Asia"),

                // Asia-Pacific
                rss("https://www.scmp.com/rss/91/feed", "South China Morning Post Business", "China", "Asia"),
                rss("https://www.abc.net.au/news/feed/51892/rss.xml", "ABC News Australia Business", "Australia", "Asia"),

                // Global / other regions — general-purpose finance wire,
                // used as the catch-all "Global" tag rather than assigning
                // it a single misleading country.
                rss("https://www.investing.com/rss/news.rss", "Investing.com", null, "Global")
        );
    }

    private static NewsProvider rss(String url, String source, String country, String region) {
        return new RssNewsProvider(url, source, country, region);
    }
}
