# Meme Fleet Battle - Epics and Stories

**Project:** Meme Fleet Battle v0.4 (Multiplayer)
**Generated:** 2026-01-13
**Source:** GDD Development Epics + Architecture

---

## Epic 1: Turn-Based Integration

**Goal:** Establish core multiplayer foundation by integrating Snap's Turn-Based component.

**Components Affected:** TurnBasedManager (new), GameManager
**Key Pattern:** ITurnHandler interface

### Story 1.1: Create TurnBasedManager Component

**As a** developer
**I want** a TurnBasedManager component that wraps the Turn-Based SceneObject
**So that** multiplayer turn handling is encapsulated and testable

**Acceptance Criteria:**
- [ ] TurnBasedManager.ts created in Assets/Scripts/
- [ ] Component has @input for Turn-Based SceneObject reference
- [ ] Implements ITurnHandler interface
- [ ] Has methods: isMyTurn(), submitTurn(), onTurnReceived()
- [ ] Includes debug logging with [TurnBasedManager] prefix

**Technical Notes:**
- Reference docs/TECH_REFERENCE.md for API details
- Use DelayedCallbackEvent for any async operations

### Story 1.2: Implement Turn Submission

**As a** player
**I want** my shot to be submitted to my opponent via Snap
**So that** they can see my move and respond

**Acceptance Criteria:**
- [ ] submitTurn(turnData) serializes game state to JSON
- [ ] Turn data includes: shotX, shotY, result, isGameOver
- [ ] Turn-Based component's submitTurn API called correctly
- [ ] Success/failure logged appropriately
- [ ] Handles Turn-Based component not ready state

**Technical Notes:**
- TurnData interface defined per architecture spec
- JSON.stringify for serialization

### Story 1.3: Implement Turn Receiving

**As a** player
**I want** to receive my opponent's shot when I open the Snap
**So that** I can see what they did and take my turn

**Acceptance Criteria:**
- [ ] onTurnReceived callback registered with Turn-Based component
- [ ] Turn data deserialized from JSON
- [ ] Invalid/corrupted data handled gracefully
- [ ] Opponent's shot result displayed before player's turn
- [ ] Game state updated based on received data

**Technical Notes:**
- JSON.parse with try/catch for deserialization
- Validate all required fields present

### Story 1.4: Connect TurnBasedManager to GameManager

**As a** developer
**I want** GameManager to use TurnBasedManager via ITurnHandler interface
**So that** multiplayer and single-player share the same turn flow

**Acceptance Criteria:**
- [ ] GameManager has turnHandler: ITurnHandler property
- [ ] Single-player mode uses existing AI logic (AITurnHandler or inline)
- [ ] Multiplayer mode uses TurnBasedManager
- [ ] Turn flow works identically for both modes
- [ ] Mode switching tested and working

**Technical Notes:**
- ITurnHandler interface defined in architecture
- Dependency injection via @input or initialization

---

## Epic 2: Multiplayer Game Flow

**Goal:** Implement the complete multiplayer game flow from mode selection to game over.

**Components Affected:** GameManager, IntroScreen, GameOverScreen
**Key Pattern:** State machine extension

### Story 2.1: Add Multiplayer Mode Selection

**As a** player
**I want** to choose between Single Player and Multiplayer from the intro screen
**So that** I can play against AI or a friend

**Acceptance Criteria:**
- [ ] IntroScreen has working "Play with Friend" button
- [ ] Tapping multiplayer sets state.mode = 'multiplayer'
- [ ] Multiplayer triggers Turn-Based matchmaking flow
- [ ] Single Player continues to work as before
- [ ] Visual feedback for mode selection

**Technical Notes:**
- IntroScreen.ts may need updates
- Reference 1_USER_FLOW.md

### Story 2.2: Initial Ship Position Exchange

**As a** player starting a multiplayer game
**I want** my ship positions exchanged with my opponent securely
**So that** we both have hidden fleets to attack

**Acceptance Criteria:**
- [ ] First turn includes shipPositions in TurnData
- [ ] Ship positions only sent once (game start)
- [ ] Opponent's ship positions stored locally
- [ ] Positions not visible to opponent until hit
- [ ] Both players' grids generated before exchange

**Technical Notes:**
- shipPositions array in TurnData (first turn only)
- Store opponent positions for hit detection

### Story 2.3: Multiplayer Turn State Management

**As a** player
**I want** to know whose turn it is and when I can act
**So that** the game flows correctly between players

