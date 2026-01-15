// AI Turn Handler - Handles AI opponent logic for single-player mode
// Implements ITurnHandler interface for turn abstraction

import { ITurnHandler, AIState, CellState, ShotResult, GRID_SIZE } from './types/GameTypes';

@component
export class AITurnHandler extends BaseScriptComponent implements ITurnHandler {

    // ==================== INPUTS ====================

    /** Reference to GameManager for callbacks */
    @input gameManager: SceneObject;

    /** Delay before AI makes its move (milliseconds) */
    @input aiDelay: number = 1000;

    /** Grid size for bounds checking */
    @input gridSize: number = 10;

    // ==================== PRIVATE STATE ====================

    /** AI state for hunt/target algorithm */
    private aiState: AIState = {
        mode: 'hunt',
        targetCells: [],
        hitCells: [],
        lastHitDirection: null
    };

    /** Reference to player's grid state for shot decisions */
    private playerGridState: CellState[][] | null = null;

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        print('[AITurnHandler] Initialized');
    }

    // ==================== PUBLIC API ====================

    /**
     * Set player grid reference for AI shot decisions
     * Called by GameManager when game starts
     */
    setPlayerGrid(grid: CellState[][]): void {
        this.playerGridState = grid;
        print('[AITurnHandler] setPlayerGrid: Grid reference set');
    }

    // ==================== ITurnHandler IMPLEMENTATION ====================

    /**
     * Called when it's the AI's turn to act
     * Schedules delayed callback to compute and execute shot
     */
    startOpponentTurn(): void {
        print(`[AITurnHandler] startOpponentTurn: Scheduling AI turn in ${this.aiDelay}ms`);

        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        delayEvent.bind(() => {
            this.executeAITurn();
        });
        delayEvent.reset(this.aiDelay / 1000); // Convert ms to seconds
    }

    /**
     * Called after player makes a shot
     * AI doesn't need to process player shots - no-op
     */
    onPlayerShotComplete(x: number, y: number, result: ShotResult): void {
        // AI doesn't need notification of player shots
        print(`[AITurnHandler] onPlayerShotComplete: Player shot (${x}, ${y}) = ${result}`);
    }

    /**
     * Called when game ends
     */
    onGameOver(winner: 'player' | 'opponent'): void {
        print(`[AITurnHandler] onGameOver: Winner is ${winner}`);
    }

    /**
     * Reset AI state for new game
     */
    reset(): void {
        this.aiState = {
            mode: 'hunt',
            targetCells: [],
            hitCells: [],
            lastHitDirection: null
        };
        this.playerGridState = null;
        print('[AITurnHandler] reset: AI state cleared');
    }

    // ==================== AI LOGIC ====================

    /**
     * Execute AI turn - compute shot and notify GameManager
     */
    private executeAITurn(): void {
        const shot = this.computeShot();
        if (!shot) {
            print('[AITurnHandler] executeAITurn: ERROR - No valid shot found');
            return;
        }

        print(`[AITurnHandler] executeAITurn: AI shoots at (${shot.x}, ${shot.y})`);

        // Callback to GameManager to process the shot
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.processAIShot === 'function') {
            gm.processAIShot(shot.x, shot.y);
        } else {
            print('[AITurnHandler] executeAITurn: ERROR - GameManager.processAIShot not found');
        }
    }

    /**
     * Compute next shot using hunt/target algorithm
     */
    private computeShot(): {x: number, y: number} | null {
        if (!this.playerGridState) {
            print('[AITurnHandler] computeShot: ERROR - No player grid reference');
            return null;
        }

        // Target mode: shoot adjacent cells to find rest of ship
        if (this.aiState.mode === 'target' && this.aiState.targetCells.length > 0) {
            while (this.aiState.targetCells.length > 0) {
                const cell = this.aiState.targetCells.pop()!;
                if (this.isCellAvailable(cell.x, cell.y)) {
                    print(`[AITurnHandler] computeShot: Target mode - shooting (${cell.x}, ${cell.y})`);
                    return cell;
                }
            }
            // No valid targets, back to hunt mode
            this.aiState.mode = 'hunt';
            print('[AITurnHandler] computeShot: Target cells exhausted, switching to hunt mode');
        }

        // Hunt mode: random available cell
        const available: Array<{x: number, y: number}> = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (this.isCellAvailable(x, y)) {
                    available.push({x, y});
                }
            }
        }

        if (available.length === 0) {
            print('[AITurnHandler] computeShot: No available cells');
            return null;
        }

        const selected = available[Math.floor(Math.random() * available.length)];
        print(`[AITurnHandler] computeShot: Hunt mode - shooting (${selected.x}, ${selected.y}) from ${available.length} available`);
        return selected;
    }

    /**
     * Check if cell is available for shooting
     */
    private isCellAvailable(x: number, y: number): boolean {
        if (!this.playerGridState) return false;
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
        if (!this.playerGridState[x]) return false;

        const state = this.playerGridState[x][y];
        return state === 'object' || state === 'unknown';
    }

    /**
     * Update AI state after shot result
     * Called by GameManager after processing AI's shot
     */
    updateAfterShot(x: number, y: number, result: ShotResult): void {
        print(`[AITurnHandler] updateAfterShot: (${x}, ${y}) = ${result}`);

        if (result === 'hit') {
            // Switch to target mode
            this.aiState.mode = 'target';
            this.aiState.hitCells.push({x, y});

            // Add adjacent cells to target list
            this.addAdjacentToTargets(x, y);

            // If we have 2+ hits, determine direction and prioritize
            if (this.aiState.hitCells.length >= 2) {
                this.determineDirection();
            }

            print(`[AITurnHandler] updateAfterShot: Target mode, ${this.aiState.targetCells.length} targets queued`);
        } else if (result === 'destroyed') {
            // Ship destroyed, back to hunt mode
            this.aiState.mode = 'hunt';
            this.aiState.targetCells = [];
            this.aiState.hitCells = [];
            this.aiState.lastHitDirection = null;
            print('[AITurnHandler] updateAfterShot: Ship destroyed, back to hunt mode');
        }
        // On miss: stay in current mode, continue with remaining targets
    }

    /**
     * Add adjacent cells to AI target list
     */
    private addAdjacentToTargets(x: number, y: number): void {
        const directions = [
            {dx: 0, dy: -1},  // up
            {dx: 0, dy: 1},   // down
            {dx: -1, dy: 0},  // left
            {dx: 1, dy: 0}    // right
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                if (this.isCellAvailable(nx, ny)) {
                    // Check if not already in targets
                    if (!this.aiState.targetCells.some(c => c.x === nx && c.y === ny)) {
                        this.aiState.targetCells.push({x: nx, y: ny});
                    }
                }
            }
        }
    }

    /**
     * Determine ship direction from multiple hits and filter targets
     */
    private determineDirection(): void {
        if (this.aiState.hitCells.length < 2) return;

        const first = this.aiState.hitCells[0];
        const second = this.aiState.hitCells[1];

        if (first.x === second.x) {
            // Vertical ship
            this.aiState.lastHitDirection = 'vertical';
            // Keep only vertical targets
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.x === first.x);
            print(`[AITurnHandler] determineDirection: Vertical ship detected, ${this.aiState.targetCells.length} targets remaining`);
        } else if (first.y === second.y) {
            // Horizontal ship
            this.aiState.lastHitDirection = 'horizontal';
            // Keep only horizontal targets
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.y === first.y);
            print(`[AITurnHandler] determineDirection: Horizontal ship detected, ${this.aiState.targetCells.length} targets remaining`);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get GameManager script from reference
     */
    private getGameManagerScript(): any {
        if (!this.gameManager) {
            print('[AITurnHandler] getGameManagerScript: ERROR - gameManager not set');
            return null;
        }

        const scripts = this.gameManager.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && typeof script.processAIShot === 'function') {
                return script;
            }
        }

        print('[AITurnHandler] getGameManagerScript: ERROR - processAIShot method not found');
        return null;
    }
}
