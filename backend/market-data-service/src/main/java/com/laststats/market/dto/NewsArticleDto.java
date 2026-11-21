package com.laststats.market.dto;

import com.laststats.market.entity.NewsArticle;

import java.time.Instant;
import java.util.UUID;

public record NewsArticleDto(
        UUID id,
        String title,
        String description,
        String source,
        String sourceUrl,
        String imageUrl,
        String country,
        String region,
        String category,
        Instant publishedAt
) {
    public static NewsArticleDto from(NewsArticle a) {
        return new NewsArticleDto(a.getId(), a.getTitle(), a.getDescription(), a.getSource(), a.getSourceUrl(),
                a.getImageUrl(), a.getCountry(), a.getRegion(), a.getCategory(), a.getPublishedAt());
    }
}
