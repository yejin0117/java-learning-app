package com.javalearn.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.javalearn.model.ChatRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    // 시스템 프롬프트 (AI 튜터 역할 정의)
    private static final String SYSTEM_PROMPT = """
        당신은 자바 프로그래밍 학습을 돕는 친절한 AI 튜터입니다.
        다음 규칙을 반드시 따르세요:
        1. 항상 한국어로 답변하세요.
        2. 자바 초보자도 이해할 수 있도록 쉽고 명확하게 설명하세요.
        3. 코드 예제가 필요하면 짧고 실용적인 예제를 제공하세요.
        4. 단순히 정답만 알려주지 말고, 왜 그런지 이유와 원리를 설명하세요.
        5. 격려하는 말투를 사용하고, 학생이 자신감을 가질 수 있도록 도와주세요.
        6. 오류 코드가 있으면 어디가 잘못됐는지 명확히 짚어주세요.
        """;

    /**
     * Gemini API 호출
     * @param chatRequest 사용자 메시지 + 대화 내역
     * @return AI 응답 텍스트
     */
    public String chat(ChatRequest chatRequest) throws Exception {
        // 요청 JSON 구성
        ObjectNode requestBody = objectMapper.createObjectNode();
        ArrayNode contents = requestBody.putArray("contents");

        // 시스템 컨텍스트 + 이전 대화 내역 추가
        String systemContext = SYSTEM_PROMPT;
        if (chatRequest.getContext() != null && !chatRequest.getContext().isBlank()) {
            systemContext += "\n현재 학습 컨텍스트: " + chatRequest.getContext();
        }

        // 이전 대화 내역 포함 (최근 6개)
        List<Map<String, String>> history = chatRequest.getHistory();
        if (history != null) {
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                Map<String, String> msg = history.get(i);
                ObjectNode contentNode = contents.addObject();
                contentNode.put("role", "user".equals(msg.get("role")) ? "user" : "model");
                ArrayNode parts = contentNode.putArray("parts");
                parts.addObject().put("text", msg.get("content"));
            }
        }

        // 현재 메시지 (시스템 프롬프트 포함)
        ObjectNode currentMsg = contents.addObject();
        currentMsg.put("role", "user");
        ArrayNode currentParts = currentMsg.putArray("parts");
        currentParts.addObject().put("text", systemContext + "\n\n사용자 질문: " + chatRequest.getMessage());

        // 생성 설정
        ObjectNode generationConfig = requestBody.putObject("generationConfig");
        generationConfig.put("maxOutputTokens", 1024);
        generationConfig.put("temperature", 0.7);

        // HTTP 요청
        String requestBodyStr = objectMapper.writeValueAsString(requestBody);
        String fullUrl = apiUrl + "?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(fullUrl))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBodyStr))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API 오류: " + response.statusCode() + " - " + response.body());
        }

        // 응답 파싱
        JsonNode responseJson = objectMapper.readTree(response.body());
        return responseJson
            .path("candidates").get(0)
            .path("content")
            .path("parts").get(0)
            .path("text").asText("응답을 받지 못했습니다.");
    }
}
