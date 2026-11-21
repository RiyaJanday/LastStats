package com.laststats.market.controller;

import com.laststats.market.dto.MarketIndexDto;
import com.laststats.market.dto.StockQuoteDto;
import com.laststats.market.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MarketController {

    private final MarketDataService marketDataService;

    @GetMapping("/indices")
    public List<MarketIndexDto> indices() {
        return marketDataService.getWorldIndices();
    }

    @GetMapping("/quote/{symbol}")
    public ResponseEntity<StockQuoteDto> quote(@PathVariable String symbol) {
        return marketDataService.getQuote(symbol)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/quotes")
    public List<StockQuoteDto> multiQuotes(@RequestBody List<String> symbols) {
        return marketDataService.getMultipleQuotes(symbols);
    }
}
