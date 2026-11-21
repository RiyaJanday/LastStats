package com.laststats.portfolio.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "portfolio_snapshots", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"portfolio_id", "snapshot_date"})
})
public class PortfolioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "invested_amount", nullable = false)
    private BigDecimal investedAmount;

    @Column(name = "current_value", nullable = false)
    private BigDecimal currentValue;

    @Column(nullable = false)
    private BigDecimal gain;

    @Column(name = "gain_percent", nullable = false)
    private BigDecimal gainPercent;

    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt;

    public PortfolioSnapshot() {}

    public PortfolioSnapshot(UUID portfolioId, LocalDate snapshotDate, BigDecimal investedAmount,
                              BigDecimal currentValue, BigDecimal gain, BigDecimal gainPercent) {
        this.portfolioId = portfolioId;
        this.snapshotDate = snapshotDate;
        this.investedAmount = investedAmount;
        this.currentValue = currentValue;
        this.gain = gain;
        this.gainPercent = gainPercent;
    }

    public UUID getId() { return id; }
    public UUID getPortfolioId() { return portfolioId; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public BigDecimal getGain() { return gain; }
    public void setGain(BigDecimal gain) { this.gain = gain; }
    public BigDecimal getGainPercent() { return gainPercent; }
    public void setGainPercent(BigDecimal gainPercent) { this.gainPercent = gainPercent; }
    public Instant getCreatedAt() { return createdAt; }
}
