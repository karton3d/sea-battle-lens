// RevealController - Controls visibility based on distance from a reveal point
// Objects fade from 100% opacity (inside minRadius) to 0% (at maxRadius)

@component
export class RevealController extends BaseScriptComponent {

    // ==================== INPUTS ====================

    /** Materials to update with reveal parameters */
    @input materials: Material[] = [];

    /** Optional: SceneObject to use as the reveal center (overrides manual position) */
    @input revealSource: SceneObject = null;

    /** Reveal center position (used if revealSource is null) */
    @input 
    @hint("World position of the reveal center")
    revealPosition: vec3 = new vec3(0, 0, 0);

    /** Inner radius - full visibility inside this radius */
    @input 
    @hint("Objects within this radius are 100% visible")
    minRadius: number = 1.0;

    /** Outer radius - zero visibility at and beyond this radius */
    @input 
    @hint("Objects beyond this radius are invisible")
    maxRadius: number = 5.0;

    /** Update every frame (for moving reveal source) */
    @input updateEveryFrame: boolean = true;

    // ==================== PRIVATE STATE ====================

    private _currentPosition: vec3 = new vec3(0, 0, 0);
    private _currentMinRadius: number = 1.0;
    private _currentMaxRadius: number = 5.0;

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        this._currentMinRadius = this.minRadius;
        this._currentMaxRadius = this.maxRadius;
        
        // Initial update
        this.updateAllMaterials();

        // print(`[RevealController] Initialized - minRadius: ${this.minRadius}, maxRadius: ${this.maxRadius}, materials: ${this.materials.length}`);
    }

    onUpdate(): void {
        if (this.updateEveryFrame) {
            this.updatePosition();
            this.updateAllMaterials();
        }
    }

    // ==================== PUBLIC API ====================

    /**
     * Set the reveal center position
     */
    setPosition(position: vec3): void {
        this._currentPosition = position;
        this.updateAllMaterials();
    }

    /**
     * Set the min radius (full visibility zone)
     */
    setMinRadius(radius: number): void {
        this._currentMinRadius = radius;
        this.updateAllMaterials();
    }

    /**
     * Set the max radius (fade-out boundary)
     */
    setMaxRadius(radius: number): void {
        this._currentMaxRadius = radius;
        this.updateAllMaterials();
    }

    /**
     * Set both radii at once
     */
    setRadii(minRadius: number, maxRadius: number): void {
        this._currentMinRadius = minRadius;
        this._currentMaxRadius = maxRadius;
        this.updateAllMaterials();
    }

    /**
     * Get current reveal position
     */
    getPosition(): vec3 {
        return this._currentPosition;
    }

    /**
     * Get current min radius
     */
    getMinRadius(): number {
        return this._currentMinRadius;
    }

    /**
     * Get current max radius
     */
    getMaxRadius(): number {
        return this._currentMaxRadius;
    }

    /**
     * Add a material to be controlled
     */
    addMaterial(material: Material): void {
        if (material && this.materials.indexOf(material) === -1) {
            this.materials.push(material);
            this.updateMaterial(material);
        }
    }

    /**
     * Remove a material from control
     */
    removeMaterial(material: Material): void {
        const index = this.materials.indexOf(material);
        if (index !== -1) {
            this.materials.splice(index, 1);
        }
    }

    /**
     * Force update all materials
     */
    forceUpdate(): void {
        this.updatePosition();
        this.updateAllMaterials();
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Update position from source or input
     */
    private updatePosition(): void {
        if (this.revealSource) {
            this._currentPosition = this.revealSource.getTransform().getWorldPosition();
        } else {
            this._currentPosition = this.revealPosition;
        }
    }

    /**
     * Update all materials with current reveal parameters
     */
    private updateAllMaterials(): void {
        for (const material of this.materials) {
            if (material) {
                this.updateMaterial(material);
            }
        }
    }

    /**
     * Update a single material with reveal parameters
     */
    private updateMaterial(material: Material): void {
        const pass = material.mainPass;
        
        // Set reveal center position
        pass.revealCenter = this._currentPosition;
        
        // Set reveal radii
        pass.revealMinRadius = this._currentMinRadius;
        pass.revealMaxRadius = this._currentMaxRadius;
    }
}
