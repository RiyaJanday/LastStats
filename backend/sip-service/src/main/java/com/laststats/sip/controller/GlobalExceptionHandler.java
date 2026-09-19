package com.laststats.sip.controller;

import com.laststats.sip.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> badRequest(IllegalArgumentException exception) {
        return ApiResponse.error(exception.getMessage());
    }

    // See auth-service's GlobalExceptionHandler for why this needs its own
    // handler instead of sharing badRequest(): MethodArgumentNotValidException's
    // getMessage() is a technical dump, not something to show a user directly
    // (e.g. on CreateSipRequest validation failures).
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> validationFailed(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldError();
        String message = fieldError != null
                ? fieldError.getField() + ": " + fieldError.getDefaultMessage()
                : "Invalid request.";
        return ApiResponse.error(message);
    }

    @ExceptionHandler(NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> notFound(NoSuchElementException exception) {
        return ApiResponse.error(exception.getMessage());
    }
}
