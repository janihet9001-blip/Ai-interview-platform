package com.interviewai.interview_platform.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "questions")
@Data
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "session_id")
    private InterviewSession session;

    @JsonProperty("questiontext")
    @Column(columnDefinition = "TEXT")
    private String questiontext;

    @JsonProperty("userAnswer")
    @Column(columnDefinition = "TEXT")
    private String userAnswer;

    @JsonProperty("aiFeedback")
    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    @JsonProperty("score")
    private Integer score;

    @JsonProperty("questionNumber")
    private Integer questionNumber;
}