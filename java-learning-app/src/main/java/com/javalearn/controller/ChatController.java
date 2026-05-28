package com.javalearn.controller;

import com.javalearn.model.ChatRequest;
import com.javalearn.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * AI 챗봇 질문 처리
     * POST /api/chat
     * Body: { "message": "...", "context": "...", "history": [...] }
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest chatRequest) {
        // 입력 검증
        if (chatRequest.getMessage() == null || chatRequest.getMessage().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "메시지를 입력해주세요."));
        }

        try {
            String aiResponse = geminiService.chat(chatRequest);
            return ResponseEntity.ok(Map.of("response", aiResponse));

        } catch (Exception e) {
            System.err.println("Gemini API 오류: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "AI 응답 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 코드 피드백 요청
     * POST /api/feedback
     * Body: { "code": "...", "lessonTitle": "...", "question": "..." }
     */
    @PostMapping("/feedback")
    public ResponseEntity<?> feedback(@RequestBody Map<String, String> body) {
        String code = body.getOrDefault("code", "");
        String lessonTitle = body.getOrDefault("lessonTitle", "");
        String question = body.getOrDefault("question", "");

        if (code.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "코드를 입력해주세요."));
        }

        // 코드 피드백 전용 프롬프트 구성
        String feedbackPrompt = String.format("""
            다음 자바 코드를 분석하고 피드백을 제공해주세요.
            학습 단원: %s
            관련 질문: %s
            
            코드:
            ```java
            %s
            ```
            
            다음 항목으로 피드백해주세요:
            1. 코드의 올바른 점
            2. 잘못된 점 또는 개선할 점 (있다면)
            3. 왜 그런지 이유 설명
            4. 개선된 코드 예제 (필요한 경우)
            """, lessonTitle, question, code);

        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setMessage(feedbackPrompt);

        try {
            String aiResponse = geminiService.chat(chatRequest);
            return ResponseEntity.ok(Map.of("feedback", aiResponse));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "피드백 생성 중 오류가 발생했습니다."));
        }
    }
}
