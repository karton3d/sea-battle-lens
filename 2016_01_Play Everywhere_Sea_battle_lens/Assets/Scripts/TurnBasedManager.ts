// TurnBasedManager - Handles multiplayer turn logic via Snap's Turn-Based component
// Implements ITurnHandler interface for turn abstraction

import { ITurnHandler, TurnData, ShotResult, GRID_SIZE } from './types/GameTypes';

@component
export class TurnBasedManager extends BaseScriptComponent implements ITurnHandler {

    // ==================== INPUTS ====================

    /** Reference to Turn-Based SceneObject from scene */
    @input turnBasedObject: SceneObject;

    /** Reference to GameManager for callbacks */
    @input gameManager: SceneObject;

    /** Enable debug mode for single-device testing */
    @input debugMode: boolean = false;

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
        print('[TurnBasedManager] onAwake: Initializing');
        this.initializeTurnBased();
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialize Turn-Based component reference and callbacks
     */
    private initializeTurnBased(): void {
        if (!this.turnBasedObject) {
            print('[TurnBasedManager] initializeTurnBased: WARNING - turnBasedObject not set');
            return;
        }

        // Get Turn-Based script component
        this.turnBasedScript = this.getTurnBasedScript();
        if (!this.turnBasedScript) {
            print('[TurnBasedManager] initializeTurnBased: ERROR - Turn-Based script not found');
            return;
        }

        // Register callbacks
        this.registerCallbacks();

        print('[TurnBasedManager] initializeTurnBased: Complete');
    }

    /**
     * Get Turn-Based script from SceneObject
     */
    private getTurnBasedScript(): any {
        if (!this.turnBasedObject) return null;

        const scripts = this.turnBasedObject.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            // Check for Turn-Based component markers
            if (script && typeof script.submitTurn === 'function') {
                print('[TurnBasedManager] getTurnBasedScript: Found Turn-Based component');
                return script;
            }
        }

