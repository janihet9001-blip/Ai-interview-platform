package com.interviewai.interview_platform.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "interview_sessions")
@Data
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String jobRole;
    private Integer totalScore;
    private Integer totalQuestions;

    @Enumerated(EnumType.STRING)
    private Status status = Status.IN_PROGRESS;

    public enum Status {IN_PROGRESS, COMPLETED, ABANDONED}

    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Question> questions = new ArrayList<>();
}