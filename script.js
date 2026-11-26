'use strict';

const progress = document.getElementById('progress');
const header = document.querySelector('.site-header');
let framePending = false;
let pageDistance = 1;
let lastProgress = -1;

// Естествен скрол: requestAnimationFrame обединява събитията в един кадър.
function updateProgress() {
  framePending = false;
  const value = Math.round(Math.max(0, Math.min(1, window.scrollY / pageDistance)) * 1000) / 10;
  if (value !== lastProgress) {
    progress.style.width = value + '%';
    lastProgress = value;
  }
}
function requestProgress() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateProgress);
}
function refreshLayout() {
  const height = header.offsetHeight + 'px';
  if (document.documentElement.style.getPropertyValue('--header-height') !== height) {
    document.documentElement.style.setProperty('--header-height', height);
  }
  // Геометрията се измерва при resize/промяна на съдържанието, не при скрол.
  pageDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  requestProgress();
}
window.addEventListener('scroll', requestProgress, { passive: true });
window.addEventListener('resize', refreshLayout);
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(refreshLayout);
  observer.observe(header);
  observer.observe(document.body);
}
refreshLayout();

// Архивно писмо: два слоя в една grid клетка, без модал или focus trap.
function initInvitation() {
  const invitation = document.getElementById('invitation');
  if (!invitation) return;
  const letter = document.getElementById('letter');
  const letterPhoto = document.getElementById('invitation-photo');
  const letterToggle = document.getElementById('letter-toggle');
  const letterClose = document.getElementById('letter-close');
  let letterOpen = false;

  invitation.classList.add('invitation-ready');
  letter.inert = true;
  letter.setAttribute('aria-hidden', 'true');
  letterToggle.hidden = false;
  letterClose.hidden = false;

  function setLetterOpen(open) {
    letterOpen = open;
    invitation.classList.toggle('letter-open', open);
    letterToggle.setAttribute('aria-expanded', String(open));
    letter.inert = !open;
    letter.setAttribute('aria-hidden', String(!open));
    letterPhoto.setAttribute('aria-hidden', String(open));
    if (open) letter.focus({ preventScroll: true });
    else letterToggle.focus({ preventScroll: true });
  }
  letterToggle.addEventListener('click', () => setLetterOpen(!letterOpen));
  letterClose.addEventListener('click', () => setLetterOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && letterOpen) {
      event.preventDefault();
      setLetterOpen(false);
    }
  });
}
initInvitation();

// Индексът на отговора продължава да означава същия дом като в оригиналния тест.
function initQuiz() {
  const quiz = document.getElementById('quiz');
  if (!quiz) return;

  const houses = [
    {
      name: 'Грифиндор', slug: 'gryffindor', values: 'Смелост и решителност', accent: '#D6A798',
      description: 'Твоята смелост те води напред. В Грифиндор ще откриеш хора, които застават зад убежденията си.'
    },
    {
      name: 'Слидерин', slug: 'slytherin', values: 'Амбиция и находчивост', accent: '#A3C5B0',
      description: 'Виждаш възможности там, където другите виждат пречки. Слидерин цени твоята находчивост и стремеж.'
    },
    {
      name: 'Рейвънклоу', slug: 'ravenclaw', values: 'Мъдрост и любознателност', accent: '#AAC0D8',
      description: 'Любопитството е твоят компас. В Рейвънклоу въпросите ти ще намират нови хоризонти.'
    },
    {
      name: 'Хафълпаф', slug: 'hufflepuff', values: 'Лоялност и трудолюбие', accent: '#DFC17E',
      description: 'Цениш хората до себе си и силата на общите усилия. Хафълпаф е дом за твоята вярност и търпение.'
    }
  ];
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
  const resultTitle = document.getElementById('result-title');
  const resultSummary = document.getElementById('result-summary');
  const resultHouses = document.getElementById('result-houses');
  const choices = document.getElementById('quiz-choices');
  const question = document.getElementById('quiz-question');
  const step = document.getElementById('quiz-step');
  const reset = document.getElementById('quiz-reset');
  const quizProgress = document.getElementById('quiz-progress');
  quiz.hidden = false;

  function focusQuizHeading(heading) {
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  function renderResult() {
    const highest = Math.max(...scores);
    const winners = houses.filter((house, index) => scores[index] === highest);
    step.textContent = 'Церемонията приключи';
    question.hidden = true;
    choices.hidden = true;
    result.hidden = false;
    resultTitle.textContent = winners.length === 1 ? 'Добре дошъл у дома.' : 'Повече от един път.';
    resultSummary.textContent = winners.length === 1 ? 'Шапката избра: ' + winners[0].name + '!' :
      'Шапката се колебае между: ' + winners.map(house => house.name).join(' и ') + '.';
    result.style.setProperty('--result-accent', winners.length === 1 ? winners[0].accent : 'var(--gold)');
    resultHouses.replaceChildren();

    // При равенство показваме ВСИЧКИ победители — няма случаен избор.
    winners.forEach(house => {
      const article = document.createElement('article');
      article.className = 'result-house';
      article.style.setProperty('--house-accent', house.accent);
      const image = document.createElement('img');
      image.src = 'assets/houses/' + house.slug + '.webp';
      image.alt = 'Цялото бродирано знаме на ' + house.name + ', с пръчка и ресни.';
      image.width = 520;
      image.height = 780;
      const copy = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = house.name;
      const values = document.createElement('p');
      values.className = 'result-values';
      values.textContent = house.values;
      const description = document.createElement('p');
      description.className = 'result-description';
      description.textContent = house.description;
      copy.append(heading, values, description);
      article.append(image, copy);
      resultHouses.appendChild(article);
    });
    refreshLayout();
    focusQuizHeading(resultTitle);
  }

  function renderQuestion() {
    choices.replaceChildren();
    quizProgress.style.width = questionIndex / questions.length * 100 + '%';
    if (questionIndex === questions.length) {
      renderResult();
      return;
    }
    step.textContent = 'Въпрос ' + (questionIndex + 1) + ' от ' + questions.length;
    question.textContent = questions[questionIndex][0];
    const answers = questions[questionIndex][1].map((label, index) => ({ label, index }));
    // Разместваме визуалната подредба, без да променяме точките за дома.
    answers.sort((a, b) => ((a.index + questionIndex) % 4) - ((b.index + questionIndex) % 4));
    answers.forEach(({ label, index }, position) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      const number = document.createElement('span');
      number.className = 'answer-index';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(position + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.textContent = label;
      button.append(number, text);
      button.addEventListener('click', () => {
        scores[index]++;
        questionIndex++;
        renderQuestion();
        if (questionIndex < questions.length) focusQuizHeading(question);
      });
      choices.appendChild(button);
    });
    refreshLayout();
  }
  reset.addEventListener('click', () => {
    scores = [0, 0, 0, 0];
    questionIndex = 0;
    result.hidden = true;
    resultSummary.textContent = '';
    resultHouses.replaceChildren();
    result.style.removeProperty('--result-accent');
    question.hidden = false;
    choices.hidden = false;
    renderQuestion();
    focusQuizHeading(question);
  });
  renderQuestion();
}
initQuiz();
