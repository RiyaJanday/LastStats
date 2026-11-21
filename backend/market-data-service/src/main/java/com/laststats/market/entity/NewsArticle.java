package com.laststats.market.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * One permanently-archived news article (spec §8/§9). Rows are never
 * deleted or overwritten by a refresh — NewsIngestionService only INSERTs
 * rows that don't already exist (matched by uniqueHash), so this table
 * only ever grows. Pagination (NewsController/NewsArticleRepository) reads
 * straight off published_at DESC with LIMIT/OFFSET; there is no separate
 * "page assignment" step anywhere.
 */
@Entity
@Table(name = "news_articles")
public class NewsArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 120)
    private String source;

    @Column(name = "source_url", nullable = false, length = 1000)
    private String sourceUrl;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(length = 80)
    private String country;

    @Column(length = 80)
    private String region;

    @Column(nullable = false, length = 60)
    private String category = "Markets";

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    // sha256(source + "::" + normalizedTitle) — see NewsIngestionService.
    // The single field the Refresh flow's dedup check runs against.
    @Column(name = "unique_hash", nullable = false, unique = true, length = 64)
    private String uniqueHash;

    public NewsArticle() {}

    public NewsArticle(String title, String description, String source, String sourceUrl, String imageUrl,
                        String country, String region, String category, Instant publishedAt, Instant fetchedAt,
                        String uniqueHash) {
        this.title = title;
        this.description = description;
        this.source = source;
        this.sourceUrl = sourceUrl;
        this.imageUrl = imageUrl;
        this.country = country;
        this.region = region;
        this.category = category;
        this.publishedAt = publishedAt;
        this.fetchedAt = fetchedAt;
        this.uniqueHash = uniqueHash;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getSource() { return source; }
    public String getSourceUrl() { return sourceUrl; }
    public String getImageUrl() { return imageUrl; }
    public String getCountry() { return country; }
    public String getRegion() { return region; }
    public String getCategory() { return category; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getFetchedAt() { return fetchedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public String getUniqueHash() { return uniqueHash; }
}
