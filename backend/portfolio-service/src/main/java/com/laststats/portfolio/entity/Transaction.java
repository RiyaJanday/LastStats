package com.laststats.portfolio.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class Transaction {

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

    @Column(name = "transaction_type", nullable = false)
    private String transactionType;

    @Column(nullable = false)
    private BigDecimal units;

    @Column(nullable = false)
    private BigDecimal nav;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "folio_number")
    private String folioNumber;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Transaction() {}

    public UUID getId() { return id; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public String getFundIsin() { return fundIsin; }
    public void setFundIsin(String fundIsin) { this.fundIsin = fundIsin; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
    public String getFundCategory() { return fundCategory; }
    public void setFundCategory(String fundCategory) { this.fundCategory = fundCategory; }
    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
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
    public Instant getCreatedAt() { return createdAt; }
}
