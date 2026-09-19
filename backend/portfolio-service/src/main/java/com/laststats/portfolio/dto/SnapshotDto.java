package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SnapshotDto(
        LocalDate date,
        BigDecimal investedAmount,
        BigDecimal currentValue,
        BigDecimal gain,
        BigDecimal gainPercent
) {}
