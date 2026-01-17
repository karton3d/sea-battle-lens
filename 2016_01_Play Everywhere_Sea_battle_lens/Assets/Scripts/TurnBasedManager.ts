// TurnBasedManager - Handles multiplayer turn logic via Snap's Turn-Based component
// Implements ITurnHandler interface for turn abstraction

import { ITurnHandler, TurnData, ShotResult, GRID_SIZE } from './types/GameTypes';

@component
export class TurnBasedManager extends BaseScriptComponent implements ITurnHandler {

    // ==================== INPUTS ====================

    /** Reference to Turn-Based SceneObject from scene */
    @allowUndefined
    @input turnBasedObject: SceneObject;

    /** Direct reference to Turn-Based script (alternative to turnBasedObject) */
    @allowUndefined
    @input turnBasedScriptInput: ScriptComponent;

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

    /** Reference to Turn-Based script component */
    private turnBasedScript: any = null;

    /** Whether it's currently this player's turn */
    private _isMyTurn: boolean = false;

    /** Whether this is the first turn (for ship position exchange) */
    private isFirstTurn: boolean = true;

    /** Ship positions to send on first turn */
    private pendingShipPositions: TurnData['shipPositions'] | null = null;

    /** Queued turn data waiting to be processed */
    private pendingTurnData: TurnData | null = null;

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        this.log('onAwake: Initializing');
        this.initializeTurnBased();
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialize Turn-Based component reference and callbacks
     */
    private initializeTurnBased(): void {
        if (!this.turnBasedObject) {
            this.log('initializeTurnBased: WARNING - turnBasedObject not set');
            return;
        }

        // Get Turn-Based script component
        this.turnBasedScript = this.getTurnBasedScript();
        if (!this.turnBasedScript) {
            this.logError('initializeTurnBased: Turn-Based script not found');
            return;
        }

        // Register callbacks
        this.registerCallbacks();

        this.log('initializeTurnBased: Complete');
    }

    /**
     * Get Turn-Based script from direct input or SceneObject
     */
    private getTurnBasedScript(): any {
        // Option 1: Direct script input (preferred)
        if (this.turnBasedScriptInput) {
            const script = this.turnBasedScriptInput as any;
            this.log('getTurnBasedScript: Using direct turnBasedScriptInput');
            this.logAvailableMethods(script, 'turnBasedScriptInput');
            return script;
        }

        // Option 2: Search in SceneObject
        if (!this.turnBasedObject) {
            this.log('getTurnBasedScript: No turnBasedObject or turnBasedScriptInput set');
            return null;
        }

        this.log(`getTurnBasedScript: Searching in object "${this.turnBasedObject.name}"`);
        const scripts = this.turnBasedObject.getComponents("Component.ScriptComponent");
        this.log(`getTurnBasedScript: Found ${scripts.length} ScriptComponent(s)`);

        // Just return the first script component found
        if (scripts.length > 0) {
            const script = scripts[0] as any;
            this.logAvailableMethods(script, 'Script[0]');
            return script;
        }

        this.log('getTurnBasedScript: No ScriptComponent found');
        return null;
    }

    /**
     * Log available methods/properties on a script for debugging
     */
    private logAvailableMethods(script: any, label: string): void {
        try {
            const keys = Object.keys(script);
            this.log(`${label} properties: ${keys.slice(0, 20).join(', ')}${keys.length > 20 ? '...' : ''}`);

            // Check for common Turn-Based patterns
            const patterns = ['submitTurn', 'endTurn', 'onTurnStart', 'onTurnEnd', '_onTurnStartResponses'];
            for (const p of patterns) {
                if (script[p] !== undefined) {
                    this.log(`${label} has "${p}": ${typeof script[p]}`);
                }
            }
        } catch (e) {
            this.log(`${label}: Could not enumerate properties`);
        }
    }

