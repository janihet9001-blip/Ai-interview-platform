package com.interviewai.interview_platform.controller;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.interviewai.interview_platform.model.User;
import com.interviewai.interview_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // ADMIN only — recruiter gets list of all candidates
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllCandidates() {
        List<User> candidates = userRepository.findAll();
        return ResponseEntity.ok(candidates);
    }
}