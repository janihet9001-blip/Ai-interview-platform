package com.interviewai.interview_platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@Slf4j
public class EvaluationService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private static final String MODEL = "llama-3.3-70b-versatile";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public EvaluationResult evaluate(String questionText, String userAnswer) {

        try {

            if (questionText == null || questionText.isBlank()) {
                return new EvaluationResult(
                        0,
                        "Question cannot be empty."
                );
            }

            if (userAnswer == null || userAnswer.isBlank()) {
                return new EvaluationResult(
                        0,
                        "Answer cannot be empty."
                );
            }

            questionText = sanitizeInput(questionText);
            userAnswer = sanitizeInput(userAnswer);

            String prompt = buildPrompt(questionText, userAnswer);

            String requestBody = buildRequestBody(prompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {

                log.error("Groq API Error: {}", response.body());

                return new EvaluationResult(
                        0,
                        "AI service is currently unavailable."
                );
            }


            return parseResponse(response.body());

        } catch (Exception e) {

            log.error("Evaluation Error", e);

            return new EvaluationResult(
                    0,
                    "Could not evaluate answer. Please try again."
            );
        }
    }

    private String sanitizeInput(String input) {

        return input
                .replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String buildPrompt(String questionText, String userAnswer) {

        return """
                You are a strict but fair technical interviewer evaluating a Java developer candidate.

                Interview Question:
                %s

                Candidate Answer:
                %s

                Instructions:
                - Evaluate technical correctness
                - Evaluate clarity
                - Evaluate completeness
                - Be concise and professional
                - Give score between 0 and 10

                Respond ONLY in this exact format:

                SCORE: <number>
                FEEDBACK: <one or two sentences>
                """
                .formatted(questionText, userAnswer);
    }

    private String buildRequestBody(String prompt) throws Exception {

        JsonNode requestBody = objectMapper.createObjectNode()
                .put("model", MODEL)
                .put("temperature", 0.3)
                .put("max_tokens", 200)
                .set("messages", objectMapper.createArrayNode()
                        .add(objectMapper.createObjectNode()
                                .put("role", "user")
                                .put("content", prompt)));

        return objectMapper.writeValueAsString(requestBody);
    }

    private EvaluationResult parseResponse(String responseBody)
            throws Exception {

        JsonNode root = objectMapper.readTree(responseBody);

        String content = root
                .path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

        int score = 0;
        String feedback = "No feedback available.";

        for (String line : content.split("\n")) {

            line = line.trim();

            if (line.startsWith("SCORE:")) {

                String scoreStr = line
                        .replace("SCORE:", "")
                        .trim();

                score = Integer.parseInt(scoreStr);

                // Ensure score is between 0 and 10
                if (score < 0) {
                    score = 0;
                }

                if (score > 10) {
                    score = 10;
                }

            } else if (line.startsWith("FEEDBACK:")) {

                feedback = line
                        .replace("FEEDBACK:", "")
                        .trim();
            }
        }

        return new EvaluationResult(score, feedback);
    }

    public record EvaluationResult(
            int score,
            String feedback
    ) {}
}