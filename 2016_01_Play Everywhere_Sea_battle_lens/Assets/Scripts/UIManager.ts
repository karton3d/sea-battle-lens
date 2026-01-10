// UI Manager - Handles all UI updates for Meme Fleet Battle

@component
export class UIManager extends BaseScriptComponent {
    
    // ==================== TEXT OBJECTS ====================
    
    // Main title (Intro screen)
    @input titleText: Text;
    
    // Status text (current game state)
    @input statusText: Text;
    
    // Hint text (instructions for player)
    @input hintText: Text;
    
    // Result text (hit/miss feedback)
    @input resultText: Text;
    
    // Score text (destroyed objects count)
    @input scoreText: Text;
    
    // ==================== SCREENS ====================
    
    // Intro screen container
    @input introScreen: SceneObject;
    
    // Setup screen container
    @input setupScreen: SceneObject;
    
    // Game screen container
    @input gameScreen: SceneObject;
    
    // Game over screen container
    @input gameOverScreen: SceneObject;
    
    // ==================== BUTTONS (UI Button components) ====================
    
    // Single Player button
    @input singlePlayerButton: SceneObject;
    
    // Multiplayer button
    @input multiplayerButton: SceneObject;
    
    // Start button
    @input startButton: SceneObject;
    
    // Play Again button
    @input playAgainButton: SceneObject;
    
    // ==================== STATE ====================
    
    private currentScreen: string = 'intro';
    
    onAwake() {
        print("UIManager: Initialized");
    }
    
    // ==================== SCREEN MANAGEMENT ====================
    
    /**
     * Show specific screen, hide all others
     */
    showScreen(screen: 'intro' | 'setup' | 'game' | 'gameover') {
        this.hideAllScreens();
        
        switch (screen) {
            case 'intro':
                if (this.introScreen) this.introScreen.enabled = true;
                break;
            case 'setup':
                if (this.setupScreen) this.setupScreen.enabled = true;
                break;
            case 'game':
                if (this.gameScreen) this.gameScreen.enabled = true;
                break;
            case 'gameover':
                if (this.gameOverScreen) this.gameOverScreen.enabled = true;
                break;
        }
        
        this.currentScreen = screen;
        print(`UIManager: Switched to screen: ${screen}`);
    }
    
    /**
     * Hide all screens
     */
    hideAllScreens() {
        if (this.introScreen) this.introScreen.enabled = false;
        if (this.setupScreen) this.setupScreen.enabled = false;
        if (this.gameScreen) this.gameScreen.enabled = false;
        if (this.gameOverScreen) this.gameOverScreen.enabled = false;
    }
    
    /**
     * Get current screen
     */
    getCurrentScreen(): string {
        return this.currentScreen;
    }
    
    // ==================== TEXT UPDATES ====================
    
    /**
     * Set title text
     */
    setTitle(text: string) {
        if (this.titleText) {
            this.titleText.text = text;
        }
    }
    
    /**
     * Set status text
     */
    setStatus(text: string) {
        if (this.statusText) {
            this.statusText.text = text;
        }
        print(`UIManager: Status: ${text}`);
    }
    
    /**
     * Set hint text
     */
    setHint(text: string) {
        if (this.hintText) {
            this.hintText.text = text;
        }
    }
    
    /**
     * Set result text (hit/miss feedback)
     */
    setResult(text: string) {
        if (this.resultText) {
            this.resultText.text = text;
        }
    }
    
    /**
     * Clear result text
     */
    clearResult() {
        this.setResult("");
    }
    
    /**
     * Set score text
     */
    setScore(playerHits: number, opponentHits: number, total: number) {
        if (this.scoreText) {
            this.scoreText.text = `You: ${playerHits}/${total} | AI: ${opponentHits}/${total}`;
        }
    }
    
    // ==================== BUTTON VISIBILITY ====================
    
    /**
     * Show/hide single player button
     */
    showSinglePlayerButton(show: boolean) {
        if (this.singlePlayerButton) {
            this.singlePlayerButton.enabled = show;
        }
    }
    
    /**
     * Show/hide multiplayer button
     */
    showMultiplayerButton(show: boolean) {
        if (this.multiplayerButton) {
            this.multiplayerButton.enabled = show;
        }
    }
    
    /**
     * Show/hide start button
     */
    showStartButton(show: boolean) {
        if (this.startButton) {
            this.startButton.enabled = show;
        }
    }
    
    /**
     * Show/hide play again button
     */
    showPlayAgainButton(show: boolean) {
        if (this.playAgainButton) {
            this.playAgainButton.enabled = show;
        }
    }
    
    // ==================== SCREEN CONTENT HELPERS ====================
    
    /**
     * Setup intro screen content
     */
    setupIntroScreen() {
        this.setTitle("Meme Fleet Battle");
        this.showSinglePlayerButton(true);
        this.showMultiplayerButton(true);
    }
    
    /**
     * Setup setup screen content
     */
    setupSetupScreen() {
        this.setStatus("Your objects are placed!");
        this.setHint("Tap Start to begin");
        this.showStartButton(true);
    }
    
    /**
     * Setup game screen for player's turn
     */
    setupPlayerTurn() {
        this.setStatus("Your turn");
        this.setHint("Tap opponent's cell to shoot");
        this.clearResult();
    }
    
    /**
     * Setup game screen for opponent's turn
     */
    setupOpponentTurn() {
        this.setStatus("Opponent's turn");
        this.setHint("Waiting...");
    }
    
    /**
     * Show hit result
     */
    showHit(destroyed: boolean, shipLength?: number) {
        if (destroyed && shipLength) {
            this.setResult(`HIT! ${shipLength}-cell object destroyed!`);
        } else {
            this.setResult("HIT!");
        }
    }
    
    /**
     * Show miss result
     */
    showMiss() {
        this.setResult("Miss");
    }
    
    /**
     * Show already shot message
     */
    showAlreadyShot() {
        this.setResult("Already shot here!");
    }
    
    /**
     * Show AI shot result
     */
    showAIShot(x: number, y: number, hit: boolean, destroyed: boolean, shipLength?: number) {
        if (destroyed && shipLength) {
            this.setResult(`AI: (${x}, ${y}) - HIT! ${shipLength}-cell destroyed!`);
        } else if (hit) {
            this.setResult(`AI: (${x}, ${y}) - HIT!`);
        } else {
            this.setResult(`AI: (${x}, ${y}) - Miss`);
        }
    }
    
    /**
     * Setup game over screen
     */
    setupGameOver(playerWon: boolean) {
        if (playerWon) {
            this.setStatus("YOU WON!");
            this.setHint("Congratulations!");
        } else {
            this.setStatus("YOU LOST!");
            this.setHint("Better luck next time!");
        }
        this.showPlayAgainButton(true);
    }
}
