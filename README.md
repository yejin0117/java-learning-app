# ☕ JavaLearn — 자바 학습 플랫폼

듀오링고 방식의 단계별 자바 학습 웹서비스입니다.
개념 학습 → 퀴즈 풀이 → AI 피드백 순서로 진행되며, Gemini 기반 AI 튜터 챗봇이 내장되어 있습니다.

---

## 브라우저에서 접속 방법

```
http://localhost:8080
```

## 기술 스택

| 역할 | 기술 |
|------|------|
| 백엔드 | Java 17, Spring Boot 3.2 |
| 프론트엔드 | HTML, CSS, JavaScript |
| 학습 데이터 | JSON 파일 |
| 진도 저장 | LocalStorage |
| AI | Google Gemini API |

---

## 프로젝트 구조

```
java-learning-app/
├── pom.xml
└── src/main/
    ├── java/com/javalearn/
    │   ├── JavaLearnApplication.java       ← 메인 실행 파일
    │   ├── controller/
    │   │   ├── LessonController.java       ← GET /api/lessons
    │   │   └── ChatController.java         ← POST /api/chat, /api/feedback
    │   ├── service/
    │   │   └── GeminiService.java          ← Gemini API 호출
    │   └── model/
    │       └── ChatRequest.java            ← 요청 데이터 구조
    └── resources/
        ├── application.properties          ← 서버 설정 및 API 키 (깃에 올리지 않음)
        ├── lessons.json                    ← 학습 콘텐츠 데이터
        └── static/                         ← 프론트엔드 (VS Code에서 편집)
            ├── index.html                  ← 전체 화면
            ├── css/style.css               ← 스타일
            └── js/
                ├── app.js                  ← 화면 전환, 퀴즈 로직, LocalStorage
                └── chatbot.js              ← AI 챗봇 UI 및 API 호출
```

---

## 필수 설치 목록

| 도구 | 버전 | 다운로드 |
|------|------|----------|
| JDK | 17 이상 | https://adoptium.net |
| IntelliJ IDEA | 최신 | https://www.jetbrains.com/idea |
| VS Code | 최신 | https://code.visualstudio.com |

> Maven은 IntelliJ에 내장되어 있어서 별도 설치 불필요합니다.

### IntelliJ 플러그인 (선택)

IntelliJ 실행 → `Plugins` 검색에서 설치하세요.

- **Lombok** — 설치하지 않으면 빨간 줄 표시될 수 있음
- **Spring Boot** — Spring 관련 자동완성

---

## 개발 환경 세팅 (처음 한 번만)

### 1. 프로젝트 클론

```bash
git clone [저장소 주소]
cd java-learning-app
```

### 2. Gemini API 키 발급

> ⚠️ API 키는 팀원 각자 개인 계정으로 발급받아야 합니다. 공유 금지.

