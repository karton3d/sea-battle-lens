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
     */
    private registerCallbacks(): void {
        if (!this.turnBasedScript) return;

        // Register turn start callback
        if (this.tryRegisterCallback('_onTurnStartResponses', (turnData: string) => {
            this.handleTurnStart(turnData);
        })) {
            this.log('registerCallbacks: onTurnStart registered');
        }

        // Register turn end callback
        if (this.tryRegisterCallback('_onTurnEndResponses', () => {
            this.handleTurnEnd();
        })) {
            this.log('registerCallbacks: onTurnEnd registered');
        }

        // Register game over callback
        if (this.tryRegisterCallback('_onGameOverResponses', () => {
            this.handleGameOverFromTurnBased();
        })) {
            this.log('registerCallbacks: onGameOver registered');
        }

        this.log('registerCallbacks: Done');
    }

    /**
     * Safely try to register a callback on the Turn-Based script
     */
    private tryRegisterCallback(eventName: string, callback: Function): boolean {
        const event = this.turnBasedScript[eventName];
        if (!event) {
            this.log(`tryRegisterCallback: "${eventName}" not found`);
            return false;
        }

        if (typeof event.add === 'function') {
            event.add(callback);
            return true;
        }

        // Maybe it's a different API pattern
        if (typeof event === 'function') {
            this.log(`tryRegisterCallback: "${eventName}" is a function, not an event`);
        } else {
            this.log(`tryRegisterCallback: "${eventName}" exists but .add is not a function (type: ${typeof event})`);
        }
        return false;
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
     */
    submitTurn(turnData: TurnData): void {
        this.log('submitTurn: Submitting turn data');
        this.log(`[TURN] Submit: shot=(${turnData.shotX}, ${turnData.shotY}), result=${turnData.result}, gameOver=${turnData.isGameOver}`);

        // Serialize turn data
        const serialized = this.serializeTurnData(turnData);
        if (!serialized) {
            this.logError('submitTurn: Serialization failed');
            return;
        }

        // Check if Turn-Based component is ready
        if (!this.turnBasedScript) {
            this.logError('submitTurn: Turn-Based component not ready');
            return;
        }

        // Submit via Turn-Based API
        if (typeof this.turnBasedScript.submitTurn === 'function') {
            this.turnBasedScript.submitTurn(serialized);
            this._isMyTurn = false;
            this.log('submitTurn: Turn submitted successfully');
        } else {
            this.logError('submitTurn: submitTurn method not found');
        }
    }

    /**
     * Serialize turn data to JSON string
     */
    private serializeTurnData(turnData: TurnData): string | null {
        try {
            const json = JSON.stringify(turnData);
            this.log(`serializeTurnData: ${json.length} bytes`);
            return json;
        } catch (e) {
            this.logError('serializeTurnData: JSON.stringify failed');
            return null;
        }
    }

    // ==================== TURN RECEIVING (Story 1.3) ====================

    /**
     * Handle turn start callback from Turn-Based component
     * Called when it becomes this player's turn (with opponent's previous turn data)
     */
    private handleTurnStart(turnDataJson: string): void {
        this.log('handleTurnStart: Received turn data');
        this._isMyTurn = true;

        // Deserialize turn data
        const turnData = this.deserializeTurnData(turnDataJson);
        if (!turnData) {
            this.log('handleTurnStart: No valid turn data (may be first turn)');
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
     * Deserialize turn data from JSON string
     */
    private deserializeTurnData(json: string): TurnData | null {
        if (!json || json.trim() === '') {
            return null;
        }

        try {
            const data = JSON.parse(json);

            // Validate required fields
            if (typeof data.shotX !== 'number' || typeof data.shotY !== 'number') {
                this.log('deserializeTurnData: Missing required fields');
                return null;
            }

            // Validate shot coordinates
            if (data.shotX < 0 || data.shotX >= GRID_SIZE || data.shotY < 0 || data.shotY >= GRID_SIZE) {
                this.log(`deserializeTurnData: Invalid coordinates (${data.shotX}, ${data.shotY})`);
                return null;
            }

            // Type coercion for safety
            const turnData: TurnData = {
                shotX: Math.floor(data.shotX),
                shotY: Math.floor(data.shotY),
                result: data.result || 'miss',
                hitsCount: data.hitsCount ? Math.floor(data.hitsCount) : undefined,
                isGameOver: Boolean(data.isGameOver),
                winner: data.winner || null,
                shipPositions: data.shipPositions || undefined
            };

            this.log('deserializeTurnData: Valid turn data parsed');
            return turnData;

        } catch (e) {
            this.logError('deserializeTurnData: JSON.parse failed');
            return null;
        }
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
