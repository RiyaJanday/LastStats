package com.laststats.sip.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
=======
import org.hibernate.annotations.CreationTimestamp;

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sip_plans")
<<<<<<< HEAD
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
=======
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
public class SipPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

<<<<<<< HEAD
    @Column(name = "portfolio_id", nullable = false)
=======
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "portfolio_id")
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    private UUID portfolioId;

    @Column(name = "fund_isin", nullable = false)
    private String fundIsin;

    @Column(name = "fund_name", nullable = false)
    private String fundName;

    @Column(name = "monthly_amount", nullable = false)
    private BigDecimal monthlyAmount;

    @Column(name = "sip_date")
<<<<<<< HEAD
    @Builder.Default
    private int sipDate = 1;   // day of month, e.g. 1 = 1st of every month
=======
    private Integer sipDate = 1;
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

<<<<<<< HEAD
    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;
=======
    @Column(nullable = false)
    private String frequency = "MONTHLY";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
<<<<<<< HEAD
=======

    public SipPlan() {}

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public String getFundIsin() { return fundIsin; }
    public void setFundIsin(String fundIsin) { this.fundIsin = fundIsin; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
    public BigDecimal getMonthlyAmount() { return monthlyAmount; }
    public void setMonthlyAmount(BigDecimal monthlyAmount) { this.monthlyAmount = monthlyAmount; }
    public Integer getSipDate() { return sipDate; }
    public void setSipDate(Integer sipDate) { this.sipDate = sipDate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
}
