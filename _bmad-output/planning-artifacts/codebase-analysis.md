# Codebase Analysis: Meme Fleet Battle

**Generated:** 2026-01-13
**Version Analyzed:** v0.3 (Single Player Complete)
**Platform:** Snap Lens Studio (TypeScript)

---

## Executive Summary

The codebase is **well-structured for a prototype** with clear separation between game logic and visual components. The architecture is suitable for Single Player but will need refactoring for Multiplayer integration. Key concerns are duplicate state management and loose component coupling.

**Overall Assessment:** SOLID FOUNDATION with some technical debt to address before Multiplayer.

---

## File Structure

```
Assets/Scripts/
├── GameManager.ts    (936 lines) - Central game controller
└── GridGenerator.ts  (628 lines) - Grid generation & visuals (class: SeaBattleGrid)
```

**Total:** ~1,564 lines of TypeScript across 2 files.

---

## Component Analysis

### 1. GameManager.ts

**Purpose:** Central controller for all game logic, state, UI, and AI.

**Class:** `GameManager extends BaseScriptComponent`

#### Type Definitions (lines 3-53)
Well-defined TypeScript types:
- `GamePhase`: 'intro' | 'setup' | 'playing' | 'gameover'
- `TurnState`: 'player' | 'opponent' | 'waiting'
- `GameMode`: 'single' | 'multiplayer'
- `CellState`: 'unknown' | 'empty' | 'hit' | 'object' | 'destroyed'
- `ShipInfo`: Ship tracking with id, length, cells, hitCells, destroyed
- `AIState`: Hunt/target mode tracking
- `GameState`: Complete game state interface

#### Input Properties (lines 58-85)
| Input | Type | Purpose |
|-------|------|---------|
| `gridSize` | number | Grid dimension (default: 10) |
| `aiDelay` | number | AI turn delay in ms |
| `playerGridGenerator` | SceneObject | Reference to player's grid |
| `opponentGridGenerator` | SceneObject | Reference to opponent's grid |
| `introScreen/setupScreen/gameScreen/gameOverScreen` | SceneObject | UI screens |
| `statusText/hintText/resultText` | Text | UI text elements |
| `*Button` | SceneObject | Various button references |

#### Key Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `onAwake()` | 96-106 | Initialize state, setup buttons, show intro |
| `getGridScript()` | 111-121 | Get grid script via component lookup |
| `initializeState()` | 214-235 | Create fresh game state |
| `setupButtons()` | 254-302 | Wire up button interactions |
| `showScreen()` | 307-314 | Screen state management |
| `startSetup()` | 386-402 | Enter setup phase |
| `generatePlacements()` | 407-417 | Generate random ship positions |
| `startGame()` | 552-566 | Enter playing phase |
| `playerShoot()` | 574-611 | Handle player's shot |
| `processShot()` | 616-643 | Core shot processing logic |
| `scheduleAITurn()` | 676-682 | Delay before AI move |
| `aiTurn()` | 687-723 | AI makes its move |
| `getAIShot()` | 728-759 | AI shot selection (hunt/target) |
| `checkWin()` | 841-850 | Win condition check |
| `endGame()` | 855-867 | Handle game over |
| `resetGame()` | 872-892 | Reset to initial state |
| `submitTurn()` | 899-902 | **STUB** - Multiplayer turn submission |
| `receiveTurn()` | 907-910 | **STUB** - Multiplayer turn receive |

#### Architecture Pattern
**State Machine** with phases: `intro → setup → playing → gameover`

```
┌─────────┐   Single/Multi    ┌───────┐   Start    ┌─────────┐   Win/Lose   ┌──────────┐
│  INTRO  │ ───────────────→  │ SETUP │ ────────→  │ PLAYING │ ──────────→  │ GAMEOVER │
└─────────┘                   └───────┘            └─────────┘              └──────────┘
     ↑                                                                            │
     └────────────────────────── Play Again ──────────────────────────────────────┘
```

---

