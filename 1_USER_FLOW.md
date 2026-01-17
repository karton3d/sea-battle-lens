# User Flow

## AR Space
- Grid floats in AR space, slightly tilted toward user
- Pinch to zoom in/out (limited by alpha mask boundary)
- Decorative elements: clouds, birds, particle effects
- Grid border color: **red** = your grid, **blue** = opponent's grid

## 1. Intro Screen
- **Title**: "Fleet Yeet!"
- **Buttons**: "Single Player" / "Play with Friend"
- **Action**: User selects game mode

## 2. Setup Screen
- **Status**: "Your objects are placed randomly"
- **Hint**: "This is your grid. Your objects are hidden here."
- **Grid**: Player's grid (red border) centered
- **Buttons**: "Reshuffle" | "Start" (horizontal)
- **Actions**:
  - Reshuffle → new random placement
  - Start → game begins

## 3. Transition to Opponent Grid
- **Animation**: Grid slides to opponent's position (centered)
- **Turn Banner**: Arrow + info box (blue color)
- **Text**: "Turn #1 — Scan a cell to find hidden objects"
- Banner fades out, opponent grid ready for tap

## 4. Player Turn
- **Grid**: Opponent's grid (blue border) centered
- **Action**: User taps cell
- **Result**: "Hit!" / "Miss!" / "Object destroyed!"
- **Visual**: Marker appears on cell

## 5. Transition to Player Grid
- **Animation**: Grid slides back to player's position
- **Turn Banner**: Arrow + info box (red color)
- **Text**: "Opponent's turn..."
- Show opponent's shot result on player's grid

## 6. Opponent Turn Result
- **Grid**: Player's grid (red border) centered
- **Result**: "Opponent hit (X,Y)!" / "Opponent missed (X,Y)!"
- **Visual**: Marker appears on player's grid

## 7. Next Turn
- Repeat steps 3-6 until win

## 8. Game Over
- **Banner**: "You Win!" / "You Lost!"
- **Button**: "Play Again"
- **Action**: Returns to Intro

---

# Multiplayer Flow (Turn-Based via Snap)

In multiplayer, players take turns asynchronously via Snapchat. Each player's field is generated locally — the opponent never sees your ship positions directly.

## Key Concept: Deferred Shot Evaluation
- When you shoot, you only send **aim coordinates** (not the result)
- The result (hit/miss) is determined by the **receiving player** when they open the Snap
- This ensures ship positions stay secret until the shot is evaluated locally

---

## Player 1 (Initiator)

### M1. Intro Screen
- **Buttons**: "Single Player" / "Play with Friend"
- **Action**: User selects "Play with Friend"

### M2. Setup Screen
- **Status**: "Place your objects"
- **Grid**: Player's grid (red border) with random ship placement
- **Buttons**: "Reshuffle" | "Ready"
- **Actions**:
  - Reshuffle → new random placement
  - Ready → confirms placement, transitions to aiming

### M3. Aiming Phase (Player 1's First Shot)
- **Animation**: Slides to opponent grid view (blue border)
- **Status**: "Select a target"
- **Hint**: "Tap a cell to aim — your friend will see the result"
- **Grid**: Empty opponent grid (no ships visible — they don't exist yet)
- **Action**: User taps cell to select aim
- **Visual**: Aim marker appears on selected cell

### M4. Confirm & Send
- **Button**: "Send" (appears after aim selected)
- **Action**: Calls `endTurn()` with:
  - `shotX`, `shotY` (aim coordinates)
  - Player 1's ship positions (for later evaluation)
- **Result**: Snap capture triggered, user sends to friend

---

## Player 2 (Receiver — First Turn)

### M5. Open Snap
- Player 2 opens the Snap from Player 1
- **Received data**: Player 1's aim coordinates (pending shot)

### M6. Setup Screen (with Pending Shot)
- **Status**: "Place your objects"
- **Hint**: "Your friend is aiming at a cell — place your objects first!"
- **Grid**: Player's grid (red border) with random ship placement
- **Visual**: Optional indicator showing "incoming shot pending"
- **Buttons**: "Reshuffle" | "Ready"
- **Actions**:
  - Reshuffle → new random placement
  - Ready → confirms placement, **evaluates pending shot**

### M7. Pending Shot Evaluated
- **Animation**: Brief reveal of hit/miss result on Player 2's grid
- **Status**: "Your friend's shot: Hit!" or "Your friend's shot: Miss!"
- **Visual**: Marker appears on Player 2's grid at (shotX, shotY)
- **Delay**: 1-2 seconds to show result

### M8. Player 2's Aiming Phase
- **Animation**: Slides to opponent grid view (blue border)
- **Status**: "Your turn — select a target"
- **Grid**: Opponent grid showing Player 1's previous shots (if any)
- **Action**: User taps cell to select aim

### M9. Confirm & Send
- **Button**: "Send"
- **Action**: Calls `endTurn()` with:
  - `shotX`, `shotY` (aim coordinates)
  - Result of Player 1's shot (hit/miss) — for their records
- **Result**: Snap sent back to Player 1

---

## Player 1 (Subsequent Turns)

### M10. Open Snap
- Player 1 opens the Snap from Player 2
- **Received data**:
  - Player 2's aim coordinates (pending shot)
  - Result of Player 1's previous shot (shown on opponent grid)

### M11. Previous Shot Result
- **Animation**: Shows result of Player 1's previous shot on opponent grid
- **Status**: "Your shot: Hit!" or "Your shot: Miss!"
- **Visual**: Marker appears on opponent grid

### M12. Incoming Shot Evaluated
- **Animation**: Slides to player grid (red border)
- **Status**: "Your friend's shot: Hit!" or "Your friend's shot: Miss!"
- **Visual**: Marker appears on Player 1's grid
- **Delay**: 1-2 seconds to show result

### M13. Player 1's Next Shot
- **Animation**: Slides back to opponent grid
- **Status**: "Your turn"
- **Action**: Tap cell, send turn
- Repeat M10-M13 until game over

---

## Multiplayer Game Over

### M14. Win/Lose Detection
- After evaluating a shot, if all ships destroyed:
  - **Winner**: The player who made the final hit
  - **Loser**: The player whose ships are all destroyed
- `setIsFinalTurn(true)` is called before `endTurn()`

### M15. Game Over Screen
- **Banner**: "You Win!" / "You Lost!"
- **Stats**: Hits, turns taken
- **Button**: "Play Again" (returns to Intro)

---

## Data Sent Each Turn

| Field                | Description                                          |
|----------------------|------------------------------------------------------|
| `shotX`              | Aim X coordinate (0-9)                               |
| `shotY`              | Aim Y coordinate (0-9)                               |
| `shipPositions`      | First turn only — serialized ship placements         |
| `incomingShotResult` | Result of opponent's previous shot evaluated locally |
| `isGameOver`         | True if this shot ends the game                      |
| `winner`             | 'player' or 'opponent' if game over                  |
