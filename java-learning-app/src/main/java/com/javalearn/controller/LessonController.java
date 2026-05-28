package com.javalearn.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")  // 개발 시 CORS 허용
public class LessonController {

    @Value("${lessons.json.path}")
    private Resource lessonsResource;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 전체 단원 목록 반환
     * GET /api/lessons
     */
    @GetMapping("/lessons")
    public ResponseEntity<?> getLessons() {
        try {
            JsonNode root = objectMapper.readTree(lessonsResource.getInputStream());
            JsonNode lessons = root.get("lessons");
            return ResponseEntity.ok(lessons);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"단원 데이터를 불러올 수 없습니다.\"}");
        }
    }

    /**
     * 특정 단원 반환
     * GET /api/lessons/{id}
     */
    @GetMapping("/lessons/{id}")
    public ResponseEntity<?> getLesson(@PathVariable int id) {
        try {
            JsonNode root = objectMapper.readTree(lessonsResource.getInputStream());
            JsonNode lessons = root.get("lessons");

            for (JsonNode lesson : lessons) {
                if (lesson.get("id").asInt() == id) {
                    return ResponseEntity.ok(lesson);
                }
            }

            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"단원 데이터를 불러올 수 없습니다.\"}");
        }
    }

    /**
     * 헬스 체크
     * GET /api/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("JavaLearn 서버 정상 동작 중");
    }
}