### 2. GridGenerator.ts (SeaBattleGrid class)

**Purpose:** Visual grid rendering, ship placement, and cell interaction.

**Class:** `SeaBattleGrid extends BaseScriptComponent`

#### Input Properties (lines 6-43)
| Input | Type | Purpose |
|-------|------|---------|
| `cellPrefab` | ObjectPrefab | Grid cell visual |
| `ship1-4Prefab` | ObjectPrefab | Ship visuals by length |
| `hitMarkerPrefab` | ObjectPrefab | Hit indicator |
| `missMarkerPrefab` | ObjectPrefab | Miss indicator |
| `gridSize` | number | Grid dimension |
| `cellSize/cellSpacing` | number | Visual sizing |
| `enableCellTapping` | boolean | Enable tap detection |
| `gameManager` | SceneObject | Reference back to GameManager |
| `autoGenerate` | boolean | Auto-generate on start |

#### Key Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `generate()` | 83-99 | Public entry point for grid generation |
| `show()/hide()` | 107-157 | Visibility control |
| `generateGrid()` | 185-225 | Create visual grid cells |
| `placeShip()` | 286-346 | Place single ship at position |
| `placeShipsRandomly()` | 395-448 | Random placement algorithm |
| `canPlaceShip()` | 454-501 | Validate placement (bounds, no-touch rule) |
| `hasShipAt()` | 526-531 | Check if cell has ship |
| `setCellState()` | 556-571 | Update cell visual (spawn marker) |
| `resetGame()` | 536-541 | Clear and regenerate |

#### Data Structures
- `gridCells: SceneObject[]` - All cell objects (flat)
- `gridCells2D: SceneObject[][]` - 2D access to cells
- `placedShips: SceneObject[]` - Ship scene objects
- `placedMarkers: SceneObject[]` - Hit/miss markers
- `shipGrid: boolean[][]` - Occupancy map

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCENE HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│  GameManager (SceneObject)                                      │
│  ├── Script: GameManager.ts                                     │
│  │   ├── @input playerGridGenerator ──────────────┐             │
│  │   └── @input opponentGridGenerator ─────────┐  │             │
│  │                                             │  │             │
│  PlayerGrid (SceneObject) ←────────────────────│──┘             │
│  └── Script: SeaBattleGrid.ts                  │                │
│      └── @input gameManager ───────────────────│───→ GameManager│
│                                                │                │
│  OpponentGrid (SceneObject) ←──────────────────┘                │
│  └── Script: SeaBattleGrid.ts                                   │
│      └── @input gameManager ───────────────────────→ GameManager│
└─────────────────────────────────────────────────────────────────┘
```

### Communication Pattern

**GameManager → Grid:**
```typescript
// Lookup pattern (fragile)
const gridScript = gridObject.getComponents("Component.ScriptComponent");
gridScript.generate();
gridScript.show();
gridScript.hasShipAt(x, y);
gridScript.setCellState(x, y, 'hit');
```

**Grid → GameManager:**
```typescript
// Direct method call on tap
const gm = this.gameManager.getComponent("Component.ScriptComponent");
(gm as any).onCellTapped(x, y);
```

---

## State Management

### Identified Issue: Duplicate State

Both components track ship positions independently:

| Data | GameManager | SeaBattleGrid |
|------|-------------|---------------|
| Ship positions | `state.playerShips[].cells` | `shipGrid[][]` |
| Grid state | `state.playerGrid[][]` | `gridCells2D[][]` |
| Hit tracking | `state.playerHits` | via markers |

**Risk:** State can diverge if not carefully synchronized.

**Current Mitigation:** `processShot()` uses `checkShipAtPosition()` which calls `gridScript.hasShipAt()` - so the Grid's `shipGrid` is source of truth for hit detection.

---

## AI Implementation

### Hunt/Target Algorithm (lines 728-834)

```
┌──────────────┐
│  HUNT MODE   │ ← Random shots to find ships
└──────┬───────┘
       │ HIT!
       ↓
