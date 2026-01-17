// TurnBasedManager - Handles multiplayer turn logic via Snap's Turn-Based component
// Implements deferred shot evaluation: shots are evaluated by the RECEIVER, not sender

import {
    ITurnHandler, TurnData, ShotResult, PendingShot, MultiplayerState, GRID_SIZE
} from './types/GameTypes';

@component
export class TurnBasedManager extends BaseScriptComponent implements ITurnHandler {

    // ==================== INPUTS ====================

    /** Turn-Based script component - drag the Turn-Based component here directly */
    @input turnBasedScript: ScriptComponent;

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

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        print(`[TurnBasedManager] onAwake: turnBasedScript=${this.turnBasedScript ? 'SET' : 'NULL'}`);

        if (!this.turnBasedScript) {
            this.logError('turnBasedScript not assigned! Drag the Turn-Based component here.');
            return;
        }

        this.registerCallbacks();
        print(`[TurnBasedManager] Initialized successfully`);
    }

    // ==================== INITIALIZATION ====================

    private registerCallbacks(): void {
        const tb = this.turnBasedScript as any;

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
                this.log('onTurnEnd fired');
            });
        }

        // onGameOver
        if (tb.onGameOver && typeof tb.onGameOver.add === 'function') {
            tb.onGameOver.add(() => {
                this.log('onGameOver fired');
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
        this.log('reset: State cleared');
    }

    // ==================== TURN SUBMISSION ====================

    /**
     * Submit turn with selected aim
     * Called when player taps "Send" button
     */
    submitSelectedAim(isGameOver: boolean = false, winner: 'player' | 'opponent' | null = null): void {
        print(`[TurnBasedManager] submitSelectedAim called`);
        print(`[TurnBasedManager] selectedAim: ${this.mpState.selectedAim ? `(${this.mpState.selectedAim.x}, ${this.mpState.selectedAim.y})` : 'NULL'}`);
        print(`[TurnBasedManager] turnBasedScript: ${this.turnBasedScript ? 'SET' : 'NULL'}`);

        if (!this.mpState.selectedAim) {
            this.logError('submitSelectedAim: No aim selected');
            return;
        }

        if (!this.turnBasedScript) {
            this.logError('submitSelectedAim: Turn-Based component not ready');
            return;
        }

        const tb = this.turnBasedScript as any;
        const { x, y } = this.mpState.selectedAim;
        print(`[TurnBasedManager] submitSelectedAim: Sending aim (${x}, ${y})`);

        // Set turn variables
        tb.setCurrentTurnVariable('shotX', x);
        tb.setCurrentTurnVariable('shotY', y);
        tb.setCurrentTurnVariable('isGameOver', isGameOver);

        if (winner) {
            tb.setCurrentTurnVariable('winner', winner);
        }

        // Send result of opponent's previous shot (if we evaluated one)
        if (this.incomingShotResult) {
            tb.setCurrentTurnVariable('incomingShotResult', this.incomingShotResult);
            this.log(`submitSelectedAim: Including incomingShotResult=${this.incomingShotResult}`);
            this.incomingShotResult = null;
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
    private handleTurnStart(eventData: any): void {
        this.mpState.turnCount = eventData.turnCount || 0;
        this.log(`handleTurnStart: turnCount=${this.mpState.turnCount}`);

        const prevVars = eventData.previousTurnVariables || {};
        this.log(`handleTurnStart: prevVars keys: ${Object.keys(prevVars).join(', ')}`);

        // First turn (turnCount=0) - Player 1 initiates, no previous data
        if (this.mpState.turnCount === 0 || Object.keys(prevVars).length === 0) {
            this.log('handleTurnStart: First turn, no incoming data');
            this.notifyGameManagerTurnStart(false, null);
            return;
        }

        // Parse incoming data
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
        if (vars.incomingShotResult) {
            this.mpState.previousShotResult = vars.incomingShotResult as ShotResult;
            this.log(`parseIncomingTurnData: Our previous shot result: ${this.mpState.previousShotResult}`);
        }

        // Extract opponent's aim (pending shot for us to evaluate)
        if (typeof vars.shotX === 'number' && typeof vars.shotY === 'number') {
            // Validate coordinates
            if (vars.shotX >= 0 && vars.shotX < GRID_SIZE && vars.shotY >= 0 && vars.shotY < GRID_SIZE) {
                this.mpState.pendingShot = {
                    x: Math.floor(vars.shotX),
                    y: Math.floor(vars.shotY)
                };
                this.log(`parseIncomingTurnData: Pending shot at (${this.mpState.pendingShot.x}, ${this.mpState.pendingShot.y})`);
            } else {
                this.logError(`parseIncomingTurnData: Invalid shot coordinates (${vars.shotX}, ${vars.shotY})`);
            }
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