    /**
     * Register callbacks with Turn-Based component
     * Uses the correct Turn-Based API: onTurnStart, onTurnEnd, onGameOver, onError
     */
    private registerCallbacks(): void {
        if (!this.turnBasedScript) return;

        // Register turn start callback - fires when turn begins with previous turn data
        if (this.turnBasedScript.onTurnStart && typeof this.turnBasedScript.onTurnStart.add === 'function') {
            this.turnBasedScript.onTurnStart.add((eventData: any) => {
                this.log(`onTurnStart fired: turnCount=${eventData.turnCount}, userIndex=${eventData.currentUserIndex}`);
                this.handleTurnStart(eventData);
            });
            this.log('registerCallbacks: onTurnStart registered');
        } else {
            this.log('registerCallbacks: WARNING - onTurnStart not found');
        }

        // Register turn end callback
        if (this.turnBasedScript.onTurnEnd && typeof this.turnBasedScript.onTurnEnd.add === 'function') {
            this.turnBasedScript.onTurnEnd.add(() => {
                this.handleTurnEnd();
            });
            this.log('registerCallbacks: onTurnEnd registered');
        }

        // Register game over callback
        if (this.turnBasedScript.onGameOver && typeof this.turnBasedScript.onGameOver.add === 'function') {
            this.turnBasedScript.onGameOver.add(() => {
                this.handleGameOverFromTurnBased();
            });
            this.log('registerCallbacks: onGameOver registered');
        }

        // Register error callback
        if (this.turnBasedScript.onError && typeof this.turnBasedScript.onError.add === 'function') {
            this.turnBasedScript.onError.add((errorData: any) => {
                this.logError(`Turn-Based error: ${errorData.code} - ${errorData.description}`);
            });
            this.log('registerCallbacks: onError registered');
        }

        this.log('registerCallbacks: Done');
    }

    // ==================== PUBLIC API ====================

    /**
     * Check if it's currently this player's turn
     */
    isMyTurn(): boolean {
        return this._isMyTurn;
    }

    /**
     * Set ship positions for first turn exchange
     * Called by GameManager during setup phase
     */
    setShipPositions(positions: TurnData['shipPositions']): void {
        this.pendingShipPositions = positions;
        this.log(`setShipPositions: ${positions?.length || 0} ships set`);
    }

    // ==================== ITurnHandler IMPLEMENTATION ====================

    /**
     * Called when it's the opponent's turn to act
     * For multiplayer: we wait for Turn-Based callback with opponent's turn data
     */
    startOpponentTurn(): void {
        this.log('startOpponentTurn: Waiting for opponent turn data');
        this._isMyTurn = false;

        // In multiplayer, we don't actively do anything here
        // The Turn-Based component will call our callback when opponent submits
    }

    /**
     * Called after player makes a shot
     * Submits turn data via Turn-Based component
     */
    onPlayerShotComplete(x: number, y: number, result: ShotResult): void {
        this.log(`onPlayerShotComplete: Shot (${x}, ${y}) = ${result}`);

        // Check for game over (handled separately)
        const gm = this.getGameManagerScript();
        const isGameOver = gm ? gm.isGameOver() : false;
        const winner = gm ? gm.getWinner() : null;

        // Build turn data
        const turnData: TurnData = {
            shotX: x,
            shotY: y,
            result: result,
            hitsCount: gm ? gm.getPlayerHits() : 0,
            isGameOver: isGameOver,
            winner: isGameOver ? (winner === 'player' ? 'opponent' : 'player') : null // Flip perspective for opponent
        };

        // Include ship positions on first turn
        if (this.isFirstTurn && this.pendingShipPositions) {
            turnData.shipPositions = this.pendingShipPositions;
            this.pendingShipPositions = null;
            this.isFirstTurn = false;
            this.log('onPlayerShotComplete: Including ship positions in first turn');
        }

        // Submit turn
        this.submitTurn(turnData);
    }

    /**
     * Called when game ends
     */
    onGameOver(winner: 'player' | 'opponent'): void {
        this.log(`onGameOver: Winner is ${winner}`);
        // Turn-Based component may handle game over state automatically
        // Final turn data is submitted in onPlayerShotComplete with isGameOver=true
    }

    /**
     * Reset state for new game
     */
    reset(): void {
        this._isMyTurn = false;
        this.isFirstTurn = true;
        this.pendingShipPositions = null;
        this.pendingTurnData = null;
        this.log('reset: State cleared');
    }

    // ==================== TURN SUBMISSION (Story 1.2) ====================

