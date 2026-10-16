// music.js — ორიგინალური, კოდით გენერირებული თამაშის მუსიკა
(function () {
  let audio = null;
  let master = null;
  let musicGain = null;
  let timer = null;
  let enabled = true;
  let scene = 'intro';
  let step = 0;
  let nextTime = 0;

  const bpm = {
    intro: 76,
    game1: 108,
    game2: 142,
    game3: 176,
    final: 96
  };

  const melodies = {
    intro: [0, 4, 7, 11, 7, 4, 2, 7],
    game1: [0, 7, 4, 9, 7, 4, 2, 5],
    game2: [0, 3, 7, 10, 7, 3, 5, 10],
    game3: [0, 7, 12, 7, 10, 7, 3, 12],
    final: [0, 4, 7, 12, 11, 7, 4, 2]
  };

  const roots = {
    intro: 261.63,
    game1: 293.66,
    game2: 220,
    game3: 246.94,
    final: 261.63
  };

  function setup() {
    if (audio) return;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      console.warn('ამ ბრაუზერს Web Audio API არ აქვს.');
      return;
    }

    audio = new AudioContextClass();

    master = audio.createGain();
    musicGain = audio.createGain();

    master.gain.value = 0.65;
    musicGain.gain.value = 0.0;

    musicGain.connect(master);
    master.connect(audio.destination);
  }

  function note(frequency, start, duration, volume, type = 'sine') {
    if (!audio || !musicGain) return;

    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, volume),
      start + 0.025
    );
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration
    );

    oscillator.connect(envelope);
    envelope.connect(musicGain);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);

    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  function playStep() {
    if (!audio || !enabled || audio.state !== 'running') return;

    const pattern = melodies[scene];
    const root = roots[scene];
    const index = step % pattern.length;
    const start = nextTime;

    // მთავარი მელოდია
    const semitones = pattern[index];
    const frequency = root * Math.pow(2, semitones / 12);

    note(frequency, start, 0.25, 0.055, 'sine');

    // რბილი ბასი
    if (step % 2 === 0) {
      note(root / 2, start, 0.32, 0.035, 'triangle');
    }

    // დამატებითი ჰარმონია
    if (step % 4 === 2) {
      note(root * 1.5, start, 0.18, 0.018, 'sine');
    }

    // მსუბუქი პერკუსია სწრაფ თამაშებში
    if (scene === 'game2' || scene === 'game3') {
      const bufferSize = Math.floor(audio.sampleRate * 0.035);
      const buffer = audio.createBuffer(
        1,
        bufferSize,
        audio.sampleRate
      );

      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) *
          (1 - i / bufferSize);
      }

      const noise = audio.createBufferSource();
      const noiseGain = audio.createGain();

      noise.buffer = buffer;
      noiseGain.gain.value = scene === 'game3' ? 0.018 : 0.009;

      noise.connect(noiseGain);
      noiseGain.connect(musicGain);

      noise.start(start);
      noise.stop(start + 0.04);
    }

    step++;

    const secondsPerBeat = 60 / bpm[scene];
    nextTime += secondsPerBeat / 2;
  }

  function startLoop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    if (!enabled || !audio || audio.state !== 'running') return;

    step = 0;
    nextTime = audio.currentTime + 0.05;

    timer = setInterval(() => {
      if (!enabled || !audio || audio.state !== 'running') return;

      // წინასწარ ვგეგმავთ მომდევნო ნოტებს,
      // რათა დაკვრა ნაკლებად შეფერხდეს.
      while (nextTime < audio.currentTime + 0.12) {
        playStep();
      }
    }, 50);
  }

  async function resume() {
    setup();

    if (!audio) return;

    try {
      if (audio.state !== 'running') {
        await audio.resume();
      }

      if (enabled) {
        musicGain.gain.setTargetAtTime(
          1,
          audio.currentTime,
          0.12
        );

        startLoop();
      }
    } catch (error) {
      console.warn('მუსიკის ჩართვა ვერ მოხერხდა:', error);
    }
  }

  function setScene(nextScene) {
    if (!bpm[nextScene]) return;

    scene = nextScene;

    if (enabled && audio && audio.state === 'running') {
      startLoop();
    }
  }

  function toggle() {
    enabled = !enabled;

    if (!enabled) {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }

      if (audio && musicGain) {
        musicGain.gain.setTargetAtTime(
          0,
          audio.currentTime,
          0.06
        );
      }
    } else {
      resume();
    }

    updateButton();
    return enabled;
  }

  function updateButton() {
    const button = document.getElementById('musicToggle');
    if (!button) return;

    button.textContent = enabled
      ? '🔊 მუსიკა'
      : '🔇 მუსიკა';

    button.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    button.title = enabled
      ? 'მუსიკის გამორთვა'
      : 'მუსიკის ჩართვა';
  }

  function effect(kind = 'click') {
    if (!enabled) return;

    setup();
    if (!audio || audio.state !== 'running') return;

    const now = audio.currentTime;

    const sounds = {
      click: [660, 0.07],
      good: [880, 0.13],
      bad: [180, 0.18],
      win: [1046.5, 0.35]
    };

    const [frequency, duration] = sounds[kind] || sounds.click;

    note(
      frequency,
      now,
      duration,
      kind === 'bad' ? 0.035 : 0.055,
      kind === 'bad' ? 'triangle' : 'sine'
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('musicToggle');

    if (button) {
      button.addEventListener('click', toggle);
      updateButton();
    }
  });

  window.gameMusic = {
    setScene,
    resume,
    toggle,
    effect
  };
})();