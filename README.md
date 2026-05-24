# 2048 Whim

[**Play the Game Live**](https://kivilcimlab.org/2048-whim/)

A 2048-style tile sliding game targeting 65,536 where the player can take control or hand it to a built-in AI. 

## Technical Details
- **Minimax Engine:** Uses iterative deepening within a fixed 50ms budget, treating tile spawns as adversarial to assume worst-case placements. 
- **Transposition Table:** Keyed on board state to prevent redundant evaluation across branches. 
- **Heuristics:** Combines a snake pattern scored against eight rotations and reflections of a corner-biased weight matrix, along with empty cell count and monotonicity bonuses. 
- **Transparency:** Move scores for all four directions are exposed alongside search depth and node count to surface the AI reasoning at each step.

## How to Run Locally
This project uses vanilla HTML, CSS, and JavaScript with no build steps required.

1. Clone the repository:
   ```bash
   git clone https://github.com/y-efekivilcim/c-2048-whim.git
   ```
2. Open `index.html` in any web browser to play.
