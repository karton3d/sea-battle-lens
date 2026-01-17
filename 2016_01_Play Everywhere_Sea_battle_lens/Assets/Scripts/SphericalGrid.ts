// Spherical Grid - Places cells on a sphere surface using lat/lon coordinates
// Creates a globe-like grid for the battleship game

@component
export class SphericalGrid extends BaseScriptComponent {

    // ==================== PREFABS ====================

    /** Prefab for grid cell */
    @input cellPrefab: ObjectPrefab;

    /** Ship prefabs (1-4 cells length) */
    @input ship1Prefab: ObjectPrefab;
    @input ship2Prefab: ObjectPrefab;
    @input ship3Prefab: ObjectPrefab;
    @input ship4Prefab: ObjectPrefab;

    /** Marker prefabs for hit/miss visualization */
    @input hitMarkerPrefab: ObjectPrefab;
    @input missMarkerPrefab: ObjectPrefab;

    // ==================== GRID PARAMETERS ====================

    /** Number of rows */
    @input gridRows: number = 10;

    /** Number of columns */
    @input gridCols: number = 10;

    /** Spacing between cells */
    @input cellSpacing: number = 1.0;

    /** Curvature amount (0 = flat, higher = more curved like a sphere) */
    @input curvature: number = 0.0;

    /** Height offset for ships above grid surface */
    @input objectHeightOffset: number = 0.1;

    /** Height offset for miss markers above grid surface */
    @input missMarkerHeightOffset: number = 0.02;

    // ==================== OPTIONS ====================

    /** Parent object for grid elements */
    @input gridParent: SceneObject = null;

    /** Use random placement (true) or fixed test placement (false) */
    @input useRandomPlacement: boolean = true;

    /** Enable cell tapping */
    @input enableCellTapping: boolean = false;

    /** Reference to GameManager */
    @input gameManager: SceneObject = null;

    /** Auto-generate on start */
    @input autoGenerate: boolean = false;

    /** Enable debug logging */
    @input debugMode: boolean = false;

    // ==================== PRIVATE STATE ====================

    /** Grid cells [row][col] -> SceneObject */
    private gridCells2D: SceneObject[][] = [];

    /** Flat array of all cells */
    private gridCells: SceneObject[] = [];

    /** Placed ships */
    private placedShips: SceneObject[] = [];

    /** Placed markers */
    private placedMarkers: SceneObject[] = [];

    /** Ship occupancy grid [row][col] -> boolean */
    private shipGrid: boolean[][] = [];

    /** Visibility state */
    private isVisible: boolean = false;

    /** Cell tap callback */
    public onCellTap: ((row: number, col: number) => void) | null = null;

    // ==================== LOGGING ====================

    private log(message: string): void {
        if (this.debugMode) {
            print(`[SphericalGrid] ${message}`);
        }
    }

    private logError(message: string): void {
        print(`[SphericalGrid] ERROR: ${message}`);
    }

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        this.initShipGrid();

        if (this.autoGenerate) {
            this.generate();
        }

