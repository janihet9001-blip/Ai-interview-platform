package com.interviewai.interview_platform.repository;

import com.interviewai.interview_platform.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}