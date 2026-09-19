package com.laststats.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AddTransactionRequest(
        @NotBlank String fundIsin,
        @NotBlank String fundName,
        String fundCategory,
        @NotBlank String transactionType,
        @NotNull BigDecimal units,
        @NotNull BigDecimal nav,
        @NotNull BigDecimal amount,
        @NotNull LocalDate transactionDate,
        String folioNumber
) {}
