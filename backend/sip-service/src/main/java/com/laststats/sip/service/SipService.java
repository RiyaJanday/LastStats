package com.laststats.sip.service;

import com.laststats.sip.dto.*;
import com.laststats.sip.entity.SipPlan;
import com.laststats.sip.repository.SipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SipService {

    private final SipPlanRepository sipRepo;

    @Transactional
    public SipPlan createSip(UUID portfolioId, CreateSipRequest req) {
        SipPlan sip = SipPlan.builder()
                .portfolioId(portfolioId)
                .fundIsin(req.getFundIsin())
                .fundName(req.getFundName())
                .monthlyAmount(req.getMonthlyAmount())
                .sipDate(req.getSipDate())
                .startDate(req.getStartDate())
                .build();
        return sipRepo.save(sip);
    }

    public List<SipSummaryDto> getPortfolioSips(UUID portfolioId) {
        return sipRepo.findByPortfolioId(portfolioId).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public void pauseSip(UUID sipId) {
        SipPlan sip = sipRepo.findById(sipId)
                .orElseThrow(() -> new NoSuchElementException("SIP not found"));
        sip.setActive(false);
        sipRepo.save(sip);
    }

    @Transactional
    public void resumeSip(UUID sipId) {
        SipPlan sip = sipRepo.findById(sipId)
                .orElseThrow(() -> new NoSuchElementException("SIP not found"));
        sip.setActive(true);
        sipRepo.save(sip);
    }

    // Future Value of SIP formula — standard compound interest for monthly investing
    // FV = P * [(1+r)^n - 1] / r * (1+r)
    private BigDecimal projectSipValue(BigDecimal monthly, int months, double annualRatePct) {
        double r = (annualRatePct / 100.0) / 12.0;   // monthly rate
        double fv = monthly.doubleValue() * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
        return BigDecimal.valueOf(fv).setScale(2, RoundingMode.HALF_UP);
    }

    private SipSummaryDto toSummary(SipPlan s) {
        long monthsActive = ChronoUnit.MONTHS.between(s.getStartDate(), LocalDate.now()) + 1;
        if (monthsActive < 0) monthsActive = 0;

        BigDecimal invested = s.getMonthlyAmount().multiply(BigDecimal.valueOf(monthsActive));

        return SipSummaryDto.builder()
                .id(s.getId())
                .fundIsin(s.getFundIsin())
                .fundName(s.getFundName())
                .monthlyAmount(s.getMonthlyAmount())
                .sipDate(s.getSipDate())
                .startDate(s.getStartDate())
                .isActive(s.isActive())
                .totalInvested(invested)
                .installmentsCount((int) monthsActive)
                // Assumes 12% annual return for 5-year projection
                .projectedValue5Y(projectSipValue(s.getMonthlyAmount(), 60, 12.0))
                .build();
    }
}