**Acceptance Criteria:**
- [ ] Turn state tracks: 'player' | 'opponent' | 'waiting'
- [ ] Player can only tap when it's their turn
- [ ] "Waiting for opponent" state shown appropriately
- [ ] Turn switches correctly after each shot
- [ ] State persists across Snap open/close

**Technical Notes:**
- Extend existing TurnState type
- Turn-Based handles turn order

### Story 2.4: Multiplayer Win/Lose Detection

**As a** player
**I want** the game to end when all ships are destroyed
**So that** there's a clear winner

**Acceptance Criteria:**
- [ ] Win detection works for multiplayer (same as single player)
- [ ] Winner determined by who reaches 20 hits first
- [ ] Game over state transmitted in final turn
- [ ] Both players see correct win/lose screen
- [ ] isGameOver and winner fields in TurnData

**Technical Notes:**
- Reuse existing checkWin() logic
- Sync game over state via turn data

---

## Epic 3: State Synchronization

**Goal:** Ensure game state is correctly serialized, transmitted, and restored between sessions.

**Components Affected:** TurnBasedManager, TurnData schema
**Key Pattern:** JSON serialization

### Story 3.1: Define Turn Data Schema

**As a** developer
**I want** a well-defined schema for turn data
**So that** state is consistently structured and validated

**Acceptance Criteria:**
- [ ] TurnData interface defined in types/GameTypes.ts
- [ ] Required fields: shotX, shotY, result, hitsCount, isGameOver
- [ ] Optional fields: destroyedShipLength, shipPositions, winner
- [ ] Type guards for runtime validation
- [ ] Schema documented in architecture

**Technical Notes:**
- TypeScript interface with strict types
- Use architecture spec as reference

### Story 3.2: Implement State Serialization

**As a** developer
**I want** game state to serialize to JSON correctly
**So that** it can be transmitted via Turn-Based

**Acceptance Criteria:**
- [ ] serializeTurnData(state) returns valid JSON string
- [ ] All required fields included
- [ ] No circular references or SceneObjects in output
- [ ] Ship positions serialized correctly (first turn)
- [ ] Output size reasonable (<10KB)

**Technical Notes:**
- JSON.stringify with custom replacer if needed
- Test with console.log output

### Story 3.3: Implement State Deserialization

**As a** developer
**I want** to restore game state from received turn data
**So that** the game continues correctly

**Acceptance Criteria:**
- [ ] deserializeTurnData(json) returns TurnData object
- [ ] Invalid JSON handled gracefully (returns null)
- [ ] Missing fields detected and logged
- [ ] Type coercion handled (string numbers to int)
- [ ] Opponent's shot applied to player grid

**Technical Notes:**
- JSON.parse with try/catch
- Validate required fields exist

### Story 3.4: Handle Edge Cases

**As a** player
**I want** the game to handle errors gracefully
**So that** a corrupted state doesn't crash the lens

**Acceptance Criteria:**
- [ ] Corrupted turn data shows error message
- [ ] Timeout/disconnect handled (show retry or exit)
- [ ] Duplicate turn data detected and ignored
- [ ] Version mismatch handled (if schema changes)
- [ ] Graceful degradation to intro screen on fatal error

**Technical Notes:**
- Defensive coding throughout
- Log errors with [ERROR] prefix

---

## Epic 4: UI/UX for Multiplayer

**Goal:** Create clear, intuitive UI for multiplayer-specific states and feedback.

**Components Affected:** All screen components
**Key Pattern:** Screen state pattern

### Story 4.1: Implement Waiting States

**As a** player waiting for my opponent
**I want** clear feedback that it's their turn
**So that** I know the game is working and what to expect

**Acceptance Criteria:**
- [ ] "Waiting for [friend]..." message displayed
- [ ] Visual indicator (spinner or animation) optional but nice
- [ ] Message updates when opponent's turn received
- [ ] Player cannot tap grid while waiting
- [ ] Waiting state persists if lens closed/reopened

**Technical Notes:**
- Use existing StatusText for messages
- Turn-Based provides player info

### Story 4.2: Show Opponent's Last Move

**As a** player receiving my opponent's turn
**I want** to see what cell they shot
**So that** I understand the game state before my turn

**Acceptance Criteria:**
- [ ] Opponent's shot highlighted on player grid
- [ ] "Opponent shot (X,Y) - Hit!/Miss" message
- [ ] Brief pause before enabling player turn
- [ ] Visual marker added to player grid
- [ ] Animation/feedback for dramatic effect (optional)

