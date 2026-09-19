package com.laststats.sip.service;

import com.laststats.sip.dto.CreateSipRequest;
import com.laststats.sip.dto.ProjectionDto;
import com.laststats.sip.dto.SipSummaryDto;
import com.laststats.sip.entity.SipPlan;
import com.laststats.sip.repository.SipPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class SipService {

    private final SipPlanRepository sipPlanRepository;

    public SipService(SipPlanRepository sipPlanRepository) {
        this.sipPlanRepository = sipPlanRepository;
    }

    public List<SipSummaryDto> list(UUID userId) {
        return sipPlanRepository.findByUserId(userId).stream().map(this::toSummary).toList();
    }

    public List<SipSummaryDto> listByPortfolio(UUID portfolioId, UUID userId) {
        return sipPlanRepository.findByPortfolioIdAndUserId(portfolioId, userId).stream().map(this::toSummary).toList();
    }

    @Transactional
    public SipSummaryDto create(UUID userId, UUID portfolioId, CreateSipRequest request) {
        SipPlan plan = new SipPlan();
        plan.setUserId(userId);
        plan.setPortfolioId(portfolioId);
        plan.setFundIsin(request.fundIsin());
        plan.setFundName(request.fundName());
        plan.setMonthlyAmount(request.monthlyAmount());
        plan.setSipDate(request.sipDate() == null ? 1 : request.sipDate());
        plan.setStartDate(request.startDate() == null ? LocalDate.now() : request.startDate());
        plan.setFrequency(request.frequency() == null ? "MONTHLY" : request.frequency());
        plan.setActive(true);
        plan = sipPlanRepository.save(plan);
        return toSummary(plan);
    }

    @Transactional
    public void pause(UUID id, UUID userId) {
        SipPlan plan = get(id, userId);
        plan.setActive(false);
        sipPlanRepository.save(plan);
    }

    @Transactional
    public void resume(UUID id, UUID userId) {
        SipPlan plan = get(id, userId);
        plan.setActive(true);
        sipPlanRepository.save(plan);
    }

    public ProjectionDto projection(UUID id, UUID userId, int years, double annualReturnPct) {
        SipPlan plan = get(id, userId);
        int months = years * 12;
        BigDecimal invested = plan.getMonthlyAmount().multiply(BigDecimal.valueOf(months));
        BigDecimal projected = project(plan.getMonthlyAmount(), months, annualReturnPct);
        return new ProjectionDto(invested, projected, projected.subtract(invested), years);
    }

    private SipPlan get(UUID id, UUID userId) {
        return sipPlanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("SIP not found"));
    }

    private SipSummaryDto toSummary(SipPlan plan) {
        int months = (int) Math.max(0, ChronoUnit.MONTHS.between(plan.getStartDate(), LocalDate.now()) + 1);
        BigDecimal invested = plan.getMonthlyAmount().multiply(BigDecimal.valueOf(months));
        return new SipSummaryDto(plan.getId(), plan.getPortfolioId(), plan.getFundIsin(), plan.getFundName(),
                plan.getMonthlyAmount(), plan.getSipDate(), plan.getStartDate(), plan.getFrequency(),
                plan.isActive() ? "ACTIVE" : "PAUSED", plan.isActive(), invested, months,
                project(plan.getMonthlyAmount(), 60, 12.0));
    }

    private BigDecimal project(BigDecimal monthly, int months, double annualReturnPct) {
        double rate = (annualReturnPct / 100.0) / 12.0;
        if (rate == 0) return monthly.multiply(BigDecimal.valueOf(months));
        double futureValue = monthly.doubleValue() * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
        return BigDecimal.valueOf(futureValue).setScale(2, RoundingMode.HALF_UP);
    }
}
