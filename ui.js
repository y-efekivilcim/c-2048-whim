export class UI {
  constructor(game) {
    this.game = game;
    this.gridContainer = document.getElementById('grid');
    this.tileContainer = document.getElementById('tile-container');
    this.scoreElement = document.getElementById('score');
    this.bestScoreElement = document.getElementById('best-score');
    this.messageElement = document.getElementById('game-message');
    this.messageText = this.messageElement.querySelector('p');
    this.bestScore = localStorage.getItem('bestScore') || 0;
    this.bestScoreElement.textContent = this.bestScore;

    this.aiDepth = document.getElementById('ai-depth');
    this.aiNodes = document.getElementById('ai-nodes');
    this.aiAction = document.getElementById('ai-action');
    this.evalUp = document.getElementById('eval-up').querySelector('.val');
    this.evalRight = document.getElementById('eval-right').querySelector('.val');
    this.evalDown = document.getElementById('eval-down').querySelector('.val');
    this.evalLeft = document.getElementById('eval-left').querySelector('.val');
    this.evalRows = {
      0: document.getElementById('eval-up'),
      1: document.getElementById('eval-right'),
      2: document.getElementById('eval-down'),
      3: document.getElementById('eval-left')
    };

    this.tileDOMs = {};
    this.setupGrid();
    this.render();
  }

  setupGrid() {
    this.gridContainer.innerHTML = '';
    for (let r = 0; r < this.game.size; r++) {
      for (let c = 0; c < this.game.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        this.gridContainer.appendChild(cell);
      }
    }
  }

  getTransform(r, c, offset) {
    return `translate(${c * offset}px, ${r * offset}px)`;
  }

  createTileDOM(tile, offset) {
    const el = document.createElement('div');
    el.className = `tile tile-${tile.value} ${tile.isNew ? 'tile-new' : ''}`;
    el.textContent = tile.value;
    el.style.transform = this.getTransform(tile.r, tile.c, offset);
    this.tileContainer.appendChild(el);
    return el;
  }

  render() {
    let offset = 118;
    if (this.gridContainer) {
      const gap = parseFloat(window.getComputedStyle(this.gridContainer).gap) || 18;
      const cell = this.gridContainer.querySelector('.grid-cell');
      const cellSize = cell ? cell.offsetWidth : 100;
      offset = cellSize + gap;
    }

    const activeIds = new Set();
    const mergedTiles = [];

    for (let r = 0; r < this.game.size; r++) {
      for (let c = 0; c < this.game.size; c++) {
        const tile = this.game.grid[r][c];
        if (tile) {
          activeIds.add(tile.id);

          if (tile.mergedFrom) {
            mergedTiles.push(...tile.mergedFrom);
            tile.mergedFrom.forEach(m => activeIds.add(m.id));
          }

          if (!this.tileDOMs[tile.id]) {
            const el = this.createTileDOM(tile, offset);
            if (tile.mergedFrom) {
              el.classList.add('tile-merged');
              el.style.opacity = 0;
              setTimeout(() => { el.style.opacity = 1; }, 150);
            }
            this.tileDOMs[tile.id] = el;
          } else {
            const el = this.tileDOMs[tile.id];
            el.className = `tile tile-${tile.value}`;
            el.style.transform = this.getTransform(tile.r, tile.c, offset);
          }
        }
      }
    }

    mergedTiles.forEach(child => {
      const el = this.tileDOMs[child.id];
      if (el) {
        el.style.transform = this.getTransform(child.r, child.c, offset);
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
          delete this.tileDOMs[child.id];
        }, 150);
      }
    });

    Object.keys(this.tileDOMs).forEach(id => {
      if (!activeIds.has(parseInt(id))) {
        const el = this.tileDOMs[id];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        delete this.tileDOMs[id];
      }
    });

    this.scoreElement.textContent = this.game.score;
    if (this.game.score > this.bestScore) {
      this.bestScore = this.game.score;
      localStorage.setItem('bestScore', this.bestScore);
      this.bestScoreElement.textContent = this.bestScore;
    }

    if (this.game.won) {
      this.messageElement.className = 'game-message game-won';
      this.messageText.textContent = 'You Reached 65536!';
    } else if (this.game.over) {
      this.messageElement.className = 'game-message game-over';
      this.messageText.textContent = 'Game Over';
    } else {
      this.messageElement.className = 'game-message';
    }
  }

  updateAIPanel(evals, bestMove, depth, nodes) {
    this.aiDepth.textContent = depth;
    this.aiNodes.textContent = nodes || '---';

    const dirs = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    const formatEval = val => val === null ? '---' : Math.floor(val).toLocaleString();

    this.evalUp.textContent = formatEval(evals[0]);
    this.evalRight.textContent = formatEval(evals[1]);
    this.evalDown.textContent = formatEval(evals[2]);
    this.evalLeft.textContent = formatEval(evals[3]);

    for (let i = 0; i < 4; i++) {
      if (i === bestMove) {
        this.evalRows[i].classList.add('best');
      } else {
        this.evalRows[i].classList.remove('best');
      }
    }

    this.aiAction.textContent = bestMove !== -1 ? dirs[bestMove] : 'WAITING';
  }

  showIndicator(direction) {
    const arrow = document.getElementById('ai-arrow');
    if (!arrow) return;

    arrow.classList.remove('dir-0', 'dir-1', 'dir-2', 'dir-3');

    if (direction !== -1) {
      arrow.classList.add(`dir-${direction}`);
    }
  }

  setAIActive(active) {
    const arrow = document.getElementById('ai-arrow');
    const wrapper = document.querySelector('.indicator-wrapper');
    if (arrow) {
      if (active) arrow.classList.add('visible');
      else arrow.classList.remove('visible');
    }
    if (wrapper) {
      if (active) wrapper.classList.add('visible');
      else wrapper.classList.remove('visible');
    }
  }
}
