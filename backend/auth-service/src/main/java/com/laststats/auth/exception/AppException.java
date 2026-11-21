package com.laststats.auth.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static AppException conflict(String msg) {
        return new AppException(msg, HttpStatus.CONFLICT);
    }

    public static AppException unauthorized(String msg) {
        return new AppException(msg, HttpStatus.UNAUTHORIZED);
    }

    public static AppException notFound(String msg) {
        return new AppException(msg, HttpStatus.NOT_FOUND);
    }
}