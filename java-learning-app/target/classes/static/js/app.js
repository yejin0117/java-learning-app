// ===== 앱 상태 관리 =====
const App = {
  lessons: [],
  currentLesson: null,
  currentQuizIndex: 0,
  quizAnswered: false,
  quizScore: 0,

  // LocalStorage 키
  STORAGE_KEYS: {
    PROGRESS: 'javalearn_progress',
    SCORES: 'javalearn_scores',
    CHAT_HISTORY: 'javalearn_chat'
  },

  // 진도 불러오기
  getProgress() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : { completedLessons: [], unlockedLessons: [1] };
  },

  // 진도 저장
  saveProgress(progress) {
    localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  // 점수 기록
  getScores() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.SCORES);
    return raw ? JSON.parse(raw) : {};
  },

  saveScore(lessonId, score) {
    const scores = this.getScores();
    scores[lessonId] = score;
    localStorage.setItem(this.STORAGE_KEYS.SCORES, JSON.stringify(scores));
  },

  // 단원 완료 처리
  completeLesson(lessonId) {
    const progress = this.getProgress();
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }
    const nextId = lessonId + 1;
    if (!progress.unlockedLessons.includes(nextId)) {
      progress.unlockedLessons.push(nextId);
    }
    this.saveProgress(progress);
    updateNavbar();
  }
};

