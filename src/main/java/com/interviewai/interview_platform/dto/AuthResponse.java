package com.interviewai.interview_platform.dto;

public class AuthResponse {
    private Long id;
    private String token;
    private String email;
    private String fullName;
    private String role;

    public AuthResponse(Long id, String token, String email, String fullName, String role) {
        this.id = id;
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
}