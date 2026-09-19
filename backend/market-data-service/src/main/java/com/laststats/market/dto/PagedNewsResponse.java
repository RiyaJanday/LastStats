package com.laststats.market.dto;

import org.springframework.data.domain.Page;

import java.util.List;

// Matches the shape the spec calls for exactly (§15):
// { articles, page, pageSize, totalArticles, totalPages }
public record PagedNewsResponse(
        List<NewsArticleDto> articles,
        int page,
        int pageSize,
        long totalArticles,
        int totalPages
) {
    public static PagedNewsResponse from(Page<NewsArticleDto> page) {
        return new PagedNewsResponse(
                page.getContent(),
                page.getNumber() + 1, // Page is 0-indexed internally; API is 1-indexed per spec §14
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
