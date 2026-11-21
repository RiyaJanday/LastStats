package com.laststats.portfolio.service;

import com.laststats.portfolio.dto.*;
import com.laststats.portfolio.entity.*;
import com.laststats.portfolio.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PortfolioService {

    private final PortfolioRepository portfolioRepo;
    private final HoldingRepository holdingRepo;
    private final TransactionRepository txRepo;

    public PortfolioService(PortfolioRepository portfolioRepo, HoldingRepository holdingRepo, TransactionRepository txRepo) {
        this.portfolioRepo = portfolioRepo;
        this.holdingRepo = holdingRepo;
        this.txRepo = txRepo;
    }

    public List<PortfolioSummaryDto> getUserPortfolios(UUID userId) {
        return portfolioRepo.findByUserId(userId).stream()
                .map(this::buildSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public Portfolio createPortfolio(UUID userId, String name) {
        Portfolio p = new Portfolio();
        p.setUserId(userId);
        p.setName(name);
        return portfolioRepo.save(p);
    }

    @Transactional
    public Transaction addTransaction(UUID portfolioId, UUID userId, AddTransactionRequest req) {
        Portfolio portfolio = portfolioRepo.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new NoSuchElementException("Portfolio not found"));

        Transaction tx = new Transaction();
        tx.setPortfolioId(portfolioId);
        tx.setFundIsin(req.getFundIsin());
        tx.setFundName(req.getFundName());
        tx.setTransactionType(req.getTransactionType());
        tx.setUnits(req.getUnits());
        tx.setNav(req.getNav());
        tx.setAmount(req.getAmount());
        tx.setTransactionDate(req.getTransactionDate());
        tx.setFolioNumber(req.getFolioNumber());
        tx = txRepo.save(tx);

        updateHolding(portfolioId, req);

        return tx;
    }

    public List<Transaction> getTransactions(UUID portfolioId, UUID userId) {
        portfolioRepo.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new NoSuchElementException("Portfolio not found"));
        return txRepo.findByPortfolioIdOrderByTransactionDateDesc(portfolioId);
    }

    private void updateHolding(UUID portfolioId, AddTransactionRequest req) {
        Optional<Holding> existing = holdingRepo.findByPortfolioIdAndFundIsin(portfolioId, req.getFundIsin());

        if (existing.isPresent()) {
            Holding h = existing.get();

            if (req.getTransactionType() == Transaction.TransactionType.BUY
                    || req.getTransactionType() == Transaction.TransactionType.SIP) {
                BigDecimal newUnits = h.getUnits().add(req.getUnits());
                BigDecimal newInvested = h.getInvestedAmount().add(req.getAmount());
                h.setAvgNav(newInvested.divide(newUnits, 4, RoundingMode.HALF_UP));
                h.setUnits(newUnits);
                h.setInvestedAmount(newInvested);
            } else if (req.getTransactionType() == Transaction.TransactionType.SELL) {
                h.setUnits(h.getUnits().subtract(req.getUnits()));
            }

            h.setCurrentNav(req.getNav());
            h.setCurrentValue(h.getUnits().multiply(req.getNav()));
            holdingRepo.save(h);
        } else {
            Holding h = new Holding();
            h.setPortfolioId(portfolioId);
            h.setFundIsin(req.getFundIsin());
            h.setFundName(req.getFundName());
            h.setFundCategory(req.getFundCategory());
            h.setUnits(req.getUnits());
            h.setAvgNav(req.getNav());
            h.setInvestedAmount(req.getAmount());
            h.setCurrentNav(req.getNav());
            h.setCurrentValue(req.getAmount());
            holdingRepo.save(h);
        }
    }

    private PortfolioSummaryDto buildSummary(Portfolio p) {
        List<Holding> holdings = holdingRepo.findByPortfolioId(p.getId());

        BigDecimal invested = holdings.stream()
                .map(Holding::getInvestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal current = holdings.stream()
                .map(h -> h.getCurrentValue() != null ? h.getCurrentValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gain = current.subtract(invested);
        BigDecimal gainPct = invested.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : gain.divide(invested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        List<HoldingDto> holdingDtos = holdings.stream()
                .map(this::toHoldingDto)
                .collect(Collectors.toList());

        PortfolioSummaryDto dto = new PortfolioSummaryDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setTotalInvested(invested);
        dto.setCurrentValue(current);
        dto.setTotalGain(gain);
        dto.setTotalGainPercent(gainPct);
        dto.setHoldingsCount(holdings.size());
        dto.setHoldings(holdingDtos);

        return dto;
    }

    private HoldingDto toHoldingDto(Holding h) {
        BigDecimal current = h.getCurrentValue() != null ? h.getCurrentValue() : BigDecimal.ZERO;
        BigDecimal gain = current.subtract(h.getInvestedAmount());
        BigDecimal gainPct = h.getInvestedAmount().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : gain.divide(h.getInvestedAmount(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        HoldingDto dto = new HoldingDto();
        dto.setId(h.getId());
        dto.setFundIsin(h.getFundIsin());
        dto.setFundName(h.getFundName());
        dto.setFundCategory(h.getFundCategory());
        dto.setUnits(h.getUnits());
        dto.setAvgNav(h.getAvgNav());
        dto.setCurrentNav(h.getCurrentNav());
        dto.setInvestedAmount(h.getInvestedAmount());
        dto.setCurrentValue(current);
        dto.setGain(gain);
        dto.setGainPercent(gainPct);

        return dto;
    }
}