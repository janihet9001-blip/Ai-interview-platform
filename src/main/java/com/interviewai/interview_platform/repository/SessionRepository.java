package com.interviewai.interview_platform.repository;

import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<InterviewSession, Long> {

    List<InterviewSession> findByUserOrderByStartedAtDesc(User user);
    List<InterviewSession> findByUserAndStatus(User user, InterviewSession.Status status);

    // Optimized — no EAGER question loading, summary only
    @Query(value = """
        SELECT s.id, s.job_role, s.total_score, s.total_questions,
               s.status, s.started_at, s.completed_at,
               u.full_name as user_name, u.id as user_id,
               COUNT(CASE WHEN q.question_number != 999 THEN 1 END) as actual_questions
        FROM interview_sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN questions q ON q.session_id = s.id
        GROUP BY s.id, s.job_role, s.total_score, s.total_questions,
                 s.status, s.started_at, s.completed_at,
                 u.full_name, u.id
        ORDER BY s.started_at DESC
        LIMIT 20
        """, nativeQuery = true)
    List<Object[]> findSessionSummaries();
}