1. [aistudio.google.com](https://aistudio.google.com) 접속
2. 구글 계정으로 로그인
3. 왼쪽 메뉴 **Get API key** 클릭
4. **Create API key** 클릭
5. 생성된 키 복사 (`AIza`로 시작하는 문자열)

### 3. application.properties 설정

`src/main/resources/application.properties` 파일을 열고 아래 내용을 작성하세요.

```properties
server.port=8080
gemini.api.key=발급받은_API_키_여기에_붙여넣기
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
lessons.json.path=classpath:lessons.json
```

> ⚠️ 이 파일은 `.gitignore`에 등록되어 있습니다. 절대 깃허브에 올리지 마세요.

### 4. Gemini 사용 가능한 모델 확인 방법

모델마다 계정별로 사용 가능 여부가 달라요. 브라우저 주소창에 아래를 입력하면 본인 키로 사용 가능한 모델 목록을 확인할 수 있어요.

```
https://generativelanguage.googleapis.com/v1beta/models?key=본인API키
```

목록에서 `generateContent`를 지원하는 모델명을 찾아 `application.properties`의 URL에 적용하세요.

```properties
# 예시 — 목록에서 찾은 모델명으로 교체
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/여기에모델명:generateContent
```

### 5. IntelliJ에서 서버 실행

```
JavaLearnApplication.java 우클릭 → Run
```

콘솔에 아래 메시지가 뜨면 성공입니다.

```
Started JavaLearnApplication on port 8080
```

> ⚠️ VS Code에서 index.html을 직접 열면 안 됩니다. 반드시 `localhost:8080`으로 접속하세요.

---

## 개발 방법

### 도구별 역할

| 도구 | 담당 파일 |
|------|-----------|
| VS Code | `index.html`, `style.css`, `app.js`, `chatbot.js`, `lessons.json` |
| IntelliJ | `JavaLearnApplication.java`, `LessonController.java`, `ChatController.java`, `GeminiService.java` |

### 프론트엔드 수정할 때

1. VS Code에서 `static` 폴더 파일 수정 후 저장
2. 브라우저에서 `localhost:8080` 새로고침
3. Java 코드 재시작 불필요

### 백엔드 수정할 때

1. IntelliJ에서 Java 파일 수정
2. IntelliJ 상단 ■ 정지 → ▶ 실행 (서버 재시작)
3. 브라우저에서 `localhost:8080` 새로고침

### 단원 추가할 때

`src/main/resources/lessons.json`에 아래 형식으로 추가하세요.

```json
{
  "id": 6,
  "title": "단원 제목",
  "icon": "🔥",
  "description": "단원 한 줄 설명",
  "color": "#3b82f6",
  "concept": {
    "summary": "핵심 개념 한 줄 요약",
    "details": ["포인트 1", "포인트 2", "포인트 3"],
    "codeExample": "// 여기에 코드 예제"
  },
  "quiz": [
    {
      "id": 1,
      "question": "문제 내용",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "answer": 0,
      "explanation": "정답 해설 (왜 맞는지 설명)"
    }
  ]
}
```

> ⚠️ `answer`는 보기 번호가 아니라 인덱스(0부터 시작)입니다. 첫 번째 보기가 정답이면 `0`, 두 번째면 `1`.

---

## API 명세

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/lessons` | 전체 단원 목록 반환 |
| GET | `/api/lessons/{id}` | 특정 단원 반환 |
| POST | `/api/chat` | AI 챗봇 질문 처리 |
| POST | `/api/feedback` | 코드 피드백 요청 |
| GET | `/api/health` | 서버 상태 확인 |

---

## 트러블슈팅

**Q. `ExceptionInInitializerError` 오류가 뜬다**

Lombok과 JDK 버전 충돌 문제입니다. `pom.xml`에서 Lombok 버전을 명시하세요.
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <optional>true</optional>
</dependency>
```
그래도 안 되면 Lombok 의존성을 삭제하고 `ChatRequest.java`에 getter/setter를 직접 작성하세요.

---

**Q. 챗봇 오류 — 403 (API key leaked)**

API 키가 깃허브에 노출되어 Google이 자동 차단한 것입니다.
1. [aistudio.google.com](https://aistudio.google.com)에서 기존 키 삭제
2. 새 키 발급
3. `application.properties`에 새 키 입력
4. 절대로 `application.properties`를 깃에 올리지 마세요

---

**Q. 챗봇 오류 — 404 (model not found)**

모델명이 잘못되었거나 해당 계정에서 사용 불가한 모델입니다.
브라우저에서 사용 가능한 모델 목록을 직접 확인하세요.
```
https://generativelanguage.googleapis.com/v1beta/models?key=본인API키
```
확인한 모델명으로 `application.properties`의 URL을 수정하세요.

> 참고: 2025년 4월 이후 신규 프로젝트는 gemini-1.5 모델 사용이 불가합니다.

---

**Q. 챗봇 오류 — 429 (quota exceeded)**

무료 티어 하루 사용량을 초과했습니다.
- 분당 초과: 1분 후 재시도
- 하루 초과: 다음날 자정(UTC) 이후 자동 리셋
- 다른 모델로 변경하면 별도 할당량으로 사용 가능

---

**Q. 챗봇 오류 — 503 (service unavailable)**

Gemini 서버 과부하 상태입니다. 1~5분 후 재시도하면 해결됩니다.

---

**Q. 화면은 뜨는데 단원 목록이 안 나온다**

브라우저 F12 → Console 탭에서 오류를 확인하세요.
`localhost:8080`으로 접속했는지 확인하세요.
VS Code에서 파일을 직접 열었다면 닫고 브라우저에서 `localhost:8080`으로 접속하세요.

---

**Q. 서버는 켜졌는데 백엔드-프론트 연결이 안 된다**

VS Code에서 `static/index.html`을 직접 열면 Java 서버와 연결되지 않습니다.
반드시 브라우저에서 `http://localhost:8080`으로 접속해야 합니다.

---

## 주의사항 요약

```
✅ 브라우저는 항상 localhost:8080으로 접속
✅ API 키는 application.properties에만 보관
✅ Java 수정 시 IntelliJ에서 서버 재시작
✅ 프론트 수정 시 브라우저 새로고침만 하면 됨
❌ application.properties 깃에 올리지 않기
❌ VS Code로 index.html 직접 열지 않기
❌ API 키 카카오톡, 슬랙 등으로 공유 금지
```
