package com.laststats.sip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSipRequest(
        @NotBlank String fundIsin,
        @NotBlank String fundName,
        @NotNull BigDecimal monthlyAmount,
        LocalDate startDate,
        String frequency,
        Integer sipDate
) {}
