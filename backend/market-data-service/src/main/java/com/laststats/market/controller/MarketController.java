package com.laststats.market.controller;

import com.laststats.market.dto.ExchangeDto;
import com.laststats.market.dto.MarketIndexDto;
import com.laststats.market.dto.NewsItemDto;
import com.laststats.market.dto.StockQuoteDto;
import com.laststats.market.service.MarketDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketDataService marketDataService;

    public MarketController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/indices")
    public List<MarketIndexDto> indices() {
        return marketDataService.indices();
    }

    @GetMapping("/world-indices")
    public List<MarketIndexDto> worldIndices() {
        return marketDataService.worldIndices();
    }

    /**
     * Full exchange master reference list (every exchange, every region)
     * merged with live quotes where available. Backs the world map's
     * "every country, not just the 12 major indices" view.
     */
    @GetMapping("/exchanges")
    public List<ExchangeDto> exchanges() {
        return marketDataService.exchanges();
    }

    @GetMapping("/news")
    public List<NewsItemDto> news() {
        return marketDataService.news();
    }

    @GetMapping("/search")
    public List<StockQuoteDto> search(@RequestParam String q) {
        return marketDataService.search(q);
    }

    @GetMapping("/quote/{symbol}")
    public ResponseEntity<StockQuoteDto> quote(@PathVariable String symbol) {
        return marketDataService.quote(symbol).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/quotes")
    public List<StockQuoteDto> quotes(@RequestBody List<String> symbols) {
        return marketDataService.quotes(symbols);
    }
}
