package com.laststats.sip.controller;

<<<<<<< HEAD
import com.laststats.sip.dto.*;
import com.laststats.sip.service.SipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
=======
import com.laststats.sip.dto.ApiResponse;
import com.laststats.sip.dto.CreateSipRequest;
import com.laststats.sip.dto.ProjectionDto;
import com.laststats.sip.dto.SipSummaryDto;
import com.laststats.sip.service.SipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sips")
<<<<<<< HEAD
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
=======
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
public class SipController {

    private final SipService sipService;

<<<<<<< HEAD
    @GetMapping("/portfolio/{portfolioId}")
    public List<SipSummaryDto> list(@PathVariable UUID portfolioId) {
        return sipService.getPortfolioSips(portfolioId);
=======
    public SipController(SipService sipService) {
        this.sipService = sipService;
    }

    @GetMapping
    public ApiResponse<List<SipSummaryDto>> list(Authentication authentication) {
        return ApiResponse.ok(sipService.list(userId(authentication)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SipSummaryDto> create(Authentication authentication,
                                              @RequestParam(required = false) UUID portfolioId,
                                              @Valid @RequestBody CreateSipRequest request) {
        return ApiResponse.ok("SIP created", sipService.create(userId(authentication), portfolioId, request));
    }

    @GetMapping("/portfolio/{portfolioId}")
    public List<SipSummaryDto> listByPortfolio(Authentication authentication, @PathVariable UUID portfolioId) {
        return sipService.listByPortfolio(portfolioId, userId(authentication));
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    }

    @PostMapping("/portfolio/{portfolioId}")
    @ResponseStatus(HttpStatus.CREATED)
<<<<<<< HEAD
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
=======
    public SipSummaryDto createForPortfolio(Authentication authentication,
                                             @PathVariable UUID portfolioId,
                                             @Valid @RequestBody CreateSipRequest request) {
        return sipService.create(userId(authentication), portfolioId, request);
    }

    @PatchMapping("/{sipId}/pause")
    public void pause(Authentication authentication, @PathVariable UUID sipId) {
        sipService.pause(sipId, userId(authentication));
    }

    @PatchMapping("/{sipId}/resume")
    public void resume(Authentication authentication, @PathVariable UUID sipId) {
        sipService.resume(sipId, userId(authentication));
    }

    @GetMapping("/{sipId}/projection")
    public ProjectionDto projection(Authentication authentication,
                                     @PathVariable UUID sipId,
                                     @RequestParam(defaultValue = "5") int years,
                                     @RequestParam(defaultValue = "12") double annualReturnPct) {
        return sipService.projection(sipId, userId(authentication), years, annualReturnPct);
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    }
}
