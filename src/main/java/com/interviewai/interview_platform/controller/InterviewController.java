package com.interviewai.interview_platform.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.interviewai.interview_platform.dto.StartSessionRequest;
import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.Question;
import com.interviewai.interview_platform.model.User;
import com.interviewai.interview_platform.repository.SessionRepository;
import com.interviewai.interview_platform.repository.UserRepository;
import com.interviewai.interview_platform.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SessionRepository sessionRepository; // ← added

    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewSession> startSession(
            @Valid @RequestBody StartSessionRequest request) {

        User candidate = userRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        InterviewSession session = interviewService.startSession(
                candidate, request.getJobRole());

        messagingTemplate.convertAndSend(
                "/topic/session/" + candidate.getId(), session);

        return ResponseEntity.ok(session);
    }

    @GetMapping("/all-sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions() {
        return ResponseEntity.ok(interviewService.getAllSessions());
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<List<InterviewSession>> getMySessions(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(interviewService.getUserSessions(user));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<Question>> getQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getSession(id).getQuestions());
    }

    // HTTP fallback — marks session COMPLETED even if WebSocket STOP failed
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> completeSession(@PathVariable Long id) {
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != InterviewSession.Status.COMPLETED) {
            session.setStatus(InterviewSession.Status.COMPLETED);
            session.setCompletedAt(LocalDateTime.now());
            sessionRepository.save(session);
        }

        return ResponseEntity.ok(Map.of("message", "Session completed", "id", id));
    }
}