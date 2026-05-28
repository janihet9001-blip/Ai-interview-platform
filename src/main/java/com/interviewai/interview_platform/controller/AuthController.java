package com.interviewai.interview_platform.controller;

import com.interviewai.interview_platform.dto.AuthResponse;
import com.interviewai.interview_platform.dto.LoginRequest;
import com.interviewai.interview_platform.dto.RegisterRequest;
import com.interviewai.interview_platform.service.AuthService;
import com.interviewai.interview_platform.service.LoginAttemptService;
import com.interviewai.interview_platform.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;
    private final RateLimiterService rateLimiterService;

    public AuthController(AuthService authService,
                          LoginAttemptService loginAttemptService,
                          RateLimiterService rateLimiterService) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        String email = request.getEmail();
        String key = email + ":" + clientIp;

        // Defense 1: Account Lockout Check (cheap, returns fast)
        if (loginAttemptService.isBlocked(key)) {
            long remainingMinutes = loginAttemptService.getRemainingBlockTime(key) / 60000;
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Account temporarily locked due to multiple failed attempts.");
            response.put("remainingMinutes", remainingMinutes);
            response.put("code", "ACCOUNT_LOCKED");
            return ResponseEntity.status(429).body(response);
        }

        // Defense 2: Rate Limiting (IP-based)
        if (!rateLimiterService.isAllowed(clientIp)) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Too many requests. Please wait a minute.");
            response.put("code", "RATE_LIMIT_EXCEEDED");
            return ResponseEntity.status(429).body(response);
        }

        // Defense 3: Tarpit Delay (progressive delays on failed attempts)
        long delay = loginAttemptService.getTarpitDelay(key);
        if (delay > 0) {
            try {
                Thread.sleep(delay);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Defense 4: Authentication
        try {
            AuthResponse authResponse = authService.login(request);
            // SUCCESS - clear all failure records
            loginAttemptService.loginSucceeded(key);
            rateLimiterService.resetCount(clientIp);
            return ResponseEntity.ok(authResponse);

        } catch (BadCredentialsException e) {
            // FAILED - record the attempt
            loginAttemptService.loginFailed(key);

            int currentAttempts = loginAttemptService.getAttempts(key);
            int remainingAttempts = 5 - currentAttempts;

            Map<String, Object> response = new HashMap<>();
            response.put("error", "Invalid email or password");
            response.put("remainingAttempts", Math.max(0, remainingAttempts));
            response.put("code", "INVALID_CREDENTIALS");

            // If this was the 5th failure, account is now locked
            if (currentAttempts >= 5) {
                response.put("message", "Account has been locked for 15 minutes due to multiple failed attempts.");
            }

            return ResponseEntity.status(401).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Login failed. Please try again.");
            response.put("code", "LOGIN_ERROR");
            return ResponseEntity.status(500).body(response);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}