package com.laststats.market.controller;

import com.laststats.market.dto.NewsRefreshResultDto;
import com.laststats.market.dto.PagedNewsResponse;
import com.laststats.market.service.NewsService;
import org.springframework.web.bind.annotation.*;

/**
 * Global market news for the Markets page — separate from MarketController
 * (quotes/indices) since this is a distinct, DB-backed concern with its own
 * pagination contract (spec §14/§15).
 */
@RestController
@RequestMapping("/api/news")
public class NewsController {
    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    // GET /api/news?country=India&category=Stocks&search=rbi&page=1&limit=20
    // `country` matches either a country ("India") or a region ("Europe") —
    // see NewsArticleRepository.search. Omit a param (or pass "All") for no filter.
    @GetMapping
    public PagedNewsResponse list(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return newsService.list(country, category, search, page, limit);
    }

    // POST /api/news/refresh — fetches new articles, inserts only what's new,
    // never touches existing rows (spec §18). Frontend calls this from the
    // Refresh button instead of GET /api/news to get an explicit "N new" count.
    @PostMapping("/refresh")
    public NewsRefreshResultDto refresh() {
        return newsService.refresh();
    }
}
