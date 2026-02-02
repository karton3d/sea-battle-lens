# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fleet Yeet! is an AR Battleship game for **Snap Lens Studio** using TypeScript. Supports single-player (vs AI) and multiplayer (async via Snaps).

**Platform:** Snap Lens Studio 5.x (NOT Node.js, NOT browser)
**Language:** TypeScript (ES2021, CommonJS)
**Main project path:** `2016_01_Play Everywhere_Sea_battle_lens/`

## Build & Run

No CLI build required. Open in Lens Studio and press Play.

1. Open project folder in Lens Studio
2. Assign prefabs to GridGenerator inputs in Scene Editor
3. Press Play/Preview

## Critical Lens Studio API Rules

**No standard JS APIs available:**

| Unavailable | Use Instead |
|-------------|-------------|
| `setTimeout(fn, ms)` | `DelayedCallbackEvent.reset(seconds)` |
| `console.log()` | `print()` |
| `throw new Error()` | Guard clause + `print()` + `return` |
| `async/await` | Callback patterns |
| DOM APIs | `SceneObject` APIs |

**Delayed execution:**
```typescript
const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
delayEvent.bind(() => this.doSomething());
delayEvent.reset(1.0);  // SECONDS, not milliseconds
```

**Component structure:**
```typescript
@component
export class MyComponent extends BaseScriptComponent {
    @input myRef: SceneObject;

    onAwake() { }   // Initialization
    onStart() { }   // After all onAwake
    onUpdate() { }  // Every frame (use sparingly)
}
```

**Component lookup:**
```typescript
const scripts = sceneObject.getComponents("Component.ScriptComponent");
for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i] as any;
    if (script && typeof script.myMethod === 'function') {
        return script;
    }
}
```

## Architecture

```
GameManager (Central Controller)
├── State: GamePhase, TurnState, GameMode
├── Turn Handling
│   ├── Single Player → AITurnHandler
│   └── Multiplayer → TurnBasedManager
└── Grid Interaction → GridGenerator/SphericalGrid
```

**Key files:**
- `GameManager.ts` - Central game state machine, turn flow, UI control
- `GridGenerator.ts` - 10x10 grid, ship placement, hit/miss tracking
- `SphericalGrid.ts` - Spherical grid variant with curvature support
- `TurnBasedManager.ts` - Multiplayer via Turn-Based component
- `AITurnHandler.ts` - AI opponent with hunt/target strategy
- `types/GameTypes.ts` - Shared types and interfaces

**Multiplayer uses deferred evaluation:** Shots evaluated by receiver, not sender. Ship positions stay secret until revealed.

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase.ts | `GameManager.ts` |
| Classes | PascalCase | `SeaBattleGrid` |
| Interfaces | IPascalCase | `ITurnHandler` |
| Constants | SCREAMING_SNAKE | `GRID_SIZE` |

## Logging

```typescript
print('[ComponentName] methodName: message');
print('[DEBUG] state: ' + JSON.stringify(obj));
```

## Testing

No automated testing framework. Use extensive `print()` logging and manual verification in Lens Studio Preview.

## Documentation

- `0_PROJECT.md` - Project overview & status
- `1_USER_FLOW.md` - Game flow details
- `_bmad-output/project-context.md` - Critical implementation rules
- `docs/TECH_REFERENCE.md` - Lens Studio API reference
