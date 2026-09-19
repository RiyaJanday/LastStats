package com.laststats.auth.controller;

import com.laststats.auth.dto.ApiResponse;
import com.laststats.auth.dto.AuthResponse;
import com.laststats.auth.dto.LoginRequest;
import com.laststats.auth.dto.RegisterRequest;
import com.laststats.auth.dto.ResetPasswordRequest;
import com.laststats.auth.dto.UpdateProfileRequest;
import com.laststats.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Logged in successfully", authService.login(request));
    }

    // Refresh token is passed explicitly (not via the Authorization header, which
    // carries the short-lived access token validated by JwtAuthFilter).
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        return ApiResponse.ok(authService.refresh(refreshToken));
    }

    @PutMapping("/profile")
    public ApiResponse<AuthResponse> updateProfile(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Profile updated", authService.updateProfile(currentUserId(authentication), request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(Authentication authentication, @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(currentUserId(authentication), request);
        return ApiResponse.ok("Password reset", null);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // Stateless JWTs — nothing to invalidate server-side without a token blacklist.
        // The frontend simply discards the tokens it's holding.
        return ApiResponse.ok("Logged out", null);
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(Authentication authentication) {
        authService.deleteAccount(currentUserId(authentication));
        return ApiResponse.ok("Account deleted", null);
    }

    private UUID currentUserId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
