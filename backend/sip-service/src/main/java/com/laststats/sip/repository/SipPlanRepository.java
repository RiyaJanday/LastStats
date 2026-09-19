package com.laststats.sip.repository;

import com.laststats.sip.entity.SipPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SipPlanRepository extends JpaRepository<SipPlan, UUID> {
    List<SipPlan> findByUserId(UUID userId);
    List<SipPlan> findByPortfolioIdAndUserId(UUID portfolioId, UUID userId);
    Optional<SipPlan> findByIdAndUserId(UUID id, UUID userId);
}
