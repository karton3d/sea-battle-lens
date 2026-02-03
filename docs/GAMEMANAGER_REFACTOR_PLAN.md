# Plan: Split GameManager.ts into Smaller Modules

## Problem
`GameManager.ts` is 1905 lines - too large. Contains duplicated AI logic and mixed concerns.

## Strategy: MVP-First Extraction

Extract cleanest modules first. Focus on:
1. **Remove AI duplication** (already in AITurnHandler.ts)
2. **Extract Ship Placement** (pure logic, no dependencies)

Expected reduction: **~230 lines** (1905 → ~1675 lines)

---

## Phase 1: Remove AI Duplication (~117 lines)

AITurnHandler.ts already has complete AI logic. GameManager has duplicate methods:

### Methods to DELETE from GameManager.ts:
| Method | Lines | Reason |
|--------|-------|--------|
| `aiTurn()` | 1414-1440 | Use `turnHandler.startOpponentTurn()` |
| `getAIShot()` | 1442-1469 | Already in AITurnHandler.computeShot() |
| `updateAIState()` | 1471-1486 | Already in AITurnHandler.updateAfterShot() |
| `addAdjacentToTargets()` | 1488-1506 | Already in AITurnHandler |
| `determineDirection()` | 1508-1521 | Already in AITurnHandler |

### Methods to KEEP:
- `scheduleAITurn()` - Keep but make it use turnHandler
- `processAIShot()` - Keep as callback entry point from AITurnHandler

### Changes Required:

1. **Remove fallback AI path** in `playerShoot()` (line 1270-1274):
```typescript
// BEFORE:
if (this.turnHandler) {
    this.turnHandler.startOpponentTurn();
} else if (this.state.mode === 'single') {
    this.delayedCall(() => { this.aiTurn(); }, this.delayBeforeAI);
}

// AFTER:
if (this.turnHandler) {
    this.turnHandler.startOpponentTurn();
}
```

2. **Remove `aiState` property** (line 72-77) - handled by AITurnHandler

3. **Remove AI state initialization** from `initializeState()` (lines 320-325)

---

## Phase 2: Extract ShipPlacementService (~112 lines)

Create new file: `ShipPlacementService.ts`

### Methods to MOVE from GameManager.ts:
| Method | Lines |
|--------|-------|
| `generateShipPlacements()` | 695-715 |
| `createEmptyBoolGrid()` | 717-726 |
| `placeRandomShip()` | 728-757 |
| `canPlaceShipAt()` | 759-773 |
| `markOccupiedWithBuffer()` | 775-785 |
| `markShipsOnGrid()` | 787-795 |

### New File Structure:
```typescript
// ShipPlacementService.ts
import { ShipInfo, CellState } from './types/GameTypes';

export class ShipPlacementService {
    private gridSize: number;

    constructor(gridSize: number = 10) {
        this.gridSize = gridSize;
    }

    generateShipPlacements(): ShipInfo[] { ... }
    createEmptyBoolGrid(): boolean[][] { ... }
    placeRandomShip(...): ShipInfo | null { ... }
    canPlaceShipAt(...): boolean { ... }
    markOccupiedWithBuffer(...): void { ... }
    markShipsOnGrid(...): void { ... }
}
```

### GameManager Changes:
```typescript
// Add import
import { ShipPlacementService } from './ShipPlacementService';

// Add property
private shipPlacement: ShipPlacementService;

// In onAwake():
this.shipPlacement = new ShipPlacementService(this.gridSize);

// Update generatePlacements() to use service:
generatePlacements() {
    this.state.playerShips = this.shipPlacement.generateShipPlacements();
    this.shipPlacement.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);

    if (this.state.mode === 'single') {
        this.state.opponentShips = this.shipPlacement.generateShipPlacements();
    }
}

// Update onReshuffleTap() similarly
```

---

## What Stays in GameManager (keeps focus)

- State management (`GameState`, phase transitions)
- Screen/UI management
- Button handlers
- Grid visual coordination
- Multiplayer flow orchestration
- Turn handler initialization
- Shot processing callbacks

---

## Files to Modify

| File | Action |
|------|--------|
| `GameManager.ts` | Remove ~230 lines (AI + ship placement) |
| `ShipPlacementService.ts` | **CREATE** - ~130 lines with ship logic |

---

## Verification

1. Open project in Lens Studio
2. Test single-player:
   - Start game, verify AI opponent works
   - Verify ship placement randomizes on reshuffle
3. Test multiplayer:
   - Verify ship placement works
   - Verify game flow unchanged

---

## Future Phases (Not This PR)

**Phase 3 options if needed:**
- Extract `MultiplayerCoordinator` (~340 lines) - Complex, tightly coupled
- Extract `UIController` (~100 lines) - Low value
- Extract `GridInteractionHelper` - Thin wrappers, adds indirection

Keep these in GameManager until pain point emerges.
