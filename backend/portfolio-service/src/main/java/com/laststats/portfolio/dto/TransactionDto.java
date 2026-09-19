package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionDto(
        UUID id,
        String fundIsin,
        String fundName,
        String fundCategory,
        String transactionType,
        BigDecimal units,
        BigDecimal nav,
        BigDecimal amount,
        LocalDate transactionDate,
        String folioNumber
) {}
