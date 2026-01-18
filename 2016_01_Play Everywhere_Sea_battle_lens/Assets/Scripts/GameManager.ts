// Game Manager - Central controller for Fleet Yeet!

import {
    GamePhase, TurnState, GameMode, CellState, ShotResult,
    ShipInfo, AIState, GameState, ITurnHandler, TurnData, PendingShot,
    TOTAL_OBJECT_CELLS, GRID_SIZE
} from './types/GameTypes';

@component
export class GameManager extends BaseScriptComponent {

    // ==================== GAME SETTINGS ====================
    @input gridSize: number = 10;
    @input aiDelay: number = 1000;
    @input screenTransitionDelay: number = 0.5;

    /** Enable debug logging */
    @input debugMode: boolean = false;

    // ==================== GRIDS ====================
    @input playerGridGenerator: SceneObject = null;
    @input opponentGridGenerator: SceneObject = null;

    // ==================== SCREENS ====================
    @input introScreen: SceneObject = null;
    @input setupScreen: SceneObject = null;
    @input gameScreen: SceneObject = null;
    @input gameOverScreen: SceneObject = null;

    // ==================== SCREEN ASSETS ====================
    @input introAssets: SceneObject[] = [];

    // ==================== UI TEXT ====================
    @input statusText: Text = null;
    @input hintText: Text = null;
    @input resultText: Text = null;

    // ==================== INTRO BUTTONS ====================
    @input singlePlayerButton: SceneObject = null;
    @input multiplayerButton: SceneObject = null;

    // ==================== SETUP BUTTONS ====================
    @input startButton: SceneObject = null;
    @input reshuffleButton: SceneObject = null;

    // ==================== MULTIPLAYER BUTTONS ====================
    /** Fire button for multiplayer (confirms aim and sends turn) */
    @allowUndefined
    @input fireButton: SceneObject;

    // ==================== GAMEOVER BUTTONS ====================
    @input playAgainButton: SceneObject = null;

    // ==================== TURN HANDLERS ====================
    @allowUndefined
    @input aiTurnHandler: SceneObject;
    @allowUndefined
    @input turnBasedManager: SceneObject;

    // ==================== SCENE HANDLE ANIMATION ====================
    @input sceneHandle: SceneObject = null;
    @input handleAnimDuration: number = 0.5;
    @input delayBeforeAI: number = 1.0;
    @input delayAfterAnimation: number = 0.3;
    @input delayAfterShot: number = 1.0;

    // Game state
    private state: GameState;

    // AI state
    private aiState: AIState;

    // Active turn handler
    private turnHandler: ITurnHandler | null = null;

    // Multiplayer state
    private mpSelectedAim: PendingShot | null = null;
    private mpPreviousShotCoords: PendingShot | null = null; // Where we shot last turn

    // Guard
    private buttonsInitialized: boolean = false;

    // ==================== LOGGING ====================

    private log(message: string): void {
        if (this.debugMode) {
            print(`[GameManager] ${message}`);
        }
    }

    private logError(message: string): void {
        print(`[GameManager] ERROR: ${message}`);
    }

    onAwake() {
        print(`[GameManager] onAwake called`);
        this.initializeState();
        this.setupButtons();
        this.setupSnapCaptureEvent();
        this.hideGrids();
        // Don't show intro yet - wait for TurnBasedManager to signal multiplayer state
        this.state.phase = 'waiting';
        this.showScreen('none');
        this.log('Initialized - waiting for TurnBasedManager');
    }

    /**
     * Setup SnapImageCaptureEvent to handle multiplayer turn submission
     */
    private setupSnapCaptureEvent(): void {
        const snapEvent = this.createEvent("SnapImageCaptureEvent") as SnapImageCaptureEvent;
        snapEvent.bind(() => {
            this.onSnapCapture();
        });
        this.log('SnapImageCaptureEvent registered');
    }

    /**
     * Called when user presses the Snap capture button
     * In multiplayer aiming phase, this submits the turn
     */
    private onSnapCapture(): void {
        if (this.state.mode !== 'multiplayer') {
            return;
        }

        if (this.state.phase !== 'aiming' && this.state.phase !== 'confirm_send') {
            this.log('onSnapCapture: Not in aiming phase, ignoring');
            return;
        }

        if (!this.mpSelectedAim) {
            this.log('onSnapCapture: No aim selected');
            return;
        }

        this.log(`onSnapCapture: Submitting turn with aim (${this.mpSelectedAim.x}, ${this.mpSelectedAim.y})`);

        // Store our shot coordinates so we can show result when it comes back
        this.mpPreviousShotCoords = { ...this.mpSelectedAim };

        // Get TurnBasedManager and submit
        const tbm = this.getTurnBasedManagerScript();
        if (tbm) {
            tbm.setSelectedAim(this.mpSelectedAim.x, this.mpSelectedAim.y);
            tbm.submitSelectedAim(false, null);
        }

        // Clear aim
        this.mpSelectedAim = null;
        this.hideAimMarker();

        this.updateStatus("Turn sent!");
        this.updateHint("Waiting for friend...");
    }

    // ==================== GRID HELPERS ====================

