# Meme Fleet Battle - Development Plan

## Game Overview

**Game Title:** Meme Fleet Battle  
**Genre:** Turn-based Strategy / Battleship with Meme Twist  
**Platform:** Snap Lens Studio (AR Lens)  
**Target Audience:** Gen Z, meme lovers, casual gamers (13+)

### Concept
A viral, meme-filled twist on the classic Battleship game. Instead of ships, players hide and hunt for wacky 3D objects (cows, toilets, sneakers, flying eyes, etc.) on a grid. The game uses X-ray scanning mechanics (UFO saucer) to reveal hidden objects, creating a fun, shareable AR experience.

---

## Development Phases

### Phase 1: Core Systems & Random Placement ✅ (COMPLETED)
- [x] Grid generation system
- [x] Ship/object placement system
- [x] Basic collision detection
- [ ] **Random object placement algorithm** (CURRENT TASK)

### Phase 2: Intro Screen & Menu System
- [ ] Welcome screen with game preview
- [ ] Game title display
- [ ] Single Player button
- [ ] Play with Friend button (Turn-Based integration)
- [ ] Background design
- [ ] Screen transitions

### Phase 3: Game Setup & Placement
- [ ] Random object placement algorithm
- [ ] Player field display
- [ ] "Your objects are placed" message
- [ ] Start button
- [ ] Field animation (slide to side)
- [ ] Opponent field generation (empty, hidden objects)

### Phase 4: Turn-Based Gameplay
- [ ] Turn-Based component integration
- [ ] Turn state management
- [ ] Player/opponent turn switching
- [ ] Turn history display
- [ ] Game state persistence

### Phase 5: Interaction & Combat
- [ ] Cell tap detection
- [ ] Cell highlighting on selection
- [ ] UFO saucer 3D object activation
- [ ] X-ray scanning animation
- [ ] Hit/miss detection
- [ ] Visual feedback system

### Phase 6: Visual Effects & Animations
- [ ] X-ray reveal effect (partial object visibility)
- [ ] Single-cell object: reveal → fly up → dissolve
- [ ] Multi-cell object: reveal parts → full reveal → dissolve
- [ ] Empty cell: visual change (mark as shot)
- [ ] Particle effects for hits/misses
- [ ] Object icon display when fully guessed

### Phase 7: Multiplayer Flow
- [ ] Turn start: show opponent's last move
- [ ] Hit/miss indicators for opponent's moves
- [ ] Player's turn interface
- [ ] Opponent's field display
- [ ] Turn completion logic
- [ ] Turn submission to Turn-Based system

### Phase 8: Win Condition & Victory
- [ ] All objects guessed detection
- [ ] Victory screen
- [ ] Congratulations message
- [ ] Game over state
- [ ] Restart/new game options

---

## Detailed Task List

### 1. Random Placement System
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Create `RandomPlacement.ts` script
- [ ] Implement random position generation
- [ ] Implement random orientation (horizontal/vertical)
- [ ] Add collision detection (no touching, no overlapping)
- [ ] Add minimum distance between objects
- [ ] Validate placement rules (classic Battleship rules)
- [ ] Test with all object sizes (1x1, 2x1, 3x1, 4x1)
- [ ] Ensure proper distribution across grid

**Required Objects:**
- 1x 4-cell object
- 2x 3-cell objects
- 3x 2-cell objects
- 4x 1-cell objects

**Rules:**
- Objects cannot touch (even diagonally)
- Objects cannot overlap
- Objects must fit within grid bounds
- Random but valid placement

---

### 2. Intro Screen (Welcome Screen)
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Create `IntroScreen.ts` script
- [ ] Design welcome background
- [ ] Add game title text/logo
- [ ] Create game preview (animated grid with objects)
- [ ] Add "Single Player" button
- [ ] Add "Play with Friend" button
- [ ] Implement button tap handlers
- [ ] Add screen transition animations
- [ ] Add background music/sound effects

**UI Elements:**
- Background image/texture
- Game title (text or 3D logo)
- Preview area (mini grid demo)
- Single Player button (UI component)
- Play with Friend button (UI component)
- Transition effects

---

