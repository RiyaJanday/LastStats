package com.laststats.market.service;

import com.laststats.market.dto.NewsArticleDto;
import com.laststats.market.dto.NewsRefreshResultDto;
import com.laststats.market.dto.PagedNewsResponse;
import com.laststats.market.entity.NewsArticle;
import com.laststats.market.repository.NewsArticleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class NewsService {
    private static final int MAX_PAGE_SIZE = 100;

    private final NewsArticleRepository repository;
    private final NewsIngestionService ingestionService;

    public NewsService(NewsArticleRepository repository, NewsIngestionService ingestionService) {
        this.repository = repository;
        this.ingestionService = ingestionService;
    }

    /**
     * Backs GET /api/news (spec §14/§15/§16/§17). `country` filters against
     * either the country or region column (see NewsArticleRepository.search)
     * so it covers both country chips ("India") and region chips ("Europe")
     * from the same param. Always ordered published_at DESC — page 1 is
     * always the newest 20 rows in the archive at query time (spec §12).
     */
    public PagedNewsResponse list(String country, String category, String search, int page, int limit) {
        int pageIndex = Math.max(0, page - 1); // API is 1-indexed, Spring's Pageable is 0-indexed
        int pageSize = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        Page<NewsArticle> result = repository.search(blankToNull(country), blankToNull(category), blankToNull(search), pageable);
        Page<NewsArticleDto> dtoPage = result.map(NewsArticleDto::from);
        return PagedNewsResponse.from(dtoPage);
    }

    /**
     * Backs POST /api/news/refresh (spec §18). Only ever INSERTs — the
     * total after a refresh is always >= the total before it.
     */
    public NewsRefreshResultDto refresh() {
        int inserted = ingestionService.ingestAll();
        long total = repository.count();
        return new NewsRefreshResultDto(inserted, total);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank() || "All".equalsIgnoreCase(value)) ? null : value.trim();
    }
}
