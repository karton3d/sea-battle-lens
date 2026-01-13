# Turn-Based Component Research & Integration Guide

## Overview

The Turn-Based component in Snap Lens Studio enables asynchronous two-player games where players take turns by sending Snaps to each other. The component automatically handles game state serialization, determines the active player, and manages turn history.

## Official Documentation Links

- **Turn-Based Component**: https://developers.snap.com/lens-studio/features/games/turn-based
- **Turn-Based Player Info**: https://developers.snap.com/lens-studio/features/games/turn-based-player-info
- **Turn-Based Game Example**: https://developers.snap.com/lens-studio/examples/lens-examples/turn-based-game
- **Games Overview**: https://developers.snap.com/lens-studio/features/games/games-overview

## Component Structure

### In Scene
- **Component Name**: "Turn Based"
- **Component Type**: ScriptComponent
- **Script Asset ID**: `2485c892-b1f1-4924-9453-ce440bd2cdfb`
- **Scene Object**: "Turn Based" (SceneObject ID: `9129c439-40f1-4777-884d-a1e0f69039ca`)

### Key Features
1. **Turn Management**: Automatically handles turn switching between two players
2. **State Serialization**: Automatically serializes game state
3. **Turn History**: Tracks and stores turn history
4. **Player Flow Objects**: Different UI objects for each player
5. **Game Over Detection**: Detects when game ends
6. **Turn Submission**: Validates and submits turns

## Component Inputs (From Scene Analysis)

### Core Settings
- `requireTurnSubmission: boolean` - Require explicit turn submission
- `allowChangingTurnVariablesAfterTurnSubmission: boolean` - Allow data changes after submission
- `useTurnLimit: boolean` - Enable turn limit
- `turnLimitInput: number` - Maximum number of turns
- `useTurnHistory: boolean` - Track turn history
- `turnsSavedLimitInput: number` - How many turns to save in history

### Game Objects
- `tappableAreasInput: SceneObject[]` - Areas that can be tapped during turns
- `user1FlowObjectsInputSO: SceneObject[]` - Objects shown to player 1
- `user2FlowObjectsInputSO: SceneObject[]` - Objects shown to player 2
- `gameOverObjectsInputSO: SceneObject[]` - Objects shown on game over

### Turn Data
- `defaultTurnVariables: object` - Default variables stored with each turn

### Callbacks (Response System)
- `_onTurnStartResponses` - Called when a turn starts
- `_onTurnEndResponses` - Called when a turn ends
- `_onGameOverResponses` - Called when game ends

### Debug Options
- `debugMode: boolean` - Enable debug mode
- `swapPlayersAfterSimulatedTurn: boolean` - Swap players after simulated turn
- `debugTappedKeySimulateTurn: string` - Key to simulate turn
- `debugTurnCount: number` - Debug turn count
- `debugTappedKeySingleTurn: string` - Key for single turn
- `testDataType: string` - Test data type
- `debugIsTurnComplete: boolean` - Debug turn completion
- `debugIsTurnRestoredFromCache: boolean` - Debug cache restoration
- `debugAssociatedDataStudioInputs: object` - Debug associated data
- `debugTurnHistoryStudioInputs: object` - Debug turn history
- `debugAssociatedDataString: string` - Debug data string
- `debugTurnHistoryStrings: string` - Debug history strings
- `printLogsInput: boolean` - Print logs
- `showDebugView: boolean` - Show debug view

## How Turn-Based Works

### Flow
1. **Game Start**: First player's turn begins
2. **Player Action**: Player makes a move (taps cell, etc.)
3. **Turn Submission**: Player submits turn with associated data
4. **Snap Sent**: Turn is sent to opponent via Snap
5. **Opponent Receives**: Opponent opens Snap, sees their turn
6. **Turn Processed**: Opponent's turn starts, previous turn data is available
7. **Repeat**: Process continues until game over

### Turn Data Storage
- Each turn can store **associated data** (JSON-serializable)
- Data persists between turns
- Can be retrieved from turn history
- Data format: Object with key-value pairs

### Player Flow Objects
- **User 1 Flow Objects**: Shown when it's player 1's turn
- **User 2 Flow Objects**: Shown when it's player 2's turn
- **Game Over Objects**: Shown when game ends
- Objects are automatically shown/hidden based on turn state

## Integration Approach

### Method 1: Access via SceneObject

The Turn-Based component is attached to a SceneObject. To access it:

```typescript
// Find the Turn Based SceneObject
const turnBasedObject = global.scene.getRootObject(0); // Or find by name
// Note: Need to find the actual object in scene hierarchy

// Get the ScriptComponent
const turnBasedScript = turnBasedObject.getComponent("Component.Script") as ScriptComponent;
```

### Method 2: Use Response System

The Turn-Based component uses a **Response System** for callbacks. This is likely implemented through:
- Event listeners
- Response objects
- Callback functions

### Method 3: Direct Reference (Recommended)

Since the component exists in the scene, we can:
1. Create a reference to the Turn Based SceneObject
2. Access its ScriptComponent
3. Use the component's methods/properties

## Implementation Strategy

