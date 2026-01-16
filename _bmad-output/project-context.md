---
project_name: 'sea-battle-lens'
user_name: 'Boss'
date: '2026-01-15'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 26
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in the Meme Fleet Battle Lens Studio project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Platform:** Snap Lens Studio 5.x (AR lens development)
- **Language:** TypeScript (ES2021 target, CommonJS modules)
- **Runtime:** Lens Studio JavaScript engine (NOT Node.js, NOT browser)
- **Multiplayer:** Turn-Based component (async via Snaps)
- **Base Class:** All scripts extend `BaseScriptComponent`

---

## Critical Implementation Rules

### Lens Studio API Rules

**Component Declaration:**
```typescript
@component
export class MyComponent extends BaseScriptComponent {
    @input myProperty: SceneObject;  // Scene reference

    onAwake() { }   // Initialization
    onStart() { }   // After all onAwake
    onUpdate() { }  // Every frame (use sparingly)
}
```

**NO Browser/Node APIs Available:**
- ❌ `setTimeout` / `setInterval` → Use `DelayedCallbackEvent`
- ❌ `console.log` → Use `print()`
- ❌ `async/await` (native) → Use callback patterns
- ❌ `throw` / `try-catch` for flow control → Use guard clauses
- ❌ DOM APIs → Use `SceneObject` APIs
- ❌ `fetch` / XMLHttpRequest → Use Turn-Based for networking

**Delayed Execution Pattern:**
```typescript
// ✅ CORRECT: Lens Studio delayed callback
const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
delayEvent.bind(() => {
    this.doSomething();
});
delayEvent.reset(1.0); // seconds, not milliseconds

// ❌ WRONG: Not available
setTimeout(() => this.doSomething(), 1000);
```

**Component Lookup Pattern:**
```typescript
// ✅ CORRECT: Get script from SceneObject
const scripts = sceneObject.getComponents("Component.ScriptComponent");
for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i] as any;
    if (script && typeof script.myMethod === 'function') {
        return script;
    }
}

// ❌ WRONG: No dependency injection framework
```

**Touch/Interaction Setup:**
```typescript
let interaction = obj.getComponent("Component.Touch") as InteractionComponent;
if (!interaction) {
    interaction = obj.createComponent("Component.Touch") as InteractionComponent;
}
interaction.onTap.add(() => this.handleTap());
```

### Error Handling Pattern

```typescript
// ✅ CORRECT: Guard clause with logging
public onCellTapped(x: number, y: number): void {
    if (this.state.turn !== 'player') {
        print('[GameManager] onCellTapped: Not player turn, ignoring');
        return;
    }
    if (x < 0 || x >= GRID_SIZE) {
        print(`[GameManager] onCellTapped: Invalid x=${x}`);
        return;
    }
    // Process tap...
}

// ❌ WRONG: Throwing exceptions
if (!valid) throw new Error('Invalid state');
```

### State Serialization Rules (Multiplayer)

```typescript
// ✅ CORRECT: Plain objects and primitives only
interface TurnData {
    shotX: number;
    shotY: number;
    result: 'hit' | 'miss';
    isGameOver: boolean;
}

// ❌ WRONG: NOT serializable
interface BadTurnData {
    grid: SceneObject;        // SceneObject not serializable
    callback: () => void;     // Functions not serializable
    circularRef: BadTurnData; // Circular refs not allowed
}
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase.ts | `GameManager.ts`, `TurnBasedManager.ts` |
| Classes | PascalCase | `SeaBattleGrid`, `TurnBasedManager` |
| Interfaces | IPascalCase | `ITurnHandler`, `IGridController` |
| Methods | camelCase | `playerShoot()`, `onCellTapped()` |
| Private fields | camelCase | `gridCells`, `turnHandler` |
| Constants | SCREAMING_SNAKE | `TOTAL_OBJECT_CELLS`, `GRID_SIZE` |
| @input props | camelCase | `@input playerGrid: SceneObject` |
| Events | onEventName | `onCellTapped`, `onTurnReceived` |

---

## Logging Strategy

```typescript
// Format: [ComponentName] methodName: message
print('[GameManager] playerShoot: Hit at (5, 3)');
print('[TurnBasedManager] onTurnReceived: Processing opponent shot');
print('[SeaBattleGrid] setCellState: Marking (2, 7) as miss');

