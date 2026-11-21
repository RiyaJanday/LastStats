package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record HoldingDto(
        UUID id,
        String fundIsin,
        String fundName,
        String fundCategory,
        BigDecimal units,
        BigDecimal avgNav,
        BigDecimal currentNav,
        BigDecimal investedAmount,
        BigDecimal currentValue,
        BigDecimal gain,
        BigDecimal gainPercent
) {}
