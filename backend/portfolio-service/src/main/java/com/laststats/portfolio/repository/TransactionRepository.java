package com.laststats.portfolio.repository;

import com.laststats.portfolio.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
=======

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByPortfolioIdOrderByTransactionDateDesc(UUID portfolioId);
}
