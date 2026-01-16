# Meme Fleet Battle - Documentation Index

Quick reference for AI agents and developers working on this Snap Lens Studio project.

## Essential Reading Order

| # | Document | Purpose |
|---|----------|---------|
| 1 | [0_PROJECT.md](../0_PROJECT.md) | Project overview, status, game concept |
| 2 | [1_USER_FLOW.md](../1_USER_FLOW.md) | Step-by-step user journey |
| 3 | [TECH_REFERENCE.md](TECH_REFERENCE.md) | Lens Studio API, Turn-Based docs |
| 4 | [project-context.md](../_bmad-output/project-context.md) | Critical rules for AI agents |

## Component Reference

| Component | File | Purpose |
|-----------|------|---------|
| **GameManager** | `Assets/Scripts/GameManager.ts` | Central game controller, state machine |
| **SeaBattleGrid** | `Assets/Scripts/GridGenerator.ts` | Grid visuals, ship placement, cell tapping |
| **AITurnHandler** | `Assets/Scripts/AITurnHandler.ts` | AI opponent logic (hunt/target algorithm) |
| **TransitionManager** | `Assets/Scripts/TransitionManager.ts` | Animated grid transitions |
| **GameTypes** | `Assets/Scripts/types/GameTypes.ts` | Shared interfaces and types |

## Architecture Documents

| Document | Location | Content |
|----------|----------|---------|
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | System design, data flow, interfaces |
| GDD | `_bmad-output/planning-artifacts/gdd.md` | Game design, mechanics, progression |
| Epics | `_bmad-output/epics.md` | 21 stories across 5 epics (v0.4 multiplayer) |

## Quick Links by Task

### "How do I..."

| Task | See |
|------|-----|
| Add a new component | [project-context.md](../_bmad-output/project-context.md) → Lens Studio API Rules |
| Handle Turn-Based multiplayer | [TECH_REFERENCE.md](TECH_REFERENCE.md) → Turn-Based Component |
| Understand game flow | [1_USER_FLOW.md](../1_USER_FLOW.md) |
| Add delayed execution | [project-context.md](../_bmad-output/project-context.md) → DelayedCallbackEvent |
| Serialize state for multiplayer | [GameTypes.ts](../2016_01_Play%20Everywhere_Sea_battle_lens/Assets/Scripts/types/GameTypes.ts) → TurnData |

### "Where is..."

| Looking For | Location |
|-------------|----------|
| Game state machine | `GameManager.ts` → `showScreen()`, `state.phase` |
| Ship placement logic | `GridGenerator.ts` → `placeShipsRandomly()` |
| AI algorithm | `AITurnHandler.ts` → `computeShot()`, `updateAfterShot()` |
| Turn handler interface | `types/GameTypes.ts` → `ITurnHandler` |
| Grid transitions | `TransitionManager.ts` |

## Implementation Status

### v0.3 (Current) - Single Player
- [x] Grid generation and ship placement
- [x] Cell tapping and hit detection
- [x] AI opponent (hunt/target algorithm)
- [x] Win condition (20 hits)
- [x] Game reset

### v0.4 (In Progress) - Multiplayer
- [x] Reshuffle board functionality
- [x] Type definitions extracted
- [x] AITurnHandler created
- [x] TransitionManager created
- [ ] GameManager refactored for turn handlers
- [ ] TurnBasedHandler for multiplayer
- [ ] Animated transitions integrated

## Key Patterns

```typescript
// Component declaration
@component
export class MyComponent extends BaseScriptComponent {
    @input myReference: SceneObject;
    onAwake() { }
}

// Delayed execution (NO setTimeout!)
const event = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
event.bind(() => this.doSomething());
event.reset(1.5); // seconds

// Logging
print('[ComponentName] methodName: message');
```

## MCP Integration

- MCP proxy runs at `localhost:50050` → forwards to Lens Studio at `localhost:50049`
- See [MCP_PROTOCOL_COMPATIBILITY.md](../MCP_PROTOCOL_COMPATIBILITY.md) for setup
- 41 Lens Studio tools available via MCP

---

_Last Updated: 2026-01-15_
