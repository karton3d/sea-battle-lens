// Transition Manager - Handles animated transitions between game views
// Used for single-player to show grid transitions and turn banners

@component
export class TransitionManager extends BaseScriptComponent {

    // ==================== INPUTS ====================

    /** Player's grid SceneObject (or container) */
    @input playerGrid: SceneObject;

    /** Opponent's grid SceneObject (or container) */
    @input opponentGrid: SceneObject;

    /** Turn banner overlay (shown between turns) */
    @input turnBanner: SceneObject;

    /** Text component for turn banner */
    @input turnBannerText: Text;

    /** Duration of grid fade transition (seconds) */
    @input transitionDuration: number = 0.3;

    /** How long to display turn banner (seconds) */
    @input bannerDisplayTime: number = 1.2;

    /** Reference to GameManager for grid script lookups */
    @input gameManager: SceneObject;

    // ==================== PRIVATE STATE ====================

    /** Callback to invoke when transition completes */
    private onTransitionComplete: (() => void) | null = null;

    /** Whether a transition is currently in progress */
    private isTransitioning: boolean = false;

    // ==================== LIFECYCLE ====================

    onAwake(): void {
        // Ensure banner is hidden initially
        if (this.turnBanner) {
            this.turnBanner.enabled = false;
        }
        print('[TransitionManager] Initialized');
    }

    // ==================== PUBLIC API ====================

    /**
     * Transition from player grid view to opponent grid view
     * Used at start of player's turn in single-player
     * @param turnNumber Current turn number for display
     * @param onComplete Callback when transition finishes
     */
    transitionToOpponentGrid(turnNumber: number, onComplete: () => void): void {
        if (this.isTransitioning) {
            print('[TransitionManager] transitionToOpponentGrid: Already transitioning, ignoring');
            return;
        }

        this.isTransitioning = true;
        this.onTransitionComplete = onComplete;

        print(`[TransitionManager] transitionToOpponentGrid: Starting turn ${turnNumber} transition`);

        // Step 1: Hide player grid
        this.fadeOutGrid(this.playerGrid, () => {
            // Step 2: Show turn banner
            this.showTurnBanner(
                `Turn #${turnNumber}`,
                "Scan enemy waters",
                () => {
                    // Step 3: Show opponent grid
                    this.fadeInGrid(this.opponentGrid, () => {
                        // Step 4: Complete
                        this.completeTransition();
                    });
                }
            );
        });
    }

    /**
     * Transition from opponent grid view to player grid view
     * Used to show opponent's shot result
     * @param message Message to display (e.g., "Opponent shot (3,5) - Hit!")
     * @param onComplete Callback when transition finishes
     */
    transitionToPlayerGrid(message: string, onComplete: () => void): void {
        if (this.isTransitioning) {
            print('[TransitionManager] transitionToPlayerGrid: Already transitioning, ignoring');
            return;
        }

        this.isTransitioning = true;
        this.onTransitionComplete = onComplete;

        print(`[TransitionManager] transitionToPlayerGrid: ${message}`);

        // Step 1: Hide opponent grid
        this.fadeOutGrid(this.opponentGrid, () => {
            // Step 2: Show banner with opponent's action
            this.showTurnBanner(
                "Incoming!",
                message,
                () => {
                    // Step 3: Show player grid
                    this.fadeInGrid(this.playerGrid, () => {
                        // Step 4: Complete
                        this.completeTransition();
                    });
                }
            );
        });
    }

    /**
     * Show both grids immediately (no transition)
     * Used for initial game setup or when transitions are disabled
     */
    showBothGrids(): void {
        const playerScript = this.getGridScript(this.playerGrid);
        if (playerScript && typeof playerScript.show === 'function') {
            playerScript.show();
        }

        const opponentScript = this.getGridScript(this.opponentGrid);
        if (opponentScript && typeof opponentScript.show === 'function') {
            opponentScript.show();
        }

        print('[TransitionManager] showBothGrids: Both grids shown');
    }

