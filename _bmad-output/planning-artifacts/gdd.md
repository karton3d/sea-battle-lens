---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/codebase-analysis.md"
  - "_bmad-output/planning-artifacts/test-strategy.md"
  - "PROJECT_PLAN.md"
  - "TURN_BASED_RESEARCH.md"
  - "INTRO_SCREEN_SETUP.md"
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 6
workflowType: 'gdd'
lastStep: 14
project_name: 'sea-battle-lens'
user_name: 'Boss'
date: '2026-01-13'
game_type: 'turn-based-tactics'
game_name: 'Meme Fleet Battle'
---

# Meme Fleet Battle - Game Design Document

**Author:** Boss
**Game Type:** Turn-Based Tactics
**Target Platform(s):** Snapchat Lens (via Lens Studio)

---

## Executive Summary

### Game Name

Meme Fleet Battle

### Core Concept

Meme Fleet Battle is a viral, meme-filled twist on the classic Battleship game, built as an AR experience for Snapchat. Instead of traditional naval ships, players hide and hunt for wacky 3D meme objects on a 10x10 grid, using X-ray scanning mechanics to reveal hidden targets. The game combines nostalgic gameplay with modern meme culture to create a fun, shareable AR experience.

The single-player experience pits players against a smart AI opponent that uses hunt/target tactics - randomly searching until finding an object, then systematically targeting adjacent cells to destroy it. Players take turns tapping cells to fire shots, with satisfying hit/miss feedback and visual markers tracking the battle's progress.

This GDD documents the **multiplayer expansion (v0.4)**, which adds asynchronous two-player battles using Snap's Turn-Based component. Players will take turns by sending Snaps to each other, with game state serialized and transmitted between sessions. The multiplayer mode uses identical mechanics to single-player, ensuring a consistent experience whether playing against AI or friends.

### Game Type

**Type:** Turn-Based Tactics
**Framework:** This GDD uses the turn-based-tactics template with type-specific sections for grid systems, action economy, and positioning tactics - adapted for the Battleship-style hidden information gameplay.

### Target Audience

- **Age Range:** 13+ (Snapchat minimum age)
- **Primary:** Gen Z (13-25), meme lovers, casual gamers
- **Session Length:** Ultra-short (1-5 minutes)

### Unique Selling Points (USPs)

1. **Meme Culture Meets Classic Gameplay** - Not just Battleship with a skin. The meme objects, visual style, and AR presentation create shareable moments.
2. **Snap-Native Social** - Multiplayer through Snaps, not friend codes or lobbies. The game IS the social interaction.
3. **Async That Fits Real Life** - No schedule coordination needed. Take your turn when you want.
4. **AR Novelty** - Grid battles in your physical space create "I need to try this" moments.

---

## Target Platform(s)

### Primary Platform

**Snapchat Lens** (via Lens Studio)
- AR camera experience native to Snapchat
- iOS and Android via Snapchat app
- No separate app installation required

### Platform Considerations

| Aspect | Details |
|--------|---------|
| **Distribution** | Snapchat Lens ecosystem, discoverable via Lens Explorer |
| **Performance** | Mobile AR constraints, target 30fps minimum |
| **Multiplayer** | Turn-Based component (async via Snaps) |
| **Session Context** | Camera-first, short attention span environment |
| **Monetization** | N/A (Lens format, no direct monetization) |

### Control Scheme

- **Primary Input:** Touch (tap cells to fire shots)
- **Navigation:** Tap buttons for menu navigation
- **AR Interaction:** Device movement for AR positioning
- **No gestures required:** Simple tap-only interaction for accessibility

---

## Target Audience

### Demographics

- **Age Range:** 13+ (Snapchat minimum age)
- **Primary:** Gen Z (13-25)
- **Gender:** All genders
- **Geography:** Global (English-first)

### Gaming Experience

**Casual** - Players who game occasionally, primarily on mobile. May not identify as "gamers" but enjoy quick, fun experiences.

### Genre Familiarity

**High familiarity with Battleship concept** - Classic game known across generations. No tutorial needed for core mechanics. Meme theme adds novelty without complexity.

### Session Length

**Ultra-short sessions (1-5 minutes)** - Matches Snapchat usage patterns. Single game can be completed in one session. Multiplayer spans multiple sessions via Snap exchanges.

