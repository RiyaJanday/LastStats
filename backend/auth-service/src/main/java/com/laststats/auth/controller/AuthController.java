package com.laststats.auth.controller;

import com.laststats.auth.dto.*;
import com.laststats.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.ok("Registered successfully", authService.register(req));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok("Login successful", authService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestHeader("X-Refresh-Token") String token) {
        return ApiResponse.ok(authService.refresh(token));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader("X-Refresh-Token") String token) {
        authService.logout(token);
        return ApiResponse.ok("Logged out", null);
    }
}