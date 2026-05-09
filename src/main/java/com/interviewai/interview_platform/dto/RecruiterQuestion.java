package com.interviewai.interview_platform.dto;

public class RecruiterQuestion {
    private Long sessionId;
    private String question;

    public Long getSessionId() { return sessionId; }
    public String getQuestion() { return question; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public void setQuestion(String question) { this.question = question; }
}