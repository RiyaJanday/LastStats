package com.laststats.auth.controller;

import com.laststats.auth.dto.ApiResponse;
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

    // MethodArgumentNotValidException's own getMessage() is a multi-line
    // technical dump ("Validation failed for argument [0]...with 2 errors:
    // [Field error in object 'registerRequest'...]") — fine for logs, but it
    // was being sent straight to the frontend and shown verbatim in a toast.
    // Surface just the first field's own message instead (e.g. "Password must
    // be at least 6 characters" via a message on the @Size annotation, or a
    // sensible default if none was set).
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
