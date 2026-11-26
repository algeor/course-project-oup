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
// Избор на дом според предпочитано качество.
const result = document.getElementById('result');
document.querySelectorAll('[data-house]').forEach(button => {
  button.addEventListener('click', () => {
    result.textContent = 'Шапката избра: ' + button.dataset.house + '!';
  });
});
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