    /**
     * Submit turn data via Turn-Based component
     * Uses setCurrentTurnVariable() + endTurn() API
     */
    submitTurn(turnData: TurnData): void {
        this.log('submitTurn: Submitting turn data');
        this.log(`[TURN] Submit: shot=(${turnData.shotX}, ${turnData.shotY}), result=${turnData.result}, gameOver=${turnData.isGameOver}`);

        // Check if Turn-Based component is ready
        if (!this.turnBasedScript) {
            this.logError('submitTurn: Turn-Based component not ready');
            return;
        }

        // Check for setCurrentTurnVariable method
        if (typeof this.turnBasedScript.setCurrentTurnVariable !== 'function') {
            this.logError('submitTurn: setCurrentTurnVariable method not found');
            return;
        }

        // Set turn variables using the correct API
        this.turnBasedScript.setCurrentTurnVariable('shotX', turnData.shotX);
        this.turnBasedScript.setCurrentTurnVariable('shotY', turnData.shotY);
        this.turnBasedScript.setCurrentTurnVariable('result', turnData.result);
        this.turnBasedScript.setCurrentTurnVariable('isGameOver', turnData.isGameOver);

        if (turnData.hitsCount !== undefined) {
            this.turnBasedScript.setCurrentTurnVariable('hitsCount', turnData.hitsCount);
        }
        if (turnData.winner) {
            this.turnBasedScript.setCurrentTurnVariable('winner', turnData.winner);
        }

        // Include ship positions on first turn (as JSON string since it's complex)
        if (turnData.shipPositions) {
            this.turnBasedScript.setCurrentTurnVariable('shipPositions', JSON.stringify(turnData.shipPositions));
            this.log('submitTurn: Including ship positions');
        }

        this.log('submitTurn: Turn variables set, calling endTurn()');

        // Mark as final turn if game over
        if (turnData.isGameOver && typeof this.turnBasedScript.setIsFinalTurn === 'function') {
            this.turnBasedScript.setIsFinalTurn(true);
        }

        // Complete the turn - this triggers Snap capture
        if (typeof this.turnBasedScript.endTurn === 'function') {
            this.turnBasedScript.endTurn();
            this._isMyTurn = false;
            this.log('submitTurn: endTurn() called successfully');
        } else {
            this.logError('submitTurn: endTurn method not found');
        }
    }

    // ==================== TURN RECEIVING (Story 1.3) ====================

    /**
     * Handle turn start callback from Turn-Based component
     * Called when it becomes this player's turn (with opponent's previous turn data)
     * eventData contains: currentUserIndex, tappedKey, turnCount, previousTurnVariables
     */
    private handleTurnStart(eventData: any): void {
        this.log('handleTurnStart: Received turn data');
        this._isMyTurn = true;

        const prevVars = eventData.previousTurnVariables || {};
        this.log(`handleTurnStart: turnCount=${eventData.turnCount}, prevVars keys: ${Object.keys(prevVars).join(', ')}`);

        // First turn (turnCount=0) has no previous data
        if (eventData.turnCount === 0 || Object.keys(prevVars).length === 0) {
            this.log('handleTurnStart: First turn, no previous data');
            this.notifyGameManagerTurnStart(null);
            return;
        }

        // Parse turn data from previousTurnVariables
        const turnData = this.parseTurnVariables(prevVars);
        if (!turnData) {
            this.log('handleTurnStart: Could not parse turn variables');
            this.notifyGameManagerTurnStart(null);
            return;
        }

        this.log(`[TURN] Received: shot=(${turnData.shotX}, ${turnData.shotY}), result=${turnData.result}, gameOver=${turnData.isGameOver}`);

        // Process opponent's turn data
        this.processReceivedTurn(turnData);
    }

    /**
     * Handle turn end callback
     */
    private handleTurnEnd(): void {
        this.log('handleTurnEnd: Turn ended');
        this._isMyTurn = false;
    }

    /**
     * Handle game over callback from Turn-Based
     */
    private handleGameOverFromTurnBased(): void {
        this.log('handleGameOverFromTurnBased: Game over signal received');
        // GameManager will handle game over UI
    }

