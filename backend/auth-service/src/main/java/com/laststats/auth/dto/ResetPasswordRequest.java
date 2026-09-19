package com.laststats.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {}
