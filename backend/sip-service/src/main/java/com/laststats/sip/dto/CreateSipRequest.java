package com.laststats.sip.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateSipRequest {
    @NotBlank private String fundIsin;
    @NotBlank private String fundName;
    @NotNull @Positive private BigDecimal monthlyAmount;
    @Min(1) @Max(28) private int sipDate = 1;
    @NotNull private LocalDate startDate;
}
