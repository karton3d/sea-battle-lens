# Architecture Document: Meme Fleet Battle

**Generated:** 2026-01-13
**Version:** v0.4 (Multiplayer Update)
**Platform:** Snap Lens Studio
**Language:** TypeScript

---

## Decision Summary

| Category           | Decision              | Version  | Affects Epics | Rationale                                         |
|--------------------|-----------------------|----------|---------------|---------------------------------------------------|
| **Platform**       | Snap Lens Studio      | 5.x      | All           | AR lens distribution, Turn-Based component        |
| **Language**       | TypeScript            | ES2020   | All           | Type safety, Lens Studio native                   |
| **Multiplayer**    | Turn-Based Component  | Built-in | 1,2,3,4       | Async multiplayer via Snaps, no custom networking |
| **State Sync**     | JSON Serialization    | Native   | 2,3           | Turn data must be serializable for Turn-Based     |
| **AI System**      | Hunt/Target Algorithm | Custom   | N/A (SP only) | Existing single-player opponent                   |
| **Grid System**    | 10x10 Square Grid     | Fixed    | All           | Classic Battleship, proven in v0.3                |
| **Ship Placement** | Random, No-Touch Rule | Custom   | 2             | Fair starts, no manual placement                  |

---

## 1. System Overview

Meme Fleet Battle is an AR Battleship game built on Snap Lens Studio. The architecture consists of two main components that manage game logic and visual rendering respectively.

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LENS SCENE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         UI LAYER (Screens)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │   │
│  │  │  Intro   │  │  Setup   │  │   Game   │  │   GameOver   │        │   │
│  │  │  Screen  │  │  Screen  │  │  Screen  │  │    Screen    │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↑                                        │
│                                    │ Controls                               │
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────┐   │
│  │                        GAME MANAGER                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Game State  │  │  AI Logic   │  │ Turn Logic  │                  │   │
│  │  │  Machine    │  │ Hunt/Target │  │   (Stub)    │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                               │
│               ┌─────────────┴─────────────┐                                │
│               │    Component Lookup       │                                │
│               │  getGridScript()          │                                │
│               └─────────────┬─────────────┘                                │
│                             │                                               │
│         ┌───────────────────┴───────────────────┐                          │
│         ↓                                       ↓                          │
│  ┌──────────────────┐                  ┌──────────────────┐                │
│  │   PLAYER GRID    │                  │  OPPONENT GRID   │                │
│  │  (SeaBattleGrid) │                  │  (SeaBattleGrid) │                │
│  │                  │                  │                  │                │
│  │  • Grid cells    │                  │  • Grid cells    │                │
│  │  • Ship visuals  │                  │  • Ship visuals  │                │
│  │  • Markers       │                  │  • Markers       │                │
│  │                  │                  │  • Cell tapping  │                │
│  └──────────────────┘                  └────────┬─────────┘                │
│                                                 │                          │
│                                                 │ onCellTapped()           │
│                                                 ↓                          │
│                                        ┌──────────────────┐                │
│                                        │  GAME MANAGER    │                │
│                                        │  playerShoot()   │                │
│                                        └──────────────────┘                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TURN-BASED COMPONENT (Unused)                    │   │
│  │                    For future multiplayer                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 GameManager

**File:** `Assets/Scripts/GameManager.ts`
**Type:** `@component` extending `BaseScriptComponent`
**Responsibility:** Central game controller

#### State Machine

