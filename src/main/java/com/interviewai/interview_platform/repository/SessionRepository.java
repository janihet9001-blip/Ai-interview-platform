package com.interviewai.interview_platform.repository;

import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserOrderByStartedAtDesc(User user);
    List<InterviewSession> findByUserAndStatus(User user, InterviewSession.Status status);
}