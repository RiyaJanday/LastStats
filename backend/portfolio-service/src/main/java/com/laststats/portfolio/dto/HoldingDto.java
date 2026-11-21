package com.laststats.portfolio.dto;

import java.math.BigDecimal;
import java.util.UUID;

<<<<<<< HEAD
public class HoldingDto {
    private UUID id;
    private String fundIsin;
    private String fundName;
    private String fundCategory;
    private BigDecimal units;
    private BigDecimal avgNav;
    private BigDecimal currentNav;
    private BigDecimal investedAmount;
    private BigDecimal currentValue;
    private BigDecimal gain;
    private BigDecimal gainPercent;

    public HoldingDto() {}

    public HoldingDto(UUID id, String fundIsin, String fundName, String fundCategory, BigDecimal units, BigDecimal avgNav, BigDecimal currentNav, BigDecimal investedAmount, BigDecimal currentValue, BigDecimal gain, BigDecimal gainPercent) {
        this.id = id;
        this.fundIsin = fundIsin;
        this.fundName = fundName;
        this.fundCategory = fundCategory;
        this.units = units;
        this.avgNav = avgNav;
        this.currentNav = currentNav;
        this.investedAmount = investedAmount;
        this.currentValue = currentValue;
        this.gain = gain;
        this.gainPercent = gainPercent;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public BigDecimal getCurrentNav() { return currentNav; }
    public void setCurrentNav(BigDecimal currentNav) { this.currentNav = currentNav; }
    public BigDecimal getInvestedAmount() { return investedAmount; }
    public void setInvestedAmount(BigDecimal investedAmount) { this.investedAmount = investedAmount; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public BigDecimal getGain() { return gain; }
    public void setGain(BigDecimal gain) { this.gain = gain; }
    public BigDecimal getGainPercent() { return gainPercent; }
    public void setGainPercent(BigDecimal gainPercent) { this.gainPercent = gainPercent; }
}
=======
public record HoldingDto(
        UUID id,
        String fundIsin,
        String fundName,
        String fundCategory,
        BigDecimal units,
        BigDecimal avgNav,
        BigDecimal currentNav,
        BigDecimal investedAmount,
        BigDecimal currentValue,
        BigDecimal gain,
        BigDecimal gainPercent
) {}
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
