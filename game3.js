(function () {
  const $ = id => document.getElementById(id);

  const stage = $('heartStage');
  const target = $('heartTarget');
  const message = $('heartMessage');
  const scoreLabel = $('game3Score');

  const TARGET_SCORE = 9;

  let score = 0;
  let running = false;
  let timer = null;
  let round = 0;
  let currentHeart = null;
  let locked = false;

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function speed() {
  return Math.max(150, 420 - score * 30);
}

  function updateScore() {
    scoreLabel.textContent = score;
  }

  function hideHeart() {
    target.classList.add('hidden');
    target.classList.remove('heart-good', 'heart-bad', 'heart-pop');
    target.textContent = '';
    currentHeart = null;
  }

  function endGame(won) {
    if (!running) return;

    running = false;
    locked = true;
    clearTimer();
    hideHeart();

    $('game3EndEmoji').textContent = won ? '💖🎉' : '💗';
    $('game3EndTitle').textContent = won
      ? 'შენ გაიმარჯვე! 🎉'
      : 'თამაში დასრულდა';

    $('game3EndMessage').textContent = won
      ? '9 ქულა დააგროვე! ახლა კი შენთვის ყველაზე მნიშვნელოვანი სიურპრიზი გელოდება. 💐'
      : 'კიდევ ერთხელ სცადე!';

    $('game3FinishButton').textContent = won
      ? 'დაბადების დღის სიურპრიზი 🎂'
      : 'თავიდან თამაში ↻';

    $('game3EndOverlay').classList.remove('hidden');

    if (won && typeof window.birthdayCelebrate === 'function') {
      window.birthdayCelebrate();
    }
  }

  function scheduleNext(delay) {
    clearTimer();

    timer = setTimeout(() => {
      if (!running) return;
      spawnHeart();
    }, delay);
  }

  function spawnHeart() {
    if (!running) return;

    locked = false;
    round++;

    // გულების უმეტესობა წითელია, ნაწილი კი გატეხილი.
    const isBroken = Math.random() < 0.28;
    currentHeart = isBroken ? 'broken' : 'good';

    target.textContent = isBroken ? '💔' : '❤️';
    target.classList.toggle('heart-good', !isBroken);
    target.classList.toggle('heart-bad', isBroken);
    target.classList.remove('hidden');

    // გულს ყოველთვის სათამაშო სივრცის ცენტრში ვაჩენთ.
    target.style.left = '50%';
    target.style.top = '50%';

    message.textContent = isBroken
      ? 'ფრთხილად! 💔'
      : 'ახლავე დააჭირე! ❤️';

    target.classList.remove('heart-pop');
    void target.offsetWidth;
    target.classList.add('heart-pop');

    // თუ დრო გავიდა და მოთამაშემ არ დააჭირა,
    // ქულა არ იცვლება.
    scheduleNext(speed());
  }

  function handleHeartTap(event) {
    event.preventDefault();

    if (!running || locked || !currentHeart) return;

    clearTimer();
    locked = true;

   if (currentHeart === 'good') {
  score = Math.min(TARGET_SCORE, score + 1);
  message.textContent = '+1 💖';
  window.gameMusic?.effect('good');
} else {
  score = Math.max(0, score - 1);
  message.textContent = '−1 💔';
  window.gameMusic?.effect('bad');
}

    updateScore();

    target.classList.add('hidden');
    currentHeart = null;

    if (score >= TARGET_SCORE) {
      endGame(true);
      return;
    }

    // მოკლე პაუზა შედეგის საჩვენებლად.
    scheduleNext(90);
  }

  function start() {
    clearTimer();

    score = 0;
    round = 0;
    running = true;
    locked = false;

    updateScore();
    hideHeart();

    $('game3StartOverlay').classList.add('hidden');
    $('game3EndOverlay').classList.add('hidden');

    message.textContent = 'მოემზადე... 💗';
    scheduleNext(500);
  }

  function stop() {
    running = false;
    locked = true;
    clearTimer();
    hideHeart();
  }

  target.addEventListener('pointerdown', handleHeartTap);

  $('startHeartButton').addEventListener('click', start);

  $('game3FinishButton').addEventListener('click', () => {
    if (score >= TARGET_SCORE) {
      stop();
      $('game3Screen').classList.add('hidden');
      $('finalScreen').classList.remove('hidden');

      if (typeof window.birthdayCelebrate === 'function') {
        window.birthdayCelebrate();
      }
    } else {
      start();
    }
  });

  window.createGame3 = {
    start,
    stop
  };
})();