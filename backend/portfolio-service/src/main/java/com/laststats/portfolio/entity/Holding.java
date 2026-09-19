package com.laststats.portfolio.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
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

    @Column(nullable = false)
    private BigDecimal units = BigDecimal.ZERO;

    @Column(name = "avg_nav")
    private BigDecimal avgNav = BigDecimal.ZERO;

    @Column(name = "current_nav")
    private BigDecimal currentNav = BigDecimal.ZERO;

    @Column(name = "invested_amount")
    private BigDecimal investedAmount = BigDecimal.ZERO;

    @Column(name = "current_value")
    private BigDecimal currentValue = BigDecimal.ZERO;

    public Holding() {}

    public Holding(UUID portfolioId, String fundIsin, String fundName, String fundCategory) {
        this.portfolioId = portfolioId;
        this.fundIsin = fundIsin;
        this.fundName = fundName;
        this.fundCategory = fundCategory;
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
