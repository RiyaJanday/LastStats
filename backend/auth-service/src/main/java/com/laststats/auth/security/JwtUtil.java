package com.laststats.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
<<<<<<< HEAD
import java.util.Date;
import java.util.UUID;

// This class creates and reads JWT tokens
=======
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
@Component
public class JwtUtil {

    private final SecretKey key;
<<<<<<< HEAD
    private final long expiration;
    private final long refreshExpiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
    }

    // Creates a short-lived token used for actual API calls (24 hours)
    public String generateAccessToken(UUID userId, String email, String role) {
=======
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long accessExpirationMs,
            @Value("${jwt.refresh-expiration}") long refreshExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Instant now = Instant.now();
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim("type", "ACCESS")
<<<<<<< HEAD
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
=======
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpirationMs)))
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
                .signWith(key)
                .compact();
    }

<<<<<<< HEAD
    // Creates a long-lived token used ONLY to get new access tokens (7 days)
    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "REFRESH")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
=======
    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "REFRESH")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshExpirationMs)))
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
                .signWith(key)
                .compact();
    }

<<<<<<< HEAD
    // Reads and verifies a token, throws exception if invalid/expired
    public Claims validateToken(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
=======
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    }

    public boolean isValid(String token) {
        try {
<<<<<<< HEAD
            validateToken(token);
=======
            parseClaims(token);
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
            return true;
        } catch (Exception e) {
            return false;
        }
    }

<<<<<<< HEAD
    public long getExpiration() { return expiration; }
=======
    public long getAccessExpirationSeconds() {
        return accessExpirationMs / 1000;
    }
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
}
