package com.laststats.market.repository;

import com.laststats.market.entity.NewsArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NewsArticleRepository extends JpaRepository<NewsArticle, java.util.UUID> {

    // Dedup check used by NewsIngestionService before every insert (spec §10) —
    // called once per fetched item, not per page-load, so a per-hash query is
    // fine at this volume (a refresh run fetches at most a few hundred items).
    boolean existsByUniqueHash(String uniqueHash);

    // Backs GET /api/news. `region` matches against EITHER the country column
    // or the region column, because the frontend's filter chips mix both
    // levels (spec §4/§16: "US", "India" are countries; "Europe", "Asia",
    // "Middle East" are regions) — one filter param, two possible matches.
    // Every :param IS NULL branch means "this filter wasn't supplied" so the
    // same query serves the unfiltered "All" case too.
    @Query("""
            SELECT n FROM NewsArticle n
            WHERE (:region IS NULL OR n.country = :region OR n.region = :region)
              AND (:category IS NULL OR n.category = :category)
              AND (:search IS NULL
                   OR LOWER(n.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(n.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(n.source) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(n.country) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            ORDER BY n.publishedAt DESC
            """)
    Page<NewsArticle> search(@Param("region") String region,
                              @Param("category") String category,
                              @Param("search") String search,
                              Pageable pageable);

    // Used to report "N new articles" after a refresh (current total minus
    // the total before ingestion ran) — see NewsController's /refresh route.
    long count();

    List<NewsArticle> findTop50ByOrderByPublishedAtDesc();
}
