package com.laststats.auth.service;

import com.laststats.auth.dto.*;
import com.laststats.auth.entity.User;
import com.laststats.auth.exception.AppException;
import com.laststats.auth.repository.UserRepository;
import com.laststats.auth.security.JwtUtil;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.util.UUID;

// This is where the actual REGISTER / LOGIN logic lives
// Controller just calls these methods — keeps things organized
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redis;

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder, StringRedisTemplate redis) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.redis = redis;
    }

    @Transactional   // if anything fails, undo all DB changes
    public AuthResponse register(RegisterRequest req) {

        // Step 1: Check if email already exists
        if (userRepository.existsByEmail(req.getEmail())) {
            throw AppException.conflict("Email already registered: " + req.getEmail());
        }

        // Step 2: Create new user — password is HASHED, never stored plain
        User user = new User();
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());

        // Step 3: Save to database
        user = userRepository.save(user);

        // Step 4: Generate tokens and return them
        return buildResponse(user);
    }

    public AuthResponse login(LoginRequest req) {

        // Step 1: Find user by email
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));

        if (!user.isActive()) {
            throw AppException.unauthorized("Account is deactivated");
        }

        // Step 2: Check password matches the stored hash
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw AppException.unauthorized("Invalid email or password");
        }

        // Step 3: Generate tokens and return them
        return buildResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {

        if (!jwtUtil.isValid(refreshToken)) {
            throw AppException.unauthorized("Invalid refresh token");
        }

        // Check if this token was already used to logout (blacklisted)
        String blacklistKey = "blacklist:" + refreshToken;
        if (Boolean.TRUE.equals(redis.hasKey(blacklistKey))) {
            throw AppException.unauthorized("Token has been revoked");
        }

        var claims = jwtUtil.validateToken(refreshToken);
        if (!"REFRESH".equals(claims.get("type"))) {
            throw AppException.unauthorized("Not a refresh token");
        }

        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("User not found"));

        // Blacklist the old token so it can't be reused
        redis.opsForValue().set(blacklistKey, "true", Duration.ofDays(7));

        return buildResponse(user);
    }

    public void logout(String refreshToken) {
        if (jwtUtil.isValid(refreshToken)) {
            redis.opsForValue().set("blacklist:" + refreshToken, "true", Duration.ofDays(7));
        }
    }

    // Helper — builds the final response with tokens + user info
    private AuthResponse buildResponse(User user) {
        String access  = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getId());

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()
        );

        return new AuthResponse(access, refresh, jwtUtil.getExpiration() / 1000, userInfo);
    }
}
