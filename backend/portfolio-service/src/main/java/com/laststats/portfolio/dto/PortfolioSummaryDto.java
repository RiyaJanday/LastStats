package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PortfolioSummaryDto(
        UUID id,
        String name,
        BigDecimal totalInvested,
        BigDecimal currentValue,
        BigDecimal totalGain,
        BigDecimal totalGainPercent,
        int holdingsCount,
        List<HoldingDto> holdings
) {}
