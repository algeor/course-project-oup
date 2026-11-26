// Прогрес на страницата и приближаване към замъка.
const progress = document.getElementById('progress');
const castle = document.querySelector('.castle');
const journey = document.querySelector('.journey');
function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
  const distance = Math.max(1, journey.offsetHeight - window.innerHeight);
  const fraction = Math.max(0, Math.min(1, -journey.getBoundingClientRect().top / distance));
  castle.style.transform = 'scale(' + (1.03 + fraction * 0.75) + ')';
}
window.addEventListener('scroll', updateScroll, {passive:true});
window.addEventListener('resize', updateScroll);
updateScroll();
// Разпределителна шапка: пет въпроса и точки за четирите дома.
const houses = ['Грифиндор','Слидерин','Рейвънклоу','Хафълпаф'];
const questions = [
  ['Кое качество цениш най-много?',['Смелост','Амбиция','Мъдрост','Лоялност']],
  ['Как решаваш труден проблем?',['Действам решително','Изготвям стратегия','Проучвам фактите','Работя с приятели']],
  ['Какво би избрал в библиотеката?',['Книга за приключения','Книга за велики магьосници','Книга с древни загадки','Книга за магически създания']],
  ['Какво правиш при несправедливост?',['Защитавам пострадалия','Търся начин да променя правилата','Разследвам причината','Подкрепям засегнатите']],
  ['Как искаш да бъдеш запомнен?',['Като смел човек','Като успешен човек','Като мъдър човек','Като верен приятел']]
];
let scores = [0,0,0,0], questionIndex = 0;
const result = document.getElementById('result');
const choices = document.getElementById('quiz-choices');
const question = document.getElementById('quiz-question');
const step = document.getElementById('quiz-step');
const reset = document.getElementById('quiz-reset');
function renderQuestion(){
  choices.replaceChildren();
  if(questionIndex === questions.length){
    const winners = houses.filter((_,i)=>scores[i]===Math.max(...scores));
    step.textContent = 'Церемонията приключи';
    question.textContent = 'Твоят резултат';
    result.textContent = winners.length===1 ? 'Шапката избра: '+winners[0]+'!' : 'Шапката се колебае между: '+winners.join(' и ')+'.';
    reset.hidden = false;
    reset.focus({preventScroll:true});
    return;
  }
  step.textContent = 'Въпрос '+(questionIndex+1)+' от '+questions.length;
  question.textContent = questions[questionIndex][0];
  // Разместваме подредбата, но пазим индекса на дома.
  questions[questionIndex][1].map((label,index)=>({label,index})).sort((a,b)=>((a.index+questionIndex)%4)-((b.index+questionIndex)%4)).forEach(({label,index})=>{
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click',()=>{scores[index]++;questionIndex++;renderQuestion();if(choices.firstElementChild)choices.firstElementChild.focus({preventScroll:true});});
    choices.appendChild(button);
  });
}
reset.addEventListener('click',()=>{scores=[0,0,0,0];questionIndex=0;result.textContent='';reset.hidden=true;renderQuestion();choices.firstElementChild.focus({preventScroll:true});});
renderQuestion();
// Отваряне на писмото.
const seal = document.getElementById('seal');
seal.addEventListener('click', () => {
  document.getElementById('envelope').classList.add('open');
  document.getElementById('letter').inert = false;
  seal.setAttribute('aria-expanded', 'true');
  seal.disabled = true;
  document.getElementById('letter-hint').textContent = 'Добре дошли в света на магията!';
  document.querySelector('.letter a').focus({preventScroll:true});
});
// Магически светлинки.
const sparkles = document.getElementById('sparkles');
for (let i = 0; i < 40; i++) {
  const spark = document.createElement('span');
  spark.className = 'spark';
  spark.style.left = Math.random() * 100 + '%';
  const size = 2 + Math.random() * 3;
  spark.style.width = spark.style.height = size + 'px';
  spark.style.animationDuration = 7 + Math.random() * 10 + 's';
  spark.style.animationDelay = -Math.random() * 15 + 's';
  sparkles.appendChild(spark);
}
// Плавно появяване и магическа следа само при мишка и разрешени анимации.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }), {threshold:0.08});
    document.body.classList.add('reveal-ready');
    document.querySelectorAll('.section').forEach(section=>observer.observe(section));
  }
  if (matchMedia('(pointer:fine)').matches) {
    const wand = document.getElementById('wand');
    let last = 0;
    window.addEventListener('pointermove', e => {
      if(e.pointerType!=='mouse')return;
      wand.style.left=e.clientX+'px';wand.style.top=e.clientY+'px';wand.style.opacity='1';
      if(performance.now()-last<45)return;
      last=performance.now();
      const dot=document.createElement('span');dot.className='trail';dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';document.body.appendChild(dot);dot.addEventListener('animationend',()=>dot.remove(),{once:true});
    });
    document.documentElement.addEventListener('pointerleave',()=>wand.style.opacity='0');
  }
}
