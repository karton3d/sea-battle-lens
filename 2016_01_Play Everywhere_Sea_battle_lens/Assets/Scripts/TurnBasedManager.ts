// TurnBasedManager - Handles multiplayer turn logic via Snap's Turn-Based component
// Implements deferred shot evaluation: shots are evaluated by the RECEIVER, not sender

import {
    ITurnHandler, TurnData, ShotResult, PendingShot, MultiplayerState, GRID_SIZE, CellState, ShotHistoryEntry
} from './types/GameTypes';

@component
export class TurnBasedManager extends BaseScriptComponent implements ITurnHandler {

    // ==================== INPUTS ====================

    /** Direct reference to the Turn-Based component (ScriptComponent) */
    @input('Component.ScriptComponent')
    turnBased: TurnBased;

    /** Reference to GameManager for callbacks */
    @allowUndefined
    @input gameManager: SceneObject;

    /** Enable debug logging */
    @input debugMode: boolean = false;

    // ==================== LOGGING ====================

    private log(message: string): void {
        if (this.debugMode) {
            print(`[TurnBasedManager] ${message}`);
        }
    }

    private logError(message: string): void {
        print(`[TurnBasedManager] ERROR: ${message}`);
    }

    // ==================== GLOBAL VARIABLE KEYS ====================

    /**
     * Get key for storing a player's ship positions
     */
    private getShipsKey(userIndex: number): string {
        return `player${userIndex}_ships`;
    }

    /**
     * Get key for storing a player's grid state (hits/misses received)
     */
    private getGridKey(userIndex: number): string {
        return `player${userIndex}_grid`;
    }

    /**
     * Get key for storing a player's VIEW of the opponent grid (their outgoing shots)
     * This is separate from the opponent's actual grid to avoid leaking ship positions
     */
    private getOpponentViewKey(userIndex: number): string {
        return `player${userIndex}_opponentview`;
    }

    /**
     * Get key for storing a player's outgoing shot history (shots they fired at opponent)
     */
    private getOutgoingShotHistoryKey(userIndex: number): string {
        return `player${userIndex}_outgoing_shots`;
    }

    /**
     * Get key for storing a player's incoming shot history (shots received from opponent)
     */
    private getIncomingShotHistoryKey(userIndex: number): string {
        return `player${userIndex}_incoming_shots`;
    }

    // ==================== PERSISTENT STORAGE API ====================

