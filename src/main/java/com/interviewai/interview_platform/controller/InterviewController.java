package com.interviewai.interview_platform.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.interviewai.interview_platform.dto.StartSessionRequest;
import com.interviewai.interview_platform.model.InterviewSession;
import com.interviewai.interview_platform.model.Question;
import com.interviewai.interview_platform.model.User;
import com.interviewai.interview_platform.repository.UserRepository;
import com.interviewai.interview_platform.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ADMIN only — recruiter starts session for a candidate
    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewSession> startSession(
            @Valid @RequestBody StartSessionRequest request) {

        User candidate = userRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        InterviewSession session = interviewService.startSession(
                candidate, request.getJobRole());

        // Broadcast to candidate's waiting room
        messagingTemplate.convertAndSend(
                "/topic/session/" + candidate.getId(), session);

        return ResponseEntity.ok(session);
    }

    // ADMIN only — get all sessions (recruiter dashboard)
    @GetMapping("/all-sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<InterviewSession>> getAllSessions() {
        return ResponseEntity.ok(interviewService.getAllSessions());
    }

    // USER — get their own sessions
    @GetMapping("/my-sessions")
    public ResponseEntity<List<InterviewSession>> getMySessions(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(interviewService.getUserSessions(user));
    }

    // Both — get questions for a session
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<Question>> getQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getSession(id).getQuestions());
    }
}