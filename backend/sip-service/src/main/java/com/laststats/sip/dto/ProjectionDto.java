package com.laststats.sip.dto;

import java.math.BigDecimal;

public record ProjectionDto(BigDecimal totalInvested, BigDecimal projectedValue, BigDecimal estimatedGain, int years) {}
