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

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final SessionRepository sessionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;

    // Recruiter calls this — creates session FOR a specific candidate
    public InterviewSession startSession(User candidate, String jobRole) {

        InterviewSession session = new InterviewSession();
        session.setUser(candidate);
        session.setJobRole(jobRole);
        session.setStatus(InterviewSession.Status.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        session.setTotalQuestions(0); // no fixed limit — updated on Stop with actual count
        session.setTotalScore(0);

        InterviewSession saved = sessionRepository.save(session);

        // Load 50 questions — recruiter decides when to stop
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

    // Get one session by ID
    public InterviewSession getSession(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    // Candidate — get their own sessions
    public List<InterviewSession> getUserSessions(User user) {
        return sessionRepository.findByUserOrderByStartedAtDesc(user);
    }

    // Recruiter — get ALL sessions
    public List<InterviewSession> getAllSessions() {
        return sessionRepository.findAll();
    }
}