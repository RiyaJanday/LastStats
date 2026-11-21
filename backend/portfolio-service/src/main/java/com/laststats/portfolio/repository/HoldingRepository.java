package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HoldingRepository extends JpaRepository<Holding, UUID> {
    List<Holding> findByPortfolioId(UUID portfolioId);
    Optional<Holding> findByPortfolioIdAndFundIsin(UUID portfolioId, String fundIsin);
}