### Step 1: Create TurnBasedManager Script

```typescript
@component
export class TurnBasedManager extends BaseScriptComponent {
    
    @input turnBasedObject: SceneObject = null;
    
    private turnBasedComponent: ScriptComponent = null;
    
    onAwake() {
        // Find Turn Based object if not assigned
        if (!this.turnBasedObject) {
            // Search for "Turn Based" object in scene
            this.findTurnBasedObject();
        }
        
        // Get the script component
        if (this.turnBasedObject) {
            this.turnBasedComponent = this.turnBasedObject.getComponent("Component.Script") as ScriptComponent;
        }
    }
    
    findTurnBasedObject() {
        // Search root objects
        const rootCount = global.scene.getRootObjectsCount();
        for (let i = 0; i < rootCount; i++) {
            const obj = global.scene.getRootObject(i);
            if (obj.name === "Turn Based") {
                this.turnBasedObject = obj;
                return;
            }
        }
    }
    
    // Methods to interact with Turn-Based component
    // (Implementation depends on actual API)
}
```

### Step 2: Set Up Response System

The Turn-Based component likely uses a response system. We need to:
1. Create response objects
2. Attach them to the component
3. Handle callbacks

### Step 3: Store Game State

```typescript
interface GameState {
    player1Grid: boolean[][];  // Player 1's object positions
    player2Grid: boolean[][];   // Player 2's object positions
    player1Shots: Array<{x: number, y: number, hit: boolean}>;
    player2Shots: Array<{x: number, y: number, hit: boolean}>;
    currentTurn: number;
    gameOver: boolean;
    winner: number | null;
}

// Store in turn data
const turnData = {
    shotX: 5,
    shotY: 3,
    hit: true,
    gameState: gameState // Serialized state
};
```

### Step 4: Handle Turn Events

```typescript
// On turn start
onTurnStart() {
    // Show appropriate UI
    // Load previous turn data
    // Display opponent's last move
}

// On turn end
onTurnEnd() {
    // Submit turn data
    // Hide UI
    // Prepare for next turn
}

// On game over
onGameOver() {
    // Show victory screen
    // Display winner
    // Show game over objects
}
```

## Key Considerations

### 1. Turn Data Format
- Must be JSON-serializable
- Keep data size reasonable
- Store only essential game state

### 2. Player Flow Objects
- Set up different UI for each player
- Use `user1FlowObjectsInputSO` and `user2FlowObjectsInputSO`
- Show/hide based on active player

### 3. Tappable Areas
- Assign cells to `tappableAreasInput`
- Only active during player's turn
- Component handles tap detection

### 4. Turn History
- Access previous turns for replay
- Useful for showing opponent's moves
- Limited by `turnsSavedLimitInput`

### 5. Game Over Detection
- Implement win condition check
- Trigger game over when condition met
- Show `gameOverObjectsInputSO`

## Testing Strategy

### Debug Mode
- Enable `debugMode: true`
- Use `debugTappedKeySimulateTurn` to test
- Use `swapPlayersAfterSimulatedTurn` for single-device testing
- Check `debugTurnCount` for turn tracking

### Single Device Testing
- Use debug keys to simulate turns
- Swap players after each turn
- Verify state persistence

### Multi-Device Testing
- Test actual Snap sending/receiving
- Verify state synchronization
- Test turn history

## Next Steps

1. **Download Example Project**
   - Get "Turn Based Game" example from Lens Studio
   - Study implementation
   - Adapt for Fleet Yeet!

2. **Create Basic Integration**
   - Create `TurnBasedManager.ts`
   - Set up basic turn flow
   - Test with debug mode

3. **Implement Game State**
   - Define game state structure
   - Implement serialization
   - Test state persistence

4. **Add UI Flow**
   - Set up player flow objects
   - Create turn start/end UI
   - Add game over screen

5. **Test & Iterate**
   - Test with debug mode
   - Test with actual Snaps
   - Refine based on feedback

## Resources

- **Official Docs**: https://developers.snap.com/lens-studio/features/games/turn-based
- **Example Project**: https://developers.snap.com/lens-studio/examples/lens-examples/turn-based-game
- **Player Info Component**: https://developers.snap.com/lens-studio/features/games/turn-based-player-info
- **Games Overview**: https://developers.snap.com/lens-studio/features/games/games-overview

## Notes

- Turn-Based component is a **built-in component** (not a custom script)
- It uses a **Response System** for callbacks (not direct method calls)
- Game state must be **JSON-serializable**
- Component handles **Snap sending/receiving** automatically
- **Player flow objects** are automatically shown/hidden
- **Tappable areas** are only active during player's turn

## Questions to Resolve

1. How to access Turn-Based component methods from script?
2. What is the exact API for turn data storage/retrieval?
3. How does the Response System work?
4. How to trigger turn submission programmatically?
5. How to access turn history?
6. How to detect current player (user1 vs user2)?

## Recommended Action

**Download the official "Turn Based Game" example** from Lens Studio and study its implementation. This will provide:
- Working code examples
- Proper API usage
- Best practices
- Complete integration pattern
