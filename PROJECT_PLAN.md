# Fleet Yeet!

**Battleship with meme twist for Snap Lens Studio**

## Concept

Hunt for hidden meme objects (cows, toilets, sneakers) on a 10×10 AR grid. UFO scans cells to reveal objects. Turn-based: Single Player (vs AI) or Multiplayer (vs friend).

## Architecture

```
GameManager.ts — state, turns, AI, UI
GridGenerator.ts — grid, ships, markers
TurnBasedManager.ts — multiplayer (TODO)
```

## Game Flow

1. **Intro** → Select mode
2. **Setup** → View your objects, Reshuffle or Start
3. **Play** → Take turns scanning opponent's grid
4. **Game Over** → Winner announced, Play Again

## Scripts

| Script | Status |
|--------|--------|
| GameManager.ts | ✅ |
| GridGenerator.ts | ✅ |
| TurnBasedManager.ts | ⬜ |

## Docs

- [USER_FLOW.md](USER_FLOW.md) — step-by-step user journey
- [ASSETS.md](ASSETS.md) — all required assets
- [TASKS.md](TASKS.md) — progress tracking
- [TURN_BASED_RESEARCH.md](TURN_BASED_RESEARCH.md) — multiplayer API
- [AI_PROMPTS_GUIDE.md](AI_PROMPTS_GUIDE.md) — image generation
- [SNAP_LENS_STUDIO_API.md](SNAP_LENS_STUDIO_API.md) — API reference

## Current Version

**v0.3** — Single Player complete, Multiplayer TODO