### 3. Game Setup Screen
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Create `GameSetup.ts` script
- [ ] Generate random object placement
- [ ] Display player's field with objects visible
- [ ] Show "Your objects are placed" message
- [ ] Add "Start" button
- [ ] Implement field slide animation (move to side)
- [ ] Generate opponent field (empty, objects hidden)
- [ ] Position both fields side by side
- [ ] Initialize Turn-Based component

**UI Elements:**
- Player field container
- Opponent field container
- Status message text
- Start button
- Animation controllers

---

### 4. Turn-Based Integration
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Research Turn-Based component API
- [ ] Create `TurnBasedManager.ts` script
- [ ] Integrate with Turn-Based component
- [ ] Set up turn variables
- [ ] Implement turn start callbacks
- [ ] Implement turn end callbacks
- [ ] Implement game over callbacks
- [ ] Handle turn submission
- [ ] Store game state in turn data
- [ ] Restore game state from turn data
- [ ] Handle player switching

**Documentation Needed:**
- Turn-Based component API reference
- Turn data storage format
- Turn history management
- Player flow objects

---

### 5. Cell Interaction System
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create `CellInteraction.ts` script
- [ ] Add InteractionComponent to cells
- [ ] Implement tap detection
- [ ] Add cell highlighting on tap
- [ ] Prevent tapping already-shot cells
- [ ] Visual feedback for tappable cells
- [ ] Cell state management (empty, hit, miss, hidden)

**Components:**
- InteractionComponent per cell
- Highlight material/shader
- Cell state enum

---

### 6. UFO Scanning System
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create UFO saucer 3D model/prefab
- [ ] Create `UFOScanner.ts` script
- [ ] Implement UFO spawn animation
- [ ] Implement UFO movement to cell
- [ ] Implement X-ray scanning animation
- [ ] Implement scanning beam effect
- [ ] Coordinate with cell reveal
- [ ] UFO return/departure animation

**Assets:**
- UFO saucer 3D model
- UFO materials/textures
- Scanning beam effect
- Particle effects
- Animation sequences

---

### 7. X-Ray Reveal System
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create `XRayReveal.ts` script
- [ ] Implement partial object reveal (for multi-cell objects)
- [ ] Implement full object reveal (when all cells hit)
- [ ] Create X-ray shader/material
- [ ] Implement reveal animation
- [ ] Add glow/outline effect
- [ ] Coordinate with object destruction

**Shaders/Materials:**
- X-ray shader (transparent, glowing)
- Outline shader
- Reveal animation controller

---

### 8. Object Destruction Animations
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create `ObjectDestroyer.ts` script
- [ ] Single-cell: reveal → fly up → dissolve
- [ ] Multi-cell: reveal all parts → dissolve together
- [ ] Implement fly-up animation
- [ ] Implement dissolve shader/effect
- [ ] Add particle effects
- [ ] Add sound effects
- [ ] Remove object from grid

**Animations:**
- Fly-up animation (translate Y + fade)
- Dissolve animation (alpha fade + scale)
- Particle burst effect

---

### 9. Hit/Miss Visual Feedback
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create hit indicator (visual change to cell)
- [ ] Create miss indicator (different visual change)
- [ ] Mark cells as "shot" (prevent re-tapping)
- [ ] Add hit/miss particle effects
- [ ] Add hit/miss sound effects
- [ ] Update cell materials

**Visual States:**
- Empty cell (water) - default
- Hit cell (with object) - glowing/colored
- Miss cell (empty) - marked/crossed
- Shot cell - disabled interaction

---

### 10. Object Icon Display
**Priority:** LOW  
**Status:** TODO

**Tasks:**
- [ ] Create icon system for each object type
- [ ] Display icon when object fully guessed
- [ ] Position icons above/below field
- [ ] Add icon animation (pop-in)
- [ ] Update icon collection display

**UI Elements:**
- Icon container
- Icon prefabs for each object
- Icon animation controller

---

### 11. Turn Flow Management
**Priority:** HIGH  
**Status:** TODO

**Tasks:**
- [ ] Create `TurnFlowManager.ts` script
- [ ] Show opponent's last move on turn start
- [ ] Display hit/miss indicators for opponent
- [ ] Show player's field with opponent's shots
- [ ] Switch to opponent's field for player's turn
- [ ] Handle turn completion
- [ ] Submit turn data to Turn-Based
- [ ] Wait for opponent's turn
- [ ] Restore opponent's move on next turn

