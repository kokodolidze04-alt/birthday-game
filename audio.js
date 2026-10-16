let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function tone(frequency, duration, type = 'sine', volume = 0.04) {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

export function playSound(name) {
  switch (name) {
    case 'burst':
      tone(350, 0.18, 'triangle', 0.05);
      setTimeout(() => tone(720, 0.24, 'sine', 0.04), 100);
      break;

    case 'chime':
      tone(660, 0.22, 'sine', 0.04);
      setTimeout(() => tone(880, 0.3, 'sine', 0.04), 170);
      break;

    case 'catch':
      tone(600, 0.09, 'sine', 0.04);
      setTimeout(() => tone(900, 0.12, 'sine', 0.035), 55);
      break;
  }
}

export function playFinalMusic() {
  const notes = [523, 659, 784, 1047, 784, 1047];

  notes.forEach((frequency, index) => {
    setTimeout(() => {
      tone(frequency, 0.35, 'sine', 0.05);
    }, index * 160);
  });
}