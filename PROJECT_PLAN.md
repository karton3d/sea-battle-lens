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

### ✅ Phase 1: Core Systems (COMPLETED)
- [x] Grid generation system
- [x] Object placement system
- [x] Collision detection
- [x] Random object placement algorithm

---

## 🎮 PROTOTYPE PHASE

### Phase 2: Game State & Manager
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Create `GameManager.ts` - central game controller
- [ ] Create `GameState.ts` - game state management
- [ ] Define game states: INTRO, SETUP, PLAYING, GAME_OVER
- [ ] Define turn states: PLAYER_TURN, OPPONENT_TURN, WAITING
- [ ] Track player grid (objects + shots received)
- [ ] Track opponent grid (player's shots + hidden objects)
- [ ] Track destroyed objects count
- [ ] Track current turn

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
**Status:** TODO

**Tasks:**
- [ ] Create `UIManager.ts` - handles all UI updates
- [ ] Create Text object for status messages
- [ ] Use UI Button components for buttons (not text)
- [ ] Implement screen management (show/hide)

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
**Status:** TODO

**Tasks:**
- [ ] Add InteractionComponent to opponent grid cells
- [ ] Implement cell tap detection
- [ ] Process shot: check if hit or miss
- [ ] Update cell visual state (can be simple color change)
- [ ] Prevent tapping already-shot cells
- [ ] Check if object is fully destroyed
- [ ] Update UI with result
- [ ] Check win condition after each shot

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
**Status:** TODO

**Rationale:** Implement AI first - easier to test locally without Turn-Based system.

**Tasks:**
- [ ] Create `AIOpponent.ts` - AI logic
- [ ] AI generates random shot (cell not yet shot)
- [ ] AI waits brief delay (simulate thinking)
- [ ] AI shot uses same logic as player shot
- [ ] AI checks win condition
- [ ] Update UI with AI's move result

**AI Logic (Simple Random):**
```typescript
function getAIShot(): {x: number, y: number} {
    // Get all cells not yet shot
    const availableCells = getUnknownCells(playerGrid);
    // Pick random cell
    return randomChoice(availableCells);
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
**Status:** TODO

**Tasks:**
- [ ] Check win after each shot
- [ ] Win when all 20 opponent cells with objects are hit
- [ ] Display winner (text)
- [ ] Show "Play Again" button
- [ ] Reset game on Play Again

**Win Check:**
```typescript
function checkWin(destroyedCells: number): boolean {
    return destroyedCells >= TOTAL_OBJECT_CELLS; // 20 cells
}
```

---

### Phase 7: Multiplayer Mode (Turn-Based)
**Priority:** MEDIUM  
**Status:** TODO

**Rationale:** Add multiplayer after Single Player works perfectly.

**Tasks:**
- [ ] Create `TurnBasedManager.ts` - Turn-Based integration
- [ ] Initialize Turn-Based component
- [ ] Store game state in turn data
- [ ] Restore game state from turn data
- [ ] Submit turn after player's shot
- [ ] Receive and process opponent's turn
- [ ] Handle turn start/end callbacks
- [ ] Handle game over callback

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
**Status:** TODO

**Tasks:**
- [ ] Smooth transitions between screens
- [ ] Proper timing for AI moves
- [ ] Clear feedback for all actions
- [ ] Error handling
- [ ] Edge cases (disconnection, timeout)

---

## 🎨 POLISH PHASE (After Prototype)

### Phase 9: Visual Polish - UI
- [ ] Styled UI buttons
- [ ] Background images
- [ ] Styled title
- [ ] UI panels/frames
- [ ] Icons for objects

### Phase 10: Visual Polish - Grid
- [ ] Cell highlighting on hover/selection
- [ ] Hit cell visual (color, glow)
- [ ] Miss cell visual (cross, mark)
- [ ] Grid appearance improvements

### Phase 11: Visual Polish - Objects
- [ ] Meme 3D models
- [ ] Materials and textures
- [ ] X-ray reveal effect
- [ ] Destruction animations

### Phase 12: Visual Polish - Effects
- [ ] UFO scanning effect
- [ ] Particle effects
- [ ] Screen transitions
- [ ] Victory effects

### Phase 13: Audio
- [ ] UI sounds
- [ ] Hit/miss sounds
- [ ] Victory/defeat sounds
- [ ] Background music

---

## Scripts to Create

### Core Scripts
1. **`GameManager.ts`** - Central game controller
2. **`GameState.ts`** - Game state management
3. **`UIManager.ts`** - UI updates and screen management
4. **`TurnManager.ts`** - Turn logic (abstract)
5. **`AIOpponent.ts`** - AI for single player
6. **`TurnBasedManager.ts`** - Multiplayer integration

### Existing Scripts
- **`GridGenerator.ts`** ✅ - Grid and object placement

---

## Immediate Task List (In Order)

### 1. GameManager & GameState
- [ ] Create `GameManager.ts`
- [ ] Create game state structure
- [ ] Basic state transitions

### 2. UIManager
- [ ] Create `UIManager.ts`
- [ ] Setup Text objects for messages
- [ ] Setup UI Buttons
- [ ] Implement screen show/hide

### 3. Intro Screen
- [ ] Title text
- [ ] Single Player button (UI Button)
- [ ] Play with Friend button (UI Button)
- [ ] Button handlers → start game

### 4. Setup Screen
- [ ] Generate random placement
- [ ] Show "Objects placed" message
- [ ] Start button → begin game

### 5. Game Screen (Cell Interaction)
- [ ] Add InteractionComponent to cells
- [ ] Tap detection
- [ ] Shot processing
- [ ] Result display

### 6. Single Player AI
- [ ] AI opponent logic
- [ ] AI turn execution
- [ ] Turn switching

### 7. Win Condition
- [ ] Win detection
- [ ] Game over screen
- [ ] Restart functionality

### 8. Multiplayer (Turn-Based)
- [ ] Turn-Based integration
- [ ] State serialization
- [ ] Turn submission/reception

---

## Success Criteria

### Prototype Complete When:
1. ✅ Can select Single Player or Multiplayer
2. ✅ Random object placement works
3. ✅ Can tap cells to shoot
4. ✅ Hit/miss detection works
5. ✅ Objects can be destroyed
6. ✅ AI opponent works (Single Player)
7. ✅ Turn-Based works (Multiplayer)
8. ✅ Win condition works
9. ✅ Game can be restarted
10. ✅ All feedback via text + basic UI

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

- **v0.1** - Grid + random placement ✅
- **v0.2** - Game manager + UI system (in progress)
- **v0.3** - Single Player with AI (target)
- **v0.4** - Multiplayer with Turn-Based
- **v1.0** - Polished version

---

## Notes

- **Single Player First**: Easier to test, no network dependency
- **Same Mechanics**: AI = random player, identical rules
- **UI Buttons**: Use proper UI Button components
- **Text for Feedback**: All game feedback via Text objects
- **Prototype Focus**: Functionality over visuals