    /**
     * Save player's ship positions to global variables
     * Called after setup confirmed
     */
    async savePlayerShips(ships: TurnData['shipPositions']): Promise<void> {
        if (!this.turnBased) {
            this.logError('savePlayerShips: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getShipsKey(userIndex);
            await tb.setGlobalVariable(key, ships);
            this.log(`savePlayerShips: Saved ${ships?.length || 0} ships to ${key}`);
        } catch (e) {
            this.logError(`savePlayerShips: Failed - ${e}`);
        }
    }

    /**
     * Load opponent's ship positions from global variables
     * Returns null if not yet available (opponent hasn't placed ships)
     */
    async loadOpponentShips(): Promise<TurnData['shipPositions'] | null> {
        if (!this.turnBased) {
            this.logError('loadOpponentShips: Turn-Based component not ready');
            return null;
        }

        const tb = this.turnBased as any;
        try {
            const opponentIndex = await tb.getOtherUserIndex();
            const key = this.getShipsKey(opponentIndex);
            const ships = await tb.getGlobalVariable(key);
            if (ships) {
                this.log(`loadOpponentShips: Loaded ${(ships as any[]).length} ships from ${key}`);
                return ships as TurnData['shipPositions'];
            }
            this.log(`loadOpponentShips: No ships found at ${key} (opponent may not have placed yet)`);
            return null;
        } catch (e) {
            this.logError(`loadOpponentShips: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Save current player's grid state to global variables
     * Called after a shot is evaluated on our grid
     */
    async savePlayerGrid(grid: CellState[][]): Promise<void> {
        if (!this.turnBased) {
            this.logError('savePlayerGrid: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getGridKey(userIndex);
            await tb.setGlobalVariable(key, grid);
            this.log(`savePlayerGrid: Saved grid to ${key}`);
        } catch (e) {
            this.logError(`savePlayerGrid: Failed - ${e}`);
        }
    }

    /**
     * Load opponent's grid state from global variables
     * Used to see where we've hit on opponent's grid
     */
    async loadOpponentGrid(): Promise<CellState[][] | null> {
        if (!this.turnBased) {
            this.logError('loadOpponentGrid: Turn-Based component not ready');
            return null;
        }

        const tb = this.turnBased as any;
        try {
            const opponentIndex = await tb.getOtherUserIndex();
            const key = this.getGridKey(opponentIndex);
            const grid = await tb.getGlobalVariable(key);
            if (grid) {
                this.log(`loadOpponentGrid: Loaded grid from ${key}`);
                return grid as CellState[][];
            }
            this.log(`loadOpponentGrid: No grid found at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadOpponentGrid: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Load player's own grid state from global variables
     * Used when reopening lens mid-session to restore state
     */
    async loadPlayerGrid(): Promise<CellState[][] | null> {
        if (!this.turnBased) {
            this.logError('loadPlayerGrid: Turn-Based component not ready');
            return null;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getGridKey(userIndex);
            const grid = await tb.getGlobalVariable(key);
            if (grid) {
                this.log(`loadPlayerGrid: Loaded grid from ${key}`);
                return grid as CellState[][];
            }
            this.log(`loadPlayerGrid: No grid found at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadPlayerGrid: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Save player's VIEW of opponent grid (their outgoing shots)
     * This tracks hit/miss/unknown - never contains 'object' values
     */
    async saveOpponentView(grid: CellState[][]): Promise<void> {
        print(`[DEBUG TBM] saveOpponentView: CALLED`);
        if (!this.turnBased) {
            this.logError('saveOpponentView: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getOpponentViewKey(userIndex);
            print(`[DEBUG TBM] saveOpponentView: Saving to key=${key}`);
            await tb.setGlobalVariable(key, grid);
            print(`[DEBUG TBM] saveOpponentView: SUCCESS`);
            this.log(`saveOpponentView: Saved to ${key}`);
        } catch (e) {
            print(`[DEBUG TBM] saveOpponentView: FAILED - ${e}`);
            this.logError(`saveOpponentView: Failed - ${e}`);
        }
    }

    /**
     * Load player's VIEW of opponent grid (their outgoing shots)
     * Returns the player's OWN view, not the opponent's actual grid
     */
    async loadOpponentView(): Promise<CellState[][] | null> {
        if (!this.turnBased) {
            this.logError('loadOpponentView: Turn-Based component not ready');
            return null;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getOpponentViewKey(userIndex);
            print(`[DEBUG TBM] loadOpponentView: key=${key}`);
            const grid = await tb.getGlobalVariable(key);
            print(`[DEBUG TBM] loadOpponentView: result=${grid ? 'HAS DATA' : 'NULL'}`);
            if (grid) {
                this.log(`loadOpponentView: Loaded from ${key}`);
                return grid as CellState[][];
            }
            this.log(`loadOpponentView: No data found at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadOpponentView: Failed - ${e}`);
            return null;
        }
    }

    // ==================== SHOT HISTORY PERSISTENCE ====================

    /**
     * Save player's outgoing shot history to global variables
     * Called after each shot result is received
     */
    async saveOutgoingShotHistory(history: ShotHistoryEntry[]): Promise<void> {
        print(`[DEBUG TBM] saveOutgoingShotHistory: CALLED with ${history.length} shots`);
        if (!this.turnBased) {
            this.logError('saveOutgoingShotHistory: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getOutgoingShotHistoryKey(userIndex);
            print(`[DEBUG TBM] saveOutgoingShotHistory: Saving to key=${key}`);
            await tb.setGlobalVariable(key, history);
            print(`[DEBUG TBM] saveOutgoingShotHistory: SUCCESS`);
            this.log(`saveOutgoingShotHistory: Saved ${history.length} shots to ${key}`);
        } catch (e) {
            print(`[DEBUG TBM] saveOutgoingShotHistory: FAILED - ${e}`);
            this.logError(`saveOutgoingShotHistory: Failed - ${e}`);
        }
    }

    /**
     * Load player's outgoing shot history from global variables
     * Used when reopening lens mid-session
     */
    async loadOutgoingShotHistory(): Promise<ShotHistoryEntry[]> {
        if (!this.turnBased) {
            this.logError('loadOutgoingShotHistory: Turn-Based component not ready');
            return [];
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getOutgoingShotHistoryKey(userIndex);
            const history = await tb.getGlobalVariable(key);
            print(`[DEBUG TBM] loadOutgoingShotHistory: result=${history ? (history.length + ' shots') : 'NULL'}`);
            if (history && Array.isArray(history)) {
                this.log(`loadOutgoingShotHistory: Loaded ${history.length} shots from ${key}`);
                return history as ShotHistoryEntry[];
            }
            this.log(`loadOutgoingShotHistory: No history found at ${key}`);
            return [];
        } catch (e) {
            this.logError(`loadOutgoingShotHistory: Failed - ${e}`);
            return [];
        }
    }

    /**
     * Save player's incoming shot history to global variables
     * Called after each incoming shot is evaluated
     */
    async saveIncomingShotHistory(history: ShotHistoryEntry[]): Promise<void> {
        if (!this.turnBased) {
            this.logError('saveIncomingShotHistory: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getIncomingShotHistoryKey(userIndex);
            await tb.setGlobalVariable(key, history);
            this.log(`saveIncomingShotHistory: Saved ${history.length} shots to ${key}`);
        } catch (e) {
            this.logError(`saveIncomingShotHistory: Failed - ${e}`);
        }
    }

    /**
     * Load player's incoming shot history from global variables
     * Used when reopening lens mid-session
     */
    async loadIncomingShotHistory(): Promise<ShotHistoryEntry[]> {
        if (!this.turnBased) {
            this.logError('loadIncomingShotHistory: Turn-Based component not ready');
            return [];
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getIncomingShotHistoryKey(userIndex);
            const history = await tb.getGlobalVariable(key);
            if (history && Array.isArray(history)) {
                this.log(`loadIncomingShotHistory: Loaded ${history.length} shots from ${key}`);
                return history as ShotHistoryEntry[];
            }
            this.log(`loadIncomingShotHistory: No history found at ${key}`);
            return [];
        } catch (e) {
            this.logError(`loadIncomingShotHistory: Failed - ${e}`);
            return [];
        }
    }

    /**
     * Load player's own ship positions from global variables
     * Used when reopening lens mid-session to restore state
     */
    async loadPlayerShips(): Promise<TurnData['shipPositions'] | null> {
        if (!this.turnBased) {
            this.logError('loadPlayerShips: Turn-Based component not ready');
            return null;
        }

        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = this.getShipsKey(userIndex);
            const ships = await tb.getGlobalVariable(key);
            if (ships) {
                this.log(`loadPlayerShips: Loaded ${(ships as any[]).length} ships from ${key}`);
                return ships as TurnData['shipPositions'];
            }
            this.log(`loadPlayerShips: No ships found at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadPlayerShips: Failed - ${e}`);
            return null;
        }
    }

    // ==================== PENDING SHOT (Global Variables) ====================

    /**
     * Save pending shot to global variable when firing
     * This is more reliable than turn variables
     */
    async savePendingShot(x: number, y: number): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `pendingShot_${userIndex}`;
            await tb.setGlobalVariable(key, { x, y });
            print(`[TBM DEBUG] savePendingShot: Saved shot (${x}, ${y}) to ${key}`);
        } catch (e) {
            this.logError(`savePendingShot: Failed - ${e}`);
        }
    }

    /**
     * Load pending shot from opponent's global variable
     */
    async loadPendingShotFromOpponent(): Promise<{x: number, y: number} | null> {
        if (!this.turnBased) return null;
        const tb = this.turnBased as any;
        try {
            const opponentIndex = await tb.getOtherUserIndex();
            const key = `pendingShot_${opponentIndex}`;
            const shot = await tb.getGlobalVariable(key);
            if (shot && typeof shot.x === 'number' && typeof shot.y === 'number') {
                print(`[TBM DEBUG] loadPendingShotFromOpponent: Found shot (${shot.x}, ${shot.y}) from ${key}`);
                return { x: shot.x, y: shot.y };
            }
            print(`[TBM DEBUG] loadPendingShotFromOpponent: No shot found at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadPendingShotFromOpponent: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Clear opponent's pending shot after processing
     */
    async clearOpponentPendingShot(): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            const opponentIndex = await tb.getOtherUserIndex();
            const key = `pendingShot_${opponentIndex}`;
            await tb.setGlobalVariable(key, null);
            print(`[TBM DEBUG] clearOpponentPendingShot: Cleared ${key}`);
        } catch (e) {
            this.logError(`clearOpponentPendingShot: Failed - ${e}`);
        }
    }

    // ==================== OWN PREVIOUS SHOT COORDS ====================

    /**
     * Save our own previous shot coordinates (so we can restore them on lens reopen)
     * This is different from pendingShot - this tracks WHERE WE SHOT, not incoming shots
     */
    async saveOwnPreviousShotCoords(x: number, y: number): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `ownPrevShot_${userIndex}`;
            await tb.setGlobalVariable(key, { x, y });
            print(`[DEBUG TBM] saveOwnPreviousShotCoords: Saved (${x}, ${y}) to ${key}`);
        } catch (e) {
            this.logError(`saveOwnPreviousShotCoords: Failed - ${e}`);
        }
    }

    /**
     * Load our own previous shot coordinates
     */
    async loadOwnPreviousShotCoords(): Promise<{x: number, y: number} | null> {
        if (!this.turnBased) return null;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `ownPrevShot_${userIndex}`;
            const shot = await tb.getGlobalVariable(key);
            if (shot && typeof shot.x === 'number' && typeof shot.y === 'number') {
                print(`[DEBUG TBM] loadOwnPreviousShotCoords: Found (${shot.x}, ${shot.y}) from ${key}`);
                return { x: shot.x, y: shot.y };
            }
            print(`[DEBUG TBM] loadOwnPreviousShotCoords: No data at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadOwnPreviousShotCoords: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Clear our own previous shot coordinates (after processing result)
     */
    async clearOwnPreviousShotCoords(): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `ownPrevShot_${userIndex}`;
            await tb.setGlobalVariable(key, null);
            print(`[DEBUG TBM] clearOwnPreviousShotCoords: Cleared ${key}`);
        } catch (e) {
            this.logError(`clearOwnPreviousShotCoords: Failed - ${e}`);
        }
    }

    // ==================== SHOT RESULT PERSISTENCE ====================

    /**
     * Save opponent's shot result to their global variable (so they can read it on reopen)
     * Called after evaluating incoming shot - saves result for the OPPONENT to read
     */
    async saveOpponentShotResult(result: ShotResult): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            // Save to OPPONENT's key (they will read this)
            const opponentIndex = await tb.getOtherUserIndex();
            const key = `player${opponentIndex}_lastShotResult`;
            await tb.setGlobalVariable(key, result);
            print(`[DEBUG TBM] saveOpponentShotResult: Saved ${result} to ${key}`);
        } catch (e) {
            this.logError(`saveOpponentShotResult: Failed - ${e}`);
        }
    }

    /**
     * Load our own previous shot result (saved by opponent after they evaluated it)
     */
    async loadOwnPreviousShotResult(): Promise<ShotResult | null> {
        if (!this.turnBased) return null;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `player${userIndex}_lastShotResult`;
            const result = await tb.getGlobalVariable(key);
            if (result) {
                print(`[DEBUG TBM] loadOwnPreviousShotResult: Found ${result} from ${key}`);
                return result as ShotResult;
            }
            print(`[DEBUG TBM] loadOwnPreviousShotResult: No data at ${key}`);
            return null;
        } catch (e) {
            this.logError(`loadOwnPreviousShotResult: Failed - ${e}`);
            return null;
        }
    }

    /**
     * Clear our own previous shot result (after it's been displayed)
     */
    async clearOwnPreviousShotResult(): Promise<void> {
        if (!this.turnBased) return;
        const tb = this.turnBased as any;
        try {
            const userIndex = await tb.getCurrentUserIndex();
            const key = `player${userIndex}_lastShotResult`;
            await tb.setGlobalVariable(key, null);
            print(`[DEBUG TBM] clearOwnPreviousShotResult: Cleared ${key}`);
        } catch (e) {
            this.logError(`clearOwnPreviousShotResult: Failed - ${e}`);
        }
    }

    // ==================== PRIVATE STATE ====================

    /** Multiplayer session state */
    private mpState: MultiplayerState = {
        turnCount: 0,
        pendingShot: null,
        selectedAim: null,
        opponentShipPositions: null,
        ourShipPositions: null,
        hasSentFirstTurn: false,
        previousShotResult: null
    };

    /** Result of evaluating incoming shot (to send back to opponent) */
    private incomingShotResult: ShotResult | null = null;

    /** Current user index (0 or 1), set on turn start */
    private currentUserIndex: number = -1;

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        print(`[TurnBasedManager] onAwake: turnBased input=${this.turnBased ? 'SET' : 'NULL'}`);

        if (!this.turnBased) {
            this.logError('turnBased not assigned! Drag the Turn-Based ScriptComponent here.');
            return;
        }

        // Verify turnBased has expected methods
        const tb = this.turnBased as any;
        print(`[TurnBasedManager] turnBased type check: endTurn=${typeof tb.endTurn}, setCurrentTurnVariable=${typeof tb.setCurrentTurnVariable}`);

        this.registerCallbacks();
        print(`[TurnBasedManager] Initialized successfully`);
    }

    // ==================== INITIALIZATION ====================

    private registerCallbacks(): void {
        const tb = this.turnBased as any;

        // onTurnStart - fires when it becomes our turn
        if (tb.onTurnStart && typeof tb.onTurnStart.add === 'function') {
            tb.onTurnStart.add((eventData: any) => {
                print(`[TurnBasedManager] onTurnStart: turnCount=${eventData.turnCount}`);
                this.handleTurnStart(eventData);
            });
            print(`[TurnBasedManager] onTurnStart registered`);
        }

        // onTurnEnd
        if (tb.onTurnEnd && typeof tb.onTurnEnd.add === 'function') {
            tb.onTurnEnd.add(() => {
                print(`[TurnBasedManager] onTurnEnd fired`);
            });
        }

        // onGameOver
        if (tb.onGameOver && typeof tb.onGameOver.add === 'function') {
            tb.onGameOver.add(() => {
                print(`[TurnBasedManager] onGameOver fired`);
                this.notifyGameManagerGameOver();
            });
        }

        // onError
        if (tb.onError && typeof tb.onError.add === 'function') {
            tb.onError.add((errorData: any) => {
                this.logError(`Turn-Based error: ${errorData.code} - ${errorData.description}`);
            });
        }
    }

    // ==================== PUBLIC API ====================

    /**
     * Check if this is the first turn (turnCount === 0)
     * Player 1 initiates, has no pending shot
     */
    isFirstTurn(): boolean {
        return this.mpState.turnCount === 0;
    }

    /**
     * Get current turn count
     */
    getTurnCount(): number {
        return this.mpState.turnCount;
    }

    /**
     * Get current user index (0 or 1)
     * Returns -1 if not yet determined
     */
    getCurrentUserIndex(): number {
        return this.currentUserIndex;
    }

    /**
     * Get current user index asynchronously from TurnBased component
     * Use this during setup phase when cached value might not be set yet
     */
    async getCurrentUserIndexAsync(): Promise<number> {
        const tb = this.turnBased as any;
        this.log(`getCurrentUserIndexAsync: cached=${this.currentUserIndex}, fetching from TurnBased...`);
        try {
            const userIndex = await tb.getCurrentUserIndex();
            this.log(`getCurrentUserIndexAsync: TurnBased returned ${userIndex}`);
            return userIndex ?? -1;
        } catch (e) {
            this.log(`getCurrentUserIndexAsync error: ${e}, falling back to cached=${this.currentUserIndex}`);
            return this.currentUserIndex; // fallback to cached
        }
    }

    /**
     * Check if there's a pending shot to evaluate
     */
    hasPendingShot(): boolean {
        return this.mpState.pendingShot !== null;
    }

    /**
     * Get pending shot coordinates (for showing indicator during setup)
     */
    getPendingShot(): PendingShot | null {
        return this.mpState.pendingShot;
    }

    /**
     * Set our ship positions (called by GameManager during setup)
     */
    setShipPositions(positions: TurnData['shipPositions']): void {
        this.mpState.ourShipPositions = positions;
        this.log(`setShipPositions: ${positions?.length || 0} ships stored`);
    }

    /**
     * Set the result of evaluating the incoming shot
     * Called by GameManager after evaluating pending shot against our grid
     */
    setIncomingShotResult(result: ShotResult): void {
        this.incomingShotResult = result;
        print(`[DEBUG TBM] setIncomingShotResult: CALLED with ${result}`);
        this.log(`setIncomingShotResult: ${result}`);
    }

    /**
     * Set selected aim for current turn
     * Called when player taps a cell on opponent grid
     */
    setSelectedAim(x: number, y: number): void {
        this.mpState.selectedAim = { x, y };
        this.log(`setSelectedAim: (${x}, ${y})`);
    }

    /**
     * Clear selected aim
     */
    clearSelectedAim(): void {
        this.mpState.selectedAim = null;
    }

    /**
     * Get selected aim
     */
    getSelectedAim(): PendingShot | null {
        return this.mpState.selectedAim;
    }

    /**
     * Get opponent's ship positions (if received)
     */
    getOpponentShipPositions(): TurnData['shipPositions'] | null {
        return this.mpState.opponentShipPositions;
    }

    /**
     * Get result of our previous shot (from opponent's response)
     */
    getPreviousShotResult(): ShotResult | null {
        return this.mpState.previousShotResult;
    }

    /**
     * Set previous shot result (used when restoring from global variables)
     */
    setPreviousShotResult(result: ShotResult): void {
        this.mpState.previousShotResult = result;
        print(`[DEBUG TBM] setPreviousShotResult: ${result}`);
    }

    /**
     * Clear previous shot result after it's been displayed
     */
    clearPreviousShotResult(): void {
        this.mpState.previousShotResult = null;
    }

    // ==================== ITurnHandler IMPLEMENTATION ====================

    /**
     * Not used in deferred flow - multiplayer waits for Turn-Based callback
     */
    startOpponentTurn(): void {
        this.log('startOpponentTurn: Waiting for Turn-Based callback');
    }

    /**
     * Not used in deferred flow - we use submitSelectedAim instead
     */
    onPlayerShotComplete(x: number, y: number, result: ShotResult): void {
        // Legacy - not used in deferred evaluation flow
        this.log('onPlayerShotComplete: (legacy, not used in deferred flow)');
    }

    /**
     * Called when game ends
     */
    onGameOver(winner: 'player' | 'opponent'): void {
        this.log(`onGameOver: Winner is ${winner}`);
    }

    /**
     * Reset state for new game
     */
    reset(): void {
        this.mpState = {
            turnCount: 0,
            pendingShot: null,
            selectedAim: null,
            opponentShipPositions: null,
            ourShipPositions: null,
            hasSentFirstTurn: false,
            previousShotResult: null
        };
        this.incomingShotResult = null;
        this.currentUserIndex = -1;
        this.log('reset: State cleared');
    }

    // ==================== TURN SUBMISSION ====================

    /**
     * Submit turn with selected aim
     * Called when player taps "Send" button
     */
    async submitSelectedAim(isGameOver: boolean = false, winner: 'player' | 'opponent' | null = null): Promise<void> {
        print(`[TurnBasedManager] submitSelectedAim called`);
        print(`[TurnBasedManager] selectedAim: ${this.mpState.selectedAim ? `(${this.mpState.selectedAim.x}, ${this.mpState.selectedAim.y})` : 'NULL'}`);
        print(`[TurnBasedManager] turnBased: ${this.turnBased ? 'SET' : 'NULL'}`);

        if (!this.mpState.selectedAim) {
            this.logError('submitSelectedAim: No aim selected');
            return;
        }

        if (!this.turnBased) {
            this.logError('submitSelectedAim: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBased as any;
        const { x, y } = this.mpState.selectedAim;
        print(`[TBM DEBUG] submitSelectedAim: Sending aim (${x}, ${y})`);
        print(`[TBM DEBUG] submitSelectedAim: tb.setCurrentTurnVariable exists = ${typeof tb.setCurrentTurnVariable}`);

        // Set turn variables
        print(`[TBM DEBUG] Setting shotX=${x}, shotY=${y}`);
        tb.setCurrentTurnVariable('shotX', x);
        tb.setCurrentTurnVariable('shotY', y);
        tb.setCurrentTurnVariable('isGameOver', isGameOver);
        print(`[TBM DEBUG] Turn variables set`);

        if (winner) {
            tb.setCurrentTurnVariable('winner', winner);
        }

        // Send result of opponent's previous shot (if we evaluated one)
        print(`[DEBUG TBM] submitSelectedAim: incomingShotResult = ${this.incomingShotResult}`);
        if (this.incomingShotResult) {
            tb.setCurrentTurnVariable('incomingShotResult', this.incomingShotResult);
            this.log(`submitSelectedAim: Including incomingShotResult=${this.incomingShotResult}`);
            this.incomingShotResult = null;
        } else {
            print(`[DEBUG TBM] submitSelectedAim: NOT including incomingShotResult (null)`);
        }

        // Include ship positions on first turn
        if (!this.mpState.hasSentFirstTurn && this.mpState.ourShipPositions) {
            tb.setCurrentTurnVariable('shipPositions', JSON.stringify(this.mpState.ourShipPositions));
            this.mpState.hasSentFirstTurn = true;
            this.log('submitSelectedAim: Including ship positions (first turn)');
        }

        // Mark final turn if game over
        if (isGameOver && typeof tb.setIsFinalTurn === 'function') {
            tb.setIsFinalTurn(true);
        }

        // Save pending shot to global variable (more reliable than turn variables)
        await this.savePendingShot(x, y);

        // End turn - triggers Snap capture
        print(`[TurnBasedManager] About to call endTurn...`);
        if (typeof tb.endTurn === 'function') {
            tb.endTurn();
            this.mpState.selectedAim = null;
            print(`[TurnBasedManager] endTurn() called successfully!`);
        } else {
            print(`[TurnBasedManager] ERROR: endTurn method not found`);
        }
    }

    // ==================== TURN RECEIVING ====================

    /**
     * Handle turn start callback from Turn-Based component
     */
    private async handleTurnStart(eventData: any): Promise<void> {
        print(`[TBM DEBUG] >>> handleTurnStart CALLED`);
        this.mpState.turnCount = eventData.turnCount || 0;
        this.currentUserIndex = eventData.currentUserIndex ?? -1;
        print(`[TBM DEBUG] handleTurnStart: turnCount=${this.mpState.turnCount}, userIndex=${this.currentUserIndex}`);
        this.log(`handleTurnStart: turnCount=${this.mpState.turnCount}, userIndex=${this.currentUserIndex}`);

        const prevVars = eventData.previousTurnVariables || {};
        print(`[TBM DEBUG] handleTurnStart: prevVars keys: ${Object.keys(prevVars).join(', ')}`);
        print(`[TBM DEBUG] handleTurnStart: prevVars.incomingShotResult = ${prevVars.incomingShotResult}`);
        print(`[TBM DEBUG] handleTurnStart: full prevVars = ${JSON.stringify(prevVars)}`);
        this.log(`handleTurnStart: prevVars keys: ${Object.keys(prevVars).join(', ')}`);

        // First turn (turnCount=0) - Player 1 initiates, no previous data
        if (this.mpState.turnCount === 0) {
            print(`[TBM DEBUG] handleTurnStart: First turn (turnCount=0), no incoming data`);
            this.log('handleTurnStart: First turn, no incoming data');
            this.notifyGameManagerTurnStart(false, null);
            return;
        }

        // Try to load pending shot from global variable (more reliable than turn variables)
        const pendingShot = await this.loadPendingShotFromOpponent();
        if (pendingShot) {
            this.mpState.pendingShot = pendingShot;
            print(`[TBM DEBUG] handleTurnStart: Loaded pending shot from global var: (${pendingShot.x}, ${pendingShot.y})`);
        }

        // Parse any other incoming data from turn variables
        this.parseIncomingTurnData(prevVars);
    }

    /**
     * Parse turn data from previousTurnVariables
     */
    private parseIncomingTurnData(vars: any): void {
        // Extract opponent's ship positions (if present - their first turn)
        if (vars.shipPositions) {
            try {
                this.mpState.opponentShipPositions = typeof vars.shipPositions === 'string'
                    ? JSON.parse(vars.shipPositions)
                    : vars.shipPositions;
                this.log(`parseIncomingTurnData: Received ${this.mpState.opponentShipPositions?.length} opponent ship positions`);
            } catch (e) {
                this.logError('parseIncomingTurnData: Could not parse shipPositions');
            }
        }

        // Extract result of OUR previous shot (opponent tells us what happened)
        print(`[DEBUG TBM] parseIncomingTurnData: vars.incomingShotResult = ${vars.incomingShotResult}`);
        if (vars.incomingShotResult) {
            this.mpState.previousShotResult = vars.incomingShotResult as ShotResult;
            this.log(`parseIncomingTurnData: Our previous shot result: ${this.mpState.previousShotResult}`);
        } else {
            print(`[DEBUG TBM] parseIncomingTurnData: NO incomingShotResult in turn vars!`);
        }

        // Extract opponent's aim (pending shot for us to evaluate)
        // Handle both number and string types from Turn-Based component
        print(`[TBM DEBUG] parseIncomingTurnData: vars.shotX=${vars.shotX} (${typeof vars.shotX}), vars.shotY=${vars.shotY} (${typeof vars.shotY})`);
        const shotX = typeof vars.shotX === 'number' ? vars.shotX :
                      typeof vars.shotX === 'string' ? parseInt(vars.shotX, 10) : NaN;
        const shotY = typeof vars.shotY === 'number' ? vars.shotY :
                      typeof vars.shotY === 'string' ? parseInt(vars.shotY, 10) : NaN;
        print(`[TBM DEBUG] parseIncomingTurnData: parsed shotX=${shotX}, shotY=${shotY}`);

        if (!isNaN(shotX) && !isNaN(shotY) && shotX >= 0 && shotX < GRID_SIZE && shotY >= 0 && shotY < GRID_SIZE) {
            this.mpState.pendingShot = {
                x: Math.floor(shotX),
                y: Math.floor(shotY)
            };
            this.log(`parseIncomingTurnData: Pending shot at (${this.mpState.pendingShot.x}, ${this.mpState.pendingShot.y})`);
        } else if (vars.shotX !== undefined || vars.shotY !== undefined) {
            this.logError(`parseIncomingTurnData: Invalid shot coordinates (${vars.shotX}, ${vars.shotY}) - types: ${typeof vars.shotX}, ${typeof vars.shotY}`);
        }

        // Check for game over
        if (vars.isGameOver) {
            this.log(`parseIncomingTurnData: Game over! Winner: ${vars.winner}`);
            // Flip perspective: if opponent says "player" won, that means they won, so we lost
            const ourResult = vars.winner === 'player' ? 'opponent' : 'player';
            this.notifyGameManagerGameOver(ourResult);
            return;
        }

        // Notify GameManager
        const hasPending = this.mpState.pendingShot !== null;
        print(`[TBM DEBUG] parseIncomingTurnData: hasPending=${hasPending}, pendingShot=${JSON.stringify(this.mpState.pendingShot)}`);
        this.notifyGameManagerTurnStart(hasPending, this.mpState.previousShotResult);
    }

    /**
     * Clear pending shot after it's been evaluated
     */
    clearPendingShot(): void {
        this.mpState.pendingShot = null;
        this.log('clearPendingShot: Pending shot cleared');
    }

    // ==================== GAMEMANAGER NOTIFICATIONS ====================

    private getGameManagerScript(): any {
        if (!this.gameManager) {
            this.logError('getGameManagerScript: gameManager not set');
            return null;
        }

        const scripts = this.gameManager.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && typeof script.getState === 'function') {
                return script;
            }
        }

        this.logError('getGameManagerScript: GameManager script not found');
        return null;
    }

    /**
     * Notify GameManager that it's our turn
     */
    private notifyGameManagerTurnStart(hasPendingShot: boolean, previousShotResult: ShotResult | null): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.onMultiplayerTurnStart === 'function') {
            gm.onMultiplayerTurnStart(this.mpState.turnCount, hasPendingShot, previousShotResult);
        }
    }

    /**
     * Notify GameManager of game over
     */
    private notifyGameManagerGameOver(winner?: 'player' | 'opponent'): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.onMultiplayerGameOver === 'function') {
            gm.onMultiplayerGameOver(winner || 'opponent');
        }
    }
}
