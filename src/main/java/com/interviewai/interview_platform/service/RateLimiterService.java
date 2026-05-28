package com.interviewai.interview_platform.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final int MAX_REQUESTS = 10;
    private final long TIME_WINDOW = 60000; // 1 minute

    public boolean isAllowed(String clientIp) {
        AtomicInteger count = requestCounts.computeIfAbsent(clientIp, k -> new AtomicInteger(0));

        if (count.incrementAndGet() > MAX_REQUESTS) {
            return false;
        }

        // Schedule reset after time window
        new java.util.Timer().schedule(new java.util.TimerTask() {
            @Override
            public void run() {
                requestCounts.remove(clientIp);
            }
        }, TIME_WINDOW);

        return true;
    }

    public void resetCount(String clientIp) {
        requestCounts.remove(clientIp);
    }
}