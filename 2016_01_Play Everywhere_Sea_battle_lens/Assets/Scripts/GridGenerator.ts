// Sea Battle grid with ships placed above the grid
@component
export class SeaBattleGrid extends BaseScriptComponent {
    
    // Prefab for grid cell (water)
    @input cellPrefab: ObjectPrefab;
    
    // Ship prefabs (1-4 cells length)
    @input ship1Prefab: ObjectPrefab;
    @input ship2Prefab: ObjectPrefab;
    @input ship3Prefab: ObjectPrefab;
    @input ship4Prefab: ObjectPrefab;
    
    // Grid size (default 10x10)
    @input gridSize: number = 10;
    
    // Size of one cell
    @input cellSize: number = 1.0;
    
    // Distance between cells
    @input cellSpacing: number = 0.1;
    
    // Parent object for grid
    @input gridParent: SceneObject = null;
    
    // Height offset for ships above grid
    @input shipHeightOffset: number = 0.5;
    
    // Use random placement (true) or fixed test placement (false)
    @input useRandomPlacement: boolean = true;
    
    // Grid cells
    private gridCells: SceneObject[] = [];
    
    // Placed ships
    private placedShips: SceneObject[] = [];
    
    // Ship grid (tracks occupied cells)
    private shipGrid: boolean[][] = [];
    
    // Distance between cell centers
    private cellDistance: number = 0;
    
    onAwake() {
        this.cellDistance = this.cellSize + this.cellSpacing;
        
        // Initialize ship grid
        this.initShipGrid();
        
        // Generate visual grid
        this.generateGrid();
        
        // Place ships (random or fixed test positions)
        if (this.useRandomPlacement) {
            const success = this.placeShipsRandomly();
            if (!success) {
                print("SeaBattleGrid: Random placement failed, falling back to test placement");
                this.placeTestShips();
            }
        } else {
            this.placeTestShips();
        }
    }
    
