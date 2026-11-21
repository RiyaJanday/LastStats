package com.laststats.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling added for NewsIngestionScheduler (periodic RSS refresh
// for the Markets page's news archive) — same pattern as portfolio-service's
// PortfolioServiceApplication/SnapshotScheduler.
@SpringBootApplication
@EnableScheduling
public class MarketDataApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketDataApplication.class, args);
    }
}
