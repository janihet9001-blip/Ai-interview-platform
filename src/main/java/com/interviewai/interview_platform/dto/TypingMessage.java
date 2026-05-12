package com.interviewai.interview_platform.dto;

public class TypingMessage {

    private Long sessionId;
    private Long questionId;
    private String questionText;
    private String questionNumber;  // ← changed from int to String
    private String currentAnswer;
    private String status;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getQuestionNumber() { return questionNumber; }
    public void setQuestionNumber(String questionNumber) { this.questionNumber = questionNumber; }

    public String getCurrentAnswer() { return currentAnswer; }
    public void setCurrentAnswer(String currentAnswer) { this.currentAnswer = currentAnswer; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}