    /**
     * Initialize empty ship grid
     */
    initShipGrid() {
        this.shipGrid = [];
        for (let x = 0; x < this.gridSize; x++) {
            this.shipGrid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                this.shipGrid[x][y] = false;
            }
        }
    }
    
    /**
     * Generate visual grid
     */
    generateGrid() {
        this.clearGrid();
        
        if (!this.cellPrefab) {
            print("SeaBattleGrid: cellPrefab is not assigned!");
            return;
        }
        
        let parent: SceneObject;
        if (this.gridParent) {
            parent = this.gridParent;
        } else {
            parent = global.scene.createSceneObject("Grid");
            parent.getTransform().setLocalPosition(new vec3(0, 0, 0));
        }
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const position = this.gridToWorldPosition(x, y, 0);
                
                const cell = this.cellPrefab.instantiate(parent);
                cell.name = `Cell_${x}_${y}`;
                
                const transform = cell.getTransform();
                transform.setLocalPosition(position);
                transform.setLocalScale(new vec3(this.cellSize, this.cellSize, this.cellSize));
                
                this.gridCells.push(cell);
            }
        }
        
        print(`SeaBattleGrid: Grid ${this.gridSize}x${this.gridSize} created`);
    }
    
    /**
     * Convert grid coordinates to world position
     */
    gridToWorldPosition(gridX: number, gridY: number, height: number): vec3 {
        return new vec3(
            (gridX - this.gridSize / 2 + 0.5) * this.cellDistance,
            height,
            (gridY - this.gridSize / 2 + 0.5) * this.cellDistance
        );
    }
    
    /**
     * Place a ship on the grid
     * @returns placed ship object or null if failed
     */
    placeShip(gridX: number, gridY: number, length: number, horizontal: boolean): SceneObject | null {
        // Get prefab for ship length
        const prefab = this.getShipPrefab(length);
        if (!prefab) {
            print(`SeaBattleGrid: No prefab for ship length ${length}`);
            return null;
        }
        
        // Check if placement is valid (bounds, overlap, touching)
        if (!this.canPlaceShip(gridX, gridY, length, horizontal)) {
            return null;
        }
        
        // Mark cells as occupied
        for (let i = 0; i < length; i++) {
            const x = horizontal ? gridX + i : gridX;
            const y = horizontal ? gridY : gridY + i;
            this.shipGrid[x][y] = true;
        }
        
        // Calculate ship center position
        // Ship center is between first and last cell
        const firstPos = this.gridToWorldPosition(gridX, gridY, 0);
        let lastX = horizontal ? gridX + length - 1 : gridX;
        let lastY = horizontal ? gridY : gridY + length - 1;
        const lastPos = this.gridToWorldPosition(lastX, lastY, 0);
        
        const centerX = (firstPos.x + lastPos.x) / 2;
        const centerZ = (firstPos.z + lastPos.z) / 2;
        
        // Ship height above grid
        // Grid cell top is at cellSize/2, ship center should be at cellSize + offset
        const shipY = this.cellSize + this.shipHeightOffset;
        
        // Get parent
        let parent: SceneObject;
        if (this.gridParent) {
            parent = this.gridParent;
        } else {
            parent = global.scene.createSceneObject("Ships");
        }
        
        // Create ship
        const ship = prefab.instantiate(parent);
        ship.name = `Ship_${length}_at_${gridX}_${gridY}_${horizontal ? "H" : "V"}`;
        
        const transform = ship.getTransform();
        transform.setLocalPosition(new vec3(centerX, shipY, centerZ));
        
        // Rotate vertical ships
        if (!horizontal) {
            transform.setLocalRotation(quat.fromEulerAngles(0, Math.PI / 2, 0));
        }
        
        this.placedShips.push(ship);
        
        const dir = horizontal ? "horizontal" : "vertical";
        print(`SeaBattleGrid: Placed ${length}-cell ship at (${gridX}, ${gridY}) ${dir}`);
        
        return ship;
    }
    
    /**
     * Get ship prefab by length
     */
    getShipPrefab(length: number): ObjectPrefab | null {
        switch (length) {
            case 1: return this.ship1Prefab;
            case 2: return this.ship2Prefab;
            case 3: return this.ship3Prefab;
            case 4: return this.ship4Prefab;
            default: return null;
        }
    }
    
    /**
     * Place test ships (fixed positions for testing)
     */
    placeTestShips() {
        // Clear previous ships
        this.clearShips();
        this.initShipGrid();
        
        // Standard battleship layout:
        // 1x 4-cell ship
        this.placeShip(0, 0, 4, true);
        
        // 2x 3-cell ships
        this.placeShip(6, 0, 3, false);
        this.placeShip(0, 2, 3, true);
        
        // 3x 2-cell ships
        this.placeShip(8, 4, 2, false);
        this.placeShip(4, 4, 2, true);
        this.placeShip(0, 5, 2, false);
        
        // 4x 1-cell ships
        this.placeShip(3, 7, 1, true);
        this.placeShip(6, 6, 1, true);
        this.placeShip(9, 8, 1, true);
        this.placeShip(5, 9, 1, true);
        
        print(`SeaBattleGrid: Test ships placed (total: ${this.placedShips.length})`);
    }
    
    /**
     * Place ships randomly with classic Battleship rules
     * Objects cannot touch (even diagonally) and cannot overlap
     */
    placeShipsRandomly(): boolean {
        // Clear previous ships
        this.clearShips();
        this.initShipGrid();
        
        // Define ships to place: [length, count]
        const shipsToPlace: Array<[number, number]> = [
            [4, 1],  // 1x 4-cell ship
            [3, 2],  // 2x 3-cell ships
            [2, 3],  // 3x 2-cell ships
            [1, 4]   // 4x 1-cell ships
        ];
        
        let totalPlaced = 0;
        const maxAttempts = 1000; // Maximum attempts per ship
        
        // Place each type of ship
        for (const [length, count] of shipsToPlace) {
            for (let i = 0; i < count; i++) {
                let placed = false;
                let attempts = 0;
                
                // Try to place ship with random position and orientation
                while (!placed && attempts < maxAttempts) {
                    attempts++;
                    
                    // Random position
                    const gridX = Math.floor(Math.random() * this.gridSize);
                    const gridY = Math.floor(Math.random() * this.gridSize);
                    
                    // Random orientation (50% chance horizontal)
                    const horizontal = Math.random() < 0.5;
                    
                    // Try to place ship
                    if (this.canPlaceShip(gridX, gridY, length, horizontal)) {
                        const ship = this.placeShip(gridX, gridY, length, horizontal);
                        if (ship) {
                            placed = true;
                            totalPlaced++;
                            print(`SeaBattleGrid: Randomly placed ${length}-cell ship #${i + 1} at (${gridX}, ${gridY}), ${horizontal ? "horizontal" : "vertical"}`);
                        }
                    }
                }
                
                if (!placed) {
                    print(`SeaBattleGrid: ERROR - Failed to place ${length}-cell ship #${i + 1} after ${maxAttempts} attempts`);
                    return false;
                }
            }
        }
        
        print(`SeaBattleGrid: Randomly placed all ships (total: ${totalPlaced})`);
        return true;
    }
    
    /**
     * Check if a ship can be placed at the given position
     * Returns true if placement is valid (no overlap, no touching, within bounds)
     */
    canPlaceShip(gridX: number, gridY: number, length: number, horizontal: boolean): boolean {
        // Check bounds
        if (horizontal) {
            if (gridX + length > this.gridSize || gridX < 0 || gridY < 0 || gridY >= this.gridSize) {
                return false;
            }
        } else {
            if (gridY + length > this.gridSize || gridX < 0 || gridX >= this.gridSize || gridY < 0) {
                return false;
            }
        }
        
        // Check all cells the ship would occupy and their neighbors
        for (let i = 0; i < length; i++) {
            const x = horizontal ? gridX + i : gridX;
            const y = horizontal ? gridY : gridY + i;
            
            // Check if cell is already occupied
            if (this.shipGrid[x][y]) {
                return false;
            }
            
            // Check all 8 neighbors (including diagonals) for "no touching" rule
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighborX = x + dx;
                    const neighborY = y + dy;
                    
                    // Skip if out of bounds
                    if (neighborX < 0 || neighborX >= this.gridSize || neighborY < 0 || neighborY >= this.gridSize) {
                        continue;
                    }
                    
                    // Skip the cell itself
                    if (dx === 0 && dy === 0) {
                        continue;
                    }
                    
                    // Check if neighbor is occupied (violates "no touching" rule)
                    if (this.shipGrid[neighborX][neighborY]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Clear grid cells
     */
    clearGrid() {
        for (const cell of this.gridCells) {
            if (cell) cell.destroy();
        }
        this.gridCells = [];
    }
    
    /**
     * Clear placed ships
     */
    clearShips() {
        for (const ship of this.placedShips) {
            if (ship) ship.destroy();
        }
        this.placedShips = [];
    }
    
    /**
     * Check if cell has ship
     */
    hasShipAt(x: number, y: number): boolean {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            return false;
        }
        return this.shipGrid[x][y];
    }
    
    /**
     * Reset game
     */
    resetGame() {
        this.clearShips();
        this.initShipGrid();
        this.generateGrid();
    }
}
