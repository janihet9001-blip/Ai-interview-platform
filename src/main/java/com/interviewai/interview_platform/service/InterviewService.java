package com.interviewai.interview_platform.service;

import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.Question;
import com.interviewai.interview_platform.model.QuestionBank;
import com.interviewai.interview_platform.model.User;
import com.interviewai.interview_platform.repository.QuestionBankRepository;
import com.interviewai.interview_platform.repository.QuestionRepository;
import com.interviewai.interview_platform.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final SessionRepository sessionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;

    public InterviewSession startSession(User candidate, String jobRole) {

        // ✅ FIX: Mark any stuck IN_PROGRESS sessions as ABANDONED before creating a new one.
        // This handles the case where a candidate closed the browser mid-interview
        // and the old session was never properly ended.
        List<InterviewSession> stuckSessions = sessionRepository
                .findByUserAndStatus(candidate, InterviewSession.Status.IN_PROGRESS);
        for (InterviewSession stuck : stuckSessions) {
            stuck.setStatus(InterviewSession.Status.ABANDONED);
            stuck.setCompletedAt(LocalDateTime.now());
            sessionRepository.save(stuck);
        }

        InterviewSession session = new InterviewSession();
        session.setUser(candidate);
        session.setJobRole(jobRole);
        session.setStatus(InterviewSession.Status.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        session.setTotalQuestions(0);
        session.setTotalScore(0);

        InterviewSession saved = sessionRepository.save(session);

        List<QuestionBank> bankQuestions =
                questionBankRepository.findRandomByJobRole(jobRole, 50);

        List<Question> questions = new ArrayList<>();
        for (int i = 0; i < bankQuestions.size(); i++) {
            Question q = new Question();
            q.setSession(saved);
            q.setQuestiontext(bankQuestions.get(i).getQuestionText());
            q.setQuestionNumber(i + 1);
            questions.add(q);
        }

        questionRepository.saveAll(questions);
        saved.setQuestions(questions);

        return saved;
    }

    public InterviewSession getSession(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    public List<InterviewSession> getUserSessions(User user) {
        return sessionRepository.findByUserOrderByStartedAtDesc(user);
    }

    // Optimized — uses native query, no EAGER loading
    public List<Map<String, Object>> getAllSessions() {
        List<Object[]> rows = sessionRepository.findSessionSummaries();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id",              row[0]);
            map.put("jobRole",         row[1]);
            map.put("totalScore",      row[2]);
            map.put("totalQuestions",  row[3]);
            map.put("status",          row[4]);
            map.put("startedAt",       row[5]);
            map.put("completedAt",     row[6]);
            map.put("userName",        row[7]);
            map.put("userId",          row[8]);
            map.put("actualQuestions", row[9]);
            result.add(map);
        }

        return result;
    }
}