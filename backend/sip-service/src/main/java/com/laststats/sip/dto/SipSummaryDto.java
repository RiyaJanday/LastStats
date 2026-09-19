package com.laststats.sip.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SipSummaryDto(
        UUID id,
        UUID portfolioId,
        String fundIsin,
        String fundName,
        BigDecimal monthlyAmount,
        Integer sipDate,
        LocalDate startDate,
        String frequency,
        String status,
        boolean active,
        BigDecimal totalInvested,
        int installmentsCount,
        BigDecimal projectedValue5Y
) {}
