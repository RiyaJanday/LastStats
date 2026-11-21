package com.laststats.auth.dto;

import java.util.UUID;

<<<<<<< HEAD
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private UserInfo user;

    public AuthResponse() {}

    public AuthResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static class UserInfo {
        private UUID id;
        private String email;
        private String fullName;
        private String role;

        public UserInfo() {}

        public UserInfo(UUID id, String email, String fullName, String role) {
            this.id = id;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
=======
public record AuthResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
    public record UserInfo(UUID id, String email, String fullName, String role, String phone, String riskProfile) {}
}
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
