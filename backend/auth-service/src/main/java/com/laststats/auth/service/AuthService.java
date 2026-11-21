package com.laststats.auth.service;

import com.laststats.auth.dto.AuthResponse;
import com.laststats.auth.dto.LoginRequest;
import com.laststats.auth.dto.RegisterRequest;
import com.laststats.auth.dto.ResetPasswordRequest;
import com.laststats.auth.dto.UpdateProfileRequest;
import com.laststats.auth.entity.User;
import com.laststats.auth.repository.UserRepository;
import com.laststats.auth.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user = userRepository.save(user);
        return responseFor(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return responseFor(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || !jwtUtil.isValid(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
        Claims claims = jwtUtil.parseClaims(refreshToken);
        if (!"REFRESH".equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Not a refresh token");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return responseFor(user);
    }

    @Transactional
    public AuthResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (request.fullName() != null && !request.fullName().isBlank()) user.setFullName(request.fullName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.riskProfile() != null && !request.riskProfile().isBlank()) user.setRiskProfile(request.riskProfile());
        user = userRepository.save(user);
        return responseFor(user);
    }

    @Transactional
    public void resetPassword(UUID userId, ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        userRepository.deleteById(userId);
    }

    private AuthResponse responseFor(User user) {
        String access = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refresh = jwtUtil.generateRefreshToken(user.getId());
        AuthResponse.UserInfo info = new AuthResponse.UserInfo(
                user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getPhone(), user.getRiskProfile());
        return new AuthResponse(access, refresh, jwtUtil.getAccessExpirationSeconds(), info);
    }
}