### Player Motivations

- **Social sharing:** Play with friends, send funny Snaps
- **Nostalgia:** Battleship mechanics with modern twist
- **Meme culture:** Humor and viral potential
- **Competition:** Beat friends, prove tactical superiority
- **Quick entertainment:** Kill time with satisfying gameplay

---

## Goals and Context

### Project Goals

1. **Fun Social Play** - Create engaging multiplayer battles that friends genuinely enjoy playing together. The async format should feel like playful banter, not a chore to respond to.

2. **Viral Sharing** - Design moments worth screenshotting and sharing. When someone destroys a friend's last meme object, that moment should be Snap-worthy.

### Background and Rationale

Meme Fleet Battle began as a meme-twist on classic Battleship, proving out the concept with a complete single-player experience (v0.3). The natural evolution is multiplayer - Battleship has always been a two-player game at heart.

Snapchat's Turn-Based component enables async multiplayer that fits how Gen Z actually communicates: through Snaps, not real-time sessions requiring coordination. Players can take their shot, send the Snap, and get notified when their friend fires back. This creates an ongoing game "conversation" that can span hours or days.

The timing is right: single-player mechanics are proven, the Turn-Based API is available, and the architecture is ready for extension.

### Competitive Positioning

Unlike other mobile Battleship games that feel like ports of board games, Meme Fleet Battle is built for Snapchat from the ground up. The async multiplayer, meme aesthetic, and AR integration create a distinctly Gen Z experience that traditional game apps can't replicate.

---

## Core Gameplay

### Game Pillars

1. **Social Fun** - Every feature should enhance playing with friends. If it doesn't make the game more fun to play together, question whether it belongs.

2. **Quick Satisfaction** - Rewarding moments in seconds, not minutes. Each tap should deliver immediate, satisfying feedback (hit explosion, miss splash, destruction celebration).

3. **Shareability** - Create screenshot/video-worthy moments. Destroying a friend's last object should feel like a victory worth sharing.

4. **Accessibility** - No tutorial needed. Everyone knows Battleship. The meme theme adds novelty without adding complexity.

**Pillar Prioritization:** When pillars conflict, prioritize:
1. Social Fun (core goal)
2. Quick Satisfaction (retention)
3. Shareability (viral growth)
4. Accessibility (onboarding)

### Core Gameplay Loop

**Single Player Loop:**
```
Place Objects → Tap Cell → See Hit/Miss → AI Responds → Repeat → Win/Lose
```

**Multiplayer Loop:**
```
Place Objects → Tap Cell → See Result → Send Snap →
→ Wait for Friend → See Their Shot → Take Next Turn → Repeat → Win/Lose
```

**Loop Timing:**
- Single turn: 2-5 seconds (tap → feedback)
- Full game: 3-5 minutes (single player), hours/days (async multiplayer)

**Loop Variation:** Each turn differs by:
- Different cell targeted (strategic choice)
- Hit vs miss outcome (surprise/disappointment)
- Progress toward victory (tension builds)
- In multiplayer: social anticipation of friend's response

### Win/Loss Conditions

#### Victory Conditions

- Destroy all 20 opponent object cells before they destroy yours
- All 10 meme objects (sizes 4,3,3,2,2,2,1,1,1,1) must be hit

#### Failure Conditions

- Opponent destroys all 20 of your object cells first
- No time limit (async-friendly)
- No move limit

#### Failure Recovery

- Game over screen with "Play Again" option
- In multiplayer: option to rematch same friend
- No persistent consequences (casual-friendly)

---

## Game Mechanics

### Primary Mechanics

#### 1. Shoot (Tap to Fire)
- **Action:** Tap a cell on opponent's grid to fire a shot
- **Frequency:** Once per turn (core action)
- **Skill tested:** Strategy, memory, deduction
- **Feel:** Instant response, satisfying feedback
- **Pillar:** Quick Satisfaction

#### 2. Place (Object Positioning)
- **Action:** Objects randomly placed at game start
- **Frequency:** Once per game (automatic)
- **Skill tested:** None (random for fairness)
- **Feel:** Quick setup, no friction
- **Pillar:** Accessibility

#### 3. Observe (Result Feedback)
- **Action:** See hit/miss markers, destruction animations
- **Frequency:** After every shot
- **Skill tested:** Pattern recognition for next shot
- **Feel:** Clear, immediate, rewarding
- **Pillar:** Quick Satisfaction, Shareability

