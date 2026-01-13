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
