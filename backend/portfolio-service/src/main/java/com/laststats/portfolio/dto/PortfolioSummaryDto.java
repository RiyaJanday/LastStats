package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class PortfolioSummaryDto {
    private UUID id;
    private String name;
    private BigDecimal totalInvested;
    private BigDecimal currentValue;
    private BigDecimal totalGain;
    private BigDecimal totalGainPercent;
    private int holdingsCount;
    private List<HoldingDto> holdings;

    public PortfolioSummaryDto() {}

    public PortfolioSummaryDto(UUID id, String name, BigDecimal totalInvested, BigDecimal currentValue, BigDecimal totalGain, BigDecimal totalGainPercent, int holdingsCount, List<HoldingDto> holdings) {
        this.id = id;
        this.name = name;
        this.totalInvested = totalInvested;
        this.currentValue = currentValue;
        this.totalGain = totalGain;
        this.totalGainPercent = totalGainPercent;
        this.holdingsCount = holdingsCount;
        this.holdings = holdings;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getTotalInvested() { return totalInvested; }
    public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public BigDecimal getTotalGain() { return totalGain; }
    public void setTotalGain(BigDecimal totalGain) { this.totalGain = totalGain; }
    public BigDecimal getTotalGainPercent() { return totalGainPercent; }
    public void setTotalGainPercent(BigDecimal totalGainPercent) { this.totalGainPercent = totalGainPercent; }
    public int getHoldingsCount() { return holdingsCount; }
    public void setHoldingsCount(int holdingsCount) { this.holdingsCount = holdingsCount; }
    public List<HoldingDto> getHoldings() { return holdings; }
    public void setHoldings(List<HoldingDto> holdings) { this.holdings = holdings; }
}