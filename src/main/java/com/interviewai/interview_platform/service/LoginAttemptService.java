package com.interviewai.interview_platform.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class LoginAttemptService {

    private final ConcurrentHashMap<String, AtomicInteger> attemptsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> blockedCache = new ConcurrentHashMap<>();

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION = 900000; // 15 minutes

    public void loginSucceeded(String key) {
        attemptsCache.remove(key);
        blockedCache.remove(key);
    }

    public void loginFailed(String key) {
        AtomicInteger attempts = attemptsCache.computeIfAbsent(key, k -> new AtomicInteger(0));
        int currentAttempts = attempts.incrementAndGet();

        if (currentAttempts >= MAX_ATTEMPTS) {
            blockedCache.put(key, System.currentTimeMillis() + BLOCK_DURATION);
        }
    }

    public boolean isBlocked(String key) {
        if (blockedCache.containsKey(key)) {
            Long blockTime = blockedCache.get(key);
            if (System.currentTimeMillis() < blockTime) {
                return true;
            } else {
                blockedCache.remove(key);
                attemptsCache.remove(key);
            }
        }
        return false;
    }

    public int getAttempts(String key) {
        AtomicInteger attempts = attemptsCache.get(key);
        return attempts != null ? attempts.get() : 0;
    }

    public long getRemainingBlockTime(String key) {
        if (blockedCache.containsKey(key)) {
            long remaining = blockedCache.get(key) - System.currentTimeMillis();
            return remaining > 0 ? remaining : 0;
        }
        return 0;
    }

    public long getTarpitDelay(String key) {
        int attempts = getAttempts(key);
        if (attempts <= 0) return 0;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        long delay = 1000L * (long) Math.pow(2, attempts - 1);
        return Math.min(delay, 30000);
    }

    public void block(String key) {
        blockedCache.put(key, System.currentTimeMillis() + BLOCK_DURATION);
    }
}