**Flow States:**
- Turn Start: Show opponent's move
- Player Turn: Show opponent's field
- Turn End: Submit move
- Waiting: Wait for opponent
- Turn Received: Process opponent's move

---

### 12. Victory System
**Priority:** MEDIUM  
**Status:** TODO

**Tasks:**
- [ ] Create `VictoryManager.ts` script
- [ ] Detect all objects guessed condition
- [ ] Trigger victory screen
- [ ] Display congratulations message
- [ ] Add victory animations
- [ ] Add confetti/celebration effects
- [ ] Show final score/stats
- [ ] Add "Play Again" button
- [ ] Add "Exit" button

**UI Elements:**
- Victory screen overlay
- Congratulations text
- Celebration effects
- Action buttons

---

## Asset List

### 3D Models & Prefabs

#### Grid Elements
- [ ] **Water Cell Prefab** (Box) - ✅ EXISTS
  - Material: Water/blue material
  - Size: Matches cellSize parameter
  - Interaction component ready

#### Object Prefabs (Meme Objects)
- [ ] **1x1 Objects (4 types needed):**
  - [ ] Cow (single cell)
  - [ ] Toilet (single cell)
  - [ ] Sneaker (single cell)
  - [ ] Flying Eye (single cell)
  - Alternative: Abstract geometric shapes

- [ ] **2x1 Objects (3 types needed):**
  - [ ] Long Cow (2 cells horizontal)
  - [ ] Double Toilet (2 cells)
  - [ ] Long Sneaker (2 cells)
  - Alternative: Stretched versions of 1x1

- [ ] **3x1 Objects (2 types needed):**
  - [ ] Triple Cow (3 cells)
  - [ ] Triple Toilet (3 cells)
  - Alternative: Extended versions

- [ ] **4x1 Objects (1 type needed):**
  - [ ] Quadruple Cow (4 cells)
  - Alternative: Longest version

**Object Requirements:**
- Low poly count (performance)
- Distinctive shapes (easy to recognize)
- Meme-worthy appearance
- Proper scaling to fit grid cells
- Materials with distinct colors
- Visibility enabled in prefabs ✅ (learned from previous issue)

#### Special Objects
- [ ] **UFO Saucer Prefab**
  - 3D model of flying saucer
  - Animated rotation (optional)
  - Materials: Metallic, glowing
  - Size: Appropriate for scanning animation
  - Animation: Spawn, move, scan, depart

---

### Materials & Shaders

#### Base Materials
- [ ] **Water Material**
  - Color: Blue/cyan
  - Texture: Optional water texture
  - Shader: Standard or custom

- [ ] **Object Materials (per object type)**
  - [ ] Cow material (brown/white)
  - [ ] Toilet material (white/porcelain)
  - [ ] Sneaker material (colorful)
  - [ ] Eye material (glowing, animated)

#### Effect Materials
- [ ] **X-Ray Shader**
  - Transparent with glow
  - Outline effect
  - Animated reveal
  - Custom shader or material setup

- [ ] **Dissolve Shader**
  - Alpha fade
  - Optional: Edge glow
  - Animated dissolve effect

- [ ] **Highlight Material**
  - For cell selection
  - Glowing outline
  - Pulsing effect (optional)

- [ ] **Hit Material**
  - For hit cells
  - Glowing/colored
  - Distinct from default

- [ ] **Miss Material**
  - For missed cells
  - Marked/crossed appearance
  - Different color/texture

---

### Textures

- [ ] **Background Texture** (for intro screen)
  - Welcome screen background
  - Game preview area texture
  - Optional: Animated texture

- [ ] **UI Textures**
  - Button textures
  - Icon textures
  - Frame/border textures

- [ ] **Effect Textures**
  - Particle textures
  - Glow textures
  - Scan beam texture

---

### Animations

#### Object Animations
- [ ] **Object Reveal Animation**
  - Fade in
  - Scale up
  - Optional: Rotation

- [ ] **Object Fly-Up Animation**
  - Translate Y upward
  - Fade out
  - Scale down (optional)

