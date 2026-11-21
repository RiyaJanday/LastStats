package com.laststats.portfolio.dto;

<<<<<<< HEAD
import com.laststats.portfolio.entity.Transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AddTransactionRequest {
    @NotBlank private String fundIsin;
    @NotBlank private String fundName;
    private String fundCategory;
    @NotNull private TransactionType transactionType;
    @NotNull @Positive private BigDecimal units;
    @NotNull @Positive private BigDecimal nav;
    @NotNull @Positive private BigDecimal amount;
    @NotNull private LocalDate transactionDate;
    private String folioNumber;

    public AddTransactionRequest() {}

    public String getFundIsin() { return fundIsin; }
    public void setFundIsin(String fundIsin) { this.fundIsin = fundIsin; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
    public String getFundCategory() { return fundCategory; }
    public void setFundCategory(String fundCategory) { this.fundCategory = fundCategory; }
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    public BigDecimal getUnits() { return units; }
    public void setUnits(BigDecimal units) { this.units = units; }
    public BigDecimal getNav() { return nav; }
    public void setNav(BigDecimal nav) { this.nav = nav; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    public String getFolioNumber() { return folioNumber; }
    public void setFolioNumber(String folioNumber) { this.folioNumber = folioNumber; }
}
=======
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AddTransactionRequest(
        @NotBlank String fundIsin,
        @NotBlank String fundName,
        String fundCategory,
        @NotBlank String transactionType,
        @NotNull BigDecimal units,
        @NotNull BigDecimal nav,
        @NotNull BigDecimal amount,
        @NotNull LocalDate transactionDate,
        String folioNumber
) {}
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
