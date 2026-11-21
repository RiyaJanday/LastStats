package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
=======

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HoldingRepository extends JpaRepository<Holding, UUID> {
    List<Holding> findByPortfolioId(UUID portfolioId);
    Optional<Holding> findByPortfolioIdAndFundIsin(UUID portfolioId, String fundIsin);
}