    private getGridScript(gridObject: SceneObject): any {
        if (!gridObject) {
            print(`[GameManager] getGridScript: gridObject is null`);
            return null;
        }
        print(`[GameManager] getGridScript: Looking in ${gridObject.name}`);
        const scripts = gridObject.getComponents("Component.ScriptComponent");
        print(`[GameManager] getGridScript: Found ${scripts.length} script components`);
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            const hasGenerate = script && typeof script.generate === 'function';
            const hasShowAimMarker = script && typeof script.showAimMarker === 'function';
            print(`[GameManager] getGridScript: Script ${i} - generate: ${hasGenerate}, showAimMarker: ${hasShowAimMarker}`);
            if (hasGenerate) {
                return script;
            }
        }
        return null;
    }

    hideGrids() {
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.hide === 'function') {
            playerScript.hide();
        }

        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.hide === 'function') {
            opponentScript.hide();
        }

        this.log('Grids hidden');
    }

    showPlayerGrid() {
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.show === 'function') {
            playerScript.show();
        }
    }

    showOpponentGrid() {
        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.show === 'function') {
            opponentScript.show();
        }
    }

    updateCellVisual(gridObject: SceneObject, x: number, y: number, state: 'hit' | 'miss') {
        const gridScript = this.getGridScript(gridObject);
        if (gridScript && typeof gridScript.setCellState === 'function') {
            gridScript.setCellState(x, y, state);
            this.log(`Updated cell (${x}, ${y}) visual to ${state}`);
        }
    }

    /**
     * Show aim marker on opponent grid (for multiplayer aiming)
     */
    showAimMarker(x: number, y: number) {
        print(`[GameManager] showAimMarker called for (${x}, ${y})`);
        const gridScript = this.getGridScript(this.opponentGridGenerator);
        if (!gridScript) {
            print(`[GameManager] ERROR: Could not get opponent grid script`);
            return;
        }
        if (typeof gridScript.showAimMarker !== 'function') {
            print(`[GameManager] ERROR: showAimMarker is not a function on grid script`);
            return;
        }
        gridScript.showAimMarker(x, y);
        print(`[GameManager] showAimMarker completed`);
    }

    /**
     * Hide aim marker
     */
    hideAimMarker() {
        const gridScript = this.getGridScript(this.opponentGridGenerator);
        if (gridScript && typeof gridScript.hideAimMarker === 'function') {
            gridScript.hideAimMarker();
        }
    }

    generateGrids() {
        this.log('generateGrids() called');

        if (this.playerGridGenerator) {
            const playerScript = this.getGridScript(this.playerGridGenerator);
            if (playerScript) {
                playerScript.generate();
                this.log('Player grid generated');
            }
        }

        if (this.opponentGridGenerator) {
            const opponentScript = this.getGridScript(this.opponentGridGenerator);
            if (opponentScript) {
                opponentScript.generate();
                this.log('Opponent grid generated');
            }
        }
    }

    // ==================== STATE INITIALIZATION ====================

    initializeState() {
        this.state = {
            mode: 'single',
            phase: 'intro',
            turn: 'player',
            playerGrid: this.createEmptyGrid(),
            opponentGrid: this.createEmptyGrid(),
            playerShips: [],
            opponentShips: [],
            playerHits: 0,
            opponentHits: 0,
            totalObjectCells: TOTAL_OBJECT_CELLS,
            winner: null,
            setupComplete: false
        };

        this.aiState = {
            mode: 'hunt',
            targetCells: [],
            hitCells: [],
            lastHitDirection: null
        };

        this.mpSelectedAim = null;
        this.mpPreviousShotCoords = null;
    }

    createEmptyGrid(): CellState[][] {
        const grid: CellState[][] = [];
        for (let x = 0; x < this.gridSize; x++) {
            grid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                grid[x][y] = 'unknown';
            }
        }
        return grid;
    }

    // ==================== BUTTON SETUP ====================

    setupButtons() {
        if (this.buttonsInitialized) {
            return;
        }
        this.buttonsInitialized = true;

        // Single Player button
        if (this.singlePlayerButton) {
            const buttonScript = this.getUIButtonScript(this.singlePlayerButton);
            if (buttonScript && buttonScript.onPressDown) {
                buttonScript.onPressDown.add(() => this.onSinglePlayerTap());
            } else {
                this.setupTouchButton(this.singlePlayerButton, () => this.onSinglePlayerTap());
            }
        }

        // Multiplayer button
        if (this.multiplayerButton) {
            const buttonScript = this.getUIButtonScript(this.multiplayerButton);
            if (buttonScript && buttonScript.onPressDown) {
                buttonScript.onPressDown.add(() => this.onMultiplayerTap());
            } else {
                this.setupTouchButton(this.multiplayerButton, () => this.onMultiplayerTap());
            }
        }

        // Start button
        if (this.startButton) {
            const buttonScript = this.getUIButtonScript(this.startButton);
            if (buttonScript && buttonScript.onPressDown) {
                buttonScript.onPressDown.add(() => this.onStartTap());
            } else {
                this.setupTouchButton(this.startButton, () => this.onStartTap());
            }
        }

        // Reshuffle button
        if (this.reshuffleButton) {
            let interaction = this.reshuffleButton.getComponent("Component.Touch") as InteractionComponent;
            if (!interaction) {
                interaction = this.reshuffleButton.createComponent("Component.Touch") as InteractionComponent;
            }
            if (interaction) {
                interaction.onTap.add(() => this.onReshuffleTap());
            }
        }

        // Fire button (multiplayer)
        if (this.fireButton) {
            const buttonScript = this.getUIButtonScript(this.fireButton);
            if (buttonScript && buttonScript.onPressDown) {
                buttonScript.onPressDown.add(() => this.onFireTap());
                this.log('Fire button setup (UI Button)');
            } else {
                this.setupTouchButton(this.fireButton, () => this.onFireTap());
                this.log('Fire button setup (Touch)');
            }
            // Hide initially
            this.fireButton.enabled = false;
        }

        // Play Again button
        if (this.playAgainButton) {
            const buttonScript = this.getUIButtonScript(this.playAgainButton);
            if (buttonScript && buttonScript.onPressDown) {
                buttonScript.onPressDown.add(() => this.onPlayAgainTap());
            } else {
                this.setupTouchButton(this.playAgainButton, () => this.onPlayAgainTap());
            }
        }
    }

    private getUIButtonScript(buttonObject: SceneObject): any {
        if (!buttonObject) return null;
        const scripts = buttonObject.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && script.onPressDown && typeof script.onPressDown.add === 'function') {
                return script;
            }
        }
        return null;
    }

    private setupTouchButton(buttonObject: SceneObject, callback: () => void) {
        let interaction = buttonObject.getComponent("Component.Touch") as InteractionComponent;
        if (!interaction) {
            interaction = buttonObject.createComponent("Component.Touch") as InteractionComponent;
        }
        if (interaction) {
            interaction.onTap.add(callback);
        }
    }

    // ==================== SCREEN MANAGEMENT ====================

    showScreen(screen: 'none' | 'intro' | 'setup' | 'game' | 'gameover') {
        if (this.introScreen) this.introScreen.enabled = (screen === 'intro');
        if (this.setupScreen) this.setupScreen.enabled = (screen === 'setup');
        if (this.gameScreen) this.gameScreen.enabled = (screen === 'game');
        if (this.gameOverScreen) this.gameOverScreen.enabled = (screen === 'gameover');

        this.setAssetsEnabled(this.introAssets, screen === 'intro');

        this.log(`Showing screen: ${screen}`);
    }

    setAssetsEnabled(assets: SceneObject[], enabled: boolean) {
        for (const asset of assets) {
            if (asset) {
                asset.enabled = enabled;
            }
        }
    }

    // ==================== UI UPDATES ====================

    /**
     * Get player label for multiplayer (e.g., "Player 0" or "Player 1")
     */
    private getPlayerLabel(): string {
        if (this.state.mode !== 'multiplayer') {
            return '';
        }
        const tbm = this.getTurnBasedManagerScript();
        if (tbm) {
            const index = tbm.getCurrentUserIndex();
            if (index >= 0) {
                return `Player ${index}`;
            }
        }
        return '';
    }

    updateStatus(message: string) {
        if (this.statusText) {
            this.statusText.text = message;
        }
        this.log(`Status: ${message}`);
    }

    updateHint(message: string) {
        if (this.hintText) {
            this.hintText.text = message;
        }
    }

    updateResult(message: string) {
        if (this.resultText) {
            this.resultText.text = message;
        }
    }

    // ==================== BUTTON HANDLERS ====================

    onSinglePlayerTap() {
        this.log('Single Player selected');
        this.state.mode = 'single';
        this.delayedCall(() => this.startSetup(), this.screenTransitionDelay);
    }

    onMultiplayerTap() {
        this.log('Multiplayer selected');
        this.state.mode = 'multiplayer';
        this.delayedCall(() => this.startSetup(), this.screenTransitionDelay);
    }

    onStartTap() {
        this.log('Start button tapped');

        // Mark setup as complete and hide reshuffle button - ships are now frozen
        if (!this.state.setupComplete) {
            this.state.setupComplete = true;
            if (this.reshuffleButton) {
                this.reshuffleButton.enabled = false;
            }
        }

        if (this.state.mode === 'single') {
            this.delayedCall(() => this.startGame(), this.screenTransitionDelay);
        } else {
            // Multiplayer: confirm setup
            this.delayedCall(() => this.onMultiplayerSetupConfirmed(), this.screenTransitionDelay);
        }
    }

    onReshuffleTap() {
        // Only allow shuffle during initial setup, before first Start
        if (this.state.setupComplete) {
            return;
        }
        if (this.state.phase !== 'setup' && this.state.phase !== 'setup_pending') {
            return;
        }

        this.log('Reshuffling ship placements');

        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.reshuffleShips === 'function') {
            playerScript.reshuffleShips();
        }

        // Only reshuffle opponent in single player
        if (this.state.mode === 'single') {
            const opponentScript = this.getGridScript(this.opponentGridGenerator);
            if (opponentScript && typeof opponentScript.reshuffleShips === 'function') {
                opponentScript.reshuffleShips();
            }
        }

        this.state.playerShips = this.generateShipPlacements();
        this.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);

        if (this.state.mode === 'single') {
            this.state.opponentShips = this.generateShipPlacements();
        }

        this.updateStatus("New positions!");
    }

    /**
     * Fire button tapped (multiplayer) - sends the turn
     */
    onFireTap(): void {
        if (this.state.mode !== 'multiplayer') {
            return;
        }

        if (this.state.phase !== 'confirm_send') {
            this.log('onFireTap: Ignored - not in confirm_send phase');
            return;
        }

        if (!this.mpSelectedAim) {
            this.logError('onFireTap: No aim selected');
            return;
        }

        print(`[GameManager] onFireTap: Firing at (${this.mpSelectedAim.x}, ${this.mpSelectedAim.y})`);

        // Store our shot coordinates so we can show result when it comes back
        this.mpPreviousShotCoords = { ...this.mpSelectedAim };

        // Get TurnBasedManager and submit
        const tbm = this.getTurnBasedManagerScript();
        if (tbm) {
            tbm.setSelectedAim(this.mpSelectedAim.x, this.mpSelectedAim.y);
            tbm.submitSelectedAim(false, null);
        }

        // Hide fire button
        if (this.fireButton) {
            this.fireButton.enabled = false;
        }

        // Clear aim
        this.mpSelectedAim = null;
        this.hideAimMarker();

        this.updateStatus("Turn sent!");
        this.updateHint("Waiting for friend...");
    }

    onPlayAgainTap() {
        this.log('Play Again tapped');
        this.delayedCall(() => this.resetGame(), this.screenTransitionDelay);
    }

    delayedCall(callback: () => void, delay: number) {
        if (delay <= 0) {
            callback();
            return;
        }
        const event = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        event.bind(callback);
        event.reset(delay);
    }

    // ==================== GAME FLOW ====================

    startSetup() {
        this.state.phase = 'setup';
        this.showScreen('setup');

        // Reset scene handle to show player grid (position 0)
        this.resetSceneHandleToPlayerGrid();

        this.generateGrids();
        this.showPlayerGrid();

        this.generatePlacements();

        this.updateStatus("Your objects are placed!");
        this.updateHint("Tap Start to begin");

        this.log('Setup phase started');
    }

    /**
     * Reset scene handle to player grid position (no animation)
     */
    private resetSceneHandleToPlayerGrid(): void {
        if (!this.sceneHandle) return;

        const transform = this.sceneHandle.getTransform();
        const currentPos = transform.getLocalPosition();
        transform.setLocalPosition(new vec3(0, currentPos.y, currentPos.z));
        this.log('Scene handle reset to player grid position');
    }

    generatePlacements() {
        this.state.playerShips = this.generateShipPlacements();
        this.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);

        // Only generate opponent ships in single player
        if (this.state.mode === 'single') {
            this.state.opponentShips = this.generateShipPlacements();
        }

        this.log(`Generated ships for player${this.state.mode === 'single' ? ' and opponent' : ''}`);
    }

    generateShipPlacements(): ShipInfo[] {
        const ships: ShipInfo[] = [];
        const occupied: boolean[][] = this.createEmptyBoolGrid();

        const shipsToPlace: Array<[number, number]> = [
            [4, 1], [3, 2], [2, 3], [1, 4]
        ];

        let shipId = 0;

        for (const [length, count] of shipsToPlace) {
            for (let i = 0; i < count; i++) {
                const ship = this.placeRandomShip(shipId++, length, occupied);
                if (ship) {
                    ships.push(ship);
                }
            }
        }

        return ships;
    }

    createEmptyBoolGrid(): boolean[][] {
        const grid: boolean[][] = [];
        for (let x = 0; x < this.gridSize; x++) {
            grid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                grid[x][y] = false;
            }
        }
        return grid;
    }

    placeRandomShip(id: number, length: number, occupied: boolean[][]): ShipInfo | null {
        const maxAttempts = 1000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            const horizontal = Math.random() < 0.5;

            if (this.canPlaceShipAt(x, y, length, horizontal, occupied)) {
                const cells: Array<{x: number, y: number}> = [];

                for (let i = 0; i < length; i++) {
                    const cx = horizontal ? x + i : x;
                    const cy = horizontal ? y : y + i;
                    cells.push({x: cx, y: cy});
                    this.markOccupiedWithBuffer(cx, cy, occupied);
                }

                return {
                    id: id,
                    length: length,
                    cells: cells,
                    hitCells: 0,
                    destroyed: false
                };
            }
        }

        return null;
    }

    canPlaceShipAt(x: number, y: number, length: number, horizontal: boolean, occupied: boolean[][]): boolean {
        for (let i = 0; i < length; i++) {
            const cx = horizontal ? x + i : x;
            const cy = horizontal ? y : y + i;

            if (cx < 0 || cx >= this.gridSize || cy < 0 || cy >= this.gridSize) {
                return false;
            }

            if (occupied[cx][cy]) {
                return false;
            }
        }
        return true;
    }

    markOccupiedWithBuffer(x: number, y: number, occupied: boolean[][]) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                    occupied[nx][ny] = true;
                }
            }
        }
    }

    markShipsOnGrid(grid: CellState[][], ships: ShipInfo[], showObjects: boolean) {
        if (showObjects) {
            for (const ship of ships) {
                for (const cell of ship.cells) {
                    grid[cell.x][cell.y] = 'object';
                }
            }
        }
    }

    /**
     * Start game (single player only)
     */
    startGame() {
        this.state.phase = 'playing';
        this.state.turn = 'player';
        this.showScreen('game');

        this.initializeTurnHandler();

        this.showPlayerGrid();
        this.showOpponentGrid();

        this.updateStatus("Your turn");
        this.updateHint("Tap opponent's cell to shoot");
        this.updateResult("");
        this.animateSceneHandle(true);

        this.log(`Game started! Mode: ${this.state.mode}`);
    }

    // ==================== MULTIPLAYER FLOW ====================

    /**
     * Called when player confirms setup in multiplayer
     * Handles: initial setup, setup with pending shot
     */
    private async onMultiplayerSetupConfirmed(): Promise<void> {
        this.log('onMultiplayerSetupConfirmed');

        // Initialize turn handler if not done
        if (!this.turnHandler) {
            this.initializeTurnHandler();
        }

        const tbm = this.getTurnBasedManagerScript();

        // Send our ship positions to TurnBasedManager and save to global variables
        if (tbm) {
            const shipPositions = this.serializeShipPositions(this.state.playerShips);
            tbm.setShipPositions(shipPositions);

            // Persist ships to global variables
            await tbm.savePlayerShips(shipPositions);
        }

        // Check if we have a pending shot to evaluate
        if (tbm && tbm.hasPendingShot()) {
            const pendingShot = tbm.getPendingShot();
            this.log(`Evaluating pending shot at (${pendingShot.x}, ${pendingShot.y})`);

            // Evaluate the shot against our grid
            const result = this.evaluateShotOnPlayerGrid(pendingShot.x, pendingShot.y);

            // Tell TurnBasedManager the result (to send back to opponent)
            tbm.setIncomingShotResult(result);
            tbm.clearPendingShot();

            // Show the result on our grid
            this.showScreen('game');
            this.showPlayerGrid();
            this.showOpponentGrid();
            this.animateSceneHandle(false); // Show player grid

            this.updateCellVisual(this.playerGridGenerator, pendingShot.x, pendingShot.y, result === 'miss' ? 'miss' : 'hit');
            this.updateStatus(result === 'miss' ? "Friend missed!" : "Friend hit!");
            this.updateResult(`Shot at (${pendingShot.x}, ${pendingShot.y})`);

            // Check if we lost
            if (this.checkWin('opponent')) {
                this.endGame('opponent');
                return;
            }

            // After delay, transition to aiming phase
            this.delayedCall(() => {
                this.transitionToAimingPhase();
            }, this.delayAfterShot);
        } else {
            // No pending shot - this is Player 1's first turn
            this.showScreen('game');
            this.showPlayerGrid();
            this.showOpponentGrid();
            this.transitionToAimingPhase();
        }
    }

    /**
     * Transition to aiming phase (multiplayer)
     */
    private transitionToAimingPhase(): void {
        this.state.phase = 'aiming';
        this.state.turn = 'player';

        // First check if we need to show result of our previous shot
        const tbm = this.getTurnBasedManagerScript();
        const previousResult = tbm ? tbm.getPreviousShotResult() : null;

        if (previousResult && this.mpPreviousShotCoords) {
            // Show result of our previous shot on opponent grid
            this.animateSceneHandle(true, () => {
                // Update opponent grid state
                const shotX = this.mpPreviousShotCoords!.x;
                const shotY = this.mpPreviousShotCoords!.y;
                this.state.opponentGrid[shotX][shotY] = previousResult === 'miss' ? 'empty' : 'hit';

                this.updateCellVisual(
                    this.opponentGridGenerator,
                    shotX,
                    shotY,
                    previousResult === 'miss' ? 'miss' : 'hit'
                );

                // Update hits count
                if (previousResult !== 'miss') {
                    this.state.playerHits++;
                }

                this.updateStatus(previousResult === 'miss' ? "You missed!" : "You hit!");
                this.updateResult("");

                if (tbm) {
                    tbm.clearPreviousShotResult();
                }
                this.mpPreviousShotCoords = null;

                // Check if we won
                if (this.checkWin('player')) {
                    this.endGame('player');
                    return;
                }

                // After showing result, let player aim
                this.delayedCall(() => {
                    const label = this.getPlayerLabel();
                    this.updateStatus(label ? `${label} - Your turn` : "Your turn");
                    this.updateHint("Tap a cell to aim");
                }, this.delayAfterShot);
            });
        } else {
            // No previous result to show, just go to aiming
            this.animateSceneHandle(true);
            const label = this.getPlayerLabel();
            this.updateStatus(label ? `${label} - Your turn` : "Your turn");
            this.updateHint("Tap a cell to aim");
        }
    }

    /**
     * Evaluate a shot on the player's grid
     * Saves grid to global variables in multiplayer mode
     */
    private evaluateShotOnPlayerGrid(x: number, y: number): ShotResult {
        const hasShip = this.checkShipAtPosition(this.playerGridGenerator, x, y);

        let result: ShotResult;
        if (hasShip) {
            this.state.playerGrid[x][y] = 'hit';
            this.state.opponentHits++;
            this.log(`Opponent hit at (${x}, ${y})! Total: ${this.state.opponentHits}/${TOTAL_OBJECT_CELLS}`);
            result = 'hit';
        } else {
            this.state.playerGrid[x][y] = 'empty';
            result = 'miss';
        }

        // Persist grid to global variables in multiplayer
        if (this.state.mode === 'multiplayer') {
            const tbm = this.getTurnBasedManagerScript();
            if (tbm) {
                tbm.savePlayerGrid(this.state.playerGrid);
            }
        }

        return result;
    }

    /**
     * Called by TurnBasedManager when it's our turn (multiplayer)
     * Decides whether to show intro screen or skip directly to game setup.
     *
     * Detection logic:
     * - turnCount === 0 → Player 1 (initiator) or fresh start → Show intro
     * - turnCount > 0 → Player 2 (receiver) → Skip intro, go to setup or gameplay
     */
    async onMultiplayerTurnStart(turnCount: number, hasPendingShot: boolean, previousShotResult: ShotResult | null): Promise<void> {
        this.log(`onMultiplayerTurnStart: turn=${turnCount}, hasPending=${hasPendingShot}, prevResult=${previousShotResult}`);

        // Player 2 receiving - any turnCount > 0 means skip intro
        if (turnCount > 0) {
            this.log('Player 2 flow - skipping intro');
            this.state.mode = 'multiplayer';
            this.state.phase = hasPendingShot ? 'setup_pending' : 'setup';

            const tbm = this.getTurnBasedManagerScript();
            const label = this.getPlayerLabel();

            // Try to load ships from global variables (in case lens was reopened)
            if (this.state.playerShips.length === 0 && tbm) {
                const savedShips = await tbm.loadPlayerShips();
                if (savedShips && savedShips.length > 0) {
                    this.log(`Restored ${savedShips.length} ships from global variables`);
                    // Generate grids first so ship visuals can be set
                    this.generateGrids();
                    this.restorePlayerShips(savedShips);
                    this.state.setupComplete = true;

                    // Also load and restore grid states (hits/misses)
                    await this.restoreGridStates(tbm);
                }
            }

            // If we have ships (from memory or restored), go directly to gameplay
            if (this.state.playerShips.length > 0) {
                this.log('Ships found - skipping setup, going to gameplay');
                // Hide shuffle button since setup is complete
                if (this.reshuffleButton) {
                    this.reshuffleButton.enabled = false;
                }
                this.onMultiplayerSetupConfirmed();
            } else {
                // First time receiving - show setup
                this.showScreen('setup');
                this.generateGrids();
                this.showPlayerGrid();
                this.generatePlacements();

                if (hasPendingShot) {
                    this.updateStatus(label ? `${label} - Incoming shot!` : "Incoming shot!");
                    this.updateHint("Place your objects, then tap Start");
                } else {
                    this.updateStatus(label ? `${label} - Your turn!` : "Your turn!");
                    this.updateHint("Place your objects, then tap Start");
                }
            }
            return;
        }

        // Fresh start (turnCount === 0) - show intro screen
        this.log('Fresh start - showing intro screen');
        this.showScreen('intro');
    }

    /**
     * Called by TurnBasedManager when game ends (multiplayer)
     */
    onMultiplayerGameOver(winner: 'player' | 'opponent'): void {
        this.log(`onMultiplayerGameOver: Winner is ${winner}`);
        this.endGame(winner);
    }

    // ==================== SHOOTING LOGIC ====================

    /**
     * Player shoots at opponent's grid (single player)
     * Or selects aim (multiplayer)
     */
    playerShoot(x: number, y: number) {
        if (this.state.mode === 'multiplayer') {
            this.handleMultiplayerCellTap(x, y);
            return;
        }

        // Single player logic
        if (this.state.turn !== 'player' || this.state.phase !== 'playing') {
            return;
        }

        if (this.state.opponentGrid[x][y] !== 'unknown') {
            this.updateResult("Already shot here!");
            return;
        }

        this.state.turn = 'waiting';

        const result = this.processShot(x, y, this.state.opponentGrid, this.state.opponentShips, true);
        this.updateCellVisual(this.opponentGridGenerator, x, y, result === 'miss' ? 'miss' : 'hit');

        if (this.checkWin('player')) {
            if (this.turnHandler) {
                this.turnHandler.onGameOver('player');
            }
            this.endGame('player');
            return;
        }

        if (this.turnHandler) {
            this.turnHandler.onPlayerShotComplete(x, y, result);
        }

        this.delayedCall(() => {
            this.state.turn = 'opponent';
            this.updateStatus("Opponent's turn");
            this.updateHint("Waiting...");

            this.animateSceneHandle(false, () => {
                if (this.turnHandler) {
                    this.turnHandler.startOpponentTurn();
                } else if (this.state.mode === 'single') {
                    this.delayedCall(() => {
                        this.aiTurn();
                    }, this.delayBeforeAI);
                }
            });
        }, this.delayAfterShot);
    }

    /**
     * Handle cell tap in multiplayer (aiming mode)
     */
    private handleMultiplayerCellTap(x: number, y: number): void {
        if (this.state.phase !== 'aiming' && this.state.phase !== 'confirm_send') {
            this.log(`handleMultiplayerCellTap: Ignored - phase is ${this.state.phase}`);
            return;
        }

        // Check if already shot
        if (this.state.opponentGrid[x][y] !== 'unknown') {
            this.updateResult("Already shot here!");
            return;
        }

        print(`[GameManager] handleMultiplayerCellTap: Selected aim (${x}, ${y})`);

        // Clear previous aim marker
        if (this.mpSelectedAim) {
            this.hideAimMarker();
        }

        // Set new aim
        this.mpSelectedAim = { x, y };
        print(`[GameManager] About to call showAimMarker...`);
        this.showAimMarker(x, y);

        // Transition to confirm_send phase
        this.state.phase = 'confirm_send';

        // Show fire button
        if (this.fireButton) {
            this.fireButton.enabled = true;
        }

        this.updateStatus("Target selected!");
        this.updateHint("Tap Fire to shoot!");
        this.updateResult(`Aiming at (${x}, ${y})`);
    }

    processShot(x: number, y: number, grid: CellState[][], ships: ShipInfo[], isPlayerShot: boolean): ShotResult {
        const gridObject = isPlayerShot ? this.opponentGridGenerator : this.playerGridGenerator;
        const hasShip = this.checkShipAtPosition(gridObject, x, y);

        if (hasShip) {
            grid[x][y] = 'hit';

            if (isPlayerShot) {
                this.state.playerHits++;
                this.log(`Player hit at (${x}, ${y})! Total: ${this.state.playerHits}/${TOTAL_OBJECT_CELLS}`);
            } else {
                this.state.opponentHits++;
                this.log(`AI hit at (${x}, ${y})! Total: ${this.state.opponentHits}/${TOTAL_OBJECT_CELLS}`);
            }

            this.updateResult("HIT!");
            return 'hit';
        } else {
            grid[x][y] = 'empty';
            this.updateResult("Miss");
            return 'miss';
        }
    }

    checkShipAtPosition(gridObject: SceneObject, x: number, y: number): boolean {
        const gridScript = this.getGridScript(gridObject);
        if (gridScript && typeof gridScript.hasShipAt === 'function') {
            return gridScript.hasShipAt(x, y);
        }
        return false;
    }

    findShipAt(x: number, y: number, ships: ShipInfo[]): ShipInfo | null {
        for (const ship of ships) {
            for (const cell of ship.cells) {
                if (cell.x === x && cell.y === y) {
                    return ship;
                }
            }
        }
        return null;
    }

    // ==================== SCENE HANDLE ANIMATION ====================

    private animateSceneHandle(toPlayerTurn: boolean, onComplete?: () => void): void {
        if (!this.sceneHandle) {
            if (onComplete) onComplete();
            return;
        }

        const transform = this.sceneHandle.getTransform();
        const currentPos = transform.getLocalPosition();
        const targetX = toPlayerTurn ? -300 : 0;

        const start = { x: currentPos.x };
        const end = { x: targetX };

        new TWEEN.Tween(start)
            .to(end, this.handleAnimDuration * 1000)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
                transform.setLocalPosition(new vec3(start.x, currentPos.y, currentPos.z));
            })
            .onComplete(() => {
                if (onComplete) {
                    const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
                    delayEvent.bind(() => {
                        onComplete();
                    });
                    delayEvent.reset(this.delayAfterAnimation);
                }
            })
            .start();
    }

    // ==================== AI OPPONENT ====================

    scheduleAITurn() {
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        delayEvent.bind(() => {
            this.aiTurn();
        });
        delayEvent.reset(this.aiDelay / 1000);
    }

    aiTurn() {
        if (this.state.turn !== 'opponent' || this.state.phase !== 'playing') {
            return;
        }

        const shot = this.getAIShot();
        if (!shot) {
            return;
        }

        const result = this.processShot(shot.x, shot.y, this.state.playerGrid, this.state.playerShips, false);
        this.updateCellVisual(this.playerGridGenerator, shot.x, shot.y, result === 'miss' ? 'miss' : 'hit');
        this.updateAIState(shot.x, shot.y, result);
        this.updateResult(`AI shot (${shot.x}, ${shot.y}) - ${result === 'miss' ? 'Miss' : 'HIT!'}`);

        if (this.checkWin('opponent')) {
            this.endGame('opponent');
            return;
        }

        this.delayedCall(() => {
            this.state.turn = 'player';
            this.updateStatus("Your turn");
            this.updateHint("Tap opponent's cell to shoot");
            this.animateSceneHandle(true);
        }, this.delayAfterShot);
    }

    getAIShot(): {x: number, y: number} | null {
        if (this.aiState.mode === 'target' && this.aiState.targetCells.length > 0) {
            while (this.aiState.targetCells.length > 0) {
                const cell = this.aiState.targetCells.pop()!;
                if (this.state.playerGrid[cell.x][cell.y] === 'object' ||
                    this.state.playerGrid[cell.x][cell.y] === 'unknown') {
                    return cell;
                }
            }
            this.aiState.mode = 'hunt';
        }

        const available: Array<{x: number, y: number}> = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const state = this.state.playerGrid[x][y];
                if (state === 'object' || state === 'unknown') {
                    available.push({x, y});
                }
            }
        }

        if (available.length === 0) {
            return null;
        }

        return available[Math.floor(Math.random() * available.length)];
    }

    updateAIState(x: number, y: number, result: ShotResult) {
        if (result === 'hit') {
            this.aiState.mode = 'target';
            this.aiState.hitCells.push({x, y});
            this.addAdjacentToTargets(x, y);

            if (this.aiState.hitCells.length >= 2) {
                this.determineDirection();
            }
        } else if (result === 'destroyed') {
            this.aiState.mode = 'hunt';
            this.aiState.targetCells = [];
            this.aiState.hitCells = [];
            this.aiState.lastHitDirection = null;
        }
    }

    addAdjacentToTargets(x: number, y: number) {
        const directions = [
            {dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                const state = this.state.playerGrid[nx][ny];
                if (state === 'object' || state === 'unknown') {
                    if (!this.aiState.targetCells.some(c => c.x === nx && c.y === ny)) {
                        this.aiState.targetCells.push({x: nx, y: ny});
                    }
                }
            }
        }
    }

    determineDirection() {
        if (this.aiState.hitCells.length < 2) return;

        const first = this.aiState.hitCells[0];
        const second = this.aiState.hitCells[1];

        if (first.x === second.x) {
            this.aiState.lastHitDirection = 'vertical';
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.x === first.x);
        } else if (first.y === second.y) {
            this.aiState.lastHitDirection = 'horizontal';
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.y === first.y);
        }
    }

    // ==================== WIN CONDITION ====================

    checkWin(who: 'player' | 'opponent'): boolean {
        const hits = who === 'player' ? this.state.playerHits : this.state.opponentHits;
        return hits >= TOTAL_OBJECT_CELLS;
    }

    endGame(winner: 'player' | 'opponent') {
        this.state.phase = 'gameover';
        this.state.winner = winner;
        this.showScreen('gameover');

        if (winner === 'player') {
            this.updateStatus("YOU WON!");
        } else {
            this.updateStatus("YOU LOST!");
        }

        // Hide fire button
        if (this.fireButton) {
            this.fireButton.enabled = false;
        }

        this.log(`Game over! Winner: ${winner}`);
    }

    resetGame() {
        if (this.turnHandler) {
            this.turnHandler.reset();
            this.turnHandler = null;
        }

        this.initializeState();
        this.hideGrids();

        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.resetGame === 'function') {
            playerScript.resetGame();
        }

        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.resetGame === 'function') {
            opponentScript.resetGame();
        }

        // Hide fire button
        if (this.fireButton) {
            this.fireButton.enabled = false;
        }

        this.showScreen('intro');
        this.updateResult("");
        this.log('Game reset');
    }

    // ==================== TURN HANDLER INTEGRATION ====================

    private getTurnHandlerScript(handlerObject: SceneObject): ITurnHandler | null {
        if (!handlerObject) return null;

        const scripts = handlerObject.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script &&
                typeof script.startOpponentTurn === 'function' &&
                typeof script.onPlayerShotComplete === 'function' &&
                typeof script.onGameOver === 'function' &&
                typeof script.reset === 'function') {
                return script as ITurnHandler;
            }
        }
        return null;
    }

    private getTurnBasedManagerScript(): any {
        if (!this.turnBasedManager) return null;

        const scripts = this.turnBasedManager.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && typeof script.submitSelectedAim === 'function') {
                return script;
            }
        }
        return null;
    }

    private initializeTurnHandler(): void {
        if (this.state.mode === 'single') {
            this.turnHandler = this.getTurnHandlerScript(this.aiTurnHandler);
            if (this.turnHandler) {
                const aiScript = this.turnHandler as any;
                if (typeof aiScript.setPlayerGrid === 'function') {
                    aiScript.setPlayerGrid(this.state.playerGrid);
                }
            }
        } else {
            this.turnHandler = this.getTurnHandlerScript(this.turnBasedManager);
            if (this.turnHandler) {
                this.log('initializeTurnHandler: Using TurnBasedManager');
            } else {
                this.logError('initializeTurnHandler: TurnBasedManager not found');
            }
        }
    }

    private serializeShipPositions(ships: ShipInfo[]): TurnData['shipPositions'] {
        return ships.map(ship => {
            const isHorizontal = ship.cells.length > 1 &&
                ship.cells[0].y === ship.cells[1].y;
            return {
                x: ship.cells[0].x,
                y: ship.cells[0].y,
                length: ship.length,
                horizontal: isHorizontal
            };
        });
    }

    // ==================== LEGACY MULTIPLAYER CALLBACKS ====================

    /**
     * Called by TurnBasedManager to store opponent's ship positions
     */
    setOpponentShipPositions(positions: TurnData['shipPositions']): void {
        if (!positions) return;

        this.log(`setOpponentShipPositions: Received ${positions.length} positions`);

        this.state.opponentShips = positions.map((pos, index) => {
            const cells: Array<{x: number, y: number}> = [];
            for (let i = 0; i < pos.length; i++) {
                cells.push({
                    x: pos.horizontal ? pos.x + i : pos.x,
                    y: pos.horizontal ? pos.y : pos.y + i
                });
            }
            return {
                id: index,
                length: pos.length,
                cells: cells,
                hitCells: 0,
                destroyed: false
            };
        });

        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.setShipPositions === 'function') {
            opponentScript.setShipPositions(positions);
        }
    }

    /**
     * Restore grid states (hits/misses) from global variables
     * Used when lens reopens mid-session
     */
    private async restoreGridStates(tbm: any): Promise<void> {
        this.log('restoreGridStates: Loading grid states from global variables');

        // Load player grid (hits we've received)
        const playerGrid = await tbm.loadPlayerGrid();
        if (playerGrid) {
            this.log('restoreGridStates: Restoring player grid');
            this.state.playerGrid = playerGrid;

            // Count hits received and update visuals
            let hitsReceived = 0;
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    const cell = playerGrid[x][y];
                    if (cell === 'hit' || cell === 'destroyed') {
                        hitsReceived++;
                        this.updateCellVisual(this.playerGridGenerator, x, y, 'hit');
                    } else if (cell === 'empty') {
                        this.updateCellVisual(this.playerGridGenerator, x, y, 'miss');
                    }
                }
            }
            this.state.opponentHits = hitsReceived;
            this.log(`restoreGridStates: Opponent has landed ${hitsReceived} hits on us`);
        }

        // Load opponent grid (our shots on them)
        const opponentGrid = await tbm.loadOpponentGrid();
        if (opponentGrid) {
            this.log('restoreGridStates: Restoring opponent grid');
            this.state.opponentGrid = opponentGrid;

            // Count our hits and update visuals
            let ourHits = 0;
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    const cell = opponentGrid[x][y];
                    if (cell === 'hit' || cell === 'destroyed') {
                        ourHits++;
                        this.updateCellVisual(this.opponentGridGenerator, x, y, 'hit');
                    } else if (cell === 'empty') {
                        this.updateCellVisual(this.opponentGridGenerator, x, y, 'miss');
                    }
                }
            }
            this.state.playerHits = ourHits;
            this.log(`restoreGridStates: We have landed ${ourHits} hits on opponent`);
        }

        // Also try to load opponent ships if available
        const opponentShips = await tbm.loadOpponentShips();
        if (opponentShips && opponentShips.length > 0) {
            this.log(`restoreGridStates: Loaded ${opponentShips.length} opponent ships`);
            this.setOpponentShipPositions(opponentShips);
        }
    }

    /**
     * Restore player's own ship positions from saved data
     * Used when lens reopens mid-session
     */
    private restorePlayerShips(positions: TurnData['shipPositions']): void {
        if (!positions) return;

        this.log(`restorePlayerShips: Restoring ${positions.length} ships`);

        // Convert to ShipInfo array
        this.state.playerShips = positions.map((pos, index) => {
            const cells: Array<{x: number, y: number}> = [];
            for (let i = 0; i < pos.length; i++) {
                cells.push({
                    x: pos.horizontal ? pos.x + i : pos.x,
                    y: pos.horizontal ? pos.y : pos.y + i
                });
            }
            return {
                id: index,
                length: pos.length,
                cells: cells,
                hitCells: 0,
                destroyed: false
            };
        });

        // Mark ships on the player grid
        this.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);

        // Also set on the grid visual component
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.setShipPositions === 'function') {
            playerScript.setShipPositions(positions);
        }
    }

    /**
     * Called by AITurnHandler to process AI's shot
     */
    processAIShot(x: number, y: number): void {
        const result = this.processShot(x, y, this.state.playerGrid, this.state.playerShips, false);
        this.updateCellVisual(this.playerGridGenerator, x, y, result === 'miss' ? 'miss' : 'hit');

        const aiScript = this.turnHandler as any;
        if (aiScript && typeof aiScript.updateAfterShot === 'function') {
            aiScript.updateAfterShot(x, y, result);
        } else {
            this.updateAIState(x, y, result);
        }

        this.updateResult(`AI shot (${x}, ${y}) - ${result === 'miss' ? 'Miss' : 'HIT!'}`);

        if (this.checkWin('opponent')) {
            if (this.turnHandler) {
                this.turnHandler.onGameOver('opponent');
            }
            this.endGame('opponent');
            return;
        }

        this.delayedCall(() => {
            this.state.turn = 'player';
            this.updateStatus("Your turn");
            this.updateHint("Tap opponent's cell to shoot");
            this.animateSceneHandle(true);
        }, this.delayAfterShot);
    }

    // ==================== PUBLIC STATE ACCESSORS ====================

    isGameOver(): boolean {
        return this.state.phase === 'gameover';
    }

    getWinner(): 'player' | 'opponent' | null {
        return this.state.winner;
    }

    getPlayerHits(): number {
        return this.state.playerHits;
    }

    getOpponentHits(): number {
        return this.state.opponentHits;
    }

    onCellTapped(x: number, y: number) {
        this.playerShoot(x, y);
    }

    getState(): GameState {
        return this.state;
    }

    canTapCell(x: number, y: number): boolean {
        if (this.state.mode === 'multiplayer') {
            return (this.state.phase === 'aiming' || this.state.phase === 'confirm_send') &&
                   this.state.opponentGrid[x][y] === 'unknown';
        }
        return this.state.turn === 'player' &&
               this.state.phase === 'playing' &&
               this.state.opponentGrid[x][y] === 'unknown';
    }
}
