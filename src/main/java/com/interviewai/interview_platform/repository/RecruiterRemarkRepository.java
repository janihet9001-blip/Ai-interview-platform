package com.interviewai.interview_platform.repository;

import com.interviewai.interview_platform.model.RecruiterRemark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRemarkRepository extends JpaRepository<RecruiterRemark, Long> {
    Optional<RecruiterRemark> findBySessionId(Long sessionId);
}
