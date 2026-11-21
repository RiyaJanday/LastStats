package com.laststats.market.scheduler;

import com.laststats.market.service.NewsIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background news refresh (spec §19) — runs independently of the frontend's
 * Refresh button so the archive stays current even if nobody has the
 * Markets page open. Same "never let one failure take the service down"
 * pattern as portfolio-service's SnapshotScheduler.
 */
@Component
public class NewsIngestionScheduler {
    private static final Logger log = LoggerFactory.getLogger(NewsIngestionScheduler.class);

    private final NewsIngestionService ingestionService;

    public NewsIngestionScheduler(NewsIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    // Every 7 minutes — inside the spec's requested 5-10 minute window
    // (§19). initialDelay gives the app a few seconds to finish starting
    // before the first run fires.
    @Scheduled(initialDelay = 15_000, fixedRate = 7 * 60 * 1000)
    public void runScheduledIngestion() {
        try {
            ingestionService.ingestAll();
        } catch (Exception e) {
            log.error("Scheduled news ingestion failed", e);
        }
    }
}
