package com.interviewai.interview_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FeedbackResponse {
    private Long questionId;
    private int score;
    private String feedback;
    private boolean sessionCompleted;
    private int totalScore;
    private int questionsAnswered;
}