┌──────────────┐
│ TARGET MODE  │ ← Shoot adjacent cells
└──────┬───────┘
       │ 2+ hits
       ↓
┌──────────────┐
│  DIRECTION   │ ← Filter to horizontal/vertical only
└──────┬───────┘
       │ Ship destroyed
       ↓
   Back to HUNT
```

**Quality:** Good implementation following classic Battleship AI strategy.

---

## Multiplayer Readiness

### Current State: STUB ONLY

```typescript
// Lines 899-910
submitTurn(x: number, y: number, result: 'hit' | 'miss' | 'destroyed') {
    // TODO: Implement Turn-Based integration
    print(`GameManager: Would submit turn...`);
}

receiveTurn(x: number, y: number) {
    // TODO: Implement Turn-Based integration
    print(`GameManager: Would receive turn...`);
}
```

### Integration Points Needed

1. **Turn-Based Component Access** - Need to find and interact with existing Turn-Based SceneObject
2. **State Serialization** - `GameState` needs JSON serialization for turn data
3. **Turn Data Format** - Define what data is sent between players
4. **Player Flow Objects** - UI elements shown per player
5. **Turn History** - Access previous turns for replay

### Existing Research
`TURN_BASED_RESEARCH.md` contains detailed API documentation and integration strategy.

---

## Critical Risks to Address Before Multiplayer

> **ACTION REQUIRED:** These risks should be addressed before starting Multiplayer development.

### Risk #1: Duplicate State Management

**Location:** GameManager.ts + GridGenerator.ts

**Problem:** Ship positions are tracked in two places:
- `GameManager.state.playerShips[].cells` - Array of ship info with cell coordinates
- `SeaBattleGrid.shipGrid[][]` - Boolean grid of occupied cells

**Current Behavior:** `processShot()` calls `gridScript.hasShipAt()` making Grid the source of truth for hit detection, but GameManager also maintains its own ship list.

**Risk:** State divergence during gameplay or reset. If one updates without the other, hits may be detected incorrectly.

**Recommendation:**
- Option A: Remove ship tracking from GameManager, always query Grid
- Option B: Remove shipGrid from Grid, let GameManager own all state
- Option C: Create shared state service (overkill for this project)

**Suggested:** Option A - Grid owns visual AND placement state, GameManager only tracks hits/turns.

---

### Risk #2: Fragile Component Coupling

**Location:** GameManager.ts lines 111-121, GridGenerator.ts lines 263-268

**Problem:** Components find each other via runtime lookup:
```typescript
// GameManager finding Grid
const scripts = gridObject.getComponents("Component.ScriptComponent");
for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i] as any;
    if (script && typeof script.generate === 'function') {
        return script;
    }
}

// Grid finding GameManager
const gm = this.gameManager.getComponent("Component.ScriptComponent");
(gm as any).onCellTapped(x, y);
```

**Risk:**
- No compile-time type safety (`as any` casts)
- Breaks if method names change
- Silent failures if component not found

**Recommendation:** Define TypeScript interfaces for cross-component communication:
```typescript
interface IGridController {
    generate(): void;
    show(): void;
    hide(): void;
    hasShipAt(x: number, y: number): boolean;
    setCellState(x: number, y: number, state: string): void;
}

interface IGameController {
    onCellTapped(x: number, y: number): void;
}
```

---

### Risk #3: No Turn Manager Abstraction

**Location:** GameManager.ts (AI logic mixed with game flow)

**Problem:** Turn handling for AI is embedded directly in GameManager:
- `scheduleAITurn()` - lines 676-682
- `aiTurn()` - lines 687-723
- `getAIShot()` - lines 728-759
- `updateAIState()` - lines 764-785

For Multiplayer, turn handling will come from Turn-Based component with completely different flow.

**Risk:** Adding Multiplayer will require:
- Conditional logic everywhere (`if (mode === 'single') ... else ...`)
- Duplicate code paths
- Hard to test either mode in isolation

**Recommendation:** Extract turn handling to dedicated abstraction:
```typescript
interface ITurnHandler {
    startTurn(): void;
    getNextShot(): Promise<{x: number, y: number}>;
    onShotResult(x: number, y: number, result: string): void;
}