        this.log(`Initialized - grid: ${this.gridRows}x${this.gridCols}, spacing: ${this.cellSpacing}, curvature: ${this.curvature}`);
    }

    // ==================== PUBLIC API ====================

    /**
     * Generate the spherical grid
     */
    generate(): void {
        this.generateGrid();

        if (this.useRandomPlacement) {
            const success = this.placeShipsRandomly();
            if (!success) {
                this.log('Random placement failed, using test placement');
                this.placeTestShips();
            }
        } else {
            this.placeTestShips();
        }

        this.log('Generation complete');
    }

    /**
     * Show the grid
     */
    show(): void {
        this.isVisible = true;

        for (const cell of this.gridCells) {
            if (cell) cell.enabled = true;
        }
        for (const ship of this.placedShips) {
            if (ship) ship.enabled = true;
        }
        for (const marker of this.placedMarkers) {
            if (marker) marker.enabled = true;
        }

        this.log('Shown');
    }

    /**
     * Hide the grid
     */
    hide(): void {
        this.isVisible = false;

        for (const cell of this.gridCells) {
            if (cell) cell.enabled = false;
        }
        for (const ship of this.placedShips) {
            if (ship) ship.enabled = false;
        }
        for (const marker of this.placedMarkers) {
            if (marker) marker.enabled = false;
        }

        this.log('Hidden');
    }

    /**
     * Check if cell has ship
     */
    hasShipAt(row: number, col: number): boolean {
        if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) {
            return false;
        }
        return this.shipGrid[row][col];
    }

    /**
     * Set cell visual state (spawn marker)
     */
    setCellState(row: number, col: number, state: 'hit' | 'miss' | 'unknown'): void {
        if (state === 'hit' && this.hitMarkerPrefab) {
            this.spawnMarker(row, col, this.hitMarkerPrefab, 'hit');
        } else if (state === 'miss' && this.missMarkerPrefab) {
            this.spawnMarker(row, col, this.missMarkerPrefab, 'miss');
        }

        this.log(`Cell (${row}, ${col}) state: ${state}`);
    }

    /**
     * Reshuffle ships
     */
    reshuffleShips(): void {
        this.log('Reshuffling ships');

        this.clearShips();
        this.initShipGrid();

        if (this.useRandomPlacement) {
            const success = this.placeShipsRandomly();
            if (!success) {
                this.placeTestShips();
            }
        } else {
            this.placeTestShips();
        }

        this.log(`Reshuffle complete, ${this.placedShips.length} ships placed`);
    }

    /**
     * Reset game
     */
    resetGame(): void {
        this.clearShips();
        this.clearMarkers();
        this.initShipGrid();
        this.clearGrid();
        this.generateGrid();
    }

    // ==================== COORDINATE CONVERSION ====================

    /**
     * Get flat grid position (centered at origin)
     */
    private getFlatGridPosition(row: number, col: number): { x: number, y: number } {
        // Center the grid around origin
        const centerRow = (this.gridRows - 1) / 2;
        const centerCol = (this.gridCols - 1) / 2;

        const x = (col - centerCol) * this.cellSpacing;
        const y = (row - centerRow) * this.cellSpacing;

        return { x, y };
    }

    /**
     * Get world position for a grid cell with curvature applied
     */
    private getCellWorldPosition(row: number, col: number, heightOffset: number = 0): vec3 {
        const flat = this.getFlatGridPosition(row, col);

        if (Math.abs(this.curvature) < 0.0001) {
            // Flat grid - no curvature
            return new vec3(flat.x, flat.y, heightOffset);
        }

        // Curvature directly controls the bend angle per unit distance
        // Positive = curve away (convex), Negative = curve toward (concave)
        // Scale factor makes values like 0.01-0.1 usable
        const scaledCurvature = this.curvature * 0.1;

        // Calculate angles based on flat position
        const angleX = flat.x * scaledCurvature;
        const angleY = flat.y * scaledCurvature;

        // For small angles, use the approximation for smooth curvature
        // z offset = distance^2 * curvature / 2 (parabolic approximation)
        const distSq = flat.x * flat.x + flat.y * flat.y;
        const zOffset = distSq * scaledCurvature * 0.5;

        // Slight x/y adjustment for proper spherical feel at higher curvatures
        const x = flat.x * (1 - Math.abs(angleY) * 0.1);
        const y = flat.y * (1 - Math.abs(angleX) * 0.1);
        const z = zOffset + heightOffset;

        return new vec3(x, y, z);
    }

    /**
     * Get rotation for cell to face viewer (with curvature)
     */
    private getCellRotation(row: number, col: number): quat {
        if (Math.abs(this.curvature) < 0.0001) {
            // Flat grid - face forward
            return quat.quatIdentity();
        }

        const flat = this.getFlatGridPosition(row, col);
        const scaledCurvature = this.curvature * 0.1;

        // Calculate tilt angles - cells tilt to face the virtual center
        const angleX = flat.x * scaledCurvature;
        const angleY = flat.y * scaledCurvature;

        // Rotate around Y axis (horizontal tilt) and X axis (vertical tilt)
        const rotY = quat.fromEulerAngles(0, -angleX, 0);
        const rotX = quat.fromEulerAngles(angleY, 0, 0);

        return rotY.multiply(rotX);
    }

    // ==================== GRID GENERATION ====================

    /**
     * Initialize ship occupancy grid
     */
    private initShipGrid(): void {
        this.shipGrid = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.shipGrid[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                this.shipGrid[row][col] = false;
            }
        }
    }

    /**
     * Generate visual grid on sphere
     */
    private generateGrid(): void {
        this.clearGrid();

        if (!this.cellPrefab) {
            this.logError('cellPrefab not assigned');
            return;
        }

        // Initialize 2D array
        this.gridCells2D = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.gridCells2D[row] = [];
        }

        // Get or create parent
        let parent: SceneObject;
        if (this.gridParent) {
            parent = this.gridParent;
        } else {
            parent = global.scene.createSceneObject("SphericalGrid");
            parent.getTransform().setLocalPosition(new vec3(0, 0, 0));
        }

        // Create cells
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const position = this.getCellWorldPosition(row, col);

                const cell = this.cellPrefab.instantiate(parent);
                cell.name = `Cell_${row}_${col}`;

                const transform = cell.getTransform();
                transform.setLocalPosition(position);

                // Rotate cell to face outward
                const rotation = this.getCellRotation(row, col);
                transform.setLocalRotation(rotation);

                this.gridCells2D[row][col] = cell;
                this.gridCells.push(cell);

                // Setup interaction if enabled
                if (this.enableCellTapping) {
                    this.setupCellInteraction(cell, row, col);
                }
            }
        }

        this.log(`Grid generated: ${this.gridRows}x${this.gridCols} = ${this.gridCells.length} cells`);
    }

    /**
     * Setup cell tap interaction
     */
    private setupCellInteraction(cell: SceneObject, row: number, col: number): void {
        let interaction = cell.getComponent("Component.Touch") as InteractionComponent;
        if (!interaction) {
            interaction = cell.createComponent("Component.Touch") as InteractionComponent;
        }

        if (interaction) {
            interaction.onTap.add(() => {
                this.handleCellTap(row, col);
            });
        }
    }

    /**
     * Handle cell tap
     */
    private handleCellTap(row: number, col: number): void {
        this.log(`Cell tapped: (${row}, ${col})`);

        if (this.onCellTap) {
            this.onCellTap(row, col);
        }

        if (this.gameManager) {
            const gm = this.gameManager.getComponent("Component.ScriptComponent");
            if (gm && typeof (gm as any).onCellTapped === 'function') {
                (gm as any).onCellTapped(row, col);
            }
        }
    }

    // ==================== SHIP PLACEMENT ====================

    /**
     * Place ships randomly on the spherical grid
     */
    private placeShipsRandomly(): boolean {
        this.clearShips();
        this.initShipGrid();

        // Ships to place: [length, count]
        const shipsToPlace: Array<[number, number]> = [
            [4, 1],  // 1x 4-cell
            [3, 2],  // 2x 3-cell
            [2, 3],  // 3x 2-cell
            [1, 4]   // 4x 1-cell
        ];

        const maxAttempts = 1000;

        for (const [length, count] of shipsToPlace) {
            for (let i = 0; i < count; i++) {
                let placed = false;
                let attempts = 0;

                while (!placed && attempts < maxAttempts) {
                    attempts++;

                    const row = Math.floor(Math.random() * this.gridRows);
                    const col = Math.floor(Math.random() * this.gridCols);
                    const horizontal = Math.random() < 0.5;

                    if (this.canPlaceShip(row, col, length, horizontal)) {
                        this.placeShip(row, col, length, horizontal);
                        placed = true;
                    }
                }

                if (!placed) {
                    this.log(`Failed to place ${length}-cell ship after ${maxAttempts} attempts`);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if ship can be placed at position
     */
    private canPlaceShip(row: number, col: number, length: number, horizontal: boolean): boolean {
        for (let i = 0; i < length; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? (col + i) % this.gridCols : col; // Wrap around longitude

            // Check row bounds (can't wrap latitude)
            if (r < 0 || r >= this.gridRows) {
                return false;
            }

            // Check if occupied
            if (this.shipGrid[r][c]) {
                return false;
            }

            // Check neighbors (no touching rule)
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = (c + dc + this.gridCols) % this.gridCols; // Wrap longitude

                    if (nr >= 0 && nr < this.gridRows) {
                        if (this.shipGrid[nr][nc]) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    /**
     * Place a ship on the grid
     */
    private placeShip(row: number, col: number, length: number, horizontal: boolean): SceneObject | null {
        const prefab = this.getShipPrefab(length);
        if (!prefab) {
            this.logError(`No prefab for ship length ${length}`);
            return null;
        }

        // Mark cells as occupied
        const cells: Array<{row: number, col: number}> = [];
        for (let i = 0; i < length; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? (col + i) % this.gridCols : col;
            this.shipGrid[r][c] = true;
            cells.push({row: r, col: c});
        }

        // Calculate ship center position
        const midIndex = Math.floor(length / 2);
        const centerRow = cells[midIndex].row;
        const centerCol = cells[midIndex].col;
        const position = this.getCellWorldPosition(centerRow, centerCol, this.objectHeightOffset);

        // Get parent
        let parent: SceneObject;
        if (this.gridParent) {
            parent = this.gridParent;
        } else {
            parent = this.getSceneObject();
        }

        // Create ship
        const ship = prefab.instantiate(parent);
        ship.name = `Ship_${length}_at_${row}_${col}_${horizontal ? "H" : "V"}`;

        const transform = ship.getTransform();
        transform.setLocalPosition(position);

        // Rotate to face outward and align with grid direction
        const rotation = this.getCellRotation(centerRow, centerCol);
        transform.setLocalRotation(rotation);

        // Additional rotation for vertical ships
        if (!horizontal) {
            const currentRot = transform.getLocalRotation();
            const verticalAdjust = quat.fromEulerAngles(0, 0, Math.PI / 2);
            transform.setLocalRotation(currentRot.multiply(verticalAdjust));
        }

        this.placedShips.push(ship);

        this.log(`Placed ${length}-cell ship at (${row}, ${col}) ${horizontal ? "horizontal" : "vertical"}`);
        return ship;
    }

    /**
     * Place test ships (fixed positions)
     */
    private placeTestShips(): void {
        this.clearShips();
        this.initShipGrid();

        // Simple test placement
        this.placeShip(1, 0, 4, true);
        this.placeShip(3, 0, 3, true);
        this.placeShip(5, 5, 3, false);
        this.placeShip(7, 2, 2, true);
        this.placeShip(7, 6, 2, true);
        this.placeShip(9, 0, 2, true);
        this.placeShip(0, 8, 1, true);
        this.placeShip(4, 3, 1, true);
        this.placeShip(6, 9, 1, true);
        this.placeShip(8, 5, 1, true);

        this.log(`Test ships placed: ${this.placedShips.length}`);
    }

    /**
     * Get ship prefab by length
     */
    private getShipPrefab(length: number): ObjectPrefab | null {
        switch (length) {
            case 1: return this.ship1Prefab;
            case 2: return this.ship2Prefab;
            case 3: return this.ship3Prefab;
            case 4: return this.ship4Prefab;
            default: return null;
        }
    }

    // ==================== MARKERS ====================

    /**
     * Spawn marker at grid position
     */
    private spawnMarker(row: number, col: number, prefab: ObjectPrefab, type: string): void {
        // Miss markers use missMarkerHeightOffset, hit markers use objectHeightOffset
        const heightOffset = type === 'miss' ? this.missMarkerHeightOffset : this.objectHeightOffset;
        const position = this.getCellWorldPosition(row, col, heightOffset);

        let parent: SceneObject;
        if (this.gridParent) {
            parent = this.gridParent;
        } else {
            parent = this.getSceneObject();
        }

        const marker = prefab.instantiate(parent);
        marker.name = `Marker_${type}_${row}_${col}`;

        // Enable the marker (prefab might be disabled by default)
        marker.enabled = true;

        const transform = marker.getTransform();
        transform.setLocalPosition(position);

        // Rotate marker to lay flat on the surface:
        // 1. Rotate 90 degrees around X-axis to lay flat (from vertical to horizontal)
        // 2. Then apply cell rotation to match the curved surface
        const layFlat = quat.fromEulerAngles(-Math.PI / 2, 0, 0);
        const cellRot = this.getCellRotation(row, col);
        transform.setLocalRotation(cellRot.multiply(layFlat));

        this.placedMarkers.push(marker);

        this.log(`Spawned ${type} marker at (${row}, ${col})`);
    }

    // ==================== CLEANUP ====================

    private clearGrid(): void {
        for (const cell of this.gridCells) {
            if (cell) cell.destroy();
        }
        this.gridCells = [];
        this.gridCells2D = [];
    }

    private clearShips(): void {
        for (const ship of this.placedShips) {
            if (ship) ship.destroy();
        }
        this.placedShips = [];
    }

    private clearMarkers(): void {
        for (const marker of this.placedMarkers) {
            if (marker) marker.destroy();
        }
        this.placedMarkers = [];
    }

    // ==================== GETTERS ====================

    getGridRows(): number { return this.gridRows; }
    getGridCols(): number { return this.gridCols; }
    getCellSpacing(): number { return this.cellSpacing; }
    getCurvature(): number { return this.curvature; }
    getIsVisible(): boolean { return this.isVisible; }
}