```
                    ┌──────────────────────────────────────────┐
                    │           STATE TRANSITIONS              │
                    └──────────────────────────────────────────┘

    ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌──────────┐
    │  INTRO  │────────→│  SETUP  │────────→│ PLAYING │────────→│ GAMEOVER │
    └─────────┘         └─────────┘         └─────────┘         └──────────┘
         │                   │                   │                    │
         │                   │                   │                    │
    onAwake()          startSetup()         startGame()          endGame()
    - init state       - generate grids     - show both grids    - show winner
    - setup buttons    - random placement   - enable tapping     - play again?
    - show intro       - show player grid   - player's turn
                                                  │
                                                  ↓
                                            ┌───────────┐
                                            │TURN CYCLE │
                                            └─────┬─────┘
                                                  │
                              ┌────────────────────┴────────────────────┐
                              ↓                                        ↓
                        ┌──────────┐                            ┌──────────┐
                        │ PLAYER   │                            │ OPPONENT │
                        │  TURN    │                            │   TURN   │
                        └────┬─────┘                            └────┬─────┘
                             │                                       │
                        playerShoot()                           aiTurn()
                             │                                       │
                             └───────────────┬───────────────────────┘
                                             ↓
                                       checkWin()
                                             │
                                    ┌────────┴────────┐
                                    ↓                 ↓
                               Continue          endGame()
```

#### Data Structures

```typescript
// Game phase tracking
type GamePhase = 'intro' | 'setup' | 'playing' | 'gameover';
type TurnState = 'player' | 'opponent' | 'waiting';
type GameMode = 'single' | 'multiplayer';

// Cell state tracking
type CellState = 'unknown' | 'empty' | 'hit' | 'object' | 'destroyed';

// Ship information
interface ShipInfo {
    id: number;
    length: number;
    cells: Array<{x: number, y: number}>;
    hitCells: number;
    destroyed: boolean;
}

// AI targeting state
interface AIState {
    mode: 'hunt' | 'target';
    targetCells: Array<{x: number, y: number}>;
    hitCells: Array<{x: number, y: number}>;
    lastHitDirection: 'horizontal' | 'vertical' | null;
}

// Complete game state
interface GameState {
    mode: GameMode;
    phase: GamePhase;
    turn: TurnState;
    playerGrid: CellState[][];
    opponentGrid: CellState[][];
    playerShips: ShipInfo[];
    opponentShips: ShipInfo[];
    playerHits: number;
    opponentHits: number;
    totalObjectCells: number;
    winner: 'player' | 'opponent' | null;
}
```

#### Public API

| Method               | Purpose                            | Called By     |
|----------------------|------------------------------------|---------------|
| `onCellTapped(x, y)` | Handle cell tap from opponent grid | SeaBattleGrid |
| `getState()`         | Get current game state (debug)     | External      |
| `canTapCell(x, y)`   | Check if cell can be tapped        | External      |

---

### 2.2 SeaBattleGrid

**File:** `Assets/Scripts/GridGenerator.ts`
**Type:** `@component` extending `BaseScriptComponent`
**Responsibility:** Visual grid rendering and ship management

#### Visual Hierarchy

```
GridParent (SceneObject)
├── Cell_0_0 (instantiated from cellPrefab)
├── Cell_0_1
├── ...
├── Cell_9_9
├── Ship_4_at_0_0_H (instantiated from ship4Prefab)
├── Ship_3_at_6_0_V
├── ...
├── Marker_hit_5_3 (instantiated from hitMarkerPrefab)
├── Marker_miss_2_7 (instantiated from missMarkerPrefab)
└── ...
```

#### Data Structures

```typescript
// Internal state
private gridCells: SceneObject[] = [];           // All cells (flat array)
private gridCells2D: SceneObject[][] = [];       // 2D cell access
private placedShips: SceneObject[] = [];         // Ship scene objects
private placedMarkers: SceneObject[] = [];       // Hit/miss markers
private shipGrid: boolean[][] = [];              // Occupancy map
private isVisible: boolean = false;              // Visibility state
```

#### Public API

| Method                      | Purpose                       | Called By   |
|-----------------------------|-------------------------------|-------------|
| `generate()`                | Generate grid and place ships | GameManager |
| `show()`                    | Show all grid elements        | GameManager |
| `hide()`                    | Hide all grid elements        | GameManager |
| `hasShipAt(x, y)`           | Check ship occupancy          | GameManager |
| `setCellState(x, y, state)` | Update cell visual            | GameManager |
| `resetGame()`               | Clear and regenerate          | GameManager |
| `getCellAt(x, y)`           | Get cell SceneObject          | Internal    |
| `getGridSize()`             | Get grid dimension            | External    |

