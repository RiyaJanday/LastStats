package com.laststats.portfolio.scheduler;

import com.laststats.portfolio.service.PortfolioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(SnapshotScheduler.class);

    private final PortfolioService portfolioService;

    public SnapshotScheduler(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    // Runs once a day at 00:05 server time — late enough that any
    // end-of-day transaction entries for "today" have already landed,
    // early enough that "today's" snapshot is ready before anyone
    // checks the Dashboard in the morning. Cron: sec min hour day month weekday.
    @Scheduled(cron = "0 5 0 * * *")
    public void runNightlySnapshot() {
        try {
            portfolioService.snapshotAll();
        } catch (Exception e) {
            // A failed snapshot run should never take the service down —
            // log it and let tomorrow's run (or a manual trigger) catch up.
            log.error("Nightly portfolio snapshot failed", e);
        }
    }
}
