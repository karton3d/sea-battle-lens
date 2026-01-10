# Meme Fleet Battle - Development Plan

## Game Overview

**Game Title:** Meme Fleet Battle  
**Genre:** Turn-based Strategy / Battleship with Meme Twist  
**Platform:** Snap Lens Studio (AR Lens)  
**Target Audience:** Gen Z, meme lovers, casual gamers (13+)

### Concept
A viral, meme-filled twist on the classic Battleship game. Instead of ships, players hide and hunt for wacky 3D objects on a grid. The game uses X-ray scanning mechanics to reveal hidden objects, creating a fun, shareable AR experience.

### Development Strategy
**Prototype First, Polish Later**: Create a fully functional prototype with minimal UI (text + UI Buttons), then add visual polish in the final phase.

### Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Done / Completed |
| 🔄 | In Progress |
| ⬜ | Not Started / TODO |

---

## Architecture Overview

### Game Modes
Both modes use **identical game mechanics**, only the opponent differs:
- **Single Player**: AI opponent (random cell selection with same rules)
- **Multiplayer**: Real opponent via Turn-Based component

### Core Components
```
GameManager
├── GameState (tracks everything)
├── GridManager (generates and manages grids)
├── TurnManager (handles turn logic for both modes)
│   ├── AIOpponent (for Single Player)
│   └── TurnBasedOpponent (for Multiplayer)
├── UIManager (text + buttons)
└── SoundManager (future)
```

### Game Flow (Same for Both Modes)
1. **Intro Screen** → Select mode
2. **Setup** → Generate random placement, show player's grid
3. **Game Loop**:
   - Player's turn → tap opponent's cell → show result
   - Opponent's turn → AI or real player → show result
   - Repeat until win condition
4. **Game Over** → Show winner, restart option

---

## Development Phases

### Phase 1: Core Systems
**Status:** ✅ COMPLETED

**Tasks:**
| Task | Status |
|------|--------|
| Grid generation system | ✅ |
| Object placement system | ✅ |
| Collision detection | ✅ |
| Random object placement algorithm | ✅ |

---

## 🎮 PROTOTYPE PHASE

### Phase 2: Game State & Manager
**Priority:** HIGH  
**Status:** ✅ COMPLETED