---

## 3. Data Flow

### 3.1 Game Initialization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INITIALIZATION FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

    GameManager.onAwake()
           │
           ├──→ initializeState()      Create empty GameState
           │
           ├──→ setupButtons()         Wire button interactions
           │
           ├──→ hideGrids()            Call grid.hide() on both grids
           │
           └──→ showScreen('intro')    Display intro UI
```

### 3.2 Game Setup Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SETUP FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

    User taps "Single Player"
           │
           ↓
    onSinglePlayerTap()
           │
           ├──→ state.mode = 'single'
           │
           └──→ startSetup()
                     │
                     ├──→ generateGrids()
                     │         │
                     │         ├──→ playerGrid.generate()
                     │         │         │
                     │         │         ├──→ generateGrid()     Create cells
                     │         │         └──→ placeShipsRandomly()
                     │         │
                     │         └──→ opponentGrid.generate()
                     │
                     ├──→ showPlayerGrid()
                     │
                     ├──→ generatePlacements()   GameManager's state.ships
                     │
                     └──→ showScreen('setup')
```

### 3.3 Shot Processing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SHOT PROCESSING FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

    User taps cell on opponent grid
           │
           ↓
    SeaBattleGrid.handleCellTap(x, y)
           │
           └──→ GameManager.onCellTapped(x, y)
                          │
                          └──→ playerShoot(x, y)
                                     │
                                     ├──→ Check: Is player's turn?
                                     │
                                     ├──→ Check: Is cell 'unknown'?
                                     │
                                     ├──→ processShot(x, y, ...)
                                     │         │
                                     │         ├──→ checkShipAtPosition()
                                     │         │         │
                                     │         │         └──→ grid.hasShipAt(x, y)
                                     │         │
                                     │         ├──→ Update grid state (hit/empty)
                                     │         │
                                     │         └──→ Update hit counter
                                     │
                                     ├──→ updateCellVisual()
                                     │         │
                                     │         └──→ grid.setCellState(x, y, 'hit'/'miss')
                                     │
                                     ├──→ checkWin()
                                     │
                                     └──→ Switch turn / Schedule AI
```

---

## 4. State Ownership

### 4.1 Current State Distribution (Problem)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CURRENT STATE OWNERSHIP                           │
│                       (DUPLICATED)                                  │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────┐    ┌─────────────────────────────┐
    │       GAME MANAGER          │    │      SEABATTLE GRID         │
    │                             │    │                             │
    │  state.playerShips[]        │ ≈  │  shipGrid[][]               │
    │  - id, length, cells        │    │  - boolean occupancy        │
    │  - hitCells, destroyed      │    │                             │
    │                             │    │                             │
    │  state.playerGrid[][]       │    │  gridCells2D[][]            │
    │  - CellState per cell       │    │  - SceneObject per cell     │
    │                             │    │                             │
    │  state.playerHits           │    │  placedMarkers[]            │
    │  - number of hits           │    │  - visual markers           │
    └─────────────────────────────┘    └─────────────────────────────┘
```

### 4.2 Recommended State Ownership (Solution)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  RECOMMENDED STATE OWNERSHIP                        │
│                    (SINGLE SOURCE OF TRUTH)                         │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────┐    ┌─────────────────────────────┐
    │       GAME MANAGER          │    │      SEABATTLE GRID         │
    │       (LOGIC OWNER)         │    │      (VISUAL OWNER)         │
    │                             │    │                             │
    │  • Game phase               │    │  • Grid cells (SceneObject) │
    │  • Turn state               │    │  • Ship visuals             │
    │  • Hit/miss counters        │    │  • Markers                  │
    │  • Win detection            │    │  • Visibility               │
    │  • AI state                 │    │                             │
    │                             │    │  shipGrid[][] (TRUTH)       │
    │  Query grid for ship data →─│────│→ hasShipAt(x, y)            │
    └─────────────────────────────┘    └─────────────────────────────┘

    REMOVE from GameManager:
    - state.playerShips / opponentShips (redundant)
    - generateShipPlacements() (Grid handles this)
    - markShipsOnGrid() (Grid handles this)
