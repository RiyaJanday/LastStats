package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, UUID> {

    Optional<PortfolioSnapshot> findByPortfolioIdAndSnapshotDate(UUID portfolioId, LocalDate snapshotDate);

    List<PortfolioSnapshot> findByPortfolioIdAndSnapshotDateGreaterThanEqualOrderBySnapshotDateAsc(
            UUID portfolioId, LocalDate from);

    // Sums invested/current value across every portfolio a user owns,
    // grouped by day — this is what powers the combined Dashboard chart
    // for users with more than one portfolio. Gain/gain% are derived
    // from these sums in the service layer rather than averaged here,
    // since percentages don't sum correctly.
    @Query("""
            SELECT s.snapshotDate, SUM(s.investedAmount), SUM(s.currentValue)
            FROM PortfolioSnapshot s
            WHERE s.portfolioId IN :portfolioIds
              AND (:from IS NULL OR s.snapshotDate >= :from)
            GROUP BY s.snapshotDate
            ORDER BY s.snapshotDate ASC
            """)
    List<Object[]> aggregateByPortfolioIds(@Param("portfolioIds") List<UUID> portfolioIds, @Param("from") LocalDate from);
}
