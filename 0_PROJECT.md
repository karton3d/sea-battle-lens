# Fleet Yeet!

**AR Battleship with meme objects for Snap Lens Studio**

## Concept

Classic Battleship mechanics with viral meme twist:
- 10×10 grid with hidden objects (cows, toilets, sneakers)
- UFO scans cells to reveal objects
- Single Player (vs AI) or Multiplayer (vs friend via Snap)
- AR space with zoom gestures, decorative elements

## Game Flow

```
Intro → Setup → Play → Game Over
```

1. **Intro**: Select "Single Player" or "Play with Friend"
2. **Setup**: View your grid (red border), Reshuffle or Start
3. **Play**: 
   - Turn banner slides in with hint
   - Grid transitions to opponent (blue border)
   - Tap cell → Hit/Miss result
   - Grid returns, see opponent's shot
   - Repeat until win
4. **Game Over**: Winner banner, Play Again

## Architecture

```
GameManager.ts      — state, turns, AI, UI control
GridGenerator.ts    — grid generation, ships, markers
TurnBasedManager.ts — multiplayer integration (TODO)
```

### GameManager handles:
- Game phases: intro → setup → playing → gameover
- Turn states: player → opponent → waiting
- AI logic: hunt mode (random) → target mode (adjacent cells)
- UI: screens, buttons, text updates
- Win detection: all 20 cells hit

### GridGenerator handles:
- 10×10 grid creation
- Random ship placement (no overlap, no touching)
- Cell tap detection
- Hit/miss marker spawning

## Objects (Ships)

| Size | Count | Total Cells |
|------|-------|-------------|
| 1×4 | 1 | 4 |
| 1×3 | 2 | 6 |
| 1×2 | 3 | 6 |
| 1×1 | 4 | 4 |
| **Total** | **10** | **20** |

## Status

| Component | Status |
|-----------|--------|
| Grid + Ships | ✅ |
| Single Player (AI) | ✅ |
| Hit/Miss Markers | ✅ |
| Win Condition | ✅ |
| Multiplayer | ⬜ |
| Visual Polish | ⬜ |

**Current: v0.3** — Single Player complete

## Docs

| # | File | Content |
|---|------|---------|
| 1 | [1_USER_FLOW.md](1_USER_FLOW.md) | Step-by-step user journey |
| 2 | [2_ASSETS.md](2_ASSETS.md) | All required assets |
| 3 | [3_TASKS.md](3_TASKS.md) | Progress tracking |
| - | [docs/TECH_REFERENCE.md](docs/TECH_REFERENCE.md) | API + Turn-Based docs |