    /**
     * Parse turn data from previousTurnVariables map
     */
    private parseTurnVariables(vars: any): TurnData | null {
        // Check for required shot coordinates
        if (typeof vars.shotX !== 'number' || typeof vars.shotY !== 'number') {
            this.log('parseTurnVariables: Missing shotX/shotY');
            return null;
        }

        // Validate shot coordinates
        if (vars.shotX < 0 || vars.shotX >= GRID_SIZE || vars.shotY < 0 || vars.shotY >= GRID_SIZE) {
            this.log(`parseTurnVariables: Invalid coordinates (${vars.shotX}, ${vars.shotY})`);
            return null;
        }

        // Parse ship positions if present (stored as JSON string)
        let shipPositions = undefined;
        if (vars.shipPositions) {
            try {
                shipPositions = typeof vars.shipPositions === 'string'
                    ? JSON.parse(vars.shipPositions)
                    : vars.shipPositions;
            } catch (e) {
                this.log('parseTurnVariables: Could not parse shipPositions');
            }
        }

        const turnData: TurnData = {
            shotX: Math.floor(vars.shotX),
            shotY: Math.floor(vars.shotY),
            result: vars.result || 'miss',
            hitsCount: vars.hitsCount ? Math.floor(vars.hitsCount) : undefined,
            isGameOver: Boolean(vars.isGameOver),
            winner: vars.winner || null,
            shipPositions: shipPositions
        };

        this.log('parseTurnVariables: Valid turn data parsed');
        return turnData;
    }

    /**
     * Process received turn data - apply opponent's shot to player grid
     */
    private processReceivedTurn(turnData: TurnData): void {
        this.log(`processReceivedTurn: Processing opponent shot (${turnData.shotX}, ${turnData.shotY})`);

        // Store ship positions if this is first turn with positions
        if (turnData.shipPositions && turnData.shipPositions.length > 0) {
            this.log(`processReceivedTurn: Received ${turnData.shipPositions.length} opponent ship positions`);
            this.storeOpponentShipPositions(turnData.shipPositions);
        }

        // Check for game over
        if (turnData.isGameOver) {
            this.log(`processReceivedTurn: Game over! Winner: ${turnData.winner}`);
            this.notifyGameManagerGameOver(turnData.winner === 'player' ? 'opponent' : 'player'); // Flip perspective
            return;
        }

        // Notify GameManager of opponent's shot
        this.notifyGameManagerOpponentShot(turnData.shotX, turnData.shotY, turnData.result);
    }

    /**
     * Store opponent's ship positions
     */
    private storeOpponentShipPositions(positions: TurnData['shipPositions']): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.setOpponentShipPositions === 'function') {
            gm.setOpponentShipPositions(positions);
            this.log('storeOpponentShipPositions: Positions sent to GameManager');
        } else {
            this.log('storeOpponentShipPositions: WARNING - setOpponentShipPositions not found');
        }
    }

    /**
     * Notify GameManager that it's player's turn
     */
    private notifyGameManagerTurnStart(turnData: TurnData | null): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.onMultiplayerTurnStart === 'function') {
            gm.onMultiplayerTurnStart(turnData);
        }
    }

    /**
     * Notify GameManager of opponent's shot
     */
    private notifyGameManagerOpponentShot(x: number, y: number, result: ShotResult): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.processOpponentShot === 'function') {
            gm.processOpponentShot(x, y, result);
            this.log(`notifyGameManagerOpponentShot: Sent (${x}, ${y}) = ${result}`);
        } else {
            this.logError('notifyGameManagerOpponentShot: processOpponentShot not found');
        }
    }

    /**
     * Notify GameManager of game over
     */
    private notifyGameManagerGameOver(winner: 'player' | 'opponent'): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.onMultiplayerGameOver === 'function') {
            gm.onMultiplayerGameOver(winner);
            this.log(`notifyGameManagerGameOver: Winner is ${winner}`);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get GameManager script from reference
     */
    private getGameManagerScript(): any {
        if (!this.gameManager) {
            this.logError('getGameManagerScript: gameManager not set');
            return null;
        }

        const scripts = this.gameManager.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            // Check for GameManager markers
            if (script && typeof script.getState === 'function') {
                return script;
            }
        }

        this.logError('getGameManagerScript: GameManager script not found');
        return null;
    }
}
