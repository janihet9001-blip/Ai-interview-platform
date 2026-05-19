package com.interviewai.interview_platform.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recruiter_remarks")
public class RecruiterRemark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true)
    private Long sessionId;

    @Column(name = "recruiter_score")
    private Integer recruiterScore;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "status")
    private String status;

    public RecruiterRemark() {}

    public RecruiterRemark(Long sessionId, Integer recruiterScore, String remark, String status) {
        this.sessionId = sessionId;
        this.recruiterScore = recruiterScore;
        this.remark = remark;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public Integer getRecruiterScore() { return recruiterScore; }
    public void setRecruiterScore(Integer recruiterScore) { this.recruiterScore = recruiterScore; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
