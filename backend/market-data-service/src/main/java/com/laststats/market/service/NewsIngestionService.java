package com.laststats.market.service;

import com.laststats.market.entity.NewsArticle;
import com.laststats.market.repository.NewsArticleRepository;
import com.laststats.market.service.news.NewsCategoryClassifier;
import com.laststats.market.service.news.NewsFeedRegistry;
import com.laststats.market.service.news.NewsProvider;
import com.laststats.market.service.news.RawNewsItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Fetches every configured RSS source, deduplicates against what's already
 * archived, and INSERTs only genuinely new articles (spec §8/§10/§18).
 * Never deletes, never replaces, never clears the table — this is the one
 * place new rows enter news_articles, and it's additive-only by design.
 */
@Service
public class NewsIngestionService {
    private static final Logger log = LoggerFactory.getLogger(NewsIngestionService.class);

    private final NewsArticleRepository repository;
    private final List<NewsProvider> providers = NewsFeedRegistry.all();

    public NewsIngestionService(NewsArticleRepository repository) {
        this.repository = repository;
    }

    /**
     * Runs one full ingestion pass across every configured source.
     * Returns the number of genuinely new rows inserted (0 is a normal,
     * healthy result if nothing new has been published since the last run).
     *
     * Feeds are fetched in parallel (not one-by-one) — each RssNewsProvider
     * already has its own 8s connect/read timeout, so fetching sequentially
     * would make worst-case latency the SUM of every feed's timeout (with
     * 11 feeds, up to ~90s). Fetching concurrently instead makes worst-case
     * latency roughly the timeout of the SLOWEST single feed — this matters
     * because the frontend's Refresh button waits on this call synchronously.
     */
    public int ingestAll() {
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(providers.size(), 8));
        Map<NewsProvider, List<RawNewsItem>> fetched;
        try {
            List<CompletableFuture<Map.Entry<NewsProvider, List<RawNewsItem>>>> futures = providers.stream()
                    .map(provider -> CompletableFuture.supplyAsync(() -> Map.entry(provider, provider.fetch()), pool))
                    .toList();
            fetched = futures.stream()
                    .map(CompletableFuture::join) // provider.fetch() never throws, so join() is safe here
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        } finally {
            pool.shutdown();
            try {
                if (!pool.awaitTermination(15, TimeUnit.SECONDS)) pool.shutdownNow();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                pool.shutdownNow();
            }
        }

        int inserted = 0;
        for (NewsProvider provider : providers) {
            List<RawNewsItem> items = fetched.getOrDefault(provider, List.of());
            for (RawNewsItem item : items) {
                String hash = hash(provider.sourceName(), item.title());
                if (repository.existsByUniqueHash(hash)) continue; // already archived — skip, don't touch it

                String category = NewsCategoryClassifier.classify(item.title(), item.description());
                NewsArticle article = new NewsArticle(
                        item.title(),
                        item.description(),
                        provider.sourceName(),
                        item.link(),
                        item.imageUrl(),
                        provider.defaultCountry(),
                        provider.defaultRegion(),
                        category,
                        item.publishedAt(),
                        Instant.now(),
                        hash
                );
                try {
                    repository.save(article);
                    inserted++;
                } catch (Exception e) {
                    // Most likely a race on the unique_hash constraint (two
                    // overlapping refresh runs) — safe to skip, the row exists.
                    log.warn("Skipped duplicate/failed insert for '{}' from {}: {}", item.title(), provider.sourceName(), e.getMessage());
                }
            }
        }
        if (inserted > 0) {
            log.info("News ingestion: {} new article(s) archived", inserted);
        }
        return inserted;
    }

    private String hash(String source, String title) {
        String normalizedTitle = title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
        String basis = source.toLowerCase(Locale.ROOT) + "::" + normalizedTitle;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(basis.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            // SHA-256 is always available on any JVM — this branch is unreachable
            // in practice, but fall back to a basis-derived value rather than crash.
            return String.valueOf(basis.hashCode());
        }
    }
}
