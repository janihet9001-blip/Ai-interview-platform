package com.interviewai.interview_platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartSessionRequest {

    @NotNull
    private Long candidateId;

    @NotBlank
    private String jobRole;
}