package com.laststats.sip.service;

<<<<<<< HEAD
import com.laststats.sip.dto.*;
import com.laststats.sip.entity.SipPlan;
import com.laststats.sip.repository.SipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
=======
import com.laststats.sip.dto.CreateSipRequest;
import com.laststats.sip.dto.ProjectionDto;
import com.laststats.sip.dto.SipSummaryDto;
import com.laststats.sip.entity.SipPlan;
import com.laststats.sip.repository.SipPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
<<<<<<< HEAD
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
=======

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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    }
}
