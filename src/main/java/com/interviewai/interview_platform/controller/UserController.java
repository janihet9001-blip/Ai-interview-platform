package com.interviewai.interview_platform.controller;

import com.interviewai.interview_platform.model.User;
import com.interviewai.interview_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllCandidates() {
        List<User> candidates = userRepository.findAll();
        return ResponseEntity.ok(candidates);
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        user.setResumeData(file.getBytes());
        user.setResumeFileName(file.getOriginalFilename());
        user.setResumeContentType(file.getContentType());
        userRepository.save(user);
        return ResponseEntity.ok("Resume uploaded");
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<byte[]> getResume(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        if (user.getResumeData() == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + user.getResumeFileName() + "\"")
                .contentType(MediaType.parseMediaType(user.getResumeContentType()))
                .body(user.getResumeData());
    }
}