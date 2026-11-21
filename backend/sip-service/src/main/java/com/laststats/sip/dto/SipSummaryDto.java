package com.laststats.sip.dto;

<<<<<<< HEAD
import lombok.*;
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

<<<<<<< HEAD
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
=======
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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
