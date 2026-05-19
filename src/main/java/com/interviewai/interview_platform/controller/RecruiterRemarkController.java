package com.interviewai.interview_platform.controller;

import com.interviewai.interview_platform.model.RecruiterRemark;
import com.interviewai.interview_platform.repository.RecruiterRemarkRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterRemarkController {

    private final RecruiterRemarkRepository remarkRepository;

    public RecruiterRemarkController(RecruiterRemarkRepository remarkRepository) {
        this.remarkRepository = remarkRepository;
    }

    /**
     * POST /api/recruiter/remark
     * Body: { sessionId, recruiterScore, remark, status }
     * Creates or updates the remark for a session.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/remark")
    public ResponseEntity<RecruiterRemark> saveRemark(@RequestBody Map<String, Object> body) {
        Long sessionId = Long.valueOf(body.get("sessionId").toString());
        Integer recruiterScore = body.get("recruiterScore") != null
                ? Integer.valueOf(body.get("recruiterScore").toString()) : null;
        String remark = body.get("remark") != null ? body.get("remark").toString() : null;
        String status = body.get("status") != null ? body.get("status").toString() : null;

        RecruiterRemark existing = remarkRepository.findBySessionId(sessionId).orElse(null);

        if (existing != null) {
            existing.setRecruiterScore(recruiterScore);
            existing.setRemark(remark);
            existing.setStatus(status);
            return ResponseEntity.ok(remarkRepository.save(existing));
        } else {
            RecruiterRemark newRemark = new RecruiterRemark(sessionId, recruiterScore, remark, status);
            return ResponseEntity.ok(remarkRepository.save(newRemark));
        }
    }

    /**
     * GET /api/recruiter/remark/{sessionId}
     * Returns the remark for a single session, or 204 if none exists yet.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/remark/{sessionId}")
    public ResponseEntity<RecruiterRemark> getRemark(@PathVariable Long sessionId) {
        return remarkRepository.findBySessionId(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * GET /api/recruiter/remarks/all
     * Returns all recruiter remarks — used to hydrate the full candidates list.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/remarks/all")
    public ResponseEntity<List<RecruiterRemark>> getAllRemarks() {
        return ResponseEntity.ok(remarkRepository.findAll());
    }
}
