package com.laststats.portfolio.controller;

import com.laststats.portfolio.dto.*;
import com.laststats.portfolio.entity.Portfolio;
import com.laststats.portfolio.entity.Transaction;
import com.laststats.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/portfolios")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public ApiResponseWrapper<List<PortfolioSummaryDto>> list(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        UUID uid = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
        return new ApiResponseWrapper<>(true, portfolioService.getUserPortfolios(uid));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Portfolio create(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestParam(defaultValue = "My Portfolio") String name) {
        UUID uid = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
        return portfolioService.createPortfolio(uid, name);
    }

    @PostMapping("/{id}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction addTransaction(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody AddTransactionRequest req) {
        UUID uid = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
        return portfolioService.addTransaction(id, uid, req);
    }

    @GetMapping("/{id}/transactions")
    public List<Transaction> getTransactions(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        UUID uid = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
        return portfolioService.getTransactions(id, uid);
    }
}

class ApiResponseWrapper<T> {
    private boolean success;
    private T data;

    public ApiResponseWrapper() {}

    public ApiResponseWrapper(boolean success, T data) {
        this.success = success;
        this.data = data;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}