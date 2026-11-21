package com.laststats.portfolio.controller;

<<<<<<< HEAD
import com.laststats.portfolio.dto.*;
import com.laststats.portfolio.entity.Portfolio;
import com.laststats.portfolio.entity.Transaction;
import com.laststats.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
=======
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

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/portfolios")
<<<<<<< HEAD
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {

=======
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PortfolioController {
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
<<<<<<< HEAD
    public ApiResponseWrapper<List<PortfolioSummaryDto>> list(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        UUID uid = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
        return new ApiResponseWrapper<>(true, portfolioService.getUserPortfolios(uid));
=======
    public ApiResponse<List<PortfolioSummaryDto>> list(Authentication authentication) {
        return ApiResponse.ok(portfolioService.list(userId(authentication)));
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
<<<<<<< HEAD
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
=======
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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
