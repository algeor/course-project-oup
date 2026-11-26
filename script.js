'use strict';

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const mousePreference = matchMedia('(hover: hover) and (pointer: fine)');
const progress = document.getElementById('progress');
const header = document.querySelector('.site-header');
const journey = document.getElementById('home');
const viewport = document.querySelector('.cinematic-viewport');
const scenes = Array.from(document.querySelectorAll('.scene'));
const sceneCopies = scenes.map(scene => scene.querySelector('.scene-copy'));
const markers = Array.from(document.querySelectorAll('.scene-markers li'));
const sparkles = document.getElementById('sparkles');

let imagesReady = false;
let cinematicEnabled = false;
let framePending = false;
let layoutDirty = true;
let start = 0;
let distance = 1;
let pageDistance = 1;
let activeScene = -1;
let lastProgress = -1;
const lastOpacities = [-1, -1, -1, -1];

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

// Smoothstep: плавно начало и край на всяко преливане.
function ease(value) {
  return value * value * (3 - 2 * value);
}

function requestScrollUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateScroll);
}

function refreshLayout() {
  layoutDirty = true;
  requestScrollUpdate();
}

function configureCinematic() {
  const enabled = imagesReady && !motionPreference.matches &&
    CSS.supports('position', 'sticky') && window.innerHeight - header.offsetHeight >= 280;
  if (enabled === cinematicEnabled) return;

  cinematicEnabled = enabled;
  document.body.classList.toggle('cinematic-ready', enabled);
  activeScene = -1;
  scenes.forEach((scene, index) => {
    scene.style.removeProperty('opacity');
    sceneCopies[index].style.removeProperty('opacity');
    scene.removeAttribute('aria-hidden');
    lastOpacities[index] = -1;
  });
  if (enabled) createAtmosphere();
  else sparkles.replaceChildren();
  refreshLayout();
}

function measureLayout() {
  const height = header.offsetHeight;
  const value = height + 'px';
  if (document.documentElement.style.getPropertyValue('--header-height') !== value) {
    document.documentElement.style.setProperty('--header-height', value);
  }
  configureCinematic();
  // Кешираме геометрията само при промяна на оформлението, не при всеки скрол.
  start = journey.getBoundingClientRect().top + window.scrollY - height;
  distance = Math.max(1, journey.offsetHeight - viewport.offsetHeight);
  pageDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  layoutDirty = false;
}

function updateScroll() {
  framePending = false;
  if (layoutDirty) measureLayout();
  const pageProgress = Math.round(clamp(window.scrollY / pageDistance) * 1000) / 10;
  if (pageProgress !== lastProgress) {
    progress.style.width = pageProgress + '%';
    lastProgress = pageProgress;
  }
  if (!cinematicEnabled) return;

  // 0 = начало на sticky секцията; 1 = край. Работи и при обратен скрол.
  const normalized = clamp((window.scrollY - start) / distance);
  const position = normalized * (scenes.length - 1);
  const current = Math.min(Math.floor(position), scenes.length - 2);
  const fraction = position - current;
  // Задържаме кадъра в началото и края на всеки интервал (28% / 28%).
  const fade = ease(clamp((fraction - 0.28) / 0.44));

  scenes.forEach((scene, index) => {
    const opacity = index === current ? 1 - fade : index === current + 1 ? fade : 0;
    const rounded = Math.round(opacity * 1000) / 1000;
    if (lastOpacities[index] !== rounded) {
      scene.style.opacity = rounded;
      // Текстът изчезва преди средата и се появява след нея, без застъпване.
      sceneCopies[index].style.opacity = ease(clamp((rounded - 0.5) / 0.5));
      lastOpacities[index] = rounded;
    }
  });

  const dominant = fade < 0.5 ? current : current + 1;
  if (dominant !== activeScene) {
    activeScene = dominant;
    scenes.forEach((scene, index) => scene.setAttribute('aria-hidden', String(index !== dominant)));
    markers.forEach((marker, index) => marker.classList.toggle('active', index === dominant));
  }
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', refreshLayout);
if ('ResizeObserver' in window) {
  const layoutObserver = new ResizeObserver(refreshLayout);
  layoutObserver.observe(header);
  layoutObserver.observe(document.body);
}
refreshLayout();

// Всички четири локални изображения се декодират ПРЕДИ включване на преливането.
// При грешка оставяме статичните сцени и останалото съдържание достъпни.
Promise.all(scenes.map(async scene => {
  const image = scene.querySelector('img');
  try {
    if (image.decode) await image.decode();
    else if (!image.complete) {
      await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
    }
    return image.naturalWidth > 0;
  } catch {
    return false;
  }
})).then(ready => {
  imagesReady = ready.every(Boolean);
  configureCinematic();
  refreshLayout();
});

function createAtmosphere() {
  if (sparkles.childElementCount) return;
  const fragment = document.createDocumentFragment();
  const count = window.innerWidth <= 600 ? 8 : 14;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    const size = 1 + Math.random() * 2;
    spark.style.left = Math.random() * 100 + '%';
    spark.style.width = spark.style.height = size + 'px';
    spark.style.animationDuration = 12 + Math.random() * 9 + 's';
    spark.style.animationDelay = -Math.random() * 20 + 's';
    fragment.appendChild(spark);
  }
  sparkles.appendChild(fragment);
}

// Спираме декоративните анимации, когато пътешествието е извън екрана.
if ('IntersectionObserver' in window) {
  const visibilityObserver = new IntersectionObserver(entries => {
    journey.classList.toggle('effects-paused', !entries[0].isIntersecting);
  });
  visibilityObserver.observe(journey);
}

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
motionPreference.addEventListener('change', () => {
  configureCinematic();
  updateGlitterPreference();
  refreshLayout();
});
mousePreference.addEventListener('change', updateGlitterPreference);
updateGlitterPreference();
