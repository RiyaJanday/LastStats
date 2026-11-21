package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByPortfolioIdOrderByTransactionDateDesc(UUID portfolioId);
}
