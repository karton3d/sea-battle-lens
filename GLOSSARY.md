# Fleet Yeet! Glossary

Domain terminology for the AR Battleship game. Organized hierarchically for consistent communication.

---

## Game Core

### Game Mode
`GameMode` type in `types/GameTypes.ts:21`

How the game is played.

| Mode | Description |
|------|-------------|
| **single** | Player vs AI opponent |
| **multiplayer** | Player vs player via Snapchat Turn-Based |

### Game Phase
`GamePhase` type in `types/GameTypes.ts:7-15`

Current stage of the game lifecycle.

```
┌─────────┐    ┌───────┐    ┌───────┐    ┌─────────────────┐    ┌──────────┐
│ waiting │───→│ intro │───→│ setup │───→│ playing/aiming  │───→│ gameover │
└─────────┘    └───────┘    └───────┘    └─────────────────┘    └──────────┘
                               │                 ↑
                               ↓                 │
                        ┌──────────────┐         │
                        │setup_pending │─────────┘
                        └──────────────┘
                         (multiplayer only)
```

| Phase | Description |
|-------|-------------|
| **waiting** | Initial: waiting for Turn-Based to signal multiplayer state |
| **intro** | Menu screen: mode selection |
| **setup** | Ship placement phase |
| **setup_pending** | MP: setup with incoming shot to evaluate |
| **playing** | Single player: active combat |
| **aiming** | MP: selecting target cell |
| **confirm_send** | MP: aim selected, awaiting Fire button |
| **gameover** | Game ended, showing result |

### Win Condition

First player to score **20 hits** wins. This equals `TOTAL_OBJECT_CELLS` (sum of all ship lengths).

---

## Grid System

### Grid

The 10x10 playing field. Each player has two grids:
- **Player Grid** — Shows own ships, receives opponent shots
- **Opponent Grid** — Hidden ships, player shoots here

**Grid Types:**
| Type | Component | Description |
|------|-----------|-------------|
| **Flat** | `GridGenerator.ts` | Standard 2D layout |
| **Spherical** | `SphericalGrid.ts` | Curved surface, globe-like |

### Cell

A single square on the grid. Identified by (x, y) coordinates.

### Cell State
`CellState` type in `types/GameTypes.ts:24`

The visual/logical state of a cell.

| State | Description | Visual |
|-------|-------------|--------|
| **unknown** | Not yet targeted | Empty |
| **empty** | Shot landed, no ship | Miss marker |
| **hit** | Shot landed, ship present | Hit marker |
| **object** | Contains ship (own grid only) | Ship visible |
| **destroyed** | Ship fully sunk | Hit marker |

### Coordinates

```
         0   1   2   3   4   5   6   7   8   9   ← X (column)
       ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
     0 │   │   │   │   │   │   │   │   │   │   │
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     1 │   │   │ ▓ │ ▓ │ ▓ │   │   │   │   │   │  ← 3-cell ship at (2,1)-(4,1)
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     2 │   │   │   │   │   │   │   │   │   │   │
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     3 │   │ ▓ │   │   │   │   │   │   │   │   │
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     4 │   │ ▓ │   │   │   │   │   │ X │   │   │  ← Hit at (7,4)
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     5 │   │   │   │   │   │ ○ │   │   │   │   │  ← Miss at (5,5)
       ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
     ...
     ↓
     Y (row)

     Legend: ▓ = ship, X = hit, ○ = miss
```

- **X** = column (0-9, left to right)
- **Y** = row (0-9, top to bottom)
- Format: `(x, y)` or `(col, row)`

### Curvature
`curvature` property in `SphericalGrid.ts:33`

Controls the sphere-like curve of the spherical grid.

| Value | Effect |
|-------|--------|
| 0 | Flat (no curve) |
| Higher | More pronounced sphere |

Uses parabolic approximation: `z = distance² × curvature / 2`

---

## Ships & Fleet

### Ship

A game piece occupying 1-4 consecutive cells. Placed horizontally or vertically.

