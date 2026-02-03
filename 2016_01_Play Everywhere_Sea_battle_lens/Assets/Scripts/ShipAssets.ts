// ShipAssets - Holds SceneObject inputs for all 10 individual ships
// Allows each ship to have a unique appearance

@component
export class ShipAssets extends BaseScriptComponent {

    // ==================== SINGLE-CELL SHIPS (4) ====================

    @input single1: SceneObject;
    @input single2: SceneObject;
    @input single3: SceneObject;
    @input single4: SceneObject;

    // ==================== DOUBLE-CELL SHIPS (3) ====================

    @input double1: SceneObject;
    @input double2: SceneObject;
    @input double3: SceneObject;

    // ==================== TRIPLE-CELL SHIPS (2) ====================

    @input triple1: SceneObject;
    @input triple2: SceneObject;

    // ==================== QUAD-CELL SHIP (1) ====================

    @input quad1: SceneObject;

    // ==================== PUBLIC API ====================

    /**
     * Get ship SceneObject by length and index (0-based)
     * @param length Ship length (1-4)
     * @param index Which ship of that length (0-based)
     * @returns The SceneObject or null if not found
     */
    getShip(length: number, index: number): SceneObject | null {
        switch (length) {
            case 1:
                // 4 single-cell ships
                if (index === 0) return this.single1;
                if (index === 1) return this.single2;
                if (index === 2) return this.single3;
                if (index === 3) return this.single4;
                return null;

            case 2:
                // 3 double-cell ships
                if (index === 0) return this.double1;
                if (index === 1) return this.double2;
                if (index === 2) return this.double3;
                return null;

            case 3:
                // 2 triple-cell ships
                if (index === 0) return this.triple1;
                if (index === 1) return this.triple2;
                return null;

            case 4:
                // 1 quad-cell ship
                if (index === 0) return this.quad1;
                return null;

            default:
                return null;
        }
    }
}
