package com.javalearn.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

// 챗봇 요청 모델
@Data
public class ChatRequest {
    private String message;       // 사용자 질문
    private String context;       // 시스템 컨텍스트 (현재 단원 정보 등)
    private List<Map<String, String>> history; // 이전 대화 내역
}
