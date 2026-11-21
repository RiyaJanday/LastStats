package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortfolioRepository extends JpaRepository<Portfolio, UUID> {
    List<Portfolio> findByUserId(UUID userId);
    Optional<Portfolio> findByIdAndUserId(UUID id, UUID userId);
}