```

---

## 5. Component Interfaces

### 5.1 Proposed Interface Definitions

```typescript
/**
 * Interface for grid operations
 * Implemented by: SeaBattleGrid
 * Used by: GameManager
 */
interface IGridController {
    // Lifecycle
    generate(): void;
    resetGame(): void;

    // Visibility
    show(): void;
    hide(): void;

    // State queries
    hasShipAt(x: number, y: number): boolean;
    getGridSize(): number;

    // State mutations
    setCellState(x: number, y: number, state: 'hit' | 'miss' | 'unknown'): void;
}

/**
 * Interface for game events
 * Implemented by: GameManager
 * Used by: SeaBattleGrid (cell tap callback)
 */
interface IGameEventHandler {
    onCellTapped(x: number, y: number): void;
}

/**
 * Interface for turn handling (NEW - for multiplayer)
 * Implemented by: AITurnHandler, MultiplayerTurnHandler
 * Used by: GameManager
 */
interface ITurnHandler {
    isMyTurn(): boolean;
    getNextShot(): Promise<{x: number, y: number}> | {x: number, y: number};
    onShotResult(x: number, y: number, result: 'hit' | 'miss'): void;
    onTurnEnd(): void;
}
```

---

## 6. Extension Points for Multiplayer

### 6.1 Turn-Based Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MULTIPLAYER EXTENSION POINTS                        │
└─────────────────────────────────────────────────────────────────────┘

    CURRENT (Single Player)              MULTIPLAYER (Turn-Based)
    ────────────────────────            ────────────────────────

    ┌───────────────┐                   ┌───────────────┐
    │  GameManager  │                   │  GameManager  │
    │               │                   │               │
    │  aiTurn() ────┼──→ Remove         │  turnHandler  │──→ ITurnHandler
    │  getAIShot()  │                   │               │
    │  updateAI...  │                   └───────┬───────┘
    └───────────────┘                           │
                                       ┌────────┴────────┐
                                       ↓                 ↓
                               ┌──────────────┐  ┌──────────────┐
                               │AITurnHandler │  │MPTurnHandler │
                               │              │  │              │
                               │ Hunt/Target  │  │ Turn-Based   │
                               │ Algorithm    │  │ Component    │
                               └──────────────┘  └──────────────┘
```

### 6.2 New Component: TurnBasedManager

```typescript
/**
 * NEW COMPONENT for Turn-Based integration
 * File: Assets/Scripts/TurnBasedManager.ts
 */
@component
export class TurnBasedManager extends BaseScriptComponent implements ITurnHandler {

    @input turnBasedObject: SceneObject;  // Reference to Turn-Based SceneObject

    private turnBasedComponent: any;       // Turn-Based API
    private pendingShot: {x: number, y: number} | null = null;

    // ITurnHandler implementation
    isMyTurn(): boolean { ... }

    getNextShot(): Promise<{x: number, y: number}> {
        // Wait for player tap or opponent's turn data
        return new Promise((resolve) => { ... });
    }

    onShotResult(x: number, y: number, result: 'hit' | 'miss'): void {
        // Submit turn to Turn-Based component
        this.submitTurn({ shotX: x, shotY: y, result: result });
    }

    onTurnEnd(): void {
        // Notify Turn-Based that turn is complete
    }

    // Turn-Based specific
    private submitTurn(data: TurnData): void { ... }
    private onTurnReceived(data: TurnData): void { ... }
}
```

### 6.3 Turn Data Schema

