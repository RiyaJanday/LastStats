package com.laststats.sip.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sip_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SipPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "fund_isin", nullable = false)
    private String fundIsin;

    @Column(name = "fund_name", nullable = false)
    private String fundName;

    @Column(name = "monthly_amount", nullable = false)
    private BigDecimal monthlyAmount;

    @Column(name = "sip_date")
    @Builder.Default
    private int sipDate = 1;   // day of month, e.g. 1 = 1st of every month

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