        print('[TurnBasedManager] getTurnBasedScript: Turn-Based component not found');
        return null;
    }

    /**
     * Register callbacks with Turn-Based component
     */
    private registerCallbacks(): void {
        if (!this.turnBasedScript) return;

        // Register turn start callback
        if (this.turnBasedScript._onTurnStartResponses) {
            this.turnBasedScript._onTurnStartResponses.add((turnData: string) => {
                this.handleTurnStart(turnData);
            });
            print('[TurnBasedManager] registerCallbacks: onTurnStart registered');
        }

        // Register turn end callback
        if (this.turnBasedScript._onTurnEndResponses) {
            this.turnBasedScript._onTurnEndResponses.add(() => {
                this.handleTurnEnd();
            });
            print('[TurnBasedManager] registerCallbacks: onTurnEnd registered');
        }

        // Register game over callback
        if (this.turnBasedScript._onGameOverResponses) {
            this.turnBasedScript._onGameOverResponses.add(() => {
                this.handleGameOverFromTurnBased();
            });
            print('[TurnBasedManager] registerCallbacks: onGameOver registered');
        }

        print('[TurnBasedManager] registerCallbacks: All callbacks registered');
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
        print(`[TurnBasedManager] setShipPositions: ${positions?.length || 0} ships set`);
    }

    // ==================== ITurnHandler IMPLEMENTATION ====================

    /**
     * Called when it's the opponent's turn to act
     * For multiplayer: we wait for Turn-Based callback with opponent's turn data
     */
    startOpponentTurn(): void {
        print('[TurnBasedManager] startOpponentTurn: Waiting for opponent turn data');
        this._isMyTurn = false;

        // In multiplayer, we don't actively do anything here
        // The Turn-Based component will call our callback when opponent submits
    }

    /**
     * Called after player makes a shot
     * Submits turn data via Turn-Based component
     */
    onPlayerShotComplete(x: number, y: number, result: ShotResult): void {
        print(`[TurnBasedManager] onPlayerShotComplete: Shot (${x}, ${y}) = ${result}`);

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
            print('[TurnBasedManager] onPlayerShotComplete: Including ship positions in first turn');
        }

        // Submit turn
        this.submitTurn(turnData);
    }

    /**
     * Called when game ends
     */
    onGameOver(winner: 'player' | 'opponent'): void {
        print(`[TurnBasedManager] onGameOver: Winner is ${winner}`);
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
        print('[TurnBasedManager] reset: State cleared');
    }

    // ==================== TURN SUBMISSION (Story 1.2) ====================

    /**
     * Submit turn data via Turn-Based component
     */
    submitTurn(turnData: TurnData): void {
        print(`[TurnBasedManager] submitTurn: Submitting turn data`);
        print(`[TURN] Submit: shot=(${turnData.shotX}, ${turnData.shotY}), result=${turnData.result}, gameOver=${turnData.isGameOver}`);

        // Serialize turn data
        const serialized = this.serializeTurnData(turnData);
        if (!serialized) {
            print('[TurnBasedManager] submitTurn: ERROR - Serialization failed');
            return;
        }

        // Check if Turn-Based component is ready
        if (!this.turnBasedScript) {
            print('[TurnBasedManager] submitTurn: ERROR - Turn-Based component not ready');
            return;
        }

        // Submit via Turn-Based API
        if (typeof this.turnBasedScript.submitTurn === 'function') {
            this.turnBasedScript.submitTurn(serialized);
            this._isMyTurn = false;
            print('[TurnBasedManager] submitTurn: Turn submitted successfully');
        } else {
            print('[TurnBasedManager] submitTurn: ERROR - submitTurn method not found');
        }
    }

    /**
     * Serialize turn data to JSON string
     */
    private serializeTurnData(turnData: TurnData): string | null {
        try {
            const json = JSON.stringify(turnData);
            print(`[TurnBasedManager] serializeTurnData: ${json.length} bytes`);
            return json;
        } catch (e) {
            print('[TurnBasedManager] serializeTurnData: ERROR - JSON.stringify failed');
            return null;
        }
    }

    // ==================== TURN RECEIVING (Story 1.3) ====================

    /**
     * Handle turn start callback from Turn-Based component
     * Called when it becomes this player's turn (with opponent's previous turn data)
     */
    private handleTurnStart(turnDataJson: string): void {
        print(`[TurnBasedManager] handleTurnStart: Received turn data`);
        this._isMyTurn = true;

        // Deserialize turn data
        const turnData = this.deserializeTurnData(turnDataJson);
        if (!turnData) {
            print('[TurnBasedManager] handleTurnStart: No valid turn data (may be first turn)');
            this.notifyGameManagerTurnStart(null);
            return;
        }

        print(`[TURN] Received: shot=(${turnData.shotX}, ${turnData.shotY}), result=${turnData.result}, gameOver=${turnData.isGameOver}`);

        // Process opponent's turn data
        this.processReceivedTurn(turnData);
    }

    /**
     * Handle turn end callback
     */
    private handleTurnEnd(): void {
        print('[TurnBasedManager] handleTurnEnd: Turn ended');
        this._isMyTurn = false;
    }

    /**
     * Handle game over callback from Turn-Based
     */
    private handleGameOverFromTurnBased(): void {
        print('[TurnBasedManager] handleGameOverFromTurnBased: Game over signal received');
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
                print('[TurnBasedManager] deserializeTurnData: Missing required fields');
                return null;
            }

            // Validate shot coordinates
            if (data.shotX < 0 || data.shotX >= GRID_SIZE || data.shotY < 0 || data.shotY >= GRID_SIZE) {
                print(`[TurnBasedManager] deserializeTurnData: Invalid coordinates (${data.shotX}, ${data.shotY})`);
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

            print(`[TurnBasedManager] deserializeTurnData: Valid turn data parsed`);
            return turnData;

        } catch (e) {
            print('[TurnBasedManager] deserializeTurnData: ERROR - JSON.parse failed');
            return null;
        }
    }

    /**
     * Process received turn data - apply opponent's shot to player grid
     */
    private processReceivedTurn(turnData: TurnData): void {
        print(`[TurnBasedManager] processReceivedTurn: Processing opponent shot (${turnData.shotX}, ${turnData.shotY})`);

        // Store ship positions if this is first turn with positions
        if (turnData.shipPositions && turnData.shipPositions.length > 0) {
            print(`[TurnBasedManager] processReceivedTurn: Received ${turnData.shipPositions.length} opponent ship positions`);
            this.storeOpponentShipPositions(turnData.shipPositions);
        }

        // Check for game over
        if (turnData.isGameOver) {
            print(`[TurnBasedManager] processReceivedTurn: Game over! Winner: ${turnData.winner}`);
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
            print('[TurnBasedManager] storeOpponentShipPositions: Positions sent to GameManager');
        } else {
            print('[TurnBasedManager] storeOpponentShipPositions: WARNING - setOpponentShipPositions not found');
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
            print(`[TurnBasedManager] notifyGameManagerOpponentShot: Sent (${x}, ${y}) = ${result}`);
        } else {
            print('[TurnBasedManager] notifyGameManagerOpponentShot: ERROR - processOpponentShot not found');
        }
    }

    /**
     * Notify GameManager of game over
     */
    private notifyGameManagerGameOver(winner: 'player' | 'opponent'): void {
        const gm = this.getGameManagerScript();
        if (gm && typeof gm.onMultiplayerGameOver === 'function') {
            gm.onMultiplayerGameOver(winner);
            print(`[TurnBasedManager] notifyGameManagerGameOver: Winner is ${winner}`);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get GameManager script from reference
     */
    private getGameManagerScript(): any {
        if (!this.gameManager) {
            print('[TurnBasedManager] getGameManagerScript: ERROR - gameManager not set');
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

        print('[TurnBasedManager] getGameManagerScript: GameManager script not found');
        return null;
    }
}
