package com.interviewai.interview_platform.websocket;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.interviewai.interview_platform.dto.PauseMessage;
import com.interviewai.interview_platform.dto.RecruiterQuestion;
import com.interviewai.interview_platform.dto.TypingMessage;
import com.interviewai.interview_platform.dto.AnswerMessage;
import com.interviewai.interview_platform.dto.FeedbackResponse;
import com.interviewai.interview_platform.dto.ProctoringEventDTO;
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

        log.info("Received answer for question ID: {}", answerMessage.getQuestionId());

        // 1. Find the question
        Question question = questionRepository
                .findById(answerMessage.getQuestionId())
                .orElse(null);

        if (question == null) {
            log.error("Question not found: {}", answerMessage.getQuestionId());
            return;
        }

        // 2. Find the session — load ONCE, never reload again
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

        // 5. Load questions from session ONCE
        // IMPORTANT: after saving question above, the session's in-memory list
        // still has the OLD question object. We update it manually here
        // so answeredCount and totalScore are accurate without another DB call.
        List<Question> allQuestions = session.getQuestions();

        for (int i = 0; i < allQuestions.size(); i++) {
            if (allQuestions.get(i).getId().equals(question.getId())) {
                allQuestions.set(i, question); // replace stale object with updated one
                break;
            }
        }

        // 6. Update total score using the now-accurate list
        int totalScore = allQuestions
                .stream()
                .mapToInt(q -> q.getScore() != null ? q.getScore() : 0)
                .sum();
        session.setTotalScore(totalScore);

        // 7. Count answered — exclude recruiter questions (questionNumber = 999)
        long answeredCount = allQuestions
                .stream()
                .filter(q -> q.getUserAnswer() != null
                        && q.getUserAnswer().trim().length() > 0
                        && q.getQuestionNumber() != 999)
                .count();

        // 8. Session never auto-completes — recruiter decides when to stop
        boolean sessionCompleted = false;

        sessionRepository.save(session);

        // 9. Send feedback to candidate
        FeedbackResponse response = new FeedbackResponse(
                question.getId(),
                result.score(),
                result.feedback(),
                sessionCompleted,
                totalScore,
                (int) answeredCount
        );

        messagingTemplate.convertAndSend(
                "/topic/feedback/" + answerMessage.getSessionId(),
                response
        );

        // 10. Send typing update to recruiter live feed
        Map<String, Object> typingUpdate = new HashMap<>();
        typingUpdate.put("questionNumber", question.getQuestionNumber());
        typingUpdate.put("questionText", question.getQuestiontext());
        typingUpdate.put("currentAnswer", answerMessage.getUserAnswer());
        typingUpdate.put("status", "SUBMITTED");

        messagingTemplate.convertAndSend(
                "/topic/typing/" + answerMessage.getSessionId(),
                typingUpdate
        );

        log.info("Answer saved — session: {}, answered so far: {}",
                answerMessage.getSessionId(), answeredCount);
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

        InterviewSession session = sessionRepository
                .findById(recruiterQuestion.getSessionId())
                .orElse(null);

        if (session != null) {
            Question q = new Question();
            q.setQuestiontext(recruiterQuestion.getQuestion());
            q.setQuestionNumber(999); // marker — excluded from completion count
            q.setSession(session);
            Question saved = questionRepository.save(q);
            recruiterQuestion.setQuestionId(saved.getId());
        }

        messagingTemplate.convertAndSend(
                "/topic/recruiter-question/" + recruiterQuestion.getSessionId(),
                recruiterQuestion
        );
        log.info("Recruiter question sent to session: {}", recruiterQuestion.getSessionId());
    }

    @MessageMapping("/pause")
    public void handlePause(PauseMessage pauseMessage) {

        if ("STOP".equals(pauseMessage.getAction())) {

            InterviewSession session = sessionRepository
                    .findById(pauseMessage.getSessionId())
                    .orElse(null);

            if (session != null) {
                // Load questions ONCE — use the list already in session
                List<Question> allQuestions = session.getQuestions();

                // Exclude recruiter questions (999) from answered count
                long answeredCount = allQuestions
                        .stream()
                        .filter(q -> q.getUserAnswer() != null
                                && q.getUserAnswer().trim().length() > 0
                                && q.getQuestionNumber() != 999)
                        .count();

                // Only count scores from non-999 questions
                int totalScore = allQuestions
                        .stream()
                        .filter(q -> q.getQuestionNumber() != 999)
                        .mapToInt(q -> q.getScore() != null ? q.getScore() : 0)
                        .sum();

                session.setStatus(Status.COMPLETED);
                session.setTotalScore(totalScore);
                session.setTotalQuestions((int) answeredCount);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);

                log.info("Session COMPLETED — answered: {}, score: {}",
                        answeredCount, totalScore);
            }

            messagingTemplate.convertAndSend(
                    "/topic/end/" + pauseMessage.getSessionId(),
                    pauseMessage
            );

            log.info("Interview STOPPED by recruiter — session: {}", pauseMessage.getSessionId());
            return;
        }

        messagingTemplate.convertAndSend(
                "/topic/pause/" + pauseMessage.getSessionId(),
                pauseMessage
        );
        log.info("Session {} - action: {}", pauseMessage.getSessionId(), pauseMessage.getAction());
    }

    // Receives proctoring events from candidate and forwards to recruiter
    @MessageMapping("/proctoring-event")
    public void handleProctoringEvent(ProctoringEventDTO event) {
        log.info("PROCTORING EVENT - Session: {}, Type: {}, Details: {}",
                event.getSessionId(),
                event.getEventType(),
                event.getDetails()
        );

        if (event.getPastedText() != null && !event.getPastedText().isEmpty()) {
            log.info("Pasted Text: {}",
                    event.getPastedText().length() > 100 ?
                            event.getPastedText().substring(0, 100) + "..." :
                            event.getPastedText()
            );
        }

        if (event.getQuestionText() != null && !event.getQuestionText().isEmpty()) {
            log.info("Question: {}", event.getQuestionText());
        }

        if (event.getShortcutKey() != null) {
            log.info("Shortcut Key: {}", event.getShortcutKey());
        }

        messagingTemplate.convertAndSend(
                "/topic/proctoring",
                event
        );

        log.info("Proctoring event broadcast to /topic/proctoring");
    }
}