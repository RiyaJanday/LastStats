package com.laststats.sip.controller;

import com.laststats.sip.dto.*;
import com.laststats.sip.service.SipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sips")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SipController {

    private final SipService sipService;

    @GetMapping("/portfolio/{portfolioId}")
    public List<SipSummaryDto> list(@PathVariable UUID portfolioId) {
        return sipService.getPortfolioSips(portfolioId);
    }

    @PostMapping("/portfolio/{portfolioId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@PathVariable UUID portfolioId, @Valid @RequestBody CreateSipRequest req) {
        sipService.createSip(portfolioId, req);
    }

    @PatchMapping("/{sipId}/pause")
    public void pause(@PathVariable UUID sipId) {
        sipService.pauseSip(sipId);
    }

    @PatchMapping("/{sipId}/resume")
    public void resume(@PathVariable UUID sipId) {
        sipService.resumeSip(sipId);
    }
}
