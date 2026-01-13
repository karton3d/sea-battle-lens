# Tech Reference

## Lens Studio API

### BaseScriptComponent

```typescript
@component
export class MyScript extends BaseScriptComponent {
    @input myParam: Type;
    
    onAwake() { }   // First, initialization
    onStart() { }   // After all onAwake
    onUpdate() { }  // Every frame
}
```

### SceneObject

```typescript
// Create
const obj = global.scene.createSceneObject("Name");

// Transform
const t = obj.getTransform();
t.setLocalPosition(new vec3(x, y, z));
t.setLocalScale(new vec3(1, 1, 1));

// Hierarchy
obj.getParent();
obj.setParent(parent);
obj.getChild(index);

// Components
obj.getComponent("Component.Touch");
obj.createComponent("Component.Script");

// Destroy
obj.destroy();
```

### ObjectPrefab

```typescript
@input cellPrefab: ObjectPrefab;

const instance = this.cellPrefab.instantiate(parent);
instance.name = "Cell_0_0";
```

---

## Turn-Based Component

### Overview

Async two-player games via Snaps. Component handles:
- Turn management
- State serialization
- Turn history
- Player flow objects

### Inputs

| Input | Type | Purpose |
|-------|------|---------|
| requireTurnSubmission | bool | Explicit turn submit |
| useTurnLimit | bool | Enable turn limit |
| turnLimitInput | number | Max turns |
| useTurnHistory | bool | Track history |
| tappableAreasInput | SceneObject[] | Tappable cells |
| user1FlowObjectsInputSO | SceneObject[] | Player 1 UI |
| user2FlowObjectsInputSO | SceneObject[] | Player 2 UI |
| gameOverObjectsInputSO | SceneObject[] | Game over UI |

### Callbacks

- `_onTurnStartResponses` — Turn starts
- `_onTurnEndResponses` — Turn ends
- `_onGameOverResponses` — Game ends

### Turn Data Format

```typescript
interface TurnData {
    shotX: number;
    shotY: number;
    result: 'hit' | 'miss';
    destroyedObject: number | null;
    gameState: SerializedGameState;
}
```

### Flow

1. Player makes move
2. Submit turn with data
3. Snap sent to opponent
4. Opponent opens, sees their turn
5. Previous turn data available
6. Repeat until game over

### Debug

- `debugMode: true` — Enable testing
- `swapPlayersAfterSimulatedTurn` — Single-device test
- `printLogsInput` — Console logs

### Links

- [Turn-Based](https://developers.snap.com/lens-studio/features/games/turn-based)
- [Player Info](https://developers.snap.com/lens-studio/features/games/turn-based-player-info)
- [Example](https://developers.snap.com/lens-studio/examples/lens-examples/turn-based-game)

---

## Component Names

| Use | Name |
|-----|------|
| Touch/Tap | `"Component.Touch"` |
| Script | `"Component.ScriptComponent"` |
