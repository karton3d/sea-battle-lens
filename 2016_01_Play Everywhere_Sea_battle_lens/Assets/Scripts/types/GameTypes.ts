// Shared type definitions for Meme Fleet Battle
// All components should import types from this file

// ==================== GAME STATE TYPES ====================

/** Game phases */
export type GamePhase = 'intro' | 'setup' | 'playing' | 'gameover';

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
 */
export interface TurnData {
    /** Shot column (0-9) */
    shotX: number;
    /** Shot row (0-9) */
    shotY: number;
    /** Result of the shot */
    result: ShotResult;
    /** Current hit count for sender */
    hitsCount?: number;
    /** Whether game is over */
    isGameOver: boolean;
    /** Winner if game over */
    winner: 'player' | 'opponent' | null;
    /** Ship positions (first turn only) */
    shipPositions?: Array<{
        x: number;
        y: number;
        length: number;
        horizontal: boolean;
    }>;
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
