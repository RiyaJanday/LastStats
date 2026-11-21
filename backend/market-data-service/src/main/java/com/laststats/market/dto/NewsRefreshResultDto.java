package com.laststats.market.dto;

// Response for POST /api/news/refresh — lets the frontend show
// "5 new articles" (spec §18/§20) instead of just re-showing page 1 blindly.
public record NewsRefreshResultDto(int newArticles, long totalArticles) {}
