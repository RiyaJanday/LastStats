package com.laststats.portfolio.service;

import com.laststats.portfolio.dto.AddTransactionRequest;
import com.laststats.portfolio.dto.HoldingDto;
import com.laststats.portfolio.dto.PortfolioSummaryDto;
import com.laststats.portfolio.dto.SnapshotDto;
import com.laststats.portfolio.dto.TransactionDto;
import com.laststats.portfolio.entity.Holding;
import com.laststats.portfolio.entity.Portfolio;
import com.laststats.portfolio.entity.PortfolioSnapshot;
import com.laststats.portfolio.entity.Transaction;
import com.laststats.portfolio.repository.HoldingRepository;
import com.laststats.portfolio.repository.PortfolioRepository;
import com.laststats.portfolio.repository.PortfolioSnapshotRepository;
import com.laststats.portfolio.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class PortfolioService {

    private static final Logger log = LoggerFactory.getLogger(PortfolioService.class);

    private final PortfolioRepository portfolioRepo;
    private final HoldingRepository holdingRepo;
    private final TransactionRepository transactionRepo;
    private final PortfolioSnapshotRepository snapshotRepo;

    public PortfolioService(PortfolioRepository portfolioRepo, HoldingRepository holdingRepo,
                             TransactionRepository transactionRepo, PortfolioSnapshotRepository snapshotRepo) {
        this.portfolioRepo = portfolioRepo;
        this.holdingRepo = holdingRepo;
        this.transactionRepo = transactionRepo;
        this.snapshotRepo = snapshotRepo;
    }

    public List<PortfolioSummaryDto> list(UUID userId) {
        return portfolioRepo.findByUserId(userId).stream().map(this::toSummary).toList();
    }

    @Transactional
    public PortfolioSummaryDto create(UUID userId, String name) {
        Portfolio saved = portfolioRepo.save(new Portfolio(userId, name));
        return toSummary(saved);
    }

    @Transactional
    public TransactionDto addTransaction(UUID portfolioId, UUID userId, AddTransactionRequest request) {
        Portfolio portfolio = portfolioRepo.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new NoSuchElementException("Portfolio not found"));

        Transaction tx = new Transaction();
        tx.setPortfolioId(portfolio.getId());
        tx.setFundIsin(request.fundIsin());
        tx.setFundName(request.fundName());
        tx.setFundCategory(request.fundCategory());
        tx.setTransactionType(request.transactionType());
        tx.setUnits(request.units());
        tx.setNav(request.nav());
        tx.setAmount(request.amount());
        tx.setTransactionDate(request.transactionDate());
        tx.setFolioNumber(request.folioNumber());
        tx = transactionRepo.save(tx);

        applyToHolding(portfolio.getId(), request);

        return toDto(tx);
    }

    public List<TransactionDto> transactions(UUID portfolioId, UUID userId) {
        portfolioRepo.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new NoSuchElementException("Portfolio not found"));
        return transactionRepo.findByPortfolioIdOrderByTransactionDateDesc(portfolioId).stream().map(this::toDto).toList();
    }

    private void applyToHolding(UUID portfolioId, AddTransactionRequest request) {
        Holding holding = holdingRepo.findByPortfolioIdAndFundIsin(portfolioId, request.fundIsin())
                .orElseGet(() -> new Holding(portfolioId, request.fundIsin(), request.fundName(), request.fundCategory()));

        BigDecimal sign = "SELL".equalsIgnoreCase(request.transactionType()) ? BigDecimal.valueOf(-1) : BigDecimal.ONE;
        BigDecimal newUnits = holding.getUnits().add(request.units().multiply(sign));
        BigDecimal newInvested = holding.getInvestedAmount().add(request.amount().multiply(sign));

        holding.setUnits(newUnits);
        holding.setInvestedAmount(newInvested);
        holding.setAvgNav(newUnits.signum() == 0 ? BigDecimal.ZERO : newInvested.divide(newUnits, 4, RoundingMode.HALF_UP).abs());
        holding.setCurrentNav(request.nav());
        holding.setCurrentValue(newUnits.multiply(request.nav()).setScale(2, RoundingMode.HALF_UP));

        holdingRepo.save(holding);
    }

    private PortfolioSummaryDto toSummary(Portfolio portfolio) {
        List<HoldingDto> holdings = holdingRepo.findByPortfolioId(portfolio.getId()).stream().map(this::toDto).toList();
        BigDecimal invested = holdings.stream().map(HoldingDto::investedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal current = holdings.stream().map(HoldingDto::currentValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gain = current.subtract(invested);
        BigDecimal gainPercent = invested.signum() == 0 ? BigDecimal.ZERO
                : gain.multiply(BigDecimal.valueOf(100)).divide(invested, 2, RoundingMode.HALF_UP);
        return new PortfolioSummaryDto(portfolio.getId(), portfolio.getName(), invested, current, gain, gainPercent, holdings.size(), holdings);
    }

    private HoldingDto toDto(Holding holding) {
        BigDecimal gain = holding.getCurrentValue().subtract(holding.getInvestedAmount());
        BigDecimal gainPercent = holding.getInvestedAmount().signum() == 0 ? BigDecimal.ZERO
                : gain.multiply(BigDecimal.valueOf(100)).divide(holding.getInvestedAmount(), 2, RoundingMode.HALF_UP);
        return new HoldingDto(holding.getId(), holding.getFundIsin(), holding.getFundName(), holding.getFundCategory(),
                holding.getUnits(), holding.getAvgNav(), holding.getCurrentNav(), holding.getInvestedAmount(),
                holding.getCurrentValue(), gain, gainPercent);
    }

    private TransactionDto toDto(Transaction tx) {
        return new TransactionDto(tx.getId(), tx.getFundIsin(), tx.getFundName(), tx.getFundCategory(),
                tx.getTransactionType(), tx.getUnits(), tx.getNav(), tx.getAmount(), tx.getTransactionDate(), tx.getFolioNumber());
    }

    // ---------- Daily snapshots (real performance-over-time chart) ----------

    /**
     * Snapshots every portfolio in the system as of today. Called by
     * {@link com.laststats.portfolio.scheduler.SnapshotScheduler} once a day.
     * Upserts (one row per portfolio per day) so re-running the same day
     * — e.g. a manual trigger after the nightly job already ran — just
     * overwrites today's row instead of creating a duplicate.
     */
    @Transactional
    public int snapshotAll() {
        List<Portfolio> portfolios = portfolioRepo.findAll();
        LocalDate today = LocalDate.now();
        int count = 0;
        for (Portfolio portfolio : portfolios) {
            snapshotOne(portfolio.getId(), today);
            count++;
        }
        log.info("Snapshotted {} portfolio(s) for {}", count, today);
        return count;
    }

    /** Snapshots a single portfolio the caller owns — lets the frontend or a dev force a fresh data point on demand, without waiting for the nightly job. */
    @Transactional
    public SnapshotDto snapshotNow(UUID portfolioId, UUID userId) {
        Portfolio portfolio = portfolioRepo.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new NoSuchElementException("Portfolio not found"));
        PortfolioSnapshot saved = snapshotOne(portfolio.getId(), LocalDate.now());
        return toDto(saved);
    }

    private PortfolioSnapshot snapshotOne(UUID portfolioId, LocalDate date) {
        List<Holding> holdings = holdingRepo.findByPortfolioId(portfolioId);
        BigDecimal invested = holdings.stream().map(Holding::getInvestedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal current = holdings.stream().map(Holding::getCurrentValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gain = current.subtract(invested);
        BigDecimal gainPercent = invested.signum() == 0 ? BigDecimal.ZERO
                : gain.multiply(BigDecimal.valueOf(100)).divide(invested, 2, RoundingMode.HALF_UP);

        PortfolioSnapshot snapshot = snapshotRepo.findByPortfolioIdAndSnapshotDate(portfolioId, date)
                .orElseGet(() -> new PortfolioSnapshot(portfolioId, date, invested, current, gain, gainPercent));
        snapshot.setInvestedAmount(invested);
        snapshot.setCurrentValue(current);
        snapshot.setGain(gain);
        snapshot.setGainPercent(gainPercent);
        return snapshotRepo.save(snapshot);
    }

    /** Combined performance-over-time across every portfolio the user owns — what the Dashboard chart plots. */
    public List<SnapshotDto> history(UUID userId, String range) {
        List<UUID> portfolioIds = portfolioRepo.findByUserId(userId).stream().map(Portfolio::getId).toList();
        if (portfolioIds.isEmpty()) return List.of();
        LocalDate from = rangeToFromDate(range);

        List<Object[]> rows = snapshotRepo.aggregateByPortfolioIds(portfolioIds, from);
        return rows.stream().map(row -> {
            LocalDate date = (LocalDate) row[0];
            BigDecimal invested = (BigDecimal) row[1];
            BigDecimal current = (BigDecimal) row[2];
            BigDecimal gain = current.subtract(invested);
            BigDecimal gainPercent = invested.signum() == 0 ? BigDecimal.ZERO
                    : gain.multiply(BigDecimal.valueOf(100)).divide(invested, 2, RoundingMode.HALF_UP);
            return new SnapshotDto(date, invested, current, gain, gainPercent);
        }).toList();
    }

    private LocalDate rangeToFromDate(String range) {
        LocalDate now = LocalDate.now();
        return switch (range == null ? "1M" : range.toUpperCase()) {
            case "1W" -> now.minusWeeks(1);
            case "3M" -> now.minusMonths(3);
            case "1Y" -> now.minusYears(1);
            case "ALL" -> null;
            default -> now.minusMonths(1);
        };
    }

    private SnapshotDto toDto(PortfolioSnapshot snapshot) {
        return new SnapshotDto(snapshot.getSnapshotDate(), snapshot.getInvestedAmount(), snapshot.getCurrentValue(),
                snapshot.getGain(), snapshot.getGainPercent());
    }
}
