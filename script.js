'use strict';
// Естествен скрол: само индикатор за прогрес, без sticky сцени и zoom.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const mousePreference = matchMedia('(hover: hover) and (pointer: fine)');
const progress = document.getElementById('progress');
const header = document.querySelector('.site-header');
let framePending = false;
function updateProgress() {
  framePending = false;
  const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.style.width = Math.max(0, Math.min(100, window.scrollY / distance * 100)) + '%';
}
function requestProgress() {
  if (!framePending) { framePending = true; requestAnimationFrame(updateProgress); }
}
function refreshLayout() {
  document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  requestProgress();
}
window.addEventListener('scroll', requestProgress, {passive:true});
window.addEventListener('resize', refreshLayout);
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(refreshLayout);
  observer.observe(header);
  observer.observe(document.body);
}
refreshLayout();

// Писмото остава обикновена връзка без JS; с JS го отваря восъчният печат.
const seal = document.getElementById('seal');
const envelope = document.getElementById('envelope');
const letter = document.getElementById('letter');
envelope.classList.remove('open');
letter.inert = true;
seal.hidden = false;
document.getElementById('letter-hint').textContent = 'Натисни восъчния печат, за да отвориш писмото.';
seal.addEventListener('click', () => {
  envelope.classList.add('open');
  letter.inert = false;
  seal.setAttribute('aria-expanded', 'true');
  seal.disabled = true;
  document.getElementById('letter-hint').textContent = 'Добре дошли в света на магията!';
  letter.querySelector('a').focus({ preventScroll: true });
});

// Оригиналните пет въпроса и точки за четирите дома са запазени.
const houses = ['Грифиндор', 'Слидерин', 'Рейвънклоу', 'Хафълпаф'];
const questions = [
  ['Кое качество цениш най-много?', ['Смелост', 'Амбиция', 'Мъдрост', 'Лоялност']],
  ['Как решаваш труден проблем?', ['Действам решително', 'Изготвям стратегия', 'Проучвам фактите', 'Работя с приятели']],
  ['Какво би избрал в библиотеката?', ['Книга за приключения', 'Книга за велики магьосници', 'Книга с древни загадки', 'Книга за магически създания']],
  ['Какво правиш при несправедливост?', ['Защитавам пострадалия', 'Търся начин да променя правилата', 'Разследвам причината', 'Подкрепям засегнатите']],
  ['Как искаш да бъдеш запомнен?', ['Като смел човек', 'Като успешен човек', 'Като мъдър човек', 'Като верен приятел']]
];
let scores = [0, 0, 0, 0];
let questionIndex = 0;
const result = document.getElementById('result');
const choices = document.getElementById('quiz-choices');
const question = document.getElementById('quiz-question');
const step = document.getElementById('quiz-step');
const reset = document.getElementById('quiz-reset');
const quizProgress = document.getElementById('quiz-progress');
document.getElementById('quiz').hidden = false;

function renderQuestion() {
  choices.replaceChildren();
  quizProgress.style.width = questionIndex / questions.length * 100 + '%';
  if (questionIndex === questions.length) {
    const highest = Math.max(...scores);
    const winners = houses.filter((house, index) => scores[index] === highest);
    step.textContent = 'Церемонията приключи';
    question.textContent = 'Твоят резултат';
    result.textContent = winners.length === 1 ? 'Шапката избра: ' + winners[0] + '!' :
      'Шапката се колебае между: ' + winners.join(' и ') + '.';
    reset.hidden = false;
    reset.focus({ preventScroll: true });
    refreshLayout();
    return;
  }
  step.textContent = 'Въпрос ' + (questionIndex + 1) + ' от ' + questions.length;
  question.textContent = questions[questionIndex][0];
  // Разместваме подредбата, но пазим индекса на съответния дом.
  const answers = questions[questionIndex][1].map((label, index) => ({ label, index }));
  answers.sort((a, b) => ((a.index + questionIndex) % 4) - ((b.index + questionIndex) % 4));
  answers.forEach(({ label, index }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      scores[index]++;
      questionIndex++;
      renderQuestion();
      // Новият въпрос получава фокус, за да бъде прочетен от екранен четец.
      if (questionIndex < questions.length) question.focus({ preventScroll: true });
    });
    choices.appendChild(button);
  });
  refreshLayout();
}
reset.addEventListener('click', () => {
  scores = [0, 0, 0, 0];
  questionIndex = 0;
  result.textContent = '';
  reset.hidden = true;
  renderQuestion();
  question.focus({ preventScroll: true });
});
renderQuestion();

// Родният курсор остава видим. Следата има лимит и време за автоматично изтриване.
const glitterColors = ['#dec28a', '#f1dfb6', '#fff2d6'];
const glitterParticles = new Set();
let glitterEnabled = false;
let lastParticle = 0;
function removeParticle(particle) {
  particle.remove();
  glitterParticles.delete(particle);
}
function addGlitter(event) {
  if (!glitterEnabled || event.pointerType !== 'mouse') return;
  const now = performance.now();
  if (now - lastParticle < 65 || glitterParticles.size >= 14) return;
  lastParticle = now;
  const particle = document.createElement('span');
  particle.className = 'trail';
  particle.setAttribute('aria-hidden', 'true');
  const size = 1.5 + Math.random() * 2.5;
  particle.style.width = particle.style.height = size + 'px';
  particle.style.left = event.clientX - size / 2 + 'px';
  particle.style.top = event.clientY - size / 2 + 'px';
  particle.style.setProperty('--particle-color', glitterColors[Math.floor(Math.random() * glitterColors.length)]);
  glitterParticles.add(particle);
  document.body.appendChild(particle);
  particle.addEventListener('animationend', () => removeParticle(particle), { once: true });
  // Резервно изтриване дори ако браузърът прекъсне CSS анимацията.
  setTimeout(() => removeParticle(particle), 850);
}
function updateGlitterPreference() {
  const enabled = !motionPreference.matches && mousePreference.matches && navigator.maxTouchPoints === 0;
  if (enabled === glitterEnabled) return;
  glitterEnabled = enabled;
  if (enabled) window.addEventListener('pointermove', addGlitter, { passive: true });
  else {
    window.removeEventListener('pointermove', addGlitter);
    glitterParticles.forEach(removeParticle);
  }
}
motionPreference.addEventListener('change', updateGlitterPreference);
mousePreference.addEventListener('change', updateGlitterPreference);
updateGlitterPreference();