**Tasks:**
| Task | Status |
|------|--------|
| Create `GameManager.ts` - central game controller | ✅ |
| Game state integrated into GameManager | ✅ |
| Define game states: INTRO, SETUP, PLAYING, GAME_OVER | ✅ |
| Define turn states: PLAYER_TURN, OPPONENT_TURN, WAITING | ✅ |
| Track player grid (objects + shots received) | ✅ |
| Track opponent grid (player's shots + hidden objects) | ✅ |
| Track destroyed objects count (playerHits, opponentHits) | ✅ |
| Track current turn | ✅ |

**GameState Structure:**
```typescript
interface GameState {
    mode: 'single' | 'multiplayer';
    phase: 'intro' | 'setup' | 'playing' | 'gameover';
    turn: 'player' | 'opponent';
    
    playerGrid: CellState[][];      // Player's objects + opponent's shots
    opponentGrid: CellState[][];    // Player's shots (objects hidden until hit)
    
    playerObjects: ShipInfo[];      // Player's objects info
    opponentObjects: ShipInfo[];    // Opponent's objects (hidden in multiplayer)
    
    playerDestroyedCount: number;
    opponentDestroyedCount: number;
    totalObjectCells: number;       // 20 cells total (4+3+3+2+2+2+1+1+1+1)
    
    winner: 'player' | 'opponent' | null;
}
```

---

### Phase 3: UI System (PROTOTYPE)
**Priority:** HIGH  
**Status:** ✅ COMPLETED

**Tasks:**
| Task | Status |
|------|--------|
| UI logic integrated into GameManager (no separate UIManager) | ✅ |
| Create Text objects (StatusText, HintText, ResultText) | ✅ |
| Use UI Button components (SinglePlayerBtn, MultiplayerBtn, etc.) | ✅ |
| Implement screen management (show/hide) | ✅ |

**UI Elements:**
- **Text Objects**: Title, status messages, hints, results
- **UI Buttons**: "Single Player", "Play with Friend", "Start", "Play Again"
- **Grid Labels**: "Your Grid", "Opponent Grid"

**Screens:**
1. **Intro Screen**: Title + 2 buttons
2. **Setup Screen**: Status text + Start button
3. **Game Screen**: Turn info + hint + result text
4. **Game Over Screen**: Winner text + Play Again button

---

### Phase 4: Cell Interaction & Shot Logic
**Priority:** HIGH  
**Status:** ✅ COMPLETED

**Tasks:**
| Task | Status |
|------|--------|
| Add InteractionComponent to opponent grid cells | ✅ |
| Implement cell tap detection (handleCellTap) | ✅ |
| Process shot: check if hit or miss | ✅ |
| Update cell visual state (hit/miss marker prefabs) | ✅ |
| Prevent tapping already-shot cells | ✅ |
| Check if object is fully destroyed | ✅ |
| Update UI with result | ✅ |
| Check win condition after each shot | ✅ |

**Hit/Miss Markers:**
- `hitMarkerPrefab` — spawned when player hits an object
- `missMarkerPrefab` — spawned when player hits empty cell
- Markers spawn above the cell at `cellSize + 0.5` height

**Cell States:**
- `UNKNOWN` - not shot yet (opponent grid only)
- `EMPTY` - shot, no object (miss)
- `HIT` - shot, has object (hit)
- `OBJECT` - has object (player grid only, visible)
- `DESTROYED` - object fully destroyed

**Shot Flow:**
1. Player taps cell on opponent grid
2. Check cell state (must be UNKNOWN)
3. Check if opponent has object at that position
4. Update cell state (HIT or EMPTY)
5. If HIT, check if object fully destroyed
6. Update destroyed count
7. Check win condition
8. Switch turn (or continue if hit, depending on rules)

---

### Phase 5: Single Player Mode (AI Opponent)
**Priority:** HIGH  
**Status:** ✅ COMPLETED

**Rationale:** Implement AI first - easier to test locally without Turn-Based system.

**Tasks:**
| Task | Status |
|------|--------|
| AI logic integrated into GameManager | ✅ |
| AI generates random shot — getAIShot() | ✅ |
| AI waits brief delay — aiDelay + DelayedCallbackEvent | ✅ |
| AI shot uses same logic as player — processShot() | ✅ |
| AI checks win condition — checkWin() | ✅ |
| Update UI with AI's move result | ✅ |

**AI Logic (Smart Hunt Mode):**
```typescript
// AI has two modes:
// 1. HUNT: Random shots to find objects
// 2. TARGET: After hit, shoot adjacent cells to destroy object

interface AIState {
    mode: 'hunt' | 'target';
    targetCells: {x, y}[];  // Cells to try when in target mode
    hitCells: {x, y}[];     // Current object's hit cells
}

function getAIShot(): {x: number, y: number} {
    if (aiState.mode === 'target' && aiState.targetCells.length > 0) {
        // Target mode: shoot next adjacent cell
        return aiState.targetCells.pop();
    }
    // Hunt mode: random cell
    return randomChoice(getUnknownCells(playerGrid));
}

function onAIHit(x, y) {
    aiState.mode = 'target';
    aiState.hitCells.push({x, y});
    // Add adjacent cells (up, down, left, right) to target list
    addAdjacentCells(x, y, aiState.targetCells);
    // If 2+ hits, prioritize cells in line (determine direction)
    if (aiState.hitCells.length >= 2) {
        filterTargetsByDirection(aiState);
    }
}

function onAIDestroyedObject() {
    // Object destroyed, back to hunt mode
    aiState.mode = 'hunt';
    aiState.targetCells = [];
    aiState.hitCells = [];
}
```

**Turn Flow (Single Player):**
1. Player's turn → player taps → show result → check win
2. If not win → brief delay → AI's turn
3. AI's turn → AI selects cell → show result → check win
4. If not win → Player's turn
5. Repeat until someone wins

---

### Phase 6: Win Condition & Game Over
**Priority:** HIGH  
**Status:** ✅ COMPLETED

**Tasks:**
| Task | Status |
|------|--------|
| Check win after each shot — checkWin() | ✅ |
| Win when all 20 cells hit (TOTAL_OBJECT_CELLS = 20) | ✅ |
| Display winner text | ✅ |
| Show "Play Again" button | ✅ |
| Reset game on Play Again | ✅ |

**Win Check:**
```typescript
function checkWin(destroyedCells: number): boolean {
    return destroyedCells >= TOTAL_OBJECT_CELLS; // 20 cells
}
```

---

### Phase 7: Multiplayer Mode (Turn-Based)
**Priority:** MEDIUM  
**Status:** ⬜ NOT STARTED

**Rationale:** Add multiplayer after Single Player works perfectly.

**Tasks:**
| Task | Status |
|------|--------|
| Create `TurnBasedManager.ts` - Turn-Based integration | ⬜ |
| Initialize Turn-Based component | ⬜ |
| Store game state in turn data | ⬜ |
| Restore game state from turn data | ⬜ |
| Submit turn after player's shot | ⬜ |
| Receive and process opponent's turn | ⬜ |
| Handle turn start/end callbacks | ⬜ |
| Handle game over callback | ⬜ |

**Turn Data Format:**
```typescript
interface TurnData {
    shotX: number;
    shotY: number;
    result: 'hit' | 'miss';
    destroyedObject: number | null;  // Object length if destroyed
    gameState: SerializedGameState;
}
```

**Multiplayer Flow:**
1. Game start: Both players generate random placement
2. Turn start: Show opponent's last move (if any)
3. Player taps cell → process shot → submit turn
4. Wait for opponent's turn
5. Receive opponent's turn → process → show result
6. Repeat until win

---

### Phase 8: Game Flow Polish
**Priority:** MEDIUM  
**Status:** ⬜ NOT STARTED

**Tasks:**
| Task | Status |
|------|--------|
| Smooth transitions between screens | ⬜ |
| Proper timing for AI moves | ⬜ |
| Clear feedback for all actions | ⬜ |
| Error handling | ⬜ |
| Edge cases (disconnection, timeout) | ⬜ |

---

## 🎨 POLISH PHASE (After Prototype)

### Phase 9: Visual Polish - UI ⬜
| Task | Status |
|------|--------|
| Styled UI buttons | ⬜ |
| Background images | ⬜ |
| Styled title | ⬜ |
| UI panels/frames | ⬜ |
| Icons for objects | ⬜ |

### Phase 10: Visual Polish - Grid ⬜
| Task | Status |
|------|--------|
| Cell highlighting on hover/selection | ⬜ |
| Hit cell visual (color, glow) | ⬜ |
| Miss cell visual (cross, mark) | ⬜ |
| Grid appearance improvements | ⬜ |

### Phase 11: Visual Polish - Objects ⬜
| Task | Status |
|------|--------|
| Meme 3D models | ⬜ |
| Materials and textures | ⬜ |
| X-ray reveal effect | ⬜ |
| Destruction animations | ⬜ |

### Phase 12: Visual Polish - Effects ⬜
| Task | Status |
|------|--------|
| UFO scanning effect | ⬜ |
| Particle effects | ⬜ |
| Screen transitions | ⬜ |
| Victory effects | ⬜ |

### Phase 13: Audio ⬜
| Task | Status |
|------|--------|
| UI sounds | ⬜ |
| Hit/miss sounds | ⬜ |
| Victory/defeat sounds | ⬜ |
| Background music | ⬜ |

---

## Scripts Status

### Active Scripts ✅
| Script | Description | Status |
|--------|-------------|--------|
| `GameManager.ts` | Central game controller, state, AI, turns, UI | ✅ Complete |
| `GridGenerator.ts` | Grid generation, ship placement, cell interaction, markers | ✅ Complete |

### Removed Scripts (functionality merged into GameManager)
- ~~`UIManager.ts`~~ — merged into GameManager
- ~~`IntroScreen.ts`~~ — merged into GameManager

### Pending Scripts
| Script | Description | Status |
|--------|-------------|--------|
| `TurnBasedManager.ts` | Multiplayer Turn-Based integration | 📋 TODO |

### Architecture Notes
- **GameState** integrated into GameManager (no separate file)
- **AI Logic** integrated into GameManager (hunt/target modes)
- **Turn Logic** integrated into GameManager for Single Player
- **UI Management** integrated into GameManager (screens, buttons, text)

---

## Immediate Task List (Current Sprint)

### ✅ COMPLETED
| Task | Status |
|------|--------|
| GameManager & GameState | ✅ |
| UI Management (integrated into GameManager) | ✅ |
| Intro Screen (buttons, handlers) | ✅ |
| Setup Screen (random placement, Start button) | ✅ |
| Single Player AI (hunt/target modes) | ✅ |
| Win Condition & Game Over | ✅ |
| Hit/Miss marker prefab system (code) | ✅ |

### ✅ RECENTLY COMPLETED (2026-01-10)
| Task | Status |
|------|--------|
| Create marker prefabs in Lens Studio | ✅ |
| Test cell tapping on opponent grid | ✅ |
| Verify marker spawning on hit/miss | ✅ |
| Ship destruction detection & message | ✅ |
| Win condition detection & game over | ✅ |
| Markers use prefab size (no forced scaling) | ✅ |
| Full game loop (player → AI → win) tested | ✅ |

### ⬜ NOT STARTED
| Task | Status |
|------|--------|
| Multiplayer (Turn-Based integration) | ⬜ |
| Visual polish phase | ⬜ |

---

## Success Criteria

### Prototype Complete When:
| # | Task | Status |
|---|------|--------|
| 1 | Can select Single Player or Multiplayer | ✅ Done |
| 2 | Random object placement works | ✅ Done |
| 3 | Can tap cells to shoot | ✅ Done |
| 4 | Hit/miss detection works | ✅ Done |
| 5 | Hit/miss visual markers | ✅ Done |
| 6 | Objects can be destroyed | ✅ Done |
| 7 | AI opponent works (Single Player) | ✅ Done |
| 8 | Turn-Based works (Multiplayer) | ⬜ TODO |
| 9 | Win condition works | ✅ Done |
| 10 | Game can be restarted | ✅ Done |
| 11 | All feedback via text + basic UI | ✅ Done |

**Legend:** ✅ Done | 🔄 In Progress | ⬜ Not Started

**Current Progress: 10/11 complete — Single Player READY! 🎮**

---

## Technical Notes

### Same Mechanics for Both Modes
- AI uses exact same shot logic as player
- AI uses exact same rules (can't shoot same cell twice)
- AI uses exact same win condition
- Only difference: AI selects cell randomly, player taps

### Grid Structure
- 10x10 grid
- Objects: 1×4, 2×3, 3×2, 4×1 (total 20 cells)
- No touching (even diagonally)

### UI Components
- **Text**: Status, hints, results
- **UI Button**: All interactive buttons
- **InteractionComponent**: Grid cells

---

## Version History

| Version | Description | Status |
|---------|-------------|--------|
| v0.1 | Grid + random placement | ✅ Done |
| v0.2 | Game manager + UI system | ✅ Done |
| v0.3 | Single Player with AI | ✅ Done |
| v0.4 | Multiplayer with Turn-Based | ⬜ TODO |
| v1.0 | Polished version | ⬜ TODO |

### Current Version: v0.3
**Date:** 2026-01-10  
**Status:** ✅ Single Player mode COMPLETE

---

## Notes

- **Single Player First**: Easier to test, no network dependency
- **Same Mechanics**: AI = random player, identical rules
- **UI Buttons**: Use proper UI Button components (with Component.Touch)
- **Text for Feedback**: All game feedback via Text objects
- **Prototype Focus**: Functionality over visuals

---

## Scene Hierarchy (Lens Studio)

```
Scene
├── Camera Object
├── Lighting
├── Prefabs (Box, 4x1, 3x1, 2x1, 1x1, HitMarker, MissMarker)
├── Turn Based, Turn Based Player Info
├── Orthographic Camera
│   └── Screens
│       ├── IntroScreen (TitleText, SinglePlayerBtn, MultiplayerBtn)
│       ├── SetupScreen (StatusText, StartBtn)
│       ├── GameScreen (StatusText, HintText, ResultText)
│       └── GameOverScreen (StatusText, PlayAgainBtn)
├── GameRoot
│   ├── GameManager (script)
│   └── Grids
│       ├── PlayerGrid (script: GridGenerator)
│       └── OpponentGrid (script: GridGenerator)
└── World
```

### GridGenerator Settings
| Setting | PlayerGrid | OpponentGrid |
|---------|------------|--------------|
| Auto Generate | false | false |
| Enable Cell Tapping | false | true |
| Hit Marker Prefab | HitMarker | HitMarker |
| Miss Marker Prefab | MissMarker | MissMarker |
| Position X (Transform) | 0 | ~20 (offset to the right) |

### Marker Prefabs (Create in Lens Studio)
- **HitMarker** — визуальный индикатор попадания (например красный X или огонь)
- **MissMarker** — визуальный индикатор промаха (например синий круг или всплеск воды)

---

## Known Issues / Debug Notes

### Resolved Issues:
- ✅ IntroScreen.ts and UIManager.ts removed (functionality in GameManager)
- ✅ Hit/miss marker system added
- ✅ GameManager synced with GridGenerator (uses hasShipAt() for hit detection)
- ✅ Markers use prefab's original scale (no forced scaling)
- ✅ Ship destruction messages displayed
- ✅ Win condition triggers game over correctly

### Completed Testing (2026-01-10):
- ✅ Single Player full game loop works
- ✅ Hit/miss markers spawn correctly
- ✅ AI opponent plays correctly
- ✅ Win detection and game over screen

### Next Steps:
- Multiplayer (Turn-Based integration)
- Visual polish

### Component Names
- Use `"Component.Touch"` for InteractionComponent (not "Component.InteractionComponent")
- Use `"Component.ScriptComponent"` to get script components

### Prefabs Needed
1. **Cell prefab** — grid cell (cube)
2. **Ship prefabs** — 1x1, 2x1, 3x1, 4x1
3. **HitMarker prefab** — shows on hit (red X, fire, explosion)
4. **MissMarker prefab** — shows on miss (blue circle, water splash)
