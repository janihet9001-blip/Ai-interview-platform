package com.interviewai.interview_platform.repository;

import com.interviewai.interview_platform.model.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    List<QuestionBank> findByJobRole(String jobRole);

    @Query(value = "SELECT * FROM question_bank WHERE job_role = :jobRole ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<QuestionBank> findRandomByJobRole(String jobRole, int limit);
}