```typescript
/**
 * Data sent between players via Turn-Based
 */
interface TurnData {
    // Shot information
    shotX: number;
    shotY: number;
    result: 'hit' | 'miss';

    // Ship destroyed this turn (if any)
    destroyedShipLength: number | null;

    // For initial setup: player's ship positions
    // (sent once at game start, encrypted/hidden)
    shipPositions?: Array<{
        x: number;
        y: number;
        length: number;
        horizontal: boolean;
    }>;

    // Game state
    hitsCount: number;
    isGameOver: boolean;
    winner: 'player' | 'opponent' | null;
}
```

---

## 7. Scene Hierarchy

```
Scene
├── Camera Object
├── Lighting
├── Prefabs/
│   ├── Box (cell prefab)
│   ├── 4x1, 3x1, 2x1, 1x1 (ship prefabs)
│   ├── HitMarker, MissMarker
│   └── ...
├── Turn Based (SceneObject)          ← Multiplayer component (existing, unused)
├── Turn Based Player Info
├── Orthographic Camera
│   └── Screens/
│       ├── IntroScreen
│       │   ├── TitleText
│       │   ├── SinglePlayerBtn
│       │   └── MultiplayerBtn
│       ├── SetupScreen
│       │   ├── StatusText
│       │   └── StartBtn
│       ├── GameScreen
│       │   ├── StatusText
│       │   ├── HintText
│       │   └── ResultText
│       └── GameOverScreen
│           ├── StatusText
│           └── PlayAgainBtn
├── GameRoot
│   ├── GameManager (script: GameManager.ts)
│   └── Grids/
│       ├── PlayerGrid (script: SeaBattleGrid)
│       └── OpponentGrid (script: SeaBattleGrid, enableCellTapping=true)
└── World
```

---

## 8. Configuration

### 8.1 Game Rules

| Parameter     | Value                        | Location                                         |
|---------------|------------------------------|--------------------------------------------------|
| Grid size     | 10x10                        | `GameManager.gridSize`, `SeaBattleGrid.gridSize` |
| Ships         | 4, 3, 3, 2, 2, 2, 1, 1, 1, 1 | `placeShipsRandomly()`                           |
| Total cells   | 20                           | `TOTAL_OBJECT_CELLS`                             |
| AI delay      | 1000ms                       | `GameManager.aiDelay`                            |
| No-touch rule | Enabled                      | `canPlaceShip()`                                 |

### 8.2 Grid Settings

| Parameter            | Default    | Purpose                   |
|----------------------|------------|---------------------------|
| `cellSize`           | 1.0        | Visual cell dimension     |
| `cellSpacing`        | 0.1        | Gap between cells         |
| `shipHeightOffset`   | 0.5        | Ship elevation above grid |
| `useRandomPlacement` | true       | Random vs fixed ships     |
| `enableCellTapping`  | false/true | Enable tap interaction    |
| `autoGenerate`       | false      | Auto-generate on start    |

---

## 9. Testing Strategy Reference

### 9.1 Manual Test Cases

| Test Case              | Steps                         | Expected                       |
|------------------------|-------------------------------|--------------------------------|
| TC-001: New Game       | Open lens → Tap Single Player | Shows setup screen             |
| TC-002: Ship Placement | Start game                    | 10 ships visible, no overlaps  |
| TC-003: Hit Detection  | Tap cell with ship            | "HIT!" displayed, marker shown |
| TC-004: Miss Detection | Tap empty cell                | "Miss" displayed, marker shown |
| TC-005: AI Turn        | After player turn             | AI shoots within 1 second      |
| TC-006: Win Condition  | Hit all 20 cells              | "YOU WON!" displayed           |
| TC-007: Lose Condition | AI hits all 20                | "YOU LOST!" displayed          |
| TC-008: Play Again     | Tap Play Again                | Returns to intro               |

### 9.2 Debug Tools

- **Console logging:** All major actions print to console
- **Turn-Based debug mode:** Built into component for MP testing
- **Fixed ship placement:** Set `useRandomPlacement = false`

---

## 10. Known Constraints

### 10.1 Lens Studio Limitations

