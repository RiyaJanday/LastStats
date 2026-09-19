package com.laststats.auth.dto;

import java.util.UUID;

public record AuthResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
    public record UserInfo(UUID id, String email, String fullName, String role, String phone, String riskProfile) {}
}