#### 4. Turn (Alternating Play)
- **Action:** Take turn, then wait for opponent
- **Frequency:** Continuous cycle
- **Skill tested:** Patience (async), timing
- **Feel:** Anticipation, social tension
- **Pillar:** Social Fun

#### 5. Send/Receive (Multiplayer Only)
- **Action:** Submit turn via Snap, receive opponent's turn
- **Frequency:** Once per turn
- **Skill tested:** None (system handles)
- **Feel:** Social connection, anticipation
- **Pillar:** Social Fun, Shareability

### Mechanic Interactions

- **Shoot → Observe:** Every shot produces immediate visual feedback
- **Observe → Strategy:** Results inform next shot placement
- **Turn → Send:** Completing a shot triggers Snap submission
- **Receive → Observe:** Opponent's shot shown before your turn

### Mechanic Progression

No mechanic unlocks or upgrades - all mechanics available from start. Complexity comes from strategic depth, not system mastery.

### Controls and Input

#### Control Scheme (Snapchat Lens - Touch)

| Action | Input | Notes |
|--------|-------|-------|
| Fire shot | Tap cell | Primary interaction |
| Navigate menu | Tap button | Standard UI |
| View grids | Automatic | Both grids visible during play |

#### Input Feel

- **Responsiveness:** Instant tap registration (<100ms feedback)
- **Touch targets:** Cells large enough for comfortable tapping
- **Error prevention:** Can't tap already-shot cells
- **Feedback:** Visual + optional haptic on hit/miss

#### Accessibility Controls

- **No gestures required:** Simple tap-only interaction
- **No time pressure:** Async play, no turn timers
- **Clear visual states:** Distinct hit/miss/unknown markers
- **Color-blind friendly:** Markers use shape + color differentiation

---

## Turn-Based Tactics Specific Design

### Grid System

**Grid Specifications:**
- **Size:** 10x10 (100 cells total)
- **Grid Type:** Square grid, orthogonal adjacency
- **Cell States:** Unknown, Hit, Miss, Object (player grid only)
- **Visibility:** Player sees own objects; opponent objects hidden until hit

**Spatial Rules:**
- Objects cannot overlap
- Objects cannot touch (even diagonally) - "no-touch rule"
- Objects placed randomly at game start
- No movement after placement (static positioning)

### Object Types (Ships)

| Object | Size | Count | Total Cells |
|--------|------|-------|-------------|
| Battleship | 4 cells | 1 | 4 |
| Cruiser | 3 cells | 2 | 6 |
| Destroyer | 2 cells | 3 | 6 |
| Submarine | 1 cell | 4 | 4 |
| **Total** | | **10 objects** | **20 cells** |

**Object Placement:**
- Horizontal or vertical orientation (no diagonal)
- Random placement algorithm with validation
- Both players have identical fleet composition

### Action Economy

**Turn Structure:**
- One action per turn: Fire one shot
- No action points or resource management
- Turn ends immediately after shot resolution
- No "undo" - shots are permanent

**Turn Flow:**
```
1. View current state (your grid + opponent's revealed cells)
2. Select target cell on opponent's grid
3. Fire shot
4. See result (hit/miss)
5. If hit: check for object destruction
6. Turn ends, opponent's turn begins
```

### Hidden Information System

