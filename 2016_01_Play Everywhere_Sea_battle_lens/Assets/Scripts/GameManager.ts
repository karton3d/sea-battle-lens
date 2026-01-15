// Game Manager - Central controller for Fleet Yeet!

// Game phases
type GamePhase = 'intro' | 'setup' | 'playing' | 'gameover';

// Turn states
type TurnState = 'player' | 'opponent' | 'waiting';

// Game modes
type GameMode = 'single' | 'multiplayer';

// Cell states
type CellState = 'unknown' | 'empty' | 'hit' | 'object' | 'destroyed';

// Ship info
interface ShipInfo {
    id: number;
    length: number;
    cells: Array<{x: number, y: number}>;
    hitCells: number;
    destroyed: boolean;
}

// AI state for smart targeting
interface AIState {
    mode: 'hunt' | 'target';
    targetCells: Array<{x: number, y: number}>;
    hitCells: Array<{x: number, y: number}>;
    lastHitDirection: 'horizontal' | 'vertical' | null;
}

// Complete game state
interface GameState {
    mode: GameMode;
    phase: GamePhase;
    turn: TurnState;
    
    // Grids: [x][y] = CellState
    playerGrid: CellState[][];
    opponentGrid: CellState[][];
    
    // Ships info
    playerShips: ShipInfo[];
    opponentShips: ShipInfo[];
    
    // Stats
    playerHits: number;
    opponentHits: number;
    totalObjectCells: number; // 20 cells total
    
    // Winner
    winner: 'player' | 'opponent' | null;
}

@component
export class GameManager extends BaseScriptComponent {
    
    // ==================== GAME SETTINGS ====================
    @input gridSize: number = 10;
    @input aiDelay: number = 1000;
    @input screenTransitionDelay: number = 0.5; // Delay before switching screens (seconds)
    
    // ==================== GRIDS ====================
    @input playerGridGenerator: SceneObject = null;
    @input opponentGridGenerator: SceneObject = null;
    
    // ==================== SCREENS ====================
    @input introScreen: SceneObject = null;
    @input setupScreen: SceneObject = null;
    @input gameScreen: SceneObject = null;
    @input gameOverScreen: SceneObject = null;
    
    // ==================== SCREEN ASSETS (enabled/disabled with screen) ====================
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

    // ==================== GAMEOVER BUTTONS ====================
    @input playAgainButton: SceneObject = null;

    // ==================== SCENE HANDLE ANIMATION ====================
    /** Scene handle that moves view between player/opponent grids */
    @input sceneHandle: SceneObject = null;
    /** Animation duration in seconds */
    @input handleAnimDuration: number = 0.5;

    // Game state
    private state: GameState;
    
    // AI state
    private aiState: AIState;
    
    // Total cells with objects (classic battleship: 4+3+3+2+2+2+1+1+1+1 = 20)
    private readonly TOTAL_OBJECT_CELLS = 20;
    
    onAwake() {
        this.initializeState();
        this.setupButtons();
        
        // Hide grids initially
        this.hideGrids();
        
        this.showScreen('intro');
        print("GameManager: Initialized");
        print(`GameManager: playerGrid=${this.playerGridGenerator ? 'set' : 'null'}, opponentGrid=${this.opponentGridGenerator ? 'set' : 'null'}`);
    }
    