**Technical Notes:**
- Use existing setCellState() for markers
- DelayedCallbackEvent for pause

### Story 4.3: Add Turn Indicators

**As a** player
**I want** to always know whose turn it is
**So that** I don't get confused during gameplay

**Acceptance Criteria:**
- [ ] Persistent "Your Turn" / "Opponent's Turn" indicator
- [ ] Visual distinction (color, position) clear
- [ ] Updates immediately on turn change
- [ ] Works on both game screen and waiting screen
- [ ] Accessible (readable, high contrast)

**Technical Notes:**
- Add to GameScreen UI
- Use existing text components

### Story 4.4: Multiplayer Game Over Screen

**As a** player who won or lost
**I want** a game over screen appropriate for multiplayer
**So that** I can celebrate or rematch

**Acceptance Criteria:**
- [ ] "You Won!" / "You Lost!" message
- [ ] "Play Again" returns to intro (not immediate rematch)
- [ ] Option to send celebratory Snap (future enhancement)
- [ ] Clear path to exit or play again
- [ ] Works correctly for both winner and loser

**Technical Notes:**
- Reuse existing GameOverScreen
- May need minor modifications

---

## Epic 5: Testing & Polish

**Goal:** Validate multiplayer functionality and polish the experience.

**Components Affected:** All components
**Key Pattern:** Debug logging pattern

### Story 5.1: Enable Turn-Based Debug Mode

**As a** developer
**I want** to test multiplayer without two devices
**So that** I can iterate quickly during development

**Acceptance Criteria:**
- [ ] Turn-Based debug mode enabled in scene
- [ ] Can simulate both players on one device
- [ ] Debug key triggers turn swap
- [ ] All turn flows testable in preview
- [ ] Debug mode clearly documented

**Technical Notes:**
- docs/TECH_REFERENCE.md has debug settings
- Use debugMode, swapPlayersAfterSimulatedTurn

### Story 5.2: Two-Device Testing

**As a** developer
**I want** to test with two actual devices
**So that** I can validate real-world behavior

**Acceptance Criteria:**
- [ ] Full game playable between two phones
- [ ] No crashes or sync issues
- [ ] Turn transitions feel smooth
- [ ] Both win and lose scenarios tested
- [ ] Various network conditions tested

**Technical Notes:**
- Deploy to Snapchat for testing
- Document test results

### Story 5.3: Add Comprehensive Logging

**As a** developer
**I want** detailed logs throughout multiplayer flow
**So that** I can debug issues effectively

**Acceptance Criteria:**
- [ ] All multiplayer events logged with [TURN] prefix
- [ ] State changes logged with full context
- [ ] Errors logged with [ERROR] prefix
- [ ] Log output readable in Lens Studio console
- [ ] Can be disabled for production

**Technical Notes:**
- Follow logging strategy in architecture
- Use print() for Lens Studio

### Story 5.4: Performance Optimization

**As a** player
**I want** the game to run smoothly
**So that** I have a good experience

**Acceptance Criteria:**
- [ ] Maintains 30fps during gameplay
- [ ] No hitches during turn transitions
- [ ] Memory usage stable over multiple games
- [ ] Load time under 3 seconds
- [ ] No visual glitches

**Technical Notes:**
- Profile in Lens Studio
- Optimize serialization if needed

### Story 5.5: Final Polish Pass

**As a** player
**I want** a polished multiplayer experience
**So that** it feels complete and fun

**Acceptance Criteria:**
- [ ] All UI text is clear and consistent
- [ ] No placeholder text remaining
- [ ] Error messages are user-friendly
- [ ] Transitions feel smooth
- [ ] Game is fun to play with friends

**Technical Notes:**
- Playtest with real users
- Gather feedback and iterate

---

## Summary

| Epic | Stories | Focus |
|------|---------|-------|
| Epic 1: Turn-Based Integration | 4 | Core multiplayer foundation |
| Epic 2: Multiplayer Game Flow | 4 | Game modes and flow |
| Epic 3: State Synchronization | 4 | Data handling |
| Epic 4: UI/UX for Multiplayer | 4 | User interface |
| Epic 5: Testing & Polish | 5 | Quality assurance |
| **Total** | **21 stories** | |

---

*Generated from GDD Development Epics and Architecture Document*