class AITurnHandler implements ITurnHandler { ... }
class MultiplayerTurnHandler implements ITurnHandler { ... }
```

---

## Technical Debt

### High Priority

| Issue | Location | Impact | Remediation |
|-------|----------|--------|-------------|
| Duplicate ship state | GameManager + Grid | State divergence risk | Single source of truth |
| Fragile component lookup | `getGridScript()` | Runtime errors if structure changes | Interface-based design |
| Type assertions | `(gm as any).onCellTapped` | No compile-time safety | Proper interfaces |

### Medium Priority

| Issue | Location | Impact | Remediation |
|-------|----------|--------|-------------|
| Large single file | GameManager (936 lines) | Hard to maintain | Extract services |
| Magic numbers | `TOTAL_OBJECT_CELLS = 20` | Coupling to ship config | Derive from config |
| No error boundaries | Throughout | Silent failures | Error handling |

### Low Priority

| Issue | Location | Impact | Remediation |
|-------|----------|--------|-------------|
| Print statements for logging | Throughout | Performance | Conditional logging |
| Hardcoded ship configuration | Both files | Inflexible | Config-driven |

---

## Testability Assessment

### Lens Studio Constraints
- **No unit test framework** - Lens Studio doesn't support traditional testing
- **No mocking** - Cannot mock scene objects easily
- **Manual testing required** - Play mode testing only

### What CAN Be Tested

| Aspect | Method |
|--------|--------|
| Game flow | Manual play-through |
| AI behavior | Debug mode observation |
| Ship placement | Visual inspection |
| State transitions | Console logging |
| Multiplayer | Turn-Based debug mode |

### Recommendations

1. **Defensive coding** - Null checks, bounds validation
2. **Extensive logging** - Already present, good practice
3. **Debug mode** - Use Turn-Based component's debug options
4. **State dumps** - Add method to export current state for inspection

---

## Positive Findings

1. **Clear type definitions** - TypeScript interfaces are well-defined
2. **State machine pattern** - Clean phase management
3. **Smart AI** - Hunt/target mode is properly implemented
4. **Battleship rules** - No-touch rule correctly implemented
5. **Separation of concerns** - Visual vs logic mostly separated
6. **Good documentation** - Existing .md files explain design well
7. **Prototype complete** - Single Player fully functional

---

## Recommendations for Next Steps

### Before Multiplayer Development

1. **Resolve state duplication** - Decide on single source of truth
2. **Create interfaces** - Define contracts between components
3. **Extract Turn Manager** - Prepare for both AI and multiplayer turns

### For Multiplayer Implementation

1. **Create TurnBasedManager.ts** - Dedicated component for Turn-Based API
2. **Serialize GameState** - Ensure all state is JSON-safe
3. **Design turn protocol** - What data is exchanged per turn
4. **Handle edge cases** - Disconnection, timeout, invalid state

---

## Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `GameManager.ts` | 936 | Central controller |
| `GridGenerator.ts` | 628 | Visual grid (class: SeaBattleGrid) |

**Context files (read-only):**
- `PROJECT_PLAN.md` - Development roadmap
- `TURN_BASED_RESEARCH.md` - Multiplayer API research
- `README.md` - Project overview
- `SNAP_LENS_STUDIO_API.md` - API reference

---

## Conclusion

The codebase is **solid for a prototype** and demonstrates good engineering practices:
- Clear state machine
- Type safety
- Smart AI
- Proper game rules

**Main risks for Multiplayer:**
1. State duplication may cause sync issues
2. Component coupling is fragile
3. No formal interfaces between components

**Recommendation:** Address state management before starting Multiplayer development. The existing structure can support Multiplayer with targeted refactoring.

---

*Analysis performed by BMGD Codebase Analyzer*
