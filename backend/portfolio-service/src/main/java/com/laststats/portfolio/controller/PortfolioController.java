package com.laststats.portfolio.controller;

import com.laststats.portfolio.dto.AddTransactionRequest;
import com.laststats.portfolio.dto.ApiResponse;
import com.laststats.portfolio.dto.PortfolioSummaryDto;
import com.laststats.portfolio.dto.SnapshotDto;
import com.laststats.portfolio.dto.TransactionDto;
import com.laststats.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/portfolios")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PortfolioController {
    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public ApiResponse<List<PortfolioSummaryDto>> list(Authentication authentication) {
        return ApiResponse.ok(portfolioService.list(userId(authentication)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PortfolioSummaryDto> create(Authentication authentication,
                                                    @RequestParam(defaultValue = "My Portfolio") String name) {
        return ApiResponse.ok("Portfolio created", portfolioService.create(userId(authentication), name));
    }

    @PostMapping("/{portfolioId}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDto> addTransaction(Authentication authentication,
                                                       @PathVariable UUID portfolioId,
                                                       @Valid @RequestBody AddTransactionRequest request) {
        return ApiResponse.ok("Transaction added", portfolioService.addTransaction(portfolioId, userId(authentication), request));
    }

    @GetMapping("/{portfolioId}/transactions")
    public List<TransactionDto> transactions(Authentication authentication, @PathVariable UUID portfolioId) {
        return portfolioService.transactions(portfolioId, userId(authentication));
    }

    // Combined performance-over-time across all of the user's portfolios —
    // powers the Dashboard's "Performance Trends" chart. range: 1W | 1M | 3M | 1Y | ALL
    @GetMapping("/history")
    public ApiResponse<List<SnapshotDto>> history(Authentication authentication,
                                                   @RequestParam(defaultValue = "1M") String range) {
        return ApiResponse.ok(portfolioService.history(userId(authentication), range));
    }

    // Forces a snapshot of one portfolio right now, instead of waiting for
    // the nightly job — handy right after seeding demo data, or for a user
    // who wants today's point to reflect a transaction they just logged.
    @PostMapping("/{portfolioId}/snapshot")
    public ApiResponse<SnapshotDto> snapshotNow(Authentication authentication, @PathVariable UUID portfolioId) {
        return ApiResponse.ok("Snapshot recorded", portfolioService.snapshotNow(portfolioId, userId(authentication)));
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
