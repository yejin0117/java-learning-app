// ===== 챗봇 상태 =====
const Chatbot = {
  isOpen: false,
  isLoading: false,
  history: [],

  STORAGE_KEY: 'javalearn_chat',

  // 대화 기록 불러오기
  loadHistory() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.history = raw ? JSON.parse(raw) : [];
  },

  // 대화 기록 저장 (최근 20개만)
  saveHistory() {
    const recent = this.history.slice(-20);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recent));
  },

  // 대화 기록 초기화
  clearHistory() {
    this.history = [];
    localStorage.removeItem(this.STORAGE_KEY);
    renderChatMessages();
    addWelcomeMessage();
  }
};

// ===== 챗봇 열기/닫기 =====
function openChatbot() {
  const overlay = document.getElementById('chatbot-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  Chatbot.isOpen = true;
  Chatbot.loadHistory();
  renderChatMessages();
  if (Chatbot.history.length === 0) addWelcomeMessage();
  const input = document.getElementById('chatbot-input');
  if (input) setTimeout(() => input.focus(), 100);
}

function closeChatbot() {
  const overlay = document.getElementById('chatbot-overlay');
  if (overlay) overlay.classList.remove('open');
  Chatbot.isOpen = false;
}

// ===== 환영 메시지 =====
function addWelcomeMessage() {
  const currentLesson = App.currentLesson;
  const context = currentLesson ? `현재 "${currentLesson.title}" 단원을 학습 중이에요.` : '';
  const welcomeText = `안녕하세요! 자바 학습 AI 튜터입니다 👋\n${context}\n궁금한 개념이나 코드 오류를 자유롭게 질문해주세요!`;
  appendMessage('ai', welcomeText);
}

// ===== 메시지 렌더링 =====
function renderChatMessages() {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  container.innerHTML = '';
  Chatbot.history.forEach(msg => {
    appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content, false);
  });
  scrollToBottom();
}

function appendMessage(role, text, save = true) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${role} fade-in`;

  const avatar = role === 'ai' ? '🤖' : '👤';
  const bubbleText = text.replace(/\n/g, '<br>').replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px;">$1</code>');

  msgEl.innerHTML = `
    <div class="chat-msg-avatar">${avatar}</div>
    <div class="chat-bubble">${bubbleText}</div>
  `;

  container.appendChild(msgEl);
  scrollToBottom();

  if (save) {
    Chatbot.history.push({ role: role === 'user' ? 'user' : 'model', content: text });
    Chatbot.saveHistory();
  }
}

function showTyping() {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  const typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="chat-msg-avatar">🤖</div>
    <div class="chat-bubble chat-typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(typing);
  scrollToBottom();
}

function removeTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

function scrollToBottom() {
  const container = document.getElementById('chatbot-messages');
  if (container) container.scrollTop = container.scrollHeight;
}

// ===== 메시지 전송 =====
async function sendMessage(text) {
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const userText = text || (input ? input.value.trim() : '');
  if (!userText || Chatbot.isLoading) return;

  if (input) input.value = '';
  appendMessage('user', userText);

  Chatbot.isLoading = true;
  if (sendBtn) sendBtn.disabled = true;
  showTyping();

  try {
    const aiResponse = await callGeminiAPI(userText);
    removeTyping();
    appendMessage('ai', aiResponse);
  } catch (err) {
    removeTyping();
    appendMessage('ai', '죄송해요, 응답을 받지 못했어요. 잠시 후 다시 시도해주세요.');
    console.error('Gemini API 오류:', err);
  } finally {
    Chatbot.isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}

// ===== Gemini API 호출 (Java 서버 경유) =====
async function callGeminiAPI(userMessage) {
  const currentLesson = App.currentLesson;
  const systemContext = `당신은 자바 프로그래밍 학습을 돕는 친절한 AI 튜터입니다.
${currentLesson ? `현재 학생은 "${currentLesson.title}" 단원을 학습 중입니다.` : ''}
다음 규칙을 따라주세요:
1. 항상 한국어로 답변하세요.
2. 자바 초보자도 이해할 수 있도록 쉽게 설명하세요.
3. 코드 예제가 필요하면 짧고 명확하게 작성하세요.
4. 단순히 정답만 알려주지 말고, 왜 그런지 이유를 설명하세요.
5. 격려하는 말투를 사용하세요.`;

  // Java 백엔드 서버가 있는 경우 서버를 경유
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context: systemContext,
        history: Chatbot.history.slice(-6) // 최근 6개 대화만 전송
      })
    });
    if (!res.ok) throw new Error('서버 오류');
    const data = await res.json();
    return data.response;
  } catch (serverErr) {
    // 서버 없을 때 직접 호출 (개발용 - 프로덕션에서는 API 키 노출 위험)
    console.warn('서버 없음, 직접 API 호출 (개발 모드)');
    return await callGeminiDirect(userMessage, systemContext);
  }
}

// ===== 직접 Gemini API 호출 (개발/테스트용) =====
async function callGeminiDirect(userMessage, systemContext) {
  const API_KEY = window.GEMINI_API_KEY || '';
  if (!API_KEY) {
    return '⚠️ Gemini API 키가 설정되지 않았습니다.\n\nJava 서버를 실행하거나, index.html에서 API 키를 설정해주세요.';
  }

  const contents = [];

  // 이전 대화 내역 포함
  Chatbot.history.slice(-6).forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  // 현재 메시지
  contents.push({
    role: 'user',
    parts: [{ text: `${systemContext}\n\n사용자 질문: ${userMessage}` }]
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API 호출 실패');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했어요.';
}

// ===== 빠른 질문 버튼 =====
function quickAsk(text) {
  sendMessage(text);
}

// ===== 입력 이벤트 =====
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatbot-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // 오버레이 클릭시 닫기
  const overlay = document.getElementById('chatbot-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeChatbot();
    });
  }
});
