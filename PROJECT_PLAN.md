# Meme Fleet Battle - Development Plan

## Game Overview

**Game Title:** Meme Fleet Battle  
**Genre:** Turn-based Strategy / Battleship with Meme Twist  
**Platform:** Snap Lens Studio (AR Lens)  
**Target Audience:** Gen Z, meme lovers, casual gamers (13+)

### Concept
A viral, meme-filled twist on the classic Battleship game. Instead of ships, players hide and hunt for wacky 3D objects (cows, toilets, sneakers, flying eyes, etc.) on a grid. The game uses X-ray scanning mechanics (UFO saucer) to reveal hidden objects, creating a fun, shareable AR experience.

### Development Strategy
**Prototype First, Polish Later**: Focus on creating a fully functional prototype with basic text-based UI, then add visual polish, animations, textures, and effects in the final phase.

---

## Development Phases

### ✅ Phase 1: Core Systems (COMPLETED)
- [x] Grid generation system
- [x] Ship/object placement system
- [x] Basic collision detection
- [x] Random object placement algorithm

---

## 🎮 PROTOTYPE PHASE (Current Focus)

**Goal:** Create a fully playable prototype with basic text-based UI. All visual polish (animations, textures, effects) will be added later.

### Phase 2: Basic Game Setup (PROTOTYPE)
**Priority:** HIGH  
**Status:** IN PROGRESS

**Tasks:**
- [x] Random object placement ✅
- [ ] **Text-based intro screen** (simple text: "Meme Fleet Battle", "Single Player", "Play with Friend")
- [ ] **Text-based game setup** ("Your objects are placed", "Start" button as text)
- [ ] **Two grid display** (player grid + opponent grid side by side)
- [ ] **Text status messages** ("Your turn", "Opponent's turn", "Select a cell")

**UI Elements (Text Only):**
- Text object for game title
- Text objects for buttons (tappable areas)
- Text objects for status messages
- Text objects for hints/instructions

---

### Phase 3: Cell Interaction (PROTOTYPE)
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Add InteractionComponent to grid cells
- [ ] Implement cell tap detection
- [ ] **Text feedback** ("Hit!", "Miss!", "Already shot")
- [ ] Update cell state (hit/miss/empty)
- [ ] Mark cells as shot (prevent re-tapping)
- [ ] **Text display of shot results** (show hit/miss in text)

**No Visual Effects Yet:**
- No highlighting animations
- No particle effects
- No color changes (use text only)
- Simple state tracking

---

### Phase 4: Game Logic (PROTOTYPE)
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Hit/miss detection logic
- [ ] Track which cells have objects
- [ ] Track which cells have been shot
- [ ] **Text display of object status** ("Object found at (x,y)", "Object destroyed")
- [ ] Check if object is fully revealed (all cells hit)
- [ ] Mark objects as destroyed
- [ ] **Text display of destroyed objects** ("4-cell object destroyed!")

**Game State:**
- Player grid state (objects + shots)
- Opponent grid state (shots only, objects hidden)
- Turn state (whose turn it is)
- Game over state

---

### Phase 5: Turn-Based Integration (PROTOTYPE)
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Research Turn-Based component API ✅ (see TURN_BASED_RESEARCH.md)
- [ ] Create `TurnBasedManager.ts` script
- [ ] Integrate with Turn-Based component
- [ ] Store game state in turn data
- [ ] Restore game state from turn data
- [ ] **Text display of turn info** ("Player 1's turn", "Waiting for opponent...")
- [ ] Handle turn submission
- [ ] Handle turn reception
- [ ] **Text display of opponent's moves** ("Opponent shot (x,y) - Hit!")

**Turn Flow:**
- Turn start: show text message
- Player action: tap cell
- Turn end: submit turn data
- Turn received: process opponent's move
- Display results in text

---

### Phase 6: Win Condition (PROTOTYPE)
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Detect all objects destroyed
- [ ] **Text victory message** ("You won!", "You lost!")
- [ ] Game over state
- [ ] **Text restart option** ("Play Again" as text)
- [ ] Reset game functionality

---

### Phase 7: Single Player Mode (PROTOTYPE)
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] AI opponent (random cell selection)
- [ ] AI turn logic
- [ ] **Text display of AI moves** ("AI shot (x,y) - Miss!")
- [ ] Same game flow as multiplayer but with AI

---

## 🎨 POLISH PHASE (After Prototype Works)

**Goal:** Add visual polish, animations, textures, effects, and audio to the working prototype.

### Phase 8: Visual Polish - UI
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] Replace text buttons with styled UI buttons
- [ ] Add background images/textures
- [ ] Style game title (3D text or logo)
- [ ] Add UI panels/frames
- [ ] Improve text styling and fonts
- [ ] Add icons for objects

---

### Phase 8: Visual Polish - Grid & Cells
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] Add cell highlighting on selection
- [ ] Visual feedback for hit cells (color change, glow)
- [ ] Visual feedback for miss cells (mark, cross)
- [ ] Visual feedback for shot cells (disabled state)
- [ ] Improve grid appearance

---

