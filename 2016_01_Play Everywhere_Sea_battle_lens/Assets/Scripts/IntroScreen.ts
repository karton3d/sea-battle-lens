// Intro/Welcome Screen for Meme Fleet Battle
@component
export class IntroScreen extends BaseScriptComponent {
    
    // Background object (optional, can be set in scene)
    @input backgroundObject: SceneObject = null;
    
    // Game title text/object
    @input titleObject: SceneObject = null;
    
    // Game preview area (mini grid demo)
    @input previewArea: SceneObject = null;
    
    // Single Player button
    @input singlePlayerButton: SceneObject = null;
    
    // Play with Friend button
    @input playWithFriendButton: SceneObject = null;
    
    // Screen container (parent for all intro elements)
    @input screenContainer: SceneObject = null;
    
    // Game manager reference (for starting game)
    @input gameManager: SceneObject = null;
    
    // Animation duration for transitions
    @input transitionDuration: number = 0.5;
    
    // Screen state
    private isVisible: boolean = true;
    private isTransitioning: boolean = false;
    
    onAwake() {
        // Initialize intro screen
        this.setupIntroScreen();
    }
    
    onStart() {
        // Show intro screen on start
        this.showIntroScreen();
    }
    
    /**
     * Setup intro screen elements
     */
    setupIntroScreen() {
        // Create screen container if not provided
        if (!this.screenContainer) {
            this.screenContainer = global.scene.createSceneObject("IntroScreen");
            this.screenContainer.getTransform().setLocalPosition(new vec3(0, 0, 0));
        }
        
        // Setup button interactions
        this.setupButtons();
        
        // Setup preview area (if provided)
        if (this.previewArea) {
            this.setupPreviewArea();
        }
        
        print("IntroScreen: Setup complete");
    }
    
    /**
     * Setup button interactions
     */
    setupButtons() {
        // Single Player button
        if (this.singlePlayerButton) {
            const interaction = this.singlePlayerButton.getComponent("Component.Interaction") as InteractionComponent;
            if (!interaction) {
                // Add interaction component if not present
                const newInteraction = this.singlePlayerButton.createComponent("Component.Interaction") as InteractionComponent;
                // Note: InteractionComponent setup may require additional configuration
            }
        }
        
        // Play with Friend button
        if (this.playWithFriendButton) {
            const interaction = this.playWithFriendButton.getComponent("Component.Interaction") as InteractionComponent;
            if (!interaction) {
                const newInteraction = this.playWithFriendButton.createComponent("Component.Interaction") as InteractionComponent;
            }
        }
    }
    
    /**
     * Setup preview area with mini grid demo
     */
    setupPreviewArea() {
        // TODO: Create mini grid preview
        // This could show a small animated grid with objects
        print("IntroScreen: Preview area setup (placeholder)");
    }
    
    /**
     * Show intro screen
     */
    showIntroScreen() {
        if (this.isTransitioning) return;
        
        this.isVisible = true;
        this.isTransitioning = true;
        
        // Show all intro elements
        if (this.screenContainer) {
            this.screenContainer.enabled = true;
        }
        
        // Fade in animation (simple scale/alpha)
        this.animateShow(() => {
            this.isTransitioning = false;
            print("IntroScreen: Intro screen shown");
        });
    }
    
    /**
     * Hide intro screen
     */
    hideIntroScreen(onComplete?: () => void) {
        if (this.isTransitioning || !this.isVisible) {
            if (onComplete) onComplete();
            return;
        }
        
        this.isVisible = false;
        this.isTransitioning = true;
        
        // Fade out animation
        this.animateHide(() => {
            if (this.screenContainer) {
                this.screenContainer.enabled = false;
            }
            this.isTransitioning = false;
            if (onComplete) onComplete();
            print("IntroScreen: Intro screen hidden");
        });
    }
    
    /**
     * Animate show (fade in)
     */
    animateShow(onComplete: () => void) {
        // Simple animation: scale from 0.8 to 1.0
        if (this.screenContainer) {
            const transform = this.screenContainer.getTransform();
            const startScale = 0.8;
            const endScale = 1.0;
            transform.setLocalScale(new vec3(startScale, startScale, startScale));
            
            // Animate scale (simplified - would use proper animation system in production)
            // For now, just set final scale
            transform.setLocalScale(new vec3(endScale, endScale, endScale));
        }
        
        if (onComplete) onComplete();
    }
    
    /**
     * Animate hide (fade out)
     */
    animateHide(onComplete: () => void) {
        // Simple animation: scale from 1.0 to 0.8
        if (this.screenContainer) {
            const transform = this.screenContainer.getTransform();
            const startScale = 1.0;
            const endScale = 0.8;
            transform.setLocalScale(new vec3(startScale, startScale, startScale));
            
            // Animate scale (simplified)
            transform.setLocalScale(new vec3(endScale, endScale, endScale));
        }
        
        if (onComplete) onComplete();
    }
    
    /**
     * Handle Single Player button tap
     */
    onSinglePlayerTap() {
        print("IntroScreen: Single Player button tapped");
        
        // Hide intro screen
        this.hideIntroScreen(() => {
            // Start single player game
            this.startSinglePlayerGame();
        });
    }
    
    /**
     * Handle Play with Friend button tap
     */
    onPlayWithFriendTap() {
        print("IntroScreen: Play with Friend button tapped");
        
        // Hide intro screen
        this.hideIntroScreen(() => {
            // Start multiplayer game
            this.startMultiplayerGame();
        });
    }
    
    /**
     * Start single player game
     */
    startSinglePlayerGame() {
        print("IntroScreen: Starting single player game");
        
        // TODO: Initialize single player mode
        // - Generate random object placement
        // - Show game setup screen
        // - Initialize game state
        
        // For now, just log
        if (this.gameManager) {
            // Could call a method on game manager
            print("IntroScreen: Game manager found, starting single player");
        }
    }
    
    /**
     * Start multiplayer game
     */
    startMultiplayerGame() {
        print("IntroScreen: Starting multiplayer game");
        
        // TODO: Initialize multiplayer mode
        // - Initialize Turn-Based component
        // - Generate random object placement for both players
        // - Show game setup screen
        // - Wait for opponent
        
        // For now, just log
        if (this.gameManager) {
            print("IntroScreen: Game manager found, starting multiplayer");
        }
    }
    
    /**
     * Check if intro screen is visible
     */
    getIsVisible(): boolean {
        return this.isVisible;
    }
}
