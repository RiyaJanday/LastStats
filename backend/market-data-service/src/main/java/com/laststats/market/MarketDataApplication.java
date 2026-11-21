package com.laststats.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
<<<<<<< HEAD

@SpringBootApplication
=======
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling added for NewsIngestionScheduler (periodic RSS refresh
// for the Markets page's news archive) — same pattern as portfolio-service's
// PortfolioServiceApplication/SnapshotScheduler.
@SpringBootApplication
@EnableScheduling
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
public class MarketDataApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketDataApplication.class, args);
    }
}
