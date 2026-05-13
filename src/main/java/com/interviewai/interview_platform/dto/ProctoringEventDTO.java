package com.interviewai.interview_platform.dto;

import java.time.LocalDateTime;

public class ProctoringEventDTO {
    private String sessionId;
    private String eventType;
    private String details;
    private LocalDateTime timestamp;
    private String pastedText;
    private String questionText;
    private String shortcutKey;

    // Default constructor
    public ProctoringEventDTO() {}

    // Constructor with all fields
    public ProctoringEventDTO(String sessionId, String eventType, String details,
                              LocalDateTime timestamp, String pastedText,
                              String questionText, String shortcutKey) {
        this.sessionId = sessionId;
        this.eventType = eventType;
        this.details = details;
        this.timestamp = timestamp;
        this.pastedText = pastedText;
        this.questionText = questionText;
        this.shortcutKey = shortcutKey;
    }

    // Getters
    public String getSessionId() { return sessionId; }
    public String getEventType() { return eventType; }
    public String getDetails() { return details; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getPastedText() { return pastedText; }
    public String getQuestionText() { return questionText; }
    public String getShortcutKey() { return shortcutKey; }

    // Setters
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public void setDetails(String details) { this.details = details; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setPastedText(String pastedText) { this.pastedText = pastedText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public void setShortcutKey(String shortcutKey) { this.shortcutKey = shortcutKey; }
}