- [ ] **Object Dissolve Animation**
  - Alpha fade
  - Scale down
  - Particle burst

#### UFO Animations
- [ ] **UFO Spawn Animation**
  - Fade in from above
  - Scale up
  - Rotation start

- [ ] **UFO Move Animation**
  - Smooth translation to cell
  - Optional: Rotation during movement

- [ ] **UFO Scan Animation**
  - Scanning beam activation
  - Beam sweep
  - Glow effect

- [ ] **UFO Depart Animation**
  - Move upward
  - Fade out
  - Scale down

#### Field Animations
- [ ] **Field Slide Animation**
  - Translate X to side
  - Smooth easing
  - Optional: Scale adjustment

- [ ] **Cell Highlight Animation**
  - Pulsing glow
  - Scale pulse
  - Color transition

---

### Particle Effects

- [ ] **Hit Particle Effect**
  - Burst on hit
  - Sparks/glow
  - Color: Match object color

- [ ] **Miss Particle Effect**
  - Splash effect
  - Water ripple (optional)
  - Color: Blue/water

- [ ] **Object Destroy Particle Effect**
  - Explosion/burst
  - Debris particles
  - Color: Match object

- [ ] **Scan Beam Particle Effect**
  - Beam particles
  - Glow trail
  - Color: X-ray/glowing

- [ ] **Victory Confetti Effect**
  - Confetti burst
  - Multiple colors
  - Falling particles

---

### UI Elements

#### Buttons
- [ ] **Single Player Button**
  - Text: "Single Player"
  - Style: Meme/viral aesthetic
  - Tap interaction
  - Hover/press states

- [ ] **Play with Friend Button**
  - Text: "Play with Friend"
  - Style: Meme/viral aesthetic
  - Tap interaction
  - Hover/press states

- [ ] **Start Button**
  - Text: "Start"
  - Style: Prominent, eye-catching
  - Tap interaction

- [ ] **Play Again Button**
  - Text: "Play Again"
  - Victory screen
  - Tap interaction

- [ ] **Exit Button**
  - Text: "Exit" or "Back"
  - Various screens
  - Tap interaction

#### Text Elements
- [ ] **Game Title Text**
  - Font: Meme/viral style
  - Size: Large, prominent
  - Color: Eye-catching
  - Optional: 3D text

- [ ] **Status Messages**
  - "Your objects are placed"
  - "Your turn"
  - "Opponent's turn"
  - "You won!"
  - "You lost!"
  - Font: Readable, styled
  - Size: Medium

- [ ] **Hint Text**
  - "Tap a cell to scan"
  - "Select a cell"
  - Font: Smaller, subtle
  - Color: Muted

#### Icons
- [ ] **Object Icons** (for each object type)
  - Small preview icons
  - Display when object guessed
  - Style: Match 3D objects

- [ ] **Hit/Miss Icons**
  - Hit indicator
  - Miss indicator
  - Small, clear

#### Containers & Frames
- [ ] **Field Container**
  - Frame/border for grid
  - Optional: Background

- [ ] **UI Panel**
  - Background for buttons/text
  - Semi-transparent or styled

- [ ] **Icon Collection Container**
  - Area for guessed object icons
  - Grid or list layout

---

### Audio Assets

#### Sound Effects
- [ ] **Button Tap Sound**
  - UI interaction feedback
  - Short, satisfying

- [ ] **Cell Tap Sound**
  - Cell selection feedback
  - Distinct from button

- [ ] **UFO Spawn Sound**
  - UFO arrival
  - Sci-fi, whoosh

- [ ] **Scan Sound**
  - X-ray scanning
  - Beep/sweep sound

- [ ] **Hit Sound**
  - Object hit
  - Impact sound

- [ ] **Miss Sound**
  - Water splash
  - Miss feedback

- [ ] **Object Destroy Sound**
  - Object elimination
  - Pop/explosion

- [ ] **Victory Sound**
  - Win celebration
  - Fanfare/cheer

#### Music
- [ ] **Intro Screen Music**
  - Welcome screen background
  - Meme/viral style
  - Looping

- [ ] **Gameplay Music**
  - In-game background
  - Subtle, non-intrusive
  - Looping

- [ ] **Victory Music**
  - Victory screen
  - Celebratory
  - Short loop or one-shot

