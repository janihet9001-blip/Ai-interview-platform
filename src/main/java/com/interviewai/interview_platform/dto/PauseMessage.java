package com.interviewai.interview_platform.dto;

public class PauseMessage {
    private Long sessionId;
    private String action; // "PAUSE" or "RESUME"

    public Long getSessionId() { return sessionId; }
    public String getAction() { return action; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public void setAction(String action) { this.action = action; }
}