// Game Manager - Central controller for Meme Fleet Battle

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
    
    // Grid size
    @input gridSize: number = 10;
    
    // Reference to player's grid generator
    @input playerGridGenerator: SceneObject;
    
    // Reference to opponent's grid generator
    @input opponentGridGenerator: SceneObject;
    
    // UI Text objects
    @input statusText: Text;
    @input hintText: Text;
    @input resultText: Text;
    
    // UI Buttons (SceneObjects with InteractionComponent)
    @input singlePlayerButton: SceneObject;
    @input multiplayerButton: SceneObject;
    @input startButton: SceneObject;
    @input playAgainButton: SceneObject;
    
    // Screen containers
    @input introScreen: SceneObject;
    @input setupScreen: SceneObject;
    @input gameScreen: SceneObject;
    @input gameOverScreen: SceneObject;
    
    // AI delay (ms)
    @input aiDelay: number = 1000;
    
    // Game state
    private state: GameState;
    
    // AI state
    private aiState: AIState;
    
    // Total cells with objects (classic battleship: 4+3+3+2+2+2+1+1+1+1 = 20)
    private readonly TOTAL_OBJECT_CELLS = 20;
    
    onAwake() {
        this.initializeState();
        this.setupButtons();
        this.showScreen('intro');
        print("GameManager: Initialized");
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
     */
    setupButtons() {
        // Single Player button
        if (this.singlePlayerButton) {
            const interaction = this.singlePlayerButton.getComponent("Component.InteractionComponent") as InteractionComponent;
            if (interaction) {
                interaction.onTap.add(() => this.onSinglePlayerTap());
            }
        }
        
        // Multiplayer button
        if (this.multiplayerButton) {
            const interaction = this.multiplayerButton.getComponent("Component.InteractionComponent") as InteractionComponent;
            if (interaction) {
                interaction.onTap.add(() => this.onMultiplayerTap());
            }
        }
        
        // Start button
        if (this.startButton) {
            const interaction = this.startButton.getComponent("Component.InteractionComponent") as InteractionComponent;
            if (interaction) {
                interaction.onTap.add(() => this.onStartTap());
            }
        }
        
        // Play Again button
        if (this.playAgainButton) {
            const interaction = this.playAgainButton.getComponent("Component.InteractionComponent") as InteractionComponent;
            if (interaction) {
                interaction.onTap.add(() => this.onPlayAgainTap());
            }
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
        
        print(`GameManager: Showing screen: ${screen}`);
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
        this.startSetup();
    }
    
    /**
     * Multiplayer button tapped
     */
    onMultiplayerTap() {
        print("GameManager: Multiplayer selected");
        this.state.mode = 'multiplayer';
        this.startSetup();
    }
    
    /**
     * Start button tapped
     */
    onStartTap() {
        print("GameManager: Start button tapped");
        this.startGame();
    }
    
    /**
     * Play Again button tapped
     */
    onPlayAgainTap() {
        print("GameManager: Play Again tapped");
        this.resetGame();
    }
    
    // ==================== GAME FLOW ====================
    
    /**
     * Start setup phase
     */
    startSetup() {
        this.state.phase = 'setup';
        this.showScreen('setup');
        
        // Generate random placement for both grids
        this.generatePlacements();
        
        this.updateStatus("Your objects are placed!");
        this.updateHint("Tap Start to begin");
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
        
        this.updateStatus("Your turn");
        this.updateHint("Tap opponent's cell to shoot");
        this.updateResult("");
        
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
        
        // Check win
        if (this.checkWin('player')) {
            this.endGame('player');
            return;
        }
        
        // Switch to opponent's turn
        this.state.turn = 'opponent';
        this.updateStatus("Opponent's turn");
        this.updateHint("Waiting...");
        
        // AI opponent
        if (this.state.mode === 'single') {
            this.scheduleAITurn();
        } else {
            // Multiplayer: submit turn
            this.submitTurn(x, y, result);
        }
    }
    
    /**
     * Process a shot on grid
     */
    processShot(x: number, y: number, grid: CellState[][], ships: ShipInfo[], isPlayerShot: boolean): 'hit' | 'miss' | 'destroyed' {
        // Check if there's a ship at this position
        const ship = this.findShipAt(x, y, ships);
        
        if (ship) {
            // Hit!
            grid[x][y] = 'hit';
            ship.hitCells++;
            
            if (isPlayerShot) {
                this.state.playerHits++;
            } else {
                this.state.opponentHits++;
            }
            
            // Check if ship destroyed
            if (ship.hitCells >= ship.length) {
                ship.destroyed = true;
                // Mark all cells as destroyed
                for (const cell of ship.cells) {
                    grid[cell.x][cell.y] = 'destroyed';
                }
                this.updateResult(`HIT! ${ship.length}-cell object destroyed!`);
                print(`GameManager: Ship ${ship.id} destroyed!`);
                return 'destroyed';
            } else {
                this.updateResult("HIT!");
                return 'hit';
            }
        } else {
            // Miss
            grid[x][y] = 'empty';
            this.updateResult("Miss");
            return 'miss';
        }
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
        return hits >= this.TOTAL_OBJECT_CELLS;
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
