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

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

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

    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Transaction() {}

    public Transaction(UUID id, UUID portfolioId, String fundIsin, String fundName, TransactionType transactionType, BigDecimal units, BigDecimal nav, BigDecimal amount, LocalDate transactionDate, String folioNumber, String notes, Instant createdAt) {
        this.id = id;
        this.portfolioId = portfolioId;
        this.fundIsin = fundIsin;
        this.fundName = fundName;
        this.transactionType = transactionType;
        this.units = units;
        this.nav = nav;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.folioNumber = folioNumber;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public String getFundIsin() { return fundIsin; }
    public void setFundIsin(String fundIsin) { this.fundIsin = fundIsin; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
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
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public enum TransactionType { BUY, SELL, SIP, DIVIDEND }
}