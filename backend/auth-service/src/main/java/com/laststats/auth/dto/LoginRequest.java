package com.laststats.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

<<<<<<< HEAD
public class LoginRequest {

    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;

    public LoginRequest() {}

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
=======
public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
