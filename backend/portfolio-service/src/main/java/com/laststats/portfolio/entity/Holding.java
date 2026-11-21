package com.laststats.portfolio.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.Instant;
=======

import java.math.BigDecimal;
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.util.UUID;

@Entity
@Table(name = "holdings")
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "fund_isin", nullable = false)
    private String fundIsin;

    @Column(name = "fund_name", nullable = false)
    private String fundName;

    @Column(name = "fund_category")
    private String fundCategory;

<<<<<<< HEAD
=======
    @Column(nullable = false)
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    private BigDecimal units = BigDecimal.ZERO;

    @Column(name = "avg_nav")
    private BigDecimal avgNav = BigDecimal.ZERO;

<<<<<<< HEAD
    @Column(name = "invested_amount")
    private BigDecimal investedAmount = BigDecimal.ZERO;

    @Column(name = "current_nav")
    private BigDecimal currentNav;

    @Column(name = "current_value")
    private BigDecimal currentValue;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public Holding() {}

    public Holding(UUID id, UUID portfolioId, String fundIsin, String fundName, String fundCategory, BigDecimal units, BigDecimal avgNav, BigDecimal investedAmount, BigDecimal currentNav, BigDecimal currentValue, Instant createdAt, Instant updatedAt) {
        this.id = id;
=======
    @Column(name = "current_nav")
    private BigDecimal currentNav = BigDecimal.ZERO;

    @Column(name = "invested_amount")
    private BigDecimal investedAmount = BigDecimal.ZERO;

    @Column(name = "current_value")
    private BigDecimal currentValue = BigDecimal.ZERO;

    public Holding() {}

    public Holding(UUID portfolioId, String fundIsin, String fundName, String fundCategory) {
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        this.portfolioId = portfolioId;
        this.fundIsin = fundIsin;
        this.fundName = fundName;
        this.fundCategory = fundCategory;
<<<<<<< HEAD
        this.units = units;
        this.avgNav = avgNav;
        this.investedAmount = investedAmount;
        this.currentNav = currentNav;
        this.currentValue = currentValue;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public String getFundIsin() { return fundIsin; }
    public void setFundIsin(String fundIsin) { this.fundIsin = fundIsin; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
    public String getFundCategory() { return fundCategory; }
    public void setFundCategory(String fundCategory) { this.fundCategory = fundCategory; }
    public BigDecimal getUnits() { return units; }
    public void setUnits(BigDecimal units) { this.units = units; }
    public BigDecimal getAvgNav() { return avgNav; }
    public void setAvgNav(BigDecimal avgNav) { this.avgNav = avgNav; }
    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }
    public BigDecimal getCurrentNav() { return currentNav; }
    public void setCurrentNav(BigDecimal currentNav) { this.currentNav = currentNav; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
=======
    }

    public UUID getId() { return id; }
    public UUID getPortfolioId() { return portfolioId; }
    public String getFundIsin() { return fundIsin; }
    public String getFundName() { return fundName; }
    public String getFundCategory() { return fundCategory; }

    public BigDecimal getUnits() { return units; }
    public void setUnits(BigDecimal units) { this.units = units; }

    public BigDecimal getAvgNav() { return avgNav; }
    public void setAvgNav(BigDecimal avgNav) { this.avgNav = avgNav; }

    public BigDecimal getCurrentNav() { return currentNav; }
    public void setCurrentNav(BigDecimal currentNav) { this.currentNav = currentNav; }

    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }

    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
}
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
