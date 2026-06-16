# 2048 Whim

sixty five thousand five hundred thirty six.

A 2048 variant targeting 65,536. Play it yourself, or hand it to the AI and watch it think out loud.

**[→ kivilcimlab.org/2048](https://kivilcimlab.org/2048)**

---

## The AI

The minimax engine treats tile spawns as adversarial — it assumes the worst-case spawn position and value at each step. This is conservative by design: an AI that assumes friendly spawns would play beautifully in practice and collapse the moment luck turns.

Iterative deepening runs within a fixed **50ms budget**. The engine searches as deep as time allows, then commits to the best move found so far. Under the budget, it evaluates all four directions and reports the scores.

### Transposition table

Board states repeat across different move sequences. The transposition table caches evaluations keyed on board state, so the engine never recomputes a position it's already seen in the current search.

### Heuristic

```
score = snake_pattern_weight
      + empty_cell_bonus
      + monotonicity_bonus
```

The snake pattern is scored against all 8 rotations and reflections of a corner-biased weight matrix. The highest-scoring orientation is used. This pushes large tiles toward a corner and smaller tiles in a descending snake away from it — the classic 2048 strategy.

## Evaluation Intelligence panel

When the AI is playing, the panel shows:

- **Thinking Ahead** — current search depth
- **Scenarios Checked** — nodes evaluated this move
- **Move Quality** — heuristic score for each direction
- **Chosen Action** — the selected move, with a directional arrow on the board

## Stack

- Vanilla JS
- `ai.js` — minimax engine, transposition table, heuristic
- `game.js` — board state, slide mechanics, spawn logic
- `ui.js` — rendering, evaluation panel
