package com.laststats.sip.repository;

import com.laststats.sip.entity.SipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SipPlanRepository extends JpaRepository<SipPlan, UUID> {
    List<SipPlan> findByPortfolioId(UUID portfolioId);
}