### Phase 9: Visual Polish - Objects
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] Create meme object 3D models (cow, toilet, sneaker, eye)
- [ ] Create 1x1, 2x1, 3x1, 4x1 versions
- [ ] Add materials and textures
- [ ] X-ray reveal effect (shader)
- [ ] Object destruction animations (fly up, dissolve)
- [ ] Object icons when fully guessed

---

### Phase 10: Visual Polish - Effects
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] UFO saucer 3D model and animation
- [ ] X-ray scanning beam effect
- [ ] Particle effects for hits
- [ ] Particle effects for misses
- [ ] Particle effects for object destruction
- [ ] Victory confetti effect

---

### Phase 11: Visual Polish - Animations
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] Screen transition animations
- [ ] Field slide animation
- [ ] Cell highlight animations
- [ ] Button press animations
- [ ] Smooth camera movements

---

### Phase 12: Audio
**Priority:** LOW (After prototype)  
**Status:** TODO

**Tasks:**
- [ ] Button tap sounds
- [ ] Cell tap sounds
- [ ] Hit sounds
- [ ] Miss sounds
- [ ] Object destroy sounds
- [ ] Victory sounds
- [ ] Background music

---

## Current Prototype Task List

### Immediate Next Steps (In Order)

1. **Text-Based Intro Screen** ⏳ CURRENT
   - [ ] Create simple text objects for title
   - [ ] Create text objects for buttons ("Single Player", "Play with Friend")
   - [ ] Add tap handlers to text buttons
   - [ ] Connect to game start methods

2. **Text-Based Game Setup**
   - [ ] Show text: "Your objects are placed"
   - [ ] Show text button: "Start"
   - [ ] Generate random placement
   - [ ] Display both grids (player + opponent)

3. **Cell Interaction System**
   - [ ] Add InteractionComponent to cells
   - [ ] Implement tap detection
   - [ ] Show text feedback ("Hit!", "Miss!")
   - [ ] Update game state

4. **Game Logic**
   - [ ] Hit/miss detection
   - [ ] Object tracking
   - [ ] Destroyed object detection
   - [ ] Text status updates

5. **Turn-Based Integration**
   - [ ] Create TurnBasedManager
   - [ ] Integrate with Turn-Based component
   - [ ] Store/restore game state
   - [ ] Text turn messages

6. **Win Condition**
   - [ ] Victory detection
   - [ ] Text victory message
   - [ ] Restart functionality

---

## Prototype UI Text Elements Needed

### Intro Screen
- **Title Text**: "Meme Fleet Battle"
- **Button Text 1**: "Single Player"
- **Button Text 2**: "Play with Friend"
- **Hint Text**: "Tap to start"

### Game Setup
- **Status Text**: "Your objects are placed"
- **Button Text**: "Start"
- **Grid Labels**: "Your Grid" / "Opponent Grid"

### Gameplay
- **Turn Text**: "Your turn" / "Opponent's turn" / "Waiting..."
- **Hint Text**: "Tap a cell to shoot"
- **Result Text**: "Hit!" / "Miss!" / "Already shot"
- **Object Text**: "4-cell object destroyed!"
- **Status Text**: "Objects left: 10"

### Game Over
- **Victory Text**: "You won!" / "You lost!"
- **Button Text**: "Play Again"

---

## Technical Implementation Notes

### Text Objects
- Use `Text` or `Text3D` components
- Position in screen space or world space
- Make tappable with InteractionComponent
- Update text content programmatically

### State Management
- Simple game state object
- Track: grids, shots, objects, turn, game over
- Serialize for Turn-Based component

### No Visual Effects Yet
- No animations (except basic show/hide)
- No particle effects
- No shader effects
- No color changes (use text)
- Simple, functional prototype

---

## Asset Requirements (Prototype Phase)

### Minimal Assets Needed:
- [x] Grid cell prefab (Box) ✅
- [x] Object prefabs (1x1, 2x1, 3x1, 4x1) ✅
- [ ] Text components (Text or Text3D)
- [ ] Basic materials (for visibility)

### Assets Deferred to Polish Phase:
- Meme object 3D models
- Textures and materials
- Particle effects
- Audio files
- UI sprites
- Animations

---

## Success Criteria for Prototype

✅ **Prototype is complete when:**
1. Can start single player game
2. Can start multiplayer game (Turn-Based)
3. Can tap cells to shoot
4. Hit/miss detection works
5. Objects can be destroyed
6. Win condition works
7. Game can be restarted
8. All feedback is via text (no visual effects needed)

---

## Version History

- **v0.1** - Initial prototype with grid and fixed ship placement ✅
- **v0.2** - Random placement + Intro screen (in progress)
- **v0.3** - Full prototype with text UI and gameplay (target)
- **v1.0** - Polished version with all visual effects (future)

---

## Notes

- **Prototype First**: Focus on functionality, not visuals
- **Text-Based UI**: All UI feedback via text objects
- **No Animations**: Basic show/hide only
- **No Effects**: Particles, shaders, etc. come later
- **Working Game**: Must be fully playable before polish
- **Turn-Based**: Must work with Snap's Turn-Based system

---

## Next Immediate Task

**Create Text-Based Intro Screen:**
1. Create Text objects for title and buttons
2. Add InteractionComponent to button texts
3. Connect tap handlers
4. Test navigation to game setup