| Constraint              | Impact               | Mitigation                       |
|-------------------------|----------------------|----------------------------------|
| No unit testing         | Can't automate tests | Manual testing, defensive coding |
| Limited debugging       | No breakpoints       | Extensive print statements       |
| No async/await (native) | Complex callbacks    | DelayedCallbackEvent             |
| Component lookup        | No DI framework      | Interface-based design           |

### 10.2 Turn-Based Constraints

| Constraint           | Impact                     | Mitigation                 |
|----------------------|----------------------------|----------------------------|
| Async only           | No real-time play          | Design for turn-based      |
| JSON serialization   | State must be serializable | Keep state simple          |
| No direct networking | Can't bypass Snap          | Use Turn-Based as designed |

---

## 11. Glossary

| Term            | Definition                                  |
|-----------------|---------------------------------------------|
| **Cell**        | One square on the 10x10 grid                |
| **Ship/Object** | A meme object occupying 1-4 cells           |
| **Hit**         | Shot lands on cell with ship                |
| **Miss**        | Shot lands on empty cell                    |
| **Hunt mode**   | AI shoots randomly to find ships            |
| **Target mode** | AI shoots adjacent cells after a hit        |
| **Turn-Based**  | Lens Studio component for async multiplayer |
| **SceneObject** | Lens Studio's game object equivalent        |

---

## 12. Epic to Architecture Mapping

| Epic                               | Components Affected                      | Key Patterns            | Notes                             |
|------------------------------------|------------------------------------------|-------------------------|-----------------------------------|
| **Epic 1: Turn-Based Integration** | TurnBasedManager (new), GameManager      | ITurnHandler interface  | Core multiplayer foundation       |
| **Epic 2: Multiplayer Game Flow**  | GameManager, IntroScreen, GameOverScreen | State machine extension | Mode selection, turn indicators   |
| **Epic 3: State Synchronization**  | TurnBasedManager, TurnData schema        | JSON serialization      | Ship positions, shot results      |
| **Epic 4: UI/UX for Multiplayer**  | All screen components                    | Screen state pattern    | Waiting states, opponent feedback |
| **Epic 5: Testing & Polish**       | All components                           | Debug logging pattern   | Two-device validation             |

---

## 13. Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### 13.1 Component Communication Pattern

```typescript
// PATTERN: Use interface-based communication between components
// GameManager gets grid reference, calls interface methods

// ✅ CORRECT: Query grid via interface
const hasShip = this.opponentGrid.hasShipAt(x, y);

// ❌ WRONG: Direct state access
const hasShip = this.opponentGrid.shipGrid[y][x];
```

### 13.2 Turn Handler Pattern

```typescript
// PATTERN: ITurnHandler for abstracting turn sources (AI vs Multiplayer)

interface ITurnHandler {
    isMyTurn(): boolean;
    getNextShot(): Promise<{x: number, y: number}> | {x: number, y: number};
    onShotResult(x: number, y: number, result: 'hit' | 'miss'): void;
    onTurnEnd(): void;
}

// GameManager uses handler, doesn't care if AI or multiplayer
private turnHandler: ITurnHandler;

// Single player: turnHandler = new AITurnHandler();
// Multiplayer:   turnHandler = new TurnBasedManager();
```

### 13.3 State Serialization Pattern

```typescript
// PATTERN: All multiplayer state must be JSON-serializable

// ✅ CORRECT: Plain objects and primitives
interface TurnData {
    shotX: number;
    shotY: number;
    result: 'hit' | 'miss';
    isGameOver: boolean;
}

// ❌ WRONG: SceneObjects, functions, circular refs
interface BadTurnData {
    grid: SceneObject;  // NOT SERIALIZABLE
    callback: () => void;  // NOT SERIALIZABLE
}
```

### 13.4 Screen State Pattern

```typescript
// PATTERN: Centralized screen management via showScreen()

// ✅ CORRECT: Use GameManager.showScreen()
this.showScreen('game');

// ❌ WRONG: Direct SceneObject manipulation
this.gameScreen.enabled = true;
this.introScreen.enabled = false;
```

