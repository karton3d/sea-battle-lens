# User Flow

## 1. Intro Screen
- **Title**: "Fleet Yeet!"
- **Buttons**: "Single Player" / "Play with Friend"
- **Action**: User selects game mode

## 2. Setup Screen
- **Status**: "Your objects are placed randomly"
- **Explanation**: "This is your grid. Your objects are hidden here. Tap Start when ready."
- **Grid**: Player's grid visible with objects
- **Button**: "Start"
- **Action**: User taps Start → game begins

## 3. Player Turn (First Turn)
- **Status**: "Your Turn #1"
- **Hint**: "Tap opponent's grid to scan a cell and find hidden objects"
- **Grids**: Both grids visible (player's with objects, opponent's empty)
- **Action**: User taps opponent's cell

## 4. Shot Result
- **Result**: "Hit!" / "Miss!" / "Object destroyed!"
- **Visual**: Marker appears on cell
- **Status Update**: "Turn #1 complete. Opponent's turn..."

## 5. Opponent Turn (AI/Multiplayer)
- **Status**: "Opponent's turn..."
- **Wait**: Brief delay (AI) or wait for opponent (multiplayer)
- **Result**: "Opponent hit (X,Y)!" / "Opponent missed (X,Y)!"
- **Visual**: Marker appears on player's grid

## 6. Next Player Turn
- **Status**: "Your Turn #2"
- **Hint**: "Tap opponent's grid to scan another cell"
- **Action**: User taps opponent's cell
- **Repeat**: Steps 4-6 until win

## 7. Game Over
- **Status**: "You Win!" / "You Lost!"
- **Explanation**: "All objects destroyed"
- **Button**: "Play Again"
- **Action**: User taps Play Again → returns to Intro