**What Each Player Knows:**
- Own object positions (full visibility)
- Own grid damage (opponent's hits on you)
- Opponent's revealed cells (your hits/misses)
- Shot history (all previous moves)

**What's Hidden:**
- Opponent's object positions (until hit)
- Opponent's strategy/next move
- Remaining object health (until destroyed)

### Multiplayer Turn-Based Specifics

**Async Turn Protocol:**
1. Player opens Lens, sees opponent's last shot result
2. Player takes their shot
3. Turn data serialized and attached to Snap
4. Snap sent to opponent
5. Opponent opens Snap, turn state restored
6. Cycle repeats

**Turn Data Payload:**
```typescript
interface TurnData {
  shotX: number;
  shotY: number;
  result: 'hit' | 'miss';
  destroyedShipLength: number | null;
  shipPositions?: ShipPosition[];  // First turn only
  hitsCount: number;
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}
```

**State Synchronization:**
- Each player stores own ship positions locally
- Shot results validated server-side (Turn-Based component)
- Game state reconstructed from turn history on open

---

## Progression and Balance

### Player Progression

**No Persistent Progression** - Each game is self-contained. No unlocks, no leveling, no meta-progression. This matches the casual, pick-up-and-play nature of Snapchat Lenses.

**Why No Progression:**
- Matches platform (Lenses are ephemeral experiences)
- Accessibility pillar (new players equal to veterans)
- Social pillar (friends compete on equal footing)
- Short session focus (no grind required)

**Within-Game Progression:**
- Information gathering (learning opponent's layout)
- Tactical refinement (hunt → target mode decisions)
- Tension building (approaching victory/defeat)

### Difficulty Curve

**Single Player (AI):**
- AI uses smart hunt/target algorithm
- No difficulty settings (one balanced experience)
- AI is challenging but beatable
- Estimated win rate: 40-60% for average player

**Multiplayer:**
- Difficulty = opponent skill
- Matchmaking: Friends only (no ranked/random)
- Skill expression through deduction and memory

### Economy and Resources

**No Economy** - No currency, no resources, no consumables. Pure tactical gameplay.

**Rationale:**
- Lens format doesn't support persistent state well
- Economy adds complexity against Accessibility pillar
- Social games work better with symmetric resources

---

## Level Design Framework

### Level Types

**Single Level Type** - The 10x10 grid is the only "level." Each game generates a unique configuration through random object placement.

**Grid Variations (Future Consideration):**
- Standard 10x10 (current)
- Quick Play 6x6 (faster games)
- Epic Battle 12x12 (longer, more strategic)

*Note: Grid size variations are out of scope for v0.4*

### Level Progression

**No Level Progression** - Each game is independent. No campaign, no stages, no unlockable maps.

**Game Flow Instead:**
```
Intro Screen → Mode Select → Setup (placement) → Battle → Game Over → Rematch/Exit
```

**Multiplayer Game Flow:**
```
Receive Snap → See Opponent's Move → Take Turn → Send Snap → Wait → Repeat
```

---

## Art and Audio Direction

### Art Style

**Meme-Inspired Casual**
- Bright, saturated colors
- Bold, readable shapes
- Playful, non-threatening aesthetic
- Meme-recognizable 3D objects

**Visual Elements:**

| Element | Style | Notes |
|---------|-------|-------|
| Grid cells | Simple cubes | Clear, tappable targets |
| Meme objects | Stylized 3D | Recognizable meme references |
| Hit marker | Red/orange explosion | Celebratory, satisfying |
| Miss marker | Blue splash/X | Clear but not punishing |
| UI | Clean, minimal | Text + simple buttons |

**AR Integration:**
- Grid floats in camera space
- Objects have slight AR presence
- Not full environmental AR (performance/complexity)

**Color Palette:**
- Primary: Vibrant blues, greens
- Hit: Reds, oranges
- Miss: Cool blues, grays
- UI: High contrast for readability

### Audio and Music

**Audio Approach:** Minimal but impactful sound effects. No background music (Lens context often has user audio).

**Sound Effects (Future Polish Phase):**

| Event | Sound | Feel |
|-------|-------|------|
| Tap cell | Click/tap | Responsive |
| Hit | Explosion/impact | Satisfying, celebratory |
| Miss | Splash/whoosh | Clear but soft |
| Object destroyed | Victory fanfare | Big moment |
| Win game | Celebration | Shareable moment |
| Lose game | Sad trombone (gentle) | Humorous, not punishing |

*Note: Audio is Phase 13 (Polish) - not required for v0.4 multiplayer*

---

## Technical Specifications

### Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Frame rate | 30fps minimum | AR performance floor |
| Load time | <3 seconds | Lens attention span |
| Memory | Within Lens limits | ~50MB budget |
| Battery | Minimal drain | Short sessions help |

### Platform-Specific Details

**Lens Studio Requirements:**
- Lens Studio 5.x compatibility
- TypeScript scripting
- Turn-Based component integration
- No external network calls (use Snap infrastructure)

**Turn-Based Component:**
- Async multiplayer via Snap messages
- JSON-serializable turn data
- Built-in debug mode for testing
- Player info component for identity

**Device Support:**
- iOS: iPhone 8+ (Snapchat minimum)
- Android: Mid-range 2020+ devices
- No Spectacles support required

### Asset Requirements

**3D Assets:**

| Asset | Count | Complexity |
|-------|-------|------------|
| Grid cell prefab | 1 | Low poly cube |
| Ship prefabs | 4 | 1x1, 2x1, 3x1, 4x1 |
| Hit marker | 1 | Simple effect |
| Miss marker | 1 | Simple effect |

**UI Assets:**
- Button sprites (4-6)
- Text styles (defined in code)
- Screen backgrounds (optional)

**Total Asset Budget:** <20 unique 3D objects, <10 UI sprites

---

## Development Epics

### Epic Structure

**Epic 1: Turn-Based Integration (Core)**
- Create TurnBasedManager.ts component
- Connect to Turn-Based SceneObject
- Implement turn submission
- Implement turn receiving
- Handle game state serialization
- Test with debug mode

**Epic 2: Multiplayer Game Flow**
- Multiplayer mode selection from intro
- Initial ship position exchange
- Turn state management (whose turn)
- Opponent shot visualization
- Multiplayer win/lose detection

**Epic 3: State Synchronization**
- Define turn data schema
- Serialize game state to JSON
- Deserialize and restore state
- Handle edge cases (invalid state, timeout)
- Validate turn data integrity

**Epic 4: UI/UX for Multiplayer**
- "Waiting for opponent" states
- Show opponent's last move
- Turn indicators
- Multiplayer-specific game over screen
- Rematch flow

**Epic 5: Testing & Polish**
- Two-device testing
- Debug mode validation
- Edge case handling
- Performance optimization
- Final polish pass

### Epic Dependencies

```
Epic 1 (Turn-Based Integration)
    ↓
Epic 2 (Multiplayer Flow) + Epic 3 (State Sync)
    ↓
Epic 4 (UI/UX)
    ↓
Epic 5 (Testing)
```

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Crash rate | <1% | Lens analytics |
| Turn sync success | >99% | No lost turns |
| Load time | <3s | Manual testing |
| Frame rate | 30fps+ | Performance profiler |

### Gameplay Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Game completion rate | >80% | Players finish started games |
| Multiplayer adoption | >30% | Of total plays choose MP |
| Rematch rate | >20% | Players play again with same friend |
| Share rate | Track | Screenshot/video shares |

### Qualitative Success

- Friends report enjoying async battles
- "Snap-worthy" moments occur naturally
- No complaints about turn sync issues
- Positive reception in friend testing

---

## Out of Scope

**Not included in v0.4:**

| Feature | Reason |
|---------|--------|
| Real-time multiplayer | Platform doesn't support well |
| Ranked matchmaking | Friends-only focus |
| Leaderboards | No persistent backend |
| Custom ship placement | Complexity vs accessibility |
| Different grid sizes | Scope control |
| Power-ups/special abilities | Keep it pure Battleship |
| Chat/messaging | Snap itself is the message |
| Spectator mode | Not supported by Turn-Based |
| Tournament mode | Out of scope |
| Monetization | Lens format limitation |

**Deferred to future versions:**
- Visual polish (Phase 9-12)
- Audio/sound effects (Phase 13)
- Additional meme objects
- Seasonal themes

---

## Assumptions and Dependencies

### Assumptions

1. **Turn-Based component works as documented** - API matches Snap's official docs
2. **Async latency is acceptable** - Players OK waiting hours/days between turns
3. **Friends will invite friends** - Social spread through existing connections
4. **Battleship rules are known** - No tutorial needed for core mechanics
5. **Single-player code is stable** - v0.3 foundation is solid

### Dependencies

| Dependency | Type | Risk |
|------------|------|------|
| Lens Studio 5.x | Platform | Low - stable |
| Turn-Based component | Platform | Medium - limited docs |
| Snapchat app | Distribution | Low - required anyway |
| TypeScript support | Technical | Low - well supported |

### Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Turn-Based API issues | High | Early spike testing, debug mode |
| State sync bugs | High | Thorough serialization testing |
| Async UX confusion | Medium | Clear turn indicators, messaging |
| Performance on low-end | Medium | Optimize assets, test widely |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Boss | Initial GDD for v0.4 Multiplayer |

---

*Generated by BMGD GDD Workflow*
