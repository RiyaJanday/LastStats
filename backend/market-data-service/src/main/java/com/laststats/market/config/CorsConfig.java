package com.laststats.market.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Replaces the old per-controller @CrossOrigin(origins = {"http://localhost:5173", ...})
 * annotations (which were compile-time constants and couldn't vary between local
 * dev and a deployed frontend URL) with one env-var-driven CORS mapping.
 * Set CORS_ALLOWED_ORIGINS (comma-separated) in the deploy environment; defaults
 * to the local dev origins if unset.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.split("\\s*,\\s*"))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