    /**
     * Get grid script component from SceneObject
     */
    private getGridScript(gridObject: SceneObject): any {
        if (!gridObject) return null;
        const scripts = gridObject.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && typeof script.generate === 'function') {
                return script;
            }
        }
        return null;
    }
    
    /**
     * Hide both grids (hide visual content, not the script object)
     */
    hideGrids() {
        // Call hide() method on grid scripts instead of disabling the object
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.hide === 'function') {
            playerScript.hide();
        }
        
        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.hide === 'function') {
            opponentScript.hide();
        }
        
        print("GameManager: Grids hidden");
    }
    
    /**
     * Show player grid
     */
    showPlayerGrid() {
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.show === 'function') {
            playerScript.show();
            print("GameManager: Player grid shown");
        }
    }
    
    /**
     * Show opponent grid
     */
    showOpponentGrid() {
        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.show === 'function') {
            opponentScript.show();
            print("GameManager: Opponent grid shown");
        }
    }
    
    /**
     * Update cell visual state (spawn hit/miss marker)
     */
    updateCellVisual(gridObject: SceneObject, x: number, y: number, state: 'hit' | 'miss') {
        const gridScript = this.getGridScript(gridObject);
        if (gridScript && typeof gridScript.setCellState === 'function') {
            gridScript.setCellState(x, y, state);
            print(`GameManager: Updated cell (${x}, ${y}) visual to ${state}`);
        } else {
            print(`GameManager: WARNING - Could not update cell visual, setCellState not found`);
        }
    }
    
    /**
     * Generate grids (call generate() method on grid scripts)
     */
    generateGrids() {
        print("GameManager: generateGrids() called");
        
        // Generate player grid
        if (this.playerGridGenerator) {
            print(`GameManager: playerGridGenerator found: ${this.playerGridGenerator.name}`);
            const playerScript = this.getGridScript(this.playerGridGenerator);
            if (playerScript) {
                playerScript.generate();
                print("GameManager: Player grid generated successfully");
            } else {
                print("GameManager: ERROR - Player grid script not found!");
            }
        } else {
            print("GameManager: ERROR - playerGridGenerator is null!");
        }
        
        // Generate opponent grid
        if (this.opponentGridGenerator) {
            print(`GameManager: opponentGridGenerator found: ${this.opponentGridGenerator.name}`);
            const opponentScript = this.getGridScript(this.opponentGridGenerator);
            if (opponentScript) {
                opponentScript.generate();
                print("GameManager: Opponent grid generated successfully");
            } else {
                print("GameManager: ERROR - Opponent grid script not found!");
            }
        } else {
            print("GameManager: ERROR - opponentGridGenerator is null!");
        }
    }
    
    /**
     * Initialize empty game state
     */
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
            totalObjectCells: this.TOTAL_OBJECT_CELLS,
            winner: null
        };
        
        this.aiState = {
            mode: 'hunt',
            targetCells: [],
            hitCells: [],
            lastHitDirection: null
        };
    }
    
    /**
     * Create empty grid
     */
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
    
    /**
     * Setup button interactions
     * Uses UI Button component events (onPress) to allow animations to play
     */
    setupButtons() {
        // Single Player button
        if (this.singlePlayerButton) {
            const buttonScript = this.getUIButtonScript(this.singlePlayerButton);
            if (buttonScript && buttonScript.onPress) {
                buttonScript.onPress.add(() => this.onSinglePlayerTap());
                print("GameManager: Single Player button setup (UI Button)");
            } else {
                // Fallback to Component.Touch if UI Button not found
                this.setupTouchButton(this.singlePlayerButton, () => this.onSinglePlayerTap());
            }
        }
        
        // Multiplayer button
        if (this.multiplayerButton) {
            const buttonScript = this.getUIButtonScript(this.multiplayerButton);
            if (buttonScript && buttonScript.onPress) {
                buttonScript.onPress.add(() => this.onMultiplayerTap());
                print("GameManager: Multiplayer button setup (UI Button)");
            } else {
                this.setupTouchButton(this.multiplayerButton, () => this.onMultiplayerTap());
            }
        }
        
        // Start button
        if (this.startButton) {
            const buttonScript = this.getUIButtonScript(this.startButton);
            if (buttonScript && buttonScript.onPress) {
                buttonScript.onPress.add(() => this.onStartTap());
                print("GameManager: Start button setup (UI Button)");
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
                print("GameManager: Reshuffle button setup");
            }
        }

        // Play Again button
        if (this.playAgainButton) {
            const buttonScript = this.getUIButtonScript(this.playAgainButton);
            if (buttonScript && buttonScript.onPress) {
                buttonScript.onPress.add(() => this.onPlayAgainTap());
                print("GameManager: Play Again button setup (UI Button)");
            } else {
                this.setupTouchButton(this.playAgainButton, () => this.onPlayAgainTap());
            }
        }
    }
    
    /**
     * Get UI Button script component
     */
    private getUIButtonScript(buttonObject: SceneObject): any {
        if (!buttonObject) return null;
        const scripts = buttonObject.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            // Check if it's UI Button (has onPress event)
            if (script && script.onPress && typeof script.onPress.add === 'function') {
                return script;
            }
        }
        return null;
    }
    
    /**
     * Fallback: Setup Component.Touch for buttons without UI Button component
     */
    private setupTouchButton(buttonObject: SceneObject, callback: () => void) {
        let interaction = buttonObject.getComponent("Component.Touch") as InteractionComponent;
        if (!interaction) {
            interaction = buttonObject.createComponent("Component.Touch") as InteractionComponent;
        }
        if (interaction) {
            interaction.onTap.add(callback);
            print(`GameManager: ${buttonObject.name} setup (Component.Touch fallback)`);
        }
    }
    
    /**
     * Show specific screen, hide others
     */
    showScreen(screen: 'intro' | 'setup' | 'game' | 'gameover') {
        if (this.introScreen) this.introScreen.enabled = (screen === 'intro');
        if (this.setupScreen) this.setupScreen.enabled = (screen === 'setup');
        if (this.gameScreen) this.gameScreen.enabled = (screen === 'game');
        if (this.gameOverScreen) this.gameOverScreen.enabled = (screen === 'gameover');
        
        // Toggle screen assets
        this.setAssetsEnabled(this.introAssets, screen === 'intro');
        
        print(`GameManager: Showing screen: ${screen}`);
    }
    
    /**
     * Enable/disable array of SceneObjects
     */
    setAssetsEnabled(assets: SceneObject[], enabled: boolean) {
        for (const asset of assets) {
            if (asset) {
                asset.enabled = enabled;
            }
        }
    }
    
    /**
     * Update status text
     */
    updateStatus(message: string) {
        if (this.statusText) {
            this.statusText.text = message;
        }
        print(`GameManager: Status: ${message}`);
    }
    
    /**
     * Update hint text
     */
    updateHint(message: string) {
        if (this.hintText) {
            this.hintText.text = message;
        }
    }
    
    /**
     * Update result text
     */
    updateResult(message: string) {
        if (this.resultText) {
            this.resultText.text = message;
        }
        print(`GameManager: Result: ${message}`);
    }
    
    // ==================== BUTTON HANDLERS ====================
    
    /**
     * Single Player button tapped
     */
    onSinglePlayerTap() {
        print("GameManager: Single Player selected");
        this.state.mode = 'single';
        this.delayedCall(() => this.startSetup(), this.screenTransitionDelay);
    }
    
    /**
     * Multiplayer button tapped
     */
    onMultiplayerTap() {
        print("GameManager: Multiplayer selected");
        this.state.mode = 'multiplayer';
        this.delayedCall(() => this.startSetup(), this.screenTransitionDelay);
    }
    
    /**
     * Start button tapped
     */
    onStartTap() {
        print("GameManager: Start button tapped");
        this.delayedCall(() => this.startGame(), this.screenTransitionDelay);
    }

    /**
     * Reshuffle button tapped - regenerate ship placements
     */
    onReshuffleTap() {
        // Only allow during setup phase
        if (this.state.phase !== 'setup') {
            print("[GameManager] onReshuffleTap: Ignored - not in setup phase");
            return;
        }

        print("[GameManager] onReshuffleTap: Reshuffling ship placements");

        // Reshuffle player grid ships
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.reshuffleShips === 'function') {
            playerScript.reshuffleShips();
        }

        // Reshuffle opponent grid ships (hidden from player)
        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.reshuffleShips === 'function') {
            opponentScript.reshuffleShips();
        }

        // Regenerate GameManager's placement data
        this.state.playerShips = this.generateShipPlacements();
        this.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);
        this.state.opponentShips = this.generateShipPlacements();

        this.updateStatus("New positions!");
        this.updateHint("Tap Reshuffle again or Start");

        print("[GameManager] onReshuffleTap: Reshuffle complete");
    }

    /**
     * Play Again button tapped
     */
    onPlayAgainTap() {
        print("GameManager: Play Again tapped");
        this.delayedCall(() => this.resetGame(), this.screenTransitionDelay);
    }
    
    /**
     * Execute callback after delay (seconds)
     */
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
    
    /**
     * Start setup phase
     */
    startSetup() {
        this.state.phase = 'setup';
        this.showScreen('setup');
        
        // Generate and show grids
        this.generateGrids();
        this.showPlayerGrid();
        // Don't show opponent grid yet in setup (only player's objects visible)
        
        // Generate random placement for both grids (game state)
        this.generatePlacements();
        
        this.updateStatus("Your objects are placed!");
        this.updateHint("Tap Start to begin");
        
        print("GameManager: Setup phase started");
    }
    
    /**
     * Generate random placements for both players
     */
    generatePlacements() {
        // Player grid: generate and store ship positions
        this.state.playerShips = this.generateShipPlacements();
        this.markShipsOnGrid(this.state.playerGrid, this.state.playerShips, true);
        
        // Opponent grid: generate positions (hidden from player)
        this.state.opponentShips = this.generateShipPlacements();
        // Don't mark on opponentGrid - those cells stay 'unknown' until shot
        
        print(`GameManager: Generated ${this.state.playerShips.length} ships for each player`);
    }
    
    /**
     * Generate ship placements (returns ship info array)
     */
    generateShipPlacements(): ShipInfo[] {
        const ships: ShipInfo[] = [];
        const occupied: boolean[][] = this.createEmptyBoolGrid();
        
        // Ships to place: [length, count]
        const shipsToPlace: Array<[number, number]> = [
            [4, 1],  // 1x 4-cell
            [3, 2],  // 2x 3-cell
            [2, 3],  // 3x 2-cell
            [1, 4]   // 4x 1-cell
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
    
    /**
     * Create empty boolean grid
     */
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
    
    /**
     * Place a random ship and mark occupied cells
     */
    placeRandomShip(id: number, length: number, occupied: boolean[][]): ShipInfo | null {
        const maxAttempts = 1000;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            const horizontal = Math.random() < 0.5;
            
            if (this.canPlaceShipAt(x, y, length, horizontal, occupied)) {
                const cells: Array<{x: number, y: number}> = [];
                
                // Mark cells
                for (let i = 0; i < length; i++) {
                    const cx = horizontal ? x + i : x;
                    const cy = horizontal ? y : y + i;
                    cells.push({x: cx, y: cy});
                    
                    // Mark cell and neighbors as occupied (for no-touching rule)
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
        
        print(`GameManager: Failed to place ship of length ${length}`);
        return null;
    }
    
    /**
     * Check if ship can be placed at position
     */
    canPlaceShipAt(x: number, y: number, length: number, horizontal: boolean, occupied: boolean[][]): boolean {
        for (let i = 0; i < length; i++) {
            const cx = horizontal ? x + i : x;
            const cy = horizontal ? y : y + i;
            
            // Check bounds
            if (cx < 0 || cx >= this.gridSize || cy < 0 || cy >= this.gridSize) {
                return false;
            }
            
            // Check if occupied (includes buffer for no-touching)
            if (occupied[cx][cy]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Mark cell and all neighbors as occupied (for no-touching rule)
     */
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
    
    /**
     * Mark ships on grid (for player's own grid - shows 'object')
     */
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
     * Start the game
     */
    startGame() {
        this.state.phase = 'playing';
        this.state.turn = 'player';
        this.showScreen('game');
        
        // Show both grids for gameplay
        this.showPlayerGrid();
        this.showOpponentGrid();
        
        this.updateStatus("Your turn");
        this.updateHint("Tap opponent's cell to shoot");
        this.updateResult("");
        this.animateSceneHandle(true); // Move to show opponent grid
        
        print("GameManager: Game started!");
    }
    
    // ==================== SHOOTING LOGIC ====================
    
    /**
     * Player shoots at opponent's grid
     * Called when player taps a cell
     */
    playerShoot(x: number, y: number) {
        // Check if it's player's turn
        if (this.state.turn !== 'player' || this.state.phase !== 'playing') {
            print("GameManager: Not player's turn");
            return;
        }
        
        // Check if cell already shot
        if (this.state.opponentGrid[x][y] !== 'unknown') {
            this.updateResult("Already shot here!");
            return;
        }
        
        // Process shot
        const result = this.processShot(x, y, this.state.opponentGrid, this.state.opponentShips, true);
        
        // Update visual marker on opponent's grid
        this.updateCellVisual(this.opponentGridGenerator, x, y, result === 'miss' ? 'miss' : 'hit');
        
        // Check win
        if (this.checkWin('player')) {
            this.endGame('player');
            return;
        }
        
        // Switch to opponent's turn
        this.state.turn = 'opponent';
        this.updateStatus("Opponent's turn");
        this.updateHint("Waiting...");
        this.animateSceneHandle(false); // Move to show player grid
        
        // AI opponent
        if (this.state.mode === 'single') {
            this.scheduleAITurn();
        } else {
            // Multiplayer: submit turn
            this.submitTurn(x, y, result);
        }
    }
    
    /**
     * Process a shot on grid - uses GridGenerator's hasShipAt for real ship positions
     */
    processShot(x: number, y: number, grid: CellState[][], ships: ShipInfo[], isPlayerShot: boolean): 'hit' | 'miss' | 'destroyed' {
        // Determine which grid to check
        const gridObject = isPlayerShot ? this.opponentGridGenerator : this.playerGridGenerator;
        
        // Check if there's a ship at this position using GridGenerator's actual data
        const hasShip = this.checkShipAtPosition(gridObject, x, y);
        
        if (hasShip) {
            // Hit!
            grid[x][y] = 'hit';
            
            if (isPlayerShot) {
                this.state.playerHits++;
                print(`GameManager: Player hit at (${x}, ${y})! Total hits: ${this.state.playerHits}/${this.TOTAL_OBJECT_CELLS}`);
            } else {
                this.state.opponentHits++;
                print(`GameManager: AI hit at (${x}, ${y})! Total hits: ${this.state.opponentHits}/${this.TOTAL_OBJECT_CELLS}`);
            }
            
            this.updateResult("HIT!");
            return 'hit';
        } else {
            // Miss
            grid[x][y] = 'empty';
            this.updateResult("Miss");
            return 'miss';
        }
    }
    
    /**
     * Check if there's a ship at position using GridGenerator's hasShipAt
     */
    checkShipAtPosition(gridObject: SceneObject, x: number, y: number): boolean {
        const gridScript = this.getGridScript(gridObject);
        if (gridScript && typeof gridScript.hasShipAt === 'function') {
            return gridScript.hasShipAt(x, y);
        }
        print(`GameManager: WARNING - Could not check ship at (${x}, ${y}), hasShipAt not found`);
        return false;
    }
    
    /**
     * Find ship at position
     */
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

    /**
     * Animate scene handle to shift view between grids
     * @param toPlayerTurn true = player's turn (show opponent grid), false = opponent's turn (show player grid)
     */
    private animateSceneHandle(toPlayerTurn: boolean): void {
        if (!this.sceneHandle) return;

        const transform = this.sceneHandle.getTransform();
        const currentPos = transform.getLocalPosition();
        const targetX = toPlayerTurn ? -300 : 0;

        const start = { x: currentPos.x };
        const end = { x: targetX };

        const TWEEN = (global as any).TWEEN;
        new TWEEN.Tween(start)
            .to(end, this.handleAnimDuration * 1000)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
                transform.setLocalPosition(new vec3(start.x, currentPos.y, currentPos.z));
            })
            .onComplete(() => {
                print(`[GameManager] Scene handle animation complete: x=${targetX}`);
            })
            .start();
    }

    // ==================== AI OPPONENT ====================
    
    /**
     * Schedule AI turn with delay
     */
    scheduleAITurn() {
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        delayEvent.bind(() => {
            this.aiTurn();
        });
        delayEvent.reset(this.aiDelay / 1000); // Convert ms to seconds
    }
    
    /**
     * AI takes its turn
     */
    aiTurn() {
        if (this.state.turn !== 'opponent' || this.state.phase !== 'playing') {
            return;
        }
        
        // Get AI's shot
        const shot = this.getAIShot();
        if (!shot) {
            print("GameManager: AI couldn't find a cell to shoot");
            return;
        }
        
        print(`GameManager: AI shoots at (${shot.x}, ${shot.y})`);
        
        // Process shot on player's grid
        const result = this.processShot(shot.x, shot.y, this.state.playerGrid, this.state.playerShips, false);
        
        // Update visual marker on player's grid
        this.updateCellVisual(this.playerGridGenerator, shot.x, shot.y, result === 'miss' ? 'miss' : 'hit');
        
        // Update AI state based on result
        this.updateAIState(shot.x, shot.y, result);
        
        // Update UI
        this.updateResult(`AI shot (${shot.x}, ${shot.y}) - ${result === 'miss' ? 'Miss' : 'HIT!'}`);
        
        // Check win
        if (this.checkWin('opponent')) {
            this.endGame('opponent');
            return;
        }
        
        // Switch to player's turn
        this.state.turn = 'player';
        this.updateStatus("Your turn");
        this.updateHint("Tap opponent's cell to shoot");
        this.animateSceneHandle(true); // Move to show opponent grid
    }

    /**
     * Get AI's shot (smart hunt/target mode)
     */
    getAIShot(): {x: number, y: number} | null {
        // Target mode: shoot adjacent cells to find rest of ship
        if (this.aiState.mode === 'target' && this.aiState.targetCells.length > 0) {
            // Filter out already shot cells
            while (this.aiState.targetCells.length > 0) {
                const cell = this.aiState.targetCells.pop()!;
                if (this.state.playerGrid[cell.x][cell.y] === 'object' || 
                    this.state.playerGrid[cell.x][cell.y] === 'unknown') {
                    return cell;
                }
            }
            // No valid targets, back to hunt mode
            this.aiState.mode = 'hunt';
        }
        
        // Hunt mode: random cell
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
    
    /**
     * Update AI state after shot
     */
    updateAIState(x: number, y: number, result: 'hit' | 'miss' | 'destroyed') {
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
        } else if (result === 'destroyed') {
            // Ship destroyed, back to hunt mode
            this.aiState.mode = 'hunt';
            this.aiState.targetCells = [];
            this.aiState.hitCells = [];
            this.aiState.lastHitDirection = null;
        }
        // On miss: stay in current mode, continue with remaining targets
    }
    
    /**
     * Add adjacent cells to AI target list
     */
    addAdjacentToTargets(x: number, y: number) {
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
                const state = this.state.playerGrid[nx][ny];
                if (state === 'object' || state === 'unknown') {
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
    determineDirection() {
        if (this.aiState.hitCells.length < 2) return;
        
        const first = this.aiState.hitCells[0];
        const second = this.aiState.hitCells[1];
        
        if (first.x === second.x) {
            // Vertical ship
            this.aiState.lastHitDirection = 'vertical';
            // Keep only vertical targets
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.x === first.x);
        } else if (first.y === second.y) {
            // Horizontal ship
            this.aiState.lastHitDirection = 'horizontal';
            // Keep only horizontal targets
            this.aiState.targetCells = this.aiState.targetCells.filter(c => c.y === first.y);
        }
    }
    
    // ==================== WIN CONDITION ====================
    
    /**
     * Check if player/opponent has won
     */
    checkWin(who: 'player' | 'opponent'): boolean {
        const hits = who === 'player' ? this.state.playerHits : this.state.opponentHits;
        const won = hits >= this.TOTAL_OBJECT_CELLS;
        
        if (won) {
            print(`GameManager: ${who} WON! Hits: ${hits}/${this.TOTAL_OBJECT_CELLS}`);
        }
        
        return won;
    }
    
    /**
     * End the game
     */
    endGame(winner: 'player' | 'opponent') {
        this.state.phase = 'gameover';
        this.state.winner = winner;
        this.showScreen('gameover');
        
        if (winner === 'player') {
            this.updateStatus("YOU WON!");
        } else {
            this.updateStatus("YOU LOST!");
        }
        
        print(`GameManager: Game over! Winner: ${winner}`);
    }
    
    /**
     * Reset game to initial state
     */
    resetGame() {
        this.initializeState();
        
        // Hide grids
        this.hideGrids();
        
        // Reset grid scripts
        const playerScript = this.getGridScript(this.playerGridGenerator);
        if (playerScript && typeof playerScript.resetGame === 'function') {
            playerScript.resetGame();
        }
        
        const opponentScript = this.getGridScript(this.opponentGridGenerator);
        if (opponentScript && typeof opponentScript.resetGame === 'function') {
            opponentScript.resetGame();
        }
        
        this.showScreen('intro');
        this.updateResult("");
        print("GameManager: Game reset");
    }
    
    // ==================== MULTIPLAYER (PLACEHOLDER) ====================
    
    /**
     * Submit turn to Turn-Based system (multiplayer)
     */
    submitTurn(x: number, y: number, result: 'hit' | 'miss' | 'destroyed') {
        // TODO: Implement Turn-Based integration
        print(`GameManager: Would submit turn - shot (${x}, ${y}), result: ${result}`);
    }
    
    /**
     * Receive opponent's turn (multiplayer)
     */
    receiveTurn(x: number, y: number) {
        // TODO: Implement Turn-Based integration
        print(`GameManager: Would receive turn - opponent shot (${x}, ${y})`);
    }
    
    // ==================== PUBLIC METHODS ====================
    
    /**
     * Called when player taps a cell on opponent's grid
     */
    onCellTapped(x: number, y: number) {
        this.playerShoot(x, y);
    }
    
    /**
     * Get current game state (for debugging/UI)
     */
    getState(): GameState {
        return this.state;
    }
    
    /**
     * Check if cell can be tapped
     */
    canTapCell(x: number, y: number): boolean {
        return this.state.turn === 'player' && 
               this.state.phase === 'playing' &&
               this.state.opponentGrid[x][y] === 'unknown';
    }
}
