(function () {
  const START_SCORE = 15;
  const TARGET_SCORE = 30;

  window.createGame2 = function ({ onScore, onFinish }) {
    const world = document.getElementById('game2World');
    const screen = document.getElementById('game2Screen');

    if (!world || !screen) {
      console.error('game2World ან game2Screen ვერ მოიძებნა.');
      return { start() {}, destroy() {} };
    }

    let running = false;
    let finished = false;
    let animationFrame = null;
    let lastTime = 0;

    let score = START_SCORE;
    let playerX = window.innerWidth / 2;
    let playerY = window.innerHeight - 150;
    let velocityY = -720;
    let cameraY = 0;
    let highestPlatformY = 0;

    let leftPressed = false;
    let rightPressed = false;
    let touchDirection = 0;
    let activePointerId = null;

    let platforms = [];

    const playerWidth = 38;
    const playerHeight = 48;
    const platformWidth = 86;

    // ნახტომის ფიზიკა
    const gravity = 1200;
    const jumpPower = -720;
    const moveSpeed = 390;

    // პლატფორმების განლაგება
    const MIN_GAP = 65;
    const MAX_GAP = 80;
    const MAX_HORIZONTAL_GAP = 125;

    const player = document.createElement('div');
    player.className = 'jump-player';
    player.textContent = '👩';
    player.setAttribute('aria-label', 'მოთამაშე');

    function updateScore() {
      const scoreElement = document.getElementById('game2Score');

      if (scoreElement) {
        scoreElement.textContent = score;
      }

      if (typeof onScore === 'function') {
        onScore(score);
      }
    }

    function randomX() {
      const margin = 55;

      return margin +
        Math.random() * Math.max(1, window.innerWidth - margin * 2);
    }

    function createPlatformElement(x, y, hasPoint = false) {
      const element = document.createElement('div');
      element.className = 'jump-platform';
      world.appendChild(element);

      const platform = {
        x,
        y,
        element,
        point: null,
        hasPoint
      };

      if (hasPoint) {
        const point = document.createElement('div');
        point.className = 'jump-point';
        point.textContent = '+1';
        world.appendChild(point);

        platform.point = point;
      }

      platforms.push(platform);
      return platform;
    }

    // მომდევნო პლატფორმა წინა პლატფორმიდან მისაწვდომ მანძილზე ჩნდება
    function createReachablePlatform(previousX, previousY, hasPoint = true) {
      const screenWidth = window.innerWidth;
      const margin = Math.min(65, screenWidth / 5);

      const minX = margin;
      const maxX = Math.max(minX, screenWidth - margin);

      const direction = Math.random() < 0.5 ? -1 : 1;
      const horizontalDistance =
        35 + Math.random() * MAX_HORIZONTAL_GAP;

      let x = previousX + direction * horizontalDistance;

      // ეკრანის კიდეებთან ახლოს მიმართულებას ვაბრუნებთ
      if (x < minX || x > maxX) {
        x = previousX - direction * horizontalDistance;
      }

      x = Math.max(minX, Math.min(maxX, x));

      const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
      const y = previousY - gap;

      return createPlatformElement(x, y, hasPoint);
    }

    function createWorld() {
      world.replaceChildren();
      world.appendChild(player);
      platforms = [];

      const height = window.innerHeight;
      const startX = window.innerWidth / 2;
      const startY = height - 75;

      // საწყისი პლატფორმა
      let previous = createPlatformElement(startX, startY, false);

      // ყველა შემდეგი პლატფორმა წინა პლატფორმიდან იქმნება
      for (let i = 0; i < 18; i++) {
        previous = createReachablePlatform(
          previous.x,
          previous.y,
          i > 0 && Math.random() < 0.7
        );
      }

      highestPlatformY = previous.y;
    }

    function generatePlatforms() {
      // ზემოთ ყოველთვის ინახება საკმარისი რაოდენობის პლატფორმები
      while (
        highestPlatformY > cameraY - window.innerHeight * 1.5
      ) {
        const previous = platforms.reduce((highest, platform) => {
          return platform.y < highest.y ? platform : highest;
        }, platforms[0]);

        if (!previous) break;

        const next = createReachablePlatform(
          previous.x,
          previous.y,
          Math.random() < 0.7
        );

        highestPlatformY = next.y;
      }
    }

    function collectPoint(platform) {
      if (!platform.hasPoint || !platform.point) return;

      platform.hasPoint = false;
      platform.point.remove();
      platform.point = null;

      score = Math.min(TARGET_SCORE, score + 1);
      updateScore();

      if (score >= TARGET_SCORE) {
        finish(true);
      }
    }

    // კომპიუტერის მართვა
    function keyDown(event) {
      if (
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a'
      ) {
        leftPressed = true;
        event.preventDefault();
      }

      if (
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd'
      ) {
        rightPressed = true;
        event.preventDefault();
      }
    }

    function keyUp(event) {
      if (
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a'
      ) {
        leftPressed = false;
      }

      if (
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd'
      ) {
        rightPressed = false;
      }
    }

    // ტელეფონის ეკრანზე დაჭერით მართვა
    function pointerDown(event) {
      if (!running || finished) return;

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      activePointerId = event.pointerId;

      touchDirection =
        event.clientX < window.innerWidth / 2 ? -1 : 1;
    }

    function pointerMove(event) {
      if (!running || finished) return;
      if (activePointerId !== event.pointerId) return;

      touchDirection =
        event.clientX < window.innerWidth / 2 ? -1 : 1;
    }

    function pointerUp(event) {
      if (activePointerId !== event.pointerId) return;

      activePointerId = null;
      touchDirection = 0;
    }

    function clearControls() {
      leftPressed = false;
      rightPressed = false;
      touchDirection = 0;
      activePointerId = null;
    }

    function render() {
      player.style.left = `${playerX}px`;
      player.style.top = `${playerY - cameraY}px`;

      for (const platform of platforms) {
        platform.element.style.left =
          `${platform.x - platformWidth / 2}px`;

        platform.element.style.top =
          `${platform.y - cameraY}px`;

        if (platform.point) {
          platform.point.style.left = `${platform.x}px`;
          platform.point.style.top =
            `${platform.y - cameraY - 38}px`;
        }
      }

      // ქვემოთ გასული პლატფორმების წაშლა
      platforms = platforms.filter(platform => {
        if (platform.y - cameraY > window.innerHeight + 100) {
          platform.element.remove();

          if (platform.point) {
            platform.point.remove();
          }

          return false;
        }

        return true;
      });
    }

    function finish(won) {
      if (finished) return;

      finished = true;
      running = false;
      clearControls();

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (typeof onFinish === 'function') {
        onFinish(score, won);
      }
    }

    function update(dt) {
      const keyboardDirection =
        (rightPressed ? 1 : 0) -
        (leftPressed ? 1 : 0);

      const direction =
        keyboardDirection !== 0
          ? keyboardDirection
          : touchDirection;

      playerX += direction * moveSpeed * dt;

      // ეკრანის ერთი კიდიდან მეორეზე გადასვლა
      if (playerX < -playerWidth) {
        playerX = window.innerWidth + playerWidth;
      } else if (playerX > window.innerWidth + playerWidth) {
        playerX = -playerWidth;
      }

      const previousY = playerY;

      velocityY += gravity * dt;
      playerY += velocityY * dt;

      // პლატფორმაზე დაშვების შემოწმება
      if (velocityY > 0) {
        for (const platform of platforms) {
          const previousBottom = previousY + playerHeight;
          const currentBottom = playerY + playerHeight;

          const horizontallyAligned =
            playerX + playerWidth / 2 >
              platform.x - platformWidth / 2 &&
            playerX - playerWidth / 2 <
              platform.x + platformWidth / 2;

          const crossedPlatform =
            previousBottom <= platform.y &&
            currentBottom >= platform.y;

          if (horizontallyAligned && crossedPlatform) {
            playerY = platform.y - playerHeight;
            velocityY = jumpPower;

            collectPoint(platform);
            break;
          }
        }
      }

      // კამერა პერსონაჟს ზემოთ მიჰყვება
      const threshold = window.innerHeight * 0.42;

      if (playerY - cameraY < threshold) {
        cameraY = playerY - threshold;
      }

      // დაცემის შემთხვევაში თამაში მთავრდება
      if (playerY - cameraY > window.innerHeight + 100) {
        finish(false);
        return;
      }

      generatePlatforms();
      render();
    }

    function loop(timestamp) {
      if (!running) return;

      if (!lastTime) lastTime = timestamp;

      const dt = Math.min(
        (timestamp - lastTime) / 1000,
        0.032
      );

      lastTime = timestamp;

      update(dt);

      if (running) {
        animationFrame = requestAnimationFrame(loop);
      }
    }

    function start() {
      if (running) return;

      finished = false;
      running = true;
      lastTime = 0;

      score = START_SCORE;
      playerX = window.innerWidth / 2;
      playerY = window.innerHeight - 150;
      velocityY = jumpPower;
      cameraY = 0;

      clearControls();
      createWorld();
      updateScore();
      render();

      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
      window.addEventListener('blur', clearControls);

      screen.addEventListener('pointerdown', pointerDown);
      screen.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);
      window.addEventListener('pointercancel', pointerUp);

      animationFrame = requestAnimationFrame(loop);
    }

    function destroy() {
      running = false;
      clearControls();

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', clearControls);

      screen.removeEventListener('pointerdown', pointerDown);
      screen.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerUp);

      world.replaceChildren();
    }

    return {
      start,
      destroy
    };
  };
})();