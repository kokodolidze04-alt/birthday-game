(function () {
  const $ = id => document.getElementById(id);

  const screens = [
    'intro',
    'gameScreen',
    'celebration',
    'game2Screen',
    'game3Screen',
    'finalScreen'
  ];

  let firstGame = null;
  let jumpGame = null;
  let transitioning = false;
  let game2Won = false;

  function show(id) {
    $(id).classList.remove('hidden');
  }

  function hide(id) {
    $(id).classList.add('hidden');
  }

  function showOnly(id) {
  screens.forEach(screenId => hide(screenId));
  show(id);

  const musicScenes = {
    intro: 'intro',
    gameScreen: 'game1',
    celebration: 'game1',
    game2Screen: 'game2',
    game3Screen: 'game3',
    finalScreen: 'final'
  };

  if (window.gameMusic) {
    window.gameMusic.setScene(musicScenes[id] || 'intro');
    window.gameMusic.resume();
  }
}

  function burst() {
    const container = $('confetti');
    const colors = [
      '#a78bfa',
      '#f472b6',
      '#67e8f9',
      '#facc15',
      '#34d399',
      '#fb7185'
    ];

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];

      piece.style.setProperty(
        '--duration',
        `${2 + Math.random() * 2.5}s`
      );

      piece.style.setProperty(
        '--drift',
        `${Math.random() * 300 - 150}px`
      );

      container.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }
  }

  function celebrate() {
    const flash = $('flash');
    flash.classList.remove('active');
    void flash.offsetWidth;
    flash.classList.add('active');
    burst();
  }

  // სხვა ფაილებსაც შეუძლიათ დაბადების დღის ეფექტის გაშვება.
  window.birthdayCelebrate = celebrate;

  function startFirstGame() {
    firstGame?.destroy();
    jumpGame?.destroy();

    showOnly('gameScreen');

    $('caught').textContent = '0';
    $('nextNumber').textContent = '1';
    $('progress').style.width = '0%';

    firstGame = window.createGame({
      onProgress(caught, next) {
        $('caught').textContent = caught;
        $('nextNumber').textContent = next > 15 ? '✓' : next;
        $('progress').style.width = `${caught / 15 * 100}%`;
      },

      onComplete() {
        setTimeout(() => {
          showOnly('celebration');
          $('finalScore').textContent = '15 / 15';
          celebrate();
        }, 250);
      }
    });

    firstGame.start();
  }

  function openSecondGame() {
    if (transitioning) return;
    transitioning = true;

    try {
      firstGame?.destroy();
      firstGame = null;

      jumpGame?.destroy();
      jumpGame = null;

      game2Won = false;

      showOnly('game2Screen');
      show('game2StartOverlay');
      hide('game2EndOverlay');

      $('game2Score').textContent = '15';
      $('game2ContinueButton').textContent = 'თავიდან თამაში ↻';
    } finally {
      transitioning = false;
    }
  }

  function startSecondGame() {
    hide('game2StartOverlay');
    hide('game2EndOverlay');

    jumpGame?.destroy();

    jumpGame = window.createGame2({
      onScore(score) {
        $('game2Score').textContent = score;
      },

      onFinish(score, won) {
        game2Won = won;

        $('game2EndTitle').textContent = won
          ? 'შენ გაიმარჯვე! 🎉'
          : 'კიდევ სცადე! 💜';

        $('game2EndEmoji').textContent = won ? '🏆' : '🌠';

        $('game2EndMessage').textContent = won
          ? '30 ქულა დააგროვე! წინ კიდევ ერთი სახალისო გამოწვევა გელოდება. 💗'
          : `შენი საბოლოო ქულაა ${score} / 30. თავიდან სცადე!`;

        $('game2ContinueButton').textContent = won
          ? 'მესამე თამაში 💖'
          : 'თავიდან თამაში ↻';

        show('game2EndOverlay');

        if (won) celebrate();
      }
    });

    jumpGame.start();
  }

  function openThirdGame() {
    jumpGame?.destroy();
    jumpGame = null;

    showOnly('game3Screen');
    hide('game3EndOverlay');
    show('game3StartOverlay');

    $('game3Score').textContent = '0';
    $('heartMessage').textContent = 'მზად ხარ? 💖';

    $('game3FinishButton').textContent = 'დაბადების დღის სიურპრიზი 🎂';
  }

  function replayAll() {
    firstGame?.destroy();
    jumpGame?.destroy();

    firstGame = null;
    jumpGame = null;

    showOnly('intro');
  }

  $('startButton').addEventListener('click', startFirstGame);
  $('nextGameButton').addEventListener('click', openSecondGame);
  $('startJumpButton').addEventListener('click', startSecondGame);

  $('game2ContinueButton').addEventListener('click', () => {
    if (game2Won) {
      openThirdGame();
    } else {
      startSecondGame();
    }
  });

  $('replayButton').addEventListener('click', replayAll);

  window.addEventListener('resize', () => {
    if ($('gameScreen').classList.contains('hidden')) return;

    const field = $('numberField');

    document.querySelectorAll('.number-button').forEach(button => {
      const x = Math.min(
        Math.max(25, parseFloat(button.style.left) || 25),
        field.clientWidth - 25
      );

      const y = Math.min(
        Math.max(25, parseFloat(button.style.top) || 25),
        field.clientHeight - 25
      );

      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
    });
  });
})();