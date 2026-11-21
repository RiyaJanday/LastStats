package com.laststats.sip.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

// Includes calculated PROJECTIONS — how much this SIP could grow to
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SipSummaryDto {
    private UUID id;
    private String fundIsin;
    private String fundName;
    private BigDecimal monthlyAmount;
    private int sipDate;
    private LocalDate startDate;
    private boolean isActive;
    private BigDecimal totalInvested;
    private int installmentsCount;
    private BigDecimal projectedValue5Y;
}
