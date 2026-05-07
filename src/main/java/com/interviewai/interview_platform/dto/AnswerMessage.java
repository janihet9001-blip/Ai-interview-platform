package com.interviewai.interview_platform.dto;

import lombok.Data;

@Data
public class AnswerMessage {
    private Long sessionId;
    private Long questionId;
    private String questionText;
    private String userAnswer;
}