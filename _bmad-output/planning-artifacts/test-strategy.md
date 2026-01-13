# Test Strategy: Meme Fleet Battle

**Status:** VALIDATED
**Generated:** 2026-01-13
**Validated:** 2026-01-13
**Platform:** Snap Lens Studio 5.17.1

---

## Document Status

> **VALIDATED:** The MCP server automation approach (Section 4) has been validated via Claude Code integration. The proxy solution works and MCP tools successfully query scene state and capture logs.

---

## 1. Testing Constraints

### 1.1 Lens Studio Limitations

| Constraint | Impact | Source |
|------------|--------|--------|
| No unit test framework | Cannot write automated unit tests | Platform limitation |
| No mocking support | Cannot isolate components | Platform limitation |
| Limited debugging | No breakpoints, print-based only | [Debugging Guide](https://developers.snap.com/lens-studio/4.55.1/references/guides/lens-features/adding-interactivity/debugging) |
| On-device testing required | Some bugs only appear on device | [QA Troubleshooting](https://developers.snap.com/lens-studio/publishing/optimization/lens-qa-troubleshooting) |
| Snap's automated tests | Run on submission, not during dev | Platform limitation |

### 1.2 What Snap Tests Automatically

When you submit a Lens for publishing, Snap runs automated tests:
- Runs on multiple device models
- Checks for JavaScript errors
- Verifies lens runs smoothly
- **Rejection if scripts produce errors**

This is post-development testing only - no access during development.

---

## 2. Available Testing Tools

### 2.1 Console Logging

**Primary debugging method in Lens Studio.**

```typescript
// Basic logging
print("Debug message");
Studio.log("Debug message");

// Console API (multiple levels)
console.debug("Debug level");
console.info("Info level");
console.error("Error level");
console.trace();  // Stack trace

// Timer
console.time("operation");
// ... operation ...
console.timeEnd("operation");

// Object inspection
print(JSON.stringify(object, null, 2));
```

**Log file location:** `~/Library/Preferences/Snap/Lens\ Studio/Log.txt`
- Script messages marked as `[inf#user#core]`

### 2.2 TextLogger Component

Import "Text Logger V2" from Asset Library → Tools section.

Three ways to access:
1. **LSO Import** - Direct asset import
2. **Custom Component** - Reusable across projects
3. **Module Import** - For custom implementations

```typescript
// Basic logging (supports multiple arguments)
global.textLogger.log('Hello!');
global.textLogger.log('You', 'can', { use: 'many' }, 'arguments also.');

// Configuration
global.textLogger.setLoggingEnabled(false);  // Disable screen display
global.textLogger.setTextColor(new vec4(1, 0, 0, 1));  // Red text
global.textLogger.setLogLimit(5);  // Max messages shown
global.textLogger.setTextSize(50);  // Adjust size
global.textLogger.clear();  // Remove all entries
```

Benefits:
- Multiple arguments support
- Displays on screen AND Logger panel
- Configurable appearance
- Essential for on-device debugging

### 2.3 Mobile Monitor

Use **Mobile Monitor** for deeper insight into lens behavior during device testing.

Reference: [Debugging Guide](https://developers.snap.com/lens-studio/features/scripting/debugging)

### 2.4 Turn-Based Debug Mode

Built into Turn-Based component for multiplayer testing:

| Setting | Purpose |
|---------|---------|
| `debugMode` | Enable debug features |
| `swapPlayersAfterSimulatedTurn` | Single-device MP testing |
| `debugTappedKeySimulateTurn` | Keyboard trigger for turns |
| `printLogsInput` | Verbose logging |
| `showDebugView` | Visual debug overlay |

---

## 3. Manual Testing Approach

### 3.1 Test Case Matrix

| ID | Category | Test Case | Steps | Expected Result | Priority |
|----|----------|-----------|-------|-----------------|----------|
| **INIT** |
| TC-001 | Init | Fresh start | Open lens | Intro screen displayed | P0 |
| TC-002 | Init | Single Player select | Tap "Single Player" | Setup screen, player grid visible | P0 |
| TC-003 | Init | Multiplayer select | Tap "Multiplayer" | Setup screen (MP flow) | P1 |
| **SETUP** |
| TC-010 | Setup | Ship placement | Start game | 10 ships placed, no overlaps | P0 |
| TC-011 | Setup | No-touch rule | Inspect ships | Ships don't touch (even diagonal) | P0 |
| TC-012 | Setup | Grid visibility | Setup phase | Only player grid visible | P1 |
| **GAMEPLAY** |
| TC-020 | Shoot | Hit detection | Tap cell with ship | "HIT!" message, hit marker | P0 |
| TC-021 | Shoot | Miss detection | Tap empty cell | "Miss" message, miss marker | P0 |
| TC-022 | Shoot | Double-tap prevention | Tap same cell twice | "Already shot here!" message | P0 |
| TC-023 | Shoot | Turn switch | After shot | Switches to AI turn | P0 |
| **AI** |
| TC-030 | AI | AI shoots | After player turn | AI shoots within delay time | P0 |
| TC-031 | AI | AI valid shot | AI turn | AI only shoots unknown cells | P0 |
| TC-032 | AI | Hunt mode | AI playing | Random shots until hit | P1 |
| TC-033 | AI | Target mode | After AI hit | AI shoots adjacent cells | P1 |
| **WIN/LOSE** |
| TC-040 | End | Player wins | Hit all 20 cells | "YOU WON!" screen | P0 |
| TC-041 | End | Player loses | AI hits all 20 | "YOU LOST!" screen | P0 |
| TC-042 | End | Play again | Tap "Play Again" | Returns to intro | P0 |
| **MULTIPLAYER** |
| TC-050 | MP | Turn submission | Complete turn | Turn data sent via Snap | P0 |
| TC-051 | MP | Turn receive | Opponent's turn | Opponent's shot processed | P0 |
| TC-052 | MP | State sync | Multiple turns | Game state consistent | P0 |

### 3.2 Device Testing Matrix

| Device Type | Test Focus | Notes |
|-------------|------------|-------|
| Lens Studio Preview | Quick iteration | Cannot test Turn-Based connection |
| iOS Device | Full testing | Primary target |
| Android Device | Compatibility | Secondary target |
| Spectacles (if applicable) | AR experience | Limited debugging |

---

## 4. MCP Server Automation Approach (EXPERIMENTAL)

> **STATUS:** Requires validation. This section outlines a proposed approach using Lens Studio's MCP server.

### 4.1 Overview

Lens Studio 5.16+ includes a built-in MCP server that allows external tools to interact with the editor. This could enable semi-automated testing.

**References:**
- [Developer Mode](https://developers.snap.com/lens-studio/features/lens-studio-ai/developer-mode)
- [Developer Mode with Cursor](https://developers.snap.com/lens-studio/features/lens-studio-ai/developer-mode-with-cursor)
- [Lens Studio Plugins](https://github.com/Snapchat/Lens-Studio-Plugins)

### 4.2 MCP Server Configuration

```json
{
  "servers": {
    "lens-studio": {
      "headers": {
        "Authorization": "[API_KEY]"
      },
      "type": "http",
      "url": "http://localhost:8732/mcp"
    }
  }
}
```

**To enable:**
1. Lens Studio menu: `AI Assistant > MCP > Configure Server`
2. Click "Start Server"
3. Copy configuration

### 4.3 Available MCP Tools

| Tool | Purpose | Testing Use |
|------|---------|-------------|
| `GetLensStudioSceneGraph` | Get scene structure | Verify scene setup |
| `ListSceneObjects` | List all objects | Check object creation |
| `SetProperty` | Modify properties | Simulate inputs |
| `SetLensStudioProperty` | Set lens properties | Configure test state |

### 4.4 Proposed Testing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  MCP-BASED TEST AUTOMATION                      │
│                    (EXPERIMENTAL)                               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     MCP      ┌──────────────┐
    │  Test Script │ ──────────→  │ Lens Studio  │
    │  (External)  │              │  MCP Server  │
    └──────┬───────┘              └──────┬───────┘
           │                             │
           │  1. Start test              │
           │  2. Set initial state       │
           │  3. Trigger action          │
           │  4. Query scene graph       │
           │  5. Verify state            │
           │                             │
           │                             ↓
           │                      ┌──────────────┐
           │                      │   Console    │
           │    ← Log output ───  │    Output    │
           │                      └──────────────┘
           ↓
    ┌──────────────┐
    │  Test Result │
    │   (Pass/Fail)│
    └──────────────┘
```

### 4.5 Test Script Concept (TO BE VALIDATED)

```typescript
// Conceptual test script - needs validation
// Would run externally, calling MCP server

interface MCPClient {
    call(tool: string, params: object): Promise<any>;
}

async function testShipPlacement(mcp: MCPClient) {
    // 1. Get scene graph
    const scene = await mcp.call('GetLensStudioSceneGraph', {});

    // 2. Find grid objects
    const grids = scene.objects.filter(o => o.name.includes('Grid'));

    // 3. Verify ships exist
    const ships = scene.objects.filter(o => o.name.startsWith('Ship_'));

    // 4. Assert ship count
    assert(ships.length === 10, `Expected 10 ships, got ${ships.length}`);

    // 5. Check no overlaps (would need position data)
    // ...

    return { passed: true, message: 'Ship placement valid' };
}
```

### 4.6 Console Log Collection

**Log file path:** `~/Library/Preferences/Snap/Lens\ Studio/Log.txt`

```bash
# Watch log file for test assertions
tail -f ~/Library/Preferences/Snap/Lens\ Studio/Log.txt | grep "\[TEST\]"
```

**In-game test logging:**
```typescript
// Add to GameManager.ts for testability
function logTestEvent(event: string, data: any) {
    print(`[TEST] ${event}: ${JSON.stringify(data)}`);
}

// Usage
logTestEvent('SHOT_FIRED', { x: 5, y: 3, result: 'hit' });
logTestEvent('GAME_STATE', { phase: 'playing', turn: 'player', hits: 5 });
```

### 4.7 Validation Tasks

> **VALIDATED:** 2026-01-13 - MCP approach confirmed working via Claude Code integration.

| Task | Description | Status |
|------|-------------|--------|
| [x] | Verify MCP server starts correctly | DONE |
| [x] | Test MCP connection from external script | DONE |
| [x] | List available MCP tools | DONE (41 tools) |
| [x] | Test `GetLensStudioSceneGraph` output | DONE |
| [x] | Test log collection via MCP | DONE |
| [x] | Verify script `print()` captured in logs | DONE |
| [x] | Test TypeScript compilation via MCP | DONE |
| [-] | Create minimal test script POC | N/A (use Claude Code directly) |

### 4.8 Validated MCP Tools for Testing

The following MCP tools have been validated for automated testing:

| Tool | Purpose | Validated Output |
|------|---------|------------------|
| `GetLensStudioSceneGraph` | Query scene hierarchy | Returns full tree with UUIDs, names, enabled states |
| `GetLensStudioLogsTool` | Read logs with filters | Captures script `print()` statements with file/line info |
| `RunAndCollectLogsTool` | Reset preview + collect logs | Resets lens, runs, collects runtime output |
| `CompileWithLogsTool` | TypeScript compilation | Returns status and duration |
| `GetLensStudioSceneObjectByName` | Find objects by name | Returns object details including components |
| `SetLensStudioProperty` | Modify properties | Can manipulate scene state for testing |

### 4.9 Protocol Compatibility Note

**Issue:** Lens Studio 5.17.1 only accepts MCP protocol version `2025-06-18`.

**Solution:** Use a Bun proxy (`mcp-proxy.ts`) to rewrite protocol versions:
```
Claude Code → localhost:50050 (proxy) → localhost:50049 (Lens Studio)
```

**To start the proxy (in a separate terminal, not in IDE):**
```bash
bun run mcp-proxy.ts
```

The proxy must be running before Claude Code can connect to Lens Studio MCP.
Keep the terminal open while using Claude Code with Lens Studio.

See `MCP_PROTOCOL_COMPATIBILITY.md` for full details.

### 4.10 Example: Log Output from Game Scripts

Logs captured via `GetLensStudioLogsTool` show script output with source location:

```
[Preview 1] [Assets/Scripts/GameManager.ts:263] GameManager: Single Player button setup
[Preview 1] [Assets/Scripts/GameManager.ts:313] GameManager: Showing screen: intro
[Preview 1] [Assets/Scripts/GameManager.ts:104] GameManager: Initialized
[Preview 1] [Assets/Scripts/GridGenerator.ts:76] SeaBattleGrid: Initialized (name: PlayerGrid)
```

This enables verification of game state transitions during automated tests.

---

## 5. Testing Strategy by Phase

### 5.1 Phase 0: Foundation Validation (Current)

| Test Focus | Method | Coverage |
|------------|--------|----------|
| Code review | Static analysis | Architecture |
| Manual play | Lens Studio preview | Single Player |
| Console logging | Print statements | State transitions |

### 5.2 Phase 1: Pre-Multiplayer

| Test Focus | Method | Coverage |
|------------|--------|----------|
| State serialization | Manual + logging | JSON export/import |
| Turn data format | Unit-style tests | Data structure |
| Edge cases | Manual testing | Error handling |

### 5.3 Phase 2: Multiplayer Development

| Test Focus | Method | Coverage |
|------------|--------|----------|
| Turn-Based integration | Debug mode | Connection |
| State sync | Two-device test | Data consistency |
| Error recovery | Disconnect tests | Resilience |

### 5.4 Phase 3: Pre-Release

| Test Focus | Method | Coverage |
|------------|--------|----------|
| Full game flow | Manual playthrough | End-to-end |
| Device matrix | Multi-device | Compatibility |
| Performance | Profiling | Optimization |

---

## 6. Test Infrastructure Setup

### 6.1 Logging Standards

Add to all components for testability:

```typescript
// Constants
const DEBUG_MODE = true;  // Set false for production
const TEST_MODE = false;  // Set true for test runs

// Logging helper
function log(level: 'debug' | 'info' | 'test' | 'error', message: string, data?: any) {
    if (!DEBUG_MODE && level === 'debug') return;
    if (!TEST_MODE && level === 'test') return;

    const prefix = `[${level.toUpperCase()}]`;
    if (data) {
        print(`${prefix} ${message}: ${JSON.stringify(data)}`);
    } else {
        print(`${prefix} ${message}`);
    }
}

// Usage
log('test', 'SHOT_RESULT', { x, y, result });
log('debug', 'AI selecting target');
log('error', 'Failed to place ship', { reason });
```

### 6.2 State Dump Helper

```typescript
// Add to GameManager.ts
dumpState(): string {
    const stateSnapshot = {
        phase: this.state.phase,
        turn: this.state.turn,
        mode: this.state.mode,
        playerHits: this.state.playerHits,
        opponentHits: this.state.opponentHits,
        aiMode: this.aiState.mode,
        timestamp: Date.now()
    };
    const json = JSON.stringify(stateSnapshot, null, 2);
    print(`[STATE_DUMP] ${json}`);
    return json;
}
```

### 6.3 Test Event Markers

```typescript
// Standardized test events for log parsing
const TEST_EVENTS = {
    GAME_START: 'GAME_START',
    PHASE_CHANGE: 'PHASE_CHANGE',
    SHOT_FIRED: 'SHOT_FIRED',
    SHOT_RESULT: 'SHOT_RESULT',
    TURN_CHANGE: 'TURN_CHANGE',
    SHIP_DESTROYED: 'SHIP_DESTROYED',
    GAME_END: 'GAME_END'
};

function emitTestEvent(event: string, data: any) {
    print(`[TEST_EVENT] ${event} | ${JSON.stringify(data)}`);
}
```

---

## 7. Recommendations

### 7.1 Immediate Actions

1. **Add logging standards** to existing code
2. **Create state dump** helper for debugging
3. **Document manual test cases** in runnable format

### 7.2 For Separate Validation Session

1. **Verify MCP server** connectivity
2. **Test available MCP tools** and their outputs
3. **Create POC test script** for basic automation
4. **Establish log parsing** pipeline

### 7.3 Long-term

1. **Build test harness** if MCP approach works
2. **Automate regression tests** for critical paths
3. **Create CI-like workflow** for pre-submission checks

---

## 8. References

### Official Documentation
- [Debugging (Current)](https://developers.snap.com/lens-studio/features/scripting/debugging)
- [Lens QA Troubleshooting](https://developers.snap.com/lens-studio/publishing/optimization/lens-qa-troubleshooting)
- [Console API](https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.console.html)
- [Developer Mode](https://developers.snap.com/lens-studio/features/lens-studio-ai/developer-mode)
- [Developer Mode with Cursor](https://developers.snap.com/lens-studio/features/lens-studio-ai/developer-mode-with-cursor)

### Community Resources
- [Lens Studio Plugins (GitHub)](https://github.com/Snapchat/Lens-Studio-Plugins)
- [Lens Studio Community - Debugging](https://support.lensstudio.snapchat.com/hc/en-us/community/posts/360018248186-Debugging-scripting)

---

## 9. Document History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 DRAFT | 2026-01-13 | Initial draft - MCP approach needs validation |
| 1.0 | 2026-01-13 | MCP approach validated - proxy solution works, tools verified |

---

## 10. Validation Results

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION COMPLETE ✓                        │
└─────────────────────────────────────────────────────────────────┘

✓ 1. Lens Studio 5.17.1 with MCP server
✓ 2. Protocol proxy solution (mcp-proxy.ts on port 50050)
✓ 3. Claude Code connected via .mcp.json config
✓ 4. 41 MCP tools available
✓ 5. GetLensStudioSceneGraph returns full scene hierarchy
✓ 6. GetLensStudioLogsTool captures script print() output
✓ 7. RunAndCollectLogsTool resets and collects runtime logs
✓ 8. CompileWithLogsTool verifies TypeScript compilation
✓ 9. Log output includes file path and line numbers
```

### Key Finding

Claude Code can directly call MCP tools without external scripts. This simplifies
the testing workflow - no separate test harness needed. Claude Code itself serves
as the test runner, using MCP tools to:

1. Query scene state (`GetLensStudioSceneGraph`)
2. Verify object existence (`GetLensStudioSceneObjectByName`)
3. Capture runtime logs (`GetLensStudioLogsTool`, `RunAndCollectLogsTool`)
4. Check compilation (`CompileWithLogsTool`)
5. Manipulate state (`SetLensStudioProperty`)

---

*VALIDATED - MCP approach confirmed working 2026-01-13*