### Ship Types
`SHIP_CONFIG` constant in `types/GameTypes.ts:200-205`

| Type | Length | Count | Total Cells |
|------|--------|-------|-------------|
| **Battleship** | 4 | 1 | 4 |
| **Cruiser** | 3 | 2 | 6 |
| **Destroyer** | 2 | 3 | 6 |
| **Submarine** | 1 | 4 | 4 |

### Fleet Composition

- **10 ships** total
- **20 cells** total (`TOTAL_OBJECT_CELLS`)
- All 20 cells must be hit to win

### ShipInfo
`ShipInfo` interface in `types/GameTypes.ts:32-38`

Runtime ship data structure.

| Property | Type | Description |
|----------|------|-------------|
| `id` | number | Unique identifier |
| `length` | number | Cell count (1-4) |
| `cells` | {x, y}[] | Occupied coordinates |
| `hitCells` | number | Cells hit so far |
| `destroyed` | boolean | All cells hit? |

---

## Combat & Turns

### Turn State
`TurnState` type in `types/GameTypes.ts:18`

Whose turn it is currently.

```
┌────────┐  shot complete  ┌──────────┐
│ player │────────────────→│ opponent │
└────────┘                 └──────────┘
     ↑                          │
     │      opponent shoots     │
     └──────────────────────────┘
```

| State | Description |
|-------|-------------|
| **player** | Player's turn to shoot |
| **opponent** | Opponent's turn (AI or MP) |
| **waiting** | Transition between turns |

### Shot

An attack on a cell. Specified by (x, y) coordinates.

### Shot Result
`ShotResult` type in `types/GameTypes.ts:27`

Outcome of a shot.

| Result | Description |
|--------|-------------|
| **hit** | Struck a ship |
| **miss** | Struck water |
| **destroyed** | Final hit sank the ship |

### Markers

Visual indicators spawned on the grid after shots.

| Marker | Prefab | When |
|--------|--------|------|
| **Hit Marker** | `hitMarkerPrefab` | Shot hits ship |
| **Miss Marker** | `missMarkerPrefab` | Shot hits water |
| **Aim Marker** | `aimMarkerPrefab` | MP: Selected target (before firing) |

### AI Modes
`mode` property in `AIState` (`types/GameTypes.ts:42`)

AI targeting strategy.

```
┌──────────────┐                    ┌──────────────┐
│     HUNT     │────── hit ────────→│    TARGET    │
│   (random)   │                    │  (adjacent)  │
└──────────────┘                    └──────────────┘
       ↑                                   │
       │                                   │
       └────── ship destroyed ─────────────┘
```

| Mode | Strategy |
|------|----------|
| **hunt** | Random selection from available cells |
| **target** | Focus on cells adjacent to confirmed hits |

**Target mode logic:**
1. On hit → add 4 adjacent cells to target list
2. On 2+ hits → detect direction (horizontal/vertical)
3. Filter targets to match direction
4. On destroy → return to hunt

---

## Multiplayer

### Players

Roles assigned by Snapchat Turn-Based system.

| Role | turnCount | Behavior |
|------|-----------|----------|
| **Player 0 / Player 1** | 0 | Initiates game, sees intro |
| **Player 2** | >0 | Joins via invite, may skip intro |

### Turn Data
`TurnData` interface in `types/GameTypes.ts:132-160`

Data sent each turn via Turn-Based component.

| Field | Type | Description |
|-------|------|-------------|
| `shotX` | number | Target column (0-9) |
| `shotY` | number | Target row (0-9) |
| `incomingShotResult` | ShotResult? | Result of opponent's last shot |
| `hitsCount` | number? | Sender's current hit count |
| `isGameOver` | boolean | Game ended? |
| `winner` | string? | 'player' or 'opponent' |
| `shipPositions` | array? | Ship layout (first turn only) |

### Deferred Evaluation

**Key multiplayer concept:** Shots are evaluated by the **receiver**, not the sender.