// ===== 페이지 전환 =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ===== 네비게이션 업데이트 =====
function updateNavbar() {
  const progress = App.getProgress();
  const total = App.lessons.length;
  const done = progress.completedLessons.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const fill = document.getElementById('nav-progress-fill');
  const label = document.getElementById('nav-progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done}/${total} 완료`;
}

// ===== 메인 페이지 렌더링 =====
function renderMainPage() {
  const progress = App.getProgress();
  const scores = App.getScores();
  const grid = document.getElementById('lessons-grid');
  if (!grid) return;

  grid.innerHTML = '';

  App.lessons.forEach(lesson => {
    const isCompleted = progress.completedLessons.includes(lesson.id);
    const isUnlocked = progress.unlockedLessons.includes(lesson.id);
    const score = scores[lesson.id];
    const quizCount = lesson.quiz.length;

    const card = document.createElement('div');
    card.className = `lesson-card${isCompleted ? ' completed' : ''}${!isUnlocked ? ' locked' : ''}`;
    card.style.setProperty('--lesson-color', lesson.color);

    let badgeHtml = '';
    if (isCompleted) {
      badgeHtml = `<span class="lesson-badge badge-completed">✓ 완료 ${score !== undefined ? score + '점' : ''}</span>`;
    } else if (isUnlocked) {
      badgeHtml = `<span class="lesson-badge badge-ready">학습 가능</span>`;
    } else {
      badgeHtml = `<span class="lesson-badge badge-locked">🔒 잠금</span>`;
    }

    let dotsHtml = '<div class="lesson-progress-dots">';
    for (let i = 0; i < quizCount; i++) {
      dotsHtml += `<div class="progress-dot${isCompleted ? ' done' : ''}"></div>`;
    }
    dotsHtml += '</div>';

    card.innerHTML = `
      <div class="lesson-card-header">
        <div class="lesson-icon" style="background:${lesson.color}22;">${lesson.icon}</div>
        <div>
          <div class="lesson-title">${lesson.title}</div>
        </div>
      </div>
      <div class="lesson-desc">${lesson.description}</div>
      <div class="lesson-footer">
        ${badgeHtml}
        <div class="lesson-progress-mini">
          ${dotsHtml}
          <span style="font-size:11px;color:var(--text-light);">${quizCount}문제</span>
        </div>
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => startLesson(lesson.id));
    }

    grid.appendChild(card);
  });

  // 히어로 통계 업데이트
  const totalDone = progress.completedLessons.length;
  const avgScore = Object.values(scores).length > 0
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length)
    : 0;

  const statDone = document.getElementById('stat-done');
  const statScore = document.getElementById('stat-score');
  const statTotal = document.getElementById('stat-total');
  if (statDone) statDone.textContent = totalDone;
  if (statScore) statScore.textContent = avgScore > 0 ? avgScore + '점' : '-';
  if (statTotal) statTotal.textContent = App.lessons.length;

  updateNavbar();
}

// ===== 학습 페이지 =====
function startLesson(lessonId) {
  const lesson = App.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  App.currentLesson = lesson;

  document.getElementById('learn-breadcrumb-lesson').textContent = lesson.title;
  document.getElementById('learn-lesson-title').textContent = lesson.title;
  document.getElementById('learn-concept-summary').textContent = lesson.concept.summary;

  const detailsEl = document.getElementById('learn-concept-details');
  detailsEl.innerHTML = lesson.concept.details.map(d => `<li>${d}</li>`).join('');

  const codeEl = document.getElementById('learn-code-content');
  codeEl.textContent = lesson.concept.codeExample;
  highlightCode(codeEl);

  setLearnStep(1);
  showPage('page-learn');
}

function setLearnStep(step) {
  [1, 2, 3].forEach(s => {
    const circle = document.getElementById(`step-circle-${s}`);
    const label = document.getElementById(`step-label-${s}`);
    const line = document.getElementById(`step-line-${s}`);
    if (circle) {
      circle.className = 'step-circle' + (s < step ? ' done' : s === step ? ' active' : '');
      circle.textContent = s < step ? '✓' : s;
    }
    if (label) {
      label.className = 'step-label' + (s < step ? ' done' : s === step ? ' active' : '');
    }
    if (line && s < 3) {
      line.className = 'step-line' + (s < step ? ' done' : '');
    }
  });
}

// ===== 퀴즈 페이지 =====
function startQuiz() {
  if (!App.currentLesson) return;
  App.currentQuizIndex = 0;
  App.quizScore = 0;
  App.quizAnswered = false;
  setLearnStep(2);
  renderQuiz();
  showPage('page-quiz');
}

function renderQuiz() {
  const lesson = App.currentLesson;
  const quiz = lesson.quiz[App.currentQuizIndex];
  const total = lesson.quiz.length;
  const current = App.currentQuizIndex + 1;

  document.getElementById('quiz-lesson-title').textContent = lesson.title;
  document.getElementById('quiz-count').textContent = `문제 ${current} / ${total}`;
  document.getElementById('quiz-progress-fill').style.width = ((current - 1) / total * 100) + '%';
  document.getElementById('quiz-score-badge').textContent = `점수: ${App.quizScore}`;
  document.getElementById('quiz-question').textContent = quiz.question;

  const optionsEl = document.getElementById('quiz-options');
  const labels = ['A', 'B', 'C', 'D'];
  optionsEl.innerHTML = quiz.options.map((opt, i) => `
    <button class="quiz-option" onclick="selectOption(${i})">
      <span class="option-label">${labels[i]}</span>
      ${opt}
    </button>
  `).join('');

  const feedback = document.getElementById('quiz-feedback');
  feedback.className = 'feedback-box';
  feedback.innerHTML = '';

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = current < total ? '다음 문제 →' : '결과 보기';

  App.quizAnswered = false;
}

function selectOption(selectedIndex) {
  if (App.quizAnswered) return;
  App.quizAnswered = true;

  const quiz = App.currentLesson.quiz[App.currentQuizIndex];
  const isCorrect = selectedIndex === quiz.answer;
  if (isCorrect) App.quizScore += Math.round(100 / App.currentLesson.quiz.length);

  const options = document.querySelectorAll('.quiz-option');
  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === quiz.answer) btn.classList.add('correct');
    else if (i === selectedIndex && !isCorrect) btn.classList.add('wrong');
  });

  const feedback = document.getElementById('quiz-feedback');
  feedback.className = `feedback-box ${isCorrect ? 'correct-fb' : 'wrong-fb'} show`;
  feedback.innerHTML = `
    <div class="feedback-title">${isCorrect ? '🎉 정답입니다!' : '❌ 틀렸습니다'}</div>
    <div class="feedback-text">${quiz.explanation}</div>
  `;

  document.getElementById('quiz-next-btn').disabled = false;
}

function nextQuiz() {
  const total = App.currentLesson.quiz.length;
  App.currentQuizIndex++;
  if (App.currentQuizIndex < total) {
    renderQuiz();
  } else {
    showResult();
  }
}

function showResult() {
  const finalScore = Math.min(App.quizScore, 100);
  App.saveScore(App.currentLesson.id, finalScore);
  App.completeLesson(App.currentLesson.id);
  setLearnStep(3);

  document.getElementById('result-score').textContent = finalScore;
  document.getElementById('result-lesson-title').textContent = App.currentLesson.title;

  let emoji = '😅', title = '다시 도전해봐요', msg = '개념을 다시 학습하고 재도전해보세요!';
  if (finalScore >= 90) { emoji = '🏆'; title = '완벽해요!'; msg = '모든 문제를 훌륭하게 맞혔습니다!'; }
  else if (finalScore >= 70) { emoji = '🎉'; title = '잘했어요!'; msg = '조금만 더 연습하면 완벽해질 거예요!'; }
  else if (finalScore >= 50) { emoji = '💪'; title = '절반 이상 맞혔어요!'; msg = '다시 한번 개념을 살펴보세요.'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-message').textContent = msg;

  showPage('page-result');
}

// ===== 코드 하이라이팅 (간단 버전) =====
function highlightCode(el) {
  let code = el.textContent;
  code = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>')
    .replace(/(".*?")/g, '<span class="st">$1</span>')
    .replace(/\b(public|class|void|new|static|return|this|extends|implements|if|else|for|int|String|boolean|override)\b/g, '<span class="kw">$1</span>')
    .replace(/@(\w+)/g, '<span class="fn">@$1</span>');
  el.innerHTML = code;
}

// ===== 코드 복사 =====
function copyCode() {
  const code = App.currentLesson?.concept.codeExample || '';
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('code-copy-btn');
    if (btn) { btn.textContent = '복사됨 ✓'; setTimeout(() => btn.textContent = '복사', 2000); }
  });
}

// ===== 데이터 로드 =====
async function loadLessons() {
  try {
    const res = await fetch('/api/lessons');
    const data = await res.json();
    App.lessons = data;
  } catch (e) {
    console.warn('API 없음, 로컬 JSON 사용');
    try {
      const res = await fetch('/lessons.json');
      const data = await res.json();
      App.lessons = data.lessons;
    } catch (e2) {
      console.error('데이터 로드 실패', e2);
    }
  }
  renderMainPage();
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  loadLessons();
  showPage('page-main');
});
