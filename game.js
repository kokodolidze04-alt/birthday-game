(function () {
  const MAX_NUMBER = 15;
  const MOVE_INTERVAL = 680;

  window.createGame = function ({ onProgress, onComplete }) {
    const field = document.getElementById('numberField');

    let currentNumber = 1;
    let timer = null;
    let active = false;
    let button = null;

    function moveButton() {
      if (!button || !field) return;

      const maxX = Math.max(0, field.clientWidth - button.offsetWidth);
      const maxY = Math.max(0, field.clientHeight - button.offsetHeight);

      button.style.left =
        `${Math.random() * maxX + button.offsetWidth / 2}px`;

      button.style.top =
        `${Math.random() * maxY + button.offsetHeight / 2}px`;
    }

    function showNumber(number) {
      field.replaceChildren();

      button = document.createElement('button');
      button.type = 'button';
      button.className = 'number-button';
      button.textContent = number;
      button.setAttribute('aria-label', `რიცხვი ${number}`);

      button.addEventListener('click', () => {
        if (!active) return;

        button.classList.add('correct');
        currentNumber++;

        if (typeof onProgress === 'function') {
          onProgress(currentNumber - 1, currentNumber);
        }

        if (currentNumber > MAX_NUMBER) {
          active = false;
          clearInterval(timer);
          timer = null;
          field.replaceChildren();

          if (typeof onComplete === 'function') {
            onComplete();
          }

          return;
        }

        showNumber(currentNumber);
      });

      field.appendChild(button);
      moveButton();
    }

    function start() {
      stop();

      currentNumber = 1;
      active = true;

      showNumber(currentNumber);

      if (typeof onProgress === 'function') {
        onProgress(0, 1);
      }

      timer = setInterval(() => {
        if (active) moveButton();
      }, MOVE_INTERVAL);
    }

    function stop() {
      active = false;
      clearInterval(timer);
      timer = null;
    }

    function destroy() {
      stop();
      field.replaceChildren();
    }

    return { start, stop, destroy };
  };
})();