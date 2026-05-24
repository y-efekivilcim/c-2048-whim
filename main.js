import { Game } from './game.js';
import { UI } from './ui.js';
import { AI } from './ai.js';

let game;
let ui;
let ai;
let aiPlaying = false;
let aiTimeout = null;

const init = () => {
  game = new Game(4);
  ui = new UI(game);
  ai = new AI(game);

  document.addEventListener('keydown', handleInput);

  const btnPlayer = document.getElementById('btn-player');
  const btnAI = document.getElementById('btn-ai');
  const retryBtn = document.querySelector('.retry-button');

  btnPlayer.addEventListener('click', () => {
    aiPlaying = false;
    ui.setAIActive(false);
    btnPlayer.classList.add('active');
    btnAI.classList.remove('active');
    if (aiTimeout) clearTimeout(aiTimeout);
  });

  btnAI.addEventListener('click', () => {
    aiPlaying = true;
    ui.setAIActive(true);
    btnAI.classList.add('active');
    btnPlayer.classList.remove('active');
    aiLoop();
  });

  retryBtn.addEventListener('click', () => {
    game = new Game(4);
    ui = new UI(game);
    ai = new AI(game);
    if (aiPlaying) {
      ui.setAIActive(true);
      if (aiTimeout) clearTimeout(aiTimeout);
      aiLoop();
    } else {
      ui.setAIActive(false);
    }
  });

  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    gameContainer.addEventListener('touchstart', handleTouchStart, {passive: false});
    gameContainer.addEventListener('touchend', handleTouchEnd, {passive: false});
  }
};

const handleInput = (e) => {
  if (aiPlaying || game.over || game.won) return;

  let dir = -1;
  if (e.key === 'ArrowUp' || e.key === 'w') dir = 0;
  else if (e.key === 'ArrowRight' || e.key === 'd') dir = 1;
  else if (e.key === 'ArrowDown' || e.key === 's') dir = 2;
  else if (e.key === 'ArrowLeft' || e.key === 'a') dir = 3;

  if (dir !== -1) {
    e.preventDefault();
    const result = game.move(dir);
    if (result.moved) {
      ui.render();
    }
  }
};

let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e) => {
  if (aiPlaying || game.over || game.won) return;

  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) {
      const dir = dx > 0 ? 1 : 3;
      const result = game.move(dir);
      if (result.moved) ui.render();
    }
  } else {
    if (Math.abs(dy) > 30) {
      const dir = dy > 0 ? 2 : 0;
      const result = game.move(dir);
      if (result.moved) ui.render();
    }
  }
};

const aiLoop = () => {
  if (!aiPlaying || game.over || game.won) {
    ui.setAIActive(false);
    return;
  }

  const result = ai.getBestMove();
  ui.updateAIPanel(result.evals, result.move, result.depth, ai.nodes);
  ui.showIndicator(result.move);

  if (result.move !== -1) {
    aiTimeout = setTimeout(() => {
      const moveResult = game.move(result.move);
      if (moveResult.moved) {
        ui.render();
      }
      aiTimeout = setTimeout(aiLoop, 400);
    }, 800);
  } else {
    aiPlaying = false;
    ui.setAIActive(false);
  }
};

document.addEventListener('DOMContentLoaded', init);