// Debug levels (manual filtering)
print('[DEBUG] AI state: ' + JSON.stringify(this.aiState));
print('[ERROR] Failed to deserialize turn data');
print('[TURN] Submitting turn: ' + JSON.stringify(turnData));
```

---

## Testing Rules

**No Unit Test Framework** - Lens Studio doesn't support automated testing.

**Manual Testing Approach:**
- Extensive `print()` logging for all major actions
- Turn-Based debug mode for multiplayer testing (`debugMode: true`)
- `swapPlayersAfterSimulatedTurn` for single-device MP testing
- Fixed ship placement mode for reproducible tests (`useRandomPlacement: false`)

**Test Cases to Verify:**
| Test | Steps | Expected |
|------|-------|----------|
| New Game | Open → Tap Single Player | Setup screen |
| Hit Detection | Tap cell with ship | "HIT!" + marker |
| Miss Detection | Tap empty cell | "Miss" + marker |
| Win Condition | Hit all 20 cells | "YOU WON!" |
| AI Turn | After player turn | AI shoots within 1s |

---

## Code Organization

```
Assets/Scripts/
├── GameManager.ts          # Central game controller
├── GridGenerator.ts        # SeaBattleGrid component
├── TurnBasedManager.ts     # Multiplayer turn handling (v0.4)
└── types/
    └── GameTypes.ts        # Shared type definitions (if extracted)
```

**File Structure Within Components:**
```typescript
@component
export class ComponentName extends BaseScriptComponent {
    // 1. @input declarations (scene references)
    @input playerGrid: SceneObject;

    // 2. Private state
    private state: GameState;

    // 3. Lifecycle methods
    onAwake() { }

    // 4. Public API methods
    public startGame(): void { }

    // 5. Private implementation
    private processShot(): void { }
}
```

---

## Critical Don't-Miss Rules

### Anti-Patterns to AVOID

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `setTimeout(fn, ms)` | `DelayedCallbackEvent.reset(seconds)` |
| `console.log()` | `print()` |
| `throw new Error()` | Guard clause + `print()` + `return` |
| `async/await` | Callback patterns |
| Direct state access across components | Interface methods (`hasShipAt()`) |
| `this.screen.enabled = true` | `this.showScreen('game')` |

### Lens Studio Gotchas

1. **DelayedCallbackEvent uses SECONDS, not milliseconds**
2. **No `this` binding in callbacks** - Use arrow functions or capture variables
3. **SceneObject.enabled** hides/shows objects - use for visibility
4. **Component lookup returns array** - Must iterate to find correct script
5. **Prefab instantiation** - Returns SceneObject, parent must be specified
6. **No garbage collection control** - Destroy objects explicitly

### Multiplayer-Specific Rules

1. **All turn data must be JSON-serializable** - No SceneObjects, functions, or circular refs
2. **Turn-Based is async only** - No real-time gameplay possible
3. **Each player stores own ship positions** - Opponent positions received via turn data
4. **Game state reconstructed from turn history** - On lens open
5. **ITurnHandler interface** - Abstract AI vs multiplayer turn sources

---

## Key Interfaces

```typescript
interface ITurnHandler {
    isMyTurn(): boolean;
    getNextShot(): Promise<{x: number, y: number}> | {x: number, y: number};
    onShotResult(x: number, y: number, result: 'hit' | 'miss'): void;
    onTurnEnd(): void;
}

interface IGridController {
    generate(): void;
    show(): void;
    hide(): void;
    hasShipAt(x: number, y: number): boolean;
    setCellState(x: number, y: number, state: 'hit' | 'miss'): void;
}
```

---

## Quick Reference

| Need To... | Use This |
|------------|----------|
| Delay execution | `DelayedCallbackEvent` |
| Log output | `print('[Component] method: msg')` |
| Create object | `prefab.instantiate(parent)` |
| Get component | `obj.getComponent("Component.ScriptComponent")` |
| Add touch | `obj.createComponent("Component.Touch")` |
| Show/hide | `sceneObject.enabled = true/false` |
| Position object | `obj.getTransform().setLocalPosition(vec3)` |
| Serialize state | `JSON.stringify(plainObject)` |

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Use `print()` logging liberally for debugging

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Generated by BMAD Project Context Workflow - 2026-01-15_