---

### Scripts (TypeScript)

#### Core Systems
- [x] `GridGenerator.ts` - ✅ COMPLETED
- [ ] `RandomPlacement.ts` - Random object placement
- [ ] `GameStateManager.ts` - Overall game state
- [ ] `TurnBasedManager.ts` - Turn-Based integration

#### UI & Screens
- [ ] `IntroScreen.ts` - Welcome screen logic
- [ ] `GameSetup.ts` - Game setup screen
- [ ] `VictoryScreen.ts` - Victory screen

#### Gameplay
- [ ] `CellInteraction.ts` - Cell tap handling
- [ ] `UFOScanner.ts` - UFO scanning system
- [ ] `XRayReveal.ts` - X-ray reveal effects
- [ ] `ObjectDestroyer.ts` - Object destruction
- [ ] `TurnFlowManager.ts` - Turn flow management
- [ ] `HitMissSystem.ts` - Hit/miss detection & feedback

#### Utilities
- [ ] `AnimationController.ts` - Animation management
- [ ] `ParticleManager.ts` - Particle effect management
- [ ] `AudioManager.ts` - Audio playback
- [ ] `UIController.ts` - UI element management

---

### Scene Setup

#### Scene Objects
- [ ] **Intro Screen Container**
  - Background
  - Title
  - Buttons
  - Preview area

- [ ] **Game Screen Container**
  - Player field
  - Opponent field
  - UI elements
  - Status messages

- [ ] **Victory Screen Container**
  - Congratulations message
  - Buttons
  - Effects

#### Components
- [ ] **Turn-Based Component** - ✅ EXISTS in scene
  - Configure inputs
  - Set up callbacks
  - Test integration

- [ ] **Camera Setup**
  - Appropriate angle for grid view
  - Smooth transitions (optional)

- [ ] **Lighting Setup**
  - Ambient light
  - Directional light
  - Optional: Point lights for effects

---

## Technical Specifications

### Snap Lens Studio Requirements
- **Turn-Based Component:** Already present in scene
- **Interaction Components:** For cell tapping
- **Animation System:** For all animations
- **Particle System:** For effects
- **Audio System:** For sounds/music
- **Material System:** For shaders/effects

### Performance Considerations
- Low poly models (optimize for mobile AR)
- Efficient particle effects
- Texture compression
- Animation optimization
- State management efficiency

### Platform Limitations
- Snap Lens Studio API constraints
- AR performance on mobile devices
- Turn-Based system limitations
- File size limits

---

## Documentation Needed

### Snap Lens Studio API
- [ ] **Turn-Based Component API**
  - Component reference
  - Callback system
  - Turn data storage
  - Player flow management
  - Turn history

- [ ] **Interaction Component API**
  - Tap detection
  - Event handling
  - Component setup

- [ ] **Animation System API**
  - Animation creation
  - Animation playback
  - Animation events

- [ ] **Particle System API**
  - Particle creation
  - Particle configuration
  - Performance optimization

- [ ] **Material/Shader API**
  - Custom shader creation
  - Material properties
  - Effect implementation

---

## Next Steps (Immediate)

1. **Research Turn-Based Component**
   - Find official documentation
   - Understand API structure
   - Test basic integration

2. **Implement Random Placement**
   - Create algorithm
   - Test with all object sizes
   - Validate rules

3. **Design Intro Screen**
   - Create UI layout
   - Design buttons
   - Add game title

4. **Create First Meme Object**
   - Choose one object (e.g., cow)
   - Create 1x1, 2x1, 3x1, 4x1 versions
   - Test placement

---

## Notes

- **Visibility Issue Resolved:** ✅ Prefabs must have visibility enabled
- **Grid System:** ✅ Working correctly
- **Ship Placement:** ✅ Working correctly (needs randomization)
- **Turn-Based:** Component exists, needs integration research
- **Naming:** "Meme Fleet Battle" - catchy, viral, understandable

---

## Version History

- **v0.1** - Initial prototype with grid and fixed ship placement
- **v0.2** - (Planned) Random placement + Intro screen
- **v0.3** - (Planned) Turn-Based integration + Gameplay
- **v1.0** - (Planned) Full release with all features
