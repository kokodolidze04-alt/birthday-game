export function initScene3D(starsCanvas, effectsCanvas) {
  const starsCtx = starsCanvas.getContext('2d');
  const fxCtx = effectsCanvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let stars = [];
  let particles = [];
  let shootingStars = [];
  let previousTime = 0;
  let destroyed = false;
  let animation = 0;

  const palette = [
    '#ffffff',
    '#6ce5ff',
    '#a58bff',
    '#ff5cc8',
    '#ffe77a',
    '#7dffbd'
  ];

  function configureCanvas(canvas, ctx) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    configureCanvas(starsCanvas, starsCtx);
    configureCanvas(effectsCanvas, fxCtx);

    stars = Array.from({
      length: Math.min(200, Math.floor(width * height / 6000))
    }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 22 + 7,
      alpha: Math.random() * 0.65 + 0.2,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function burst(x, y, amount = 45) {
    if (destroyed) return;

    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 240;
      const life = 0.6 + Math.random() * 0.8;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 1 + Math.random() * 3.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        gravity: 45 + Math.random() * 100
      });
    }

    if (particles.length > 3000) {
      particles.splice(0, particles.length - 3000);
    }
  }

  function drawStars(dt, time) {
    starsCtx.clearRect(0, 0, width, height);

    for (const star of stars) {
      star.y += star.speed * dt;

      if (star.y > height) {
        star.y = -3;
        star.x = Math.random() * width;
      }

      const twinkle = 0.65 + Math.sin(
        time * 0.0015 + star.phase
      ) * 0.35;

      starsCtx.beginPath();
      starsCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      starsCtx.fillStyle = `rgba(220,230,255,${star.alpha * twinkle})`;
      starsCtx.fill();
    }

    if (Math.random() < 0.003 && shootingStars.length < 3) {
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6,
        vx: 250 + Math.random() * 250,
        vy: 100 + Math.random() * 160,
        life: 0.7
      });
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];

      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;

      starsCtx.beginPath();
      starsCtx.moveTo(s.x, s.y);
      starsCtx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      starsCtx.strokeStyle = `rgba(180,220,255,${Math.max(0, s.life)})`;
      starsCtx.lineWidth = 1.5;
      starsCtx.stroke();

      if (s.life <= 0) shootingStars.splice(i, 1);
    }
  }

  function drawParticles(dt) {
    fxCtx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(0.985, dt * 60);

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, p.life / p.maxLife);

      fxCtx.globalAlpha = alpha;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      fxCtx.fillStyle = p.color;
      fxCtx.shadowBlur = 12;
      fxCtx.shadowColor = p.color;
      fxCtx.fill();
      fxCtx.shadowBlur = 0;
    }

    fxCtx.globalAlpha = 1;
  }

  function animate(time) {
    if (destroyed) return;

    const dt = Math.min((time - (previousTime || time)) / 1000, 0.04);
    previousTime = time;

    drawStars(dt, time);
    drawParticles(dt);

    animation = requestAnimationFrame(animate);
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(animation);
    window.removeEventListener('resize', resize);
  }

  resize();
  window.addEventListener('resize', resize);
  animation = requestAnimationFrame(animate);

  return { burst, destroy };
}