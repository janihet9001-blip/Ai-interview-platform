package com.interviewai.interview_platform.websocket;

import java.time.LocalDateTime;
import com.interviewai.interview_platform.dto.PauseMessage;
import com.interviewai.interview_platform.dto.RecruiterQuestion;
import com.interviewai.interview_platform.dto.TypingMessage;
import com.interviewai.interview_platform.dto.AnswerMessage;
import com.interviewai.interview_platform.dto.FeedbackResponse;
import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.Question;
import com.interviewai.interview_platform.repository.SessionRepository;
import com.interviewai.interview_platform.repository.QuestionRepository;
import com.interviewai.interview_platform.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import com.interviewai.interview_platform.model.InterviewSession.Status;

@Controller
@RequiredArgsConstructor
@Slf4j
public class InterviewWebSocketController {

    private final EvaluationService evaluationService;
    private final SessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/answer")
    public void handleAnswer(AnswerMessage answerMessage) {

        log.info("Received answer for question ID: {}",
                answerMessage.getQuestionId());

        // 1. Find the question
        Question question = questionRepository
                .findById(answerMessage.getQuestionId())
                .orElse(null);

        if (question == null) {
            log.error("Question not found: {}", answerMessage.getQuestionId());
            return;
        }

        // 2. Find the session
        InterviewSession session = sessionRepository
                .findById(answerMessage.getSessionId())
                .orElse(null);

        if (session == null) {
            log.error("Session not found: {}", answerMessage.getSessionId());
            return;
        }

        // 3. Evaluate answer using Groq AI
        EvaluationService.EvaluationResult result = evaluationService.evaluate(
                answerMessage.getQuestionText(),
                answerMessage.getUserAnswer()
        );

        // 4. Save answer and score to question
        question.setUserAnswer(answerMessage.getUserAnswer());
        question.setAiFeedback(result.feedback());
        question.setScore(result.score());
        questionRepository.save(question);

        // 5. Reload session fresh from DB to get updated questions
        session = sessionRepository.findById(answerMessage.getSessionId()).orElse(session);

        // 6. Update session total score
        int totalScore = session.getQuestions()
                .stream()
                .mapToInt(q -> q.getScore() != null ? q.getScore() : 0)
                .sum();

        session.setTotalScore(totalScore);

        // 7. Count how many questions answered
        long answeredCount = session.getQuestions()
                .stream()
                .filter(q -> q.getUserAnswer() != null)
                .count();

        // 8. Check if session is completed
        boolean sessionCompleted = false;

        sessionRepository.save(session);

        // 9. Build feedback response
        FeedbackResponse response = new FeedbackResponse(
                question.getId(),
                result.score(),
                result.feedback(),
                sessionCompleted,
                totalScore,
                (int) answeredCount
        );

        // 10. Send feedback back to candidate
        messagingTemplate.convertAndSend(
                "/topic/feedback/" + answerMessage.getSessionId(),
                response
        );

        log.info("Feedback sent for session: {}", answerMessage.getSessionId());
    }

    // Receives live typing from candidate and forwards to recruiter
    @MessageMapping("/typing")
    public void handleTyping(TypingMessage typingMessage) {
        messagingTemplate.convertAndSend(
                "/topic/typing/" + typingMessage.getSessionId(),
                typingMessage
        );
    }
    // Receives custom question from recruiter and forwards to candidate
    @MessageMapping("/recruiter-question")
    public void handleRecruiterQuestion(RecruiterQuestion recruiterQuestion) {
        messagingTemplate.convertAndSend(
                "/topic/recruiter-question/" + recruiterQuestion.getSessionId(),
                recruiterQuestion
        );
        log.info("Recruiter question sent to session: {}", recruiterQuestion.getSessionId());
    }
    @MessageMapping("/pause")
    public void handlePause(PauseMessage pauseMessage) {

        // If recruiter clicked Stop — end the interview properly
        if ("STOP".equals(pauseMessage.getAction())) {

            // Mark session as COMPLETED in DB
            InterviewSession session = sessionRepository
                    .findById(pauseMessage.getSessionId())
                    .orElse(null);

            if (session != null) {
                // Count how many questions were actually answered
                long answeredCount = session.getQuestions()
                        .stream()
                        .filter(q -> q.getUserAnswer() != null)
                        .count();

                int totalScore = session.getQuestions()
                        .stream()
                        .mapToInt(q -> q.getScore() != null ? q.getScore() : 0)
                        .sum();

                session.setStatus(Status.COMPLETED);
                session.setTotalScore(totalScore);
                session.setTotalQuestions((int) answeredCount);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
            }

            // Tell candidate interview is over
            messagingTemplate.convertAndSend(
                    "/topic/end/" + pauseMessage.getSessionId(),
                    pauseMessage
            );

            log.info("Interview STOPPED by recruiter — session: {}", pauseMessage.getSessionId());
            return;
        }

        // Otherwise normal pause/resume/continue
        messagingTemplate.convertAndSend(
                "/topic/pause/" + pauseMessage.getSessionId(),
                pauseMessage
        );
        log.info("Session {} - action: {}", pauseMessage.getSessionId(), pauseMessage.getAction());
    }
}