    /**
     * Hide both grids immediately (no transition)
     */
    hideBothGrids(): void {
        const playerScript = this.getGridScript(this.playerGrid);
        if (playerScript && typeof playerScript.hide === 'function') {
            playerScript.hide();
        }

        const opponentScript = this.getGridScript(this.opponentGrid);
        if (opponentScript && typeof opponentScript.hide === 'function') {
            opponentScript.hide();
        }

        print('[TransitionManager] hideBothGrids: Both grids hidden');
    }

    /**
     * Show only opponent grid (for attacking phase)
     */
    showOpponentGridOnly(): void {
        const playerScript = this.getGridScript(this.playerGrid);
        if (playerScript && typeof playerScript.hide === 'function') {
            playerScript.hide();
        }

        const opponentScript = this.getGridScript(this.opponentGrid);
        if (opponentScript && typeof opponentScript.show === 'function') {
            opponentScript.show();
        }

        print('[TransitionManager] showOpponentGridOnly: Opponent grid shown');
    }

    /**
     * Show only player grid (for defending phase)
     */
    showPlayerGridOnly(): void {
        const opponentScript = this.getGridScript(this.opponentGrid);
        if (opponentScript && typeof opponentScript.hide === 'function') {
            opponentScript.hide();
        }

        const playerScript = this.getGridScript(this.playerGrid);
        if (playerScript && typeof playerScript.show === 'function') {
            playerScript.show();
        }

        print('[TransitionManager] showPlayerGridOnly: Player grid shown');
    }

    /**
     * Check if currently transitioning
     */
    getIsTransitioning(): boolean {
        return this.isTransitioning;
    }

    // ==================== TRANSITION STEPS ====================

    /**
     * Fade out a grid (currently instant hide, can be enhanced with tweens)
     */
    private fadeOutGrid(gridObj: SceneObject, onComplete: () => void): void {
        const gridScript = this.getGridScript(gridObj);
        if (gridScript && typeof gridScript.hide === 'function') {
            gridScript.hide();
        }

        // Schedule completion after transition duration
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        delayEvent.bind(() => {
            onComplete();
        });
        delayEvent.reset(this.transitionDuration);
    }

    /**
     * Fade in a grid (currently instant show, can be enhanced with tweens)
     */
    private fadeInGrid(gridObj: SceneObject, onComplete: () => void): void {
        const gridScript = this.getGridScript(gridObj);
        if (gridScript && typeof gridScript.show === 'function') {
            gridScript.show();
        }

        // Schedule completion after transition duration
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        delayEvent.bind(() => {
            onComplete();
        });
        delayEvent.reset(this.transitionDuration);
    }

    /**
     * Show turn banner with title and subtitle
     */
    private showTurnBanner(title: string, subtitle: string, onComplete: () => void): void {
        if (!this.turnBanner) {
            // No banner configured, skip directly to completion
            print('[TransitionManager] showTurnBanner: No banner configured, skipping');
            onComplete();
            return;
        }

        // Set banner text
        if (this.turnBannerText) {
            this.turnBannerText.text = `${title}\n${subtitle}`;
        }

        // Show banner
        this.turnBanner.enabled = true;

        print(`[TransitionManager] showTurnBanner: "${title}" - "${subtitle}"`);

        // Schedule hide after display time
        const hideEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
        hideEvent.bind(() => {
            this.turnBanner.enabled = false;
            onComplete();
        });
        hideEvent.reset(this.bannerDisplayTime);
    }

    /**
     * Complete transition and invoke callback
     */
    private completeTransition(): void {
        this.isTransitioning = false;

        print('[TransitionManager] completeTransition: Transition complete');

        if (this.onTransitionComplete) {
            const callback = this.onTransitionComplete;
            this.onTransitionComplete = null;
            callback();
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get grid script from SceneObject
     */
    private getGridScript(gridObj: SceneObject): any {
        if (!gridObj) return null;

        const scripts = gridObj.getComponents("Component.ScriptComponent");
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i] as any;
            if (script && typeof script.show === 'function' && typeof script.hide === 'function') {
                return script;
            }
        }

        return null;
    }
}