### 13.5 Delayed Action Pattern

```typescript
// PATTERN: Use DelayedCallbackEvent for timed actions (no async/await)

// ✅ CORRECT: Lens Studio delayed callback
const delayedEvent = this.createEvent('DelayedCallbackEvent');
delayedEvent.bind(() => {
    this.executeAITurn();
});
delayedEvent.reset(1.0); // 1 second delay

// ❌ WRONG: setTimeout (not available in Lens Studio)
setTimeout(() => this.executeAITurn(), 1000);
```

---

## 14. Consistency Rules

### 14.1 Naming Conventions

| Element            | Convention            | Example                                 |
|--------------------|-----------------------|-----------------------------------------|
| **Files**          | PascalCase.ts         | `GameManager.ts`, `TurnBasedManager.ts` |
| **Classes**        | PascalCase            | `SeaBattleGrid`, `TurnBasedManager`     |
| **Interfaces**     | IPascalCase           | `ITurnHandler`, `IGridController`       |
| **Methods**        | camelCase             | `playerShoot()`, `onCellTapped()`       |
| **Private fields** | camelCase (no prefix) | `gridCells`, `turnHandler`              |
| **Constants**      | SCREAMING_SNAKE       | `TOTAL_OBJECT_CELLS`, `GRID_SIZE`       |
| **@input props**   | camelCase             | `@input playerGrid: SceneObject`        |
| **Events**         | onEventName           | `onCellTapped`, `onTurnReceived`        |

### 14.2 Code Organization

```
Assets/Scripts/
├── GameManager.ts          # Central game controller
├── GridGenerator.ts        # SeaBattleGrid component
├── TurnBasedManager.ts     # NEW: Multiplayer turn handling
├── IntroScreen.ts          # Welcome screen logic
└── types/
    └── GameTypes.ts        # Shared type definitions
```

**File Structure Within Components:**
```typescript
@component
export class ComponentName extends BaseScriptComponent {
    // 1. @input declarations (scene references)
    @input playerGrid: SceneObject;

    // 2. Private state
    private state: GameState;

    // 3. Lifecycle methods
    onAwake() { }

    // 4. Public API methods
    public startGame(): void { }

    // 5. Private implementation
    private processShot(): void { }
}
```

### 14.3 Error Handling

```typescript
// PATTERN: Defensive checks with print logging (no throw in Lens Studio)

// ✅ CORRECT: Guard clause with log
public onCellTapped(x: number, y: number): void {
    if (this.state.turn !== 'player') {
        print('[GameManager] onCellTapped: Not player turn, ignoring');
        return;
    }
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        print(`[GameManager] onCellTapped: Invalid coords (${x}, ${y})`);
        return;
    }
    // Process tap...
}

// ❌ WRONG: Throwing exceptions
if (!valid) throw new Error('Invalid state');
```

### 14.4 Logging Strategy

```typescript
// PATTERN: Prefixed logging for component tracing

// Format: [ComponentName] methodName: message
print('[GameManager] playerShoot: Hit at (5, 3)');
print('[TurnBasedManager] onTurnReceived: Processing opponent shot');
print('[SeaBattleGrid] setCellState: Marking (2, 7) as miss');

// Debug levels (manual filtering in log viewer)
print('[DEBUG] AI state: ' + JSON.stringify(this.aiState));
print('[ERROR] Failed to deserialize turn data');
print('[TURN] Submitting turn: ' + JSON.stringify(turnData));
```

---

## 15. Document History

| Version | Date       | Changes                                                                                               |
|---------|------------|-------------------------------------------------------------------------------------------------------|
| 1.0     | 2026-01-13 | Initial architecture document (v0.3 single player)                                                    |
| 1.1     | 2026-01-13 | Added Decision Summary, Epic Mapping, Implementation Patterns, Consistency Rules for v0.4 multiplayer |

---

*Generated by BMGD Architecture Workflow*
