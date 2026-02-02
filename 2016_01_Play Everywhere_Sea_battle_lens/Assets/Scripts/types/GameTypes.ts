// Shared type definitions for Meme Fleet Battle
// All components should import types from this file

// ==================== GAME STATE TYPES ====================

/** Game phases */
export type GamePhase =
    | 'waiting'            // Initial: waiting for TurnBasedManager to signal multiplayer state
    | 'intro'
    | 'setup'              // Initial setup (single player or Player 1 first turn)
    | 'setup_pending'      // Multiplayer: setup with pending incoming shot to evaluate
    | 'playing'            // Single player: active gameplay
    | 'aiming'             // Multiplayer: selecting target cell
    | 'confirm_send'       // Multiplayer: aim selected, waiting for Send tap
    | 'gameover';

/** Turn states */
export type TurnState = 'player' | 'opponent' | 'waiting';

/** Game modes */
export type GameMode = 'single' | 'multiplayer';

/** Cell states for grid tracking */
export type CellState = 'unknown' | 'empty' | 'hit' | 'object' | 'destroyed';

/** Shot result */
export type ShotResult = 'hit' | 'miss' | 'destroyed';

// ==================== DATA STRUCTURES ====================

/** Ship information */
export interface ShipInfo {
    id: number;
    length: number;
    cells: Array<{x: number, y: number}>;
    hitCells: number;
    destroyed: boolean;
}

/** AI opponent state for hunt/target algorithm */
export interface AIState {
    mode: 'hunt' | 'target';
    targetCells: Array<{x: number, y: number}>;
    hitCells: Array<{x: number, y: number}>;
    lastHitDirection: 'horizontal' | 'vertical' | null;
}

/** Complete game state */
export interface GameState {
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
    totalObjectCells: number;

    // Winner
    winner: 'player' | 'opponent' | null;

    // Setup tracking - true after first Start button press, ships are frozen
    setupComplete: boolean;

    // Pending incoming shot from opponent (stored when turn received, used when setup confirmed)
    pendingIncomingShot: { x: number; y: number } | null;
}

// ==================== INTERFACES ====================

/**
 * Turn handler interface for abstracting AI vs Multiplayer
 * Implemented by: AITurnHandler, TurnBasedHandler
 */
export interface ITurnHandler {
    /**
     * Called when it's the opponent's turn to act
     * For AI: schedules delayed callback to compute and execute shot
     * For Multiplayer: waits for turn data via Turn-Based component
     */
    startOpponentTurn(): void;

    /**
     * Called after player makes a shot - notifies handler for any processing
     * For AI: no-op (AI doesn't need notification)
     * For Multiplayer: submits turn data via Turn-Based
     */
    onPlayerShotComplete(x: number, y: number, result: ShotResult): void;

    /**
     * Called when game ends
     * For Multiplayer: includes winner info in final turn data
     */
    onGameOver(winner: 'player' | 'opponent'): void;

    /**
     * Cleanup when switching modes or resetting game
     */
    reset(): void;
}

/**
 * Grid controller interface for abstracted grid operations
 * Implemented by: SeaBattleGrid (GridGenerator.ts)
 */
export interface IGridController {
    generate(): void;
    show(): void;
    hide(): void;
    hasShipAt(x: number, y: number): boolean;
    setCellState(x: number, y: number, state: 'hit' | 'miss' | 'unknown'): void;
    resetGame(): void;
    reshuffleShips(): void;
}

// ==================== MULTIPLAYER DATA ====================

/**
 * Turn data schema for multiplayer serialization
 * Sent via Turn-Based component as JSON
 *
 * Flow:
 * - Player sends: shotX, shotY (aim), shipPositions (first turn only)
 * - Player also sends: incomingShotResult (result of opponent's previous shot, evaluated locally)
 * - Receiver evaluates the incoming shot against their own grid
 */
export interface TurnData {
    /** Shot column (0-9) - the aim coordinates */
    shotX: number;
    /** Shot row (0-9) - the aim coordinates */
    shotY: number;

    /**
     * Result of opponent's PREVIOUS shot, evaluated locally by this player
     * This tells the opponent what happened to their shot
     */
    incomingShotResult?: ShotResult;

    /** Current hit count for sender (how many hits they've landed on opponent) */
    hitsCount?: number;

    /** Whether game is over (checked after evaluating incoming shot) */
    isGameOver: boolean;

    /** Winner if game over */
    winner: 'player' | 'opponent' | null;

    /** Ship positions (Player 1's first turn only - for opponent to evaluate future shots) */
    shipPositions?: Array<{
        x: number;
        y: number;
        length: number;
        horizontal: boolean;
    }>;
}

/**
 * Pending shot waiting to be evaluated
 * Stored when receiving opponent's turn, evaluated after setup confirmation
 */
export interface PendingShot {
    x: number;
    y: number;
}

/**
 * Shot history entry for tracking shots across turns
 * Persisted to global variables to survive lens reopening
 */
export interface ShotHistoryEntry {
    x: number;
    y: number;
    result: ShotResult;
}

/**
 * Multiplayer session state
 */
export interface MultiplayerState {
    /** Current turn count from Turn-Based component */
    turnCount: number;
    /** Pending incoming shot to evaluate after setup */
    pendingShot: PendingShot | null;
    /** Selected aim for current turn (before sending) */
    selectedAim: PendingShot | null;
    /** Opponent's ship positions (received on their first turn) */
    opponentShipPositions: TurnData['shipPositions'] | null;
    /** Our ship positions to send */
    ourShipPositions: TurnData['shipPositions'] | null;
    /** Whether we've sent our first turn */
    hasSentFirstTurn: boolean;
    /** Result of our previous shot (received from opponent) */
    previousShotResult: ShotResult | null;
}

// ==================== CONSTANTS ====================

/** Total cells with objects (classic battleship fleet) */
export const TOTAL_OBJECT_CELLS = 20;

/** Grid size */
export const GRID_SIZE = 10;

/** Ship configuration: [length, count] */
export const SHIP_CONFIG: Array<[number, number]> = [
    [4, 1],  // 1x 4-cell ship
    [3, 2],  // 2x 3-cell ships
    [2, 3],  // 3x 2-cell ships
    [1, 4]   // 4x 1-cell ships
];