```
Player A                           Player B
────────                           ────────
    │                                  │
    │  aim(3,5)                        │
    │─────────────────────────────────→│
    │                                  │ evaluate (3,5)
    │                                  │ against own grid
    │               result='hit'       │
    │               + aim(7,2)         │
    │←─────────────────────────────────│
    │                                  │
    │ evaluate (7,2)                   │
    │ against own grid                 │
    │                                  │
    │  result='miss'                   │
    │  + aim(4,5)                      │
    │─────────────────────────────────→│
    ...
```

This keeps ship positions secret until revealed by shot outcomes.

### Pending Shot
`PendingShot` interface in `types/GameTypes.ts:166-169`

An incoming shot waiting to be evaluated.

| Field | Type | Description |
|-------|------|-------------|
| `x` | number | Column |
| `y` | number | Row |

Exists during `setup_pending` phase (MP only).

### Selected Aim
`selectedAim` in `MultiplayerState`

The cell the player has targeted but not yet fired.

### Ship Position Exchange

On **first turn only**, players send `shipPositions` array:
```typescript
{x: number, y: number, length: number, horizontal: boolean}[]
```

Stored in Turn-Based global variables for validation.

---

## UI & Screens

### Screens

Game interface states managed by `GameManager`.

```
┌───────┐    mode      ┌───────┐   start    ┌──────┐   20 hits   ┌──────────┐
│ intro │───selected──→│ setup │──────────→│ game │────────────→│ gameover │
└───────┘              └───────┘            └──────┘             └──────────┘
                           │                                          │
                           │  reshuffle                               │
                           └────┐                                     │
                                │                                     │
                                ↓                                     │
                           (regenerate ships)                         │
                                                                      │
                                              ┌─────────────────────┘
                                              │ play again
                                              ↓
                                          (back to intro)
```

| Screen | Phase | Purpose |
|--------|-------|---------|
| **intro** | intro | Mode selection |
| **setup** | setup | Ship placement |
| **game** | playing/aiming | Active combat |
| **gameover** | gameover | Result display |

### Buttons

| Button | Phase | Action |
|--------|-------|--------|
| **singlePlayerButton** | intro | Start single-player mode |
| **multiplayerButton** | intro | Start multiplayer mode |
| **startButton** | setup | Confirm ships, begin game |
| **reshuffleButton** | setup | Regenerate ship positions |
| **fireButton** | aiming/confirm_send | Submit turn (MP) |
| **playAgainButton** | gameover | Return to intro |

### Text Elements
`@input` properties in `GameManager.ts:34-36`

| Element | Purpose | Example |
|---------|---------|---------|
| **statusText** | Current state | "Your turn", "Opponent's turn" |
| **hintText** | Player guidance | "Tap a cell to attack" |
| **resultText** | Last action | "HIT!", "Miss" |

---

## Key Interfaces

### ITurnHandler
`types/GameTypes.ts:80-105`

Abstracts AI vs multiplayer turn handling.

**Implementations:** `AITurnHandler`, `TurnBasedManager`

| Method | Description |
|--------|-------------|
| `startOpponentTurn()` | Signal opponent's turn |
| `onPlayerShotComplete(x, y, result)` | Report player shot outcome |
| `onGameOver(winner)` | Game end notification |
| `reset()` | Clear state for new game |

### IGridController
`types/GameTypes.ts:111-119`

Grid operations interface.

**Implementations:** `SeaBattleGrid`, `SphericalGrid`

| Method | Description |
|--------|-------------|
| `generate()` | Create grid and place ships |
| `show()` / `hide()` | Toggle visibility |
| `hasShipAt(x, y)` | Check for ship |
| `setCellState(x, y, state)` | Update cell visual |
| `resetGame()` | Clear and regenerate |
| `reshuffleShips()` | New ship positions |

---

## Constants

`types/GameTypes.ts:191-205`

| Constant | Value | Description |
|----------|-------|-------------|
| `GRID_SIZE` | 10 | Grid dimension (10x10) |
| `TOTAL_OBJECT_CELLS` | 20 | Cells to sink for victory |
