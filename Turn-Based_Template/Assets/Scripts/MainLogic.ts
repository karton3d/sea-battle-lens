// --- Storage Keys (internal constants) ---
const KEY_USER_BEST = "best";
const KEY_GLOBAL_STAGE = "stage";
const KEY_GLOBAL_OVER = "gameOverFlag";
const KEY_GLOBAL_WINNER = "winnerIdx";

@component
export class MainLogic extends BaseScriptComponent {
  @ui.group_start('Core Components')
  @input('Component.ScriptComponent') turnBased: TurnBased;
  @input('Component.ScriptComponent') tapScript;   // expects: .startGame:boolean, .count:number
  @input('Component.ScriptComponent') timer;       // expects: .timerEnds:boolean
  @ui.group_end

  @ui.group_start('Top-level Groups')
  @input('SceneObject') groupGameUI;
  @input('SceneObject') player1Card;
  @input('SceneObject') player2Card;
  @input('SceneObject') groupGameStartP1;   // first ever turn only
  @input('SceneObject') groupGameOver;
  @ui.group_end

  @ui.group_start('Turn-Based UI Elements')
  @input('SceneObject') playerTurnCard;             // shown at start of each turn - not first ever turn
  @input('SceneObject') player1TurnCard;
  @input('SceneObject') player2TurnCard;
  @input('Component.Text') startTurnScoreText;      // shows opponent's BEST on the card
  @input('SceneObject') captureBanner;              // Snap & Send overlay
  @input('SceneObject') groupGameInfo;              // optional rules/info
  @input('Component.Text') turnNumberText;

  @ui.group_end

  @ui.group_start('Game UI Elements')
  @input('Component.Text') bestScoreText;
  @ui.group_end

  @ui.group_start('Game Over Elements')
  @input('Component.Text') gameOverResultText;      // "You Win!" / "Opponent Wins!" / "It's a tie!"
  @input('SceneObject') player1Crown;
  @input('SceneObject') player2Crown;
  @ui.group_end

  @ui.group_start('Labels / Formatting')
  @input('string') labelTurnPrefix: string = "Turn: ";
  @input('string') labelHighScoreFormat: string = "Highest Score: {score}";
  @ui.group_end

  @ui.group_start('Game Over Labels')
  @input('string') labelTie: string = "It's a tie!";
  @input('string') labelWin: string = "{name} Wins!";
  @ui.group_end

  // -------- State --------
  private p0Best: number = 0;
  private p1Best: number = 0;
  private currentPlayerIndex: number = 0;
  private turnStarted: boolean = false;
  private updateEvt: UpdateEvent;
  private startEvt: OnStartEvent;

  onAwake() {
    this.startEvt = this.createEvent("OnStartEvent");
    this.startEvt.bind(() => this.onStart());
  }

  private onStart() {
    // Enable global touch blocking
    global.touchSystem.touchBlocking = true;

    // Events
    this.turnBased.onTurnStart.add((e) => this.onTurnStart(e));
    this.turnBased.onGameOver.add(() => this.onGameOver());

    // Default visibility
    this.showPlayersCards(false);
    this.showGameUI(false);
    this.showGameOver(false);
    this.showCaptureBanner(false);

    if (this.groupGameStartP1) this.groupGameStartP1.enabled = false;
    if (this.playerTurnCard) this.playerTurnCard.enabled = false;
    if (this.groupGameInfo) this.groupGameInfo.enabled = true;

    // Per-frame
    this.updateEvt = this.createEvent("UpdateEvent");
    this.updateEvt.bind(() => this.onUpdate());
  }

  // -------- Turn lifecycle --------
  private async onTurnStart(e: any) {
    this.currentPlayerIndex = e.currentUserIndex;

    // Update turn number text
    if (this.turnNumberText) {
      this.turnNumberText.text = this.labelTurnPrefix + String(e.turnCount + 1);
    }

    // --- SAFE GLOBAL DEFAULTS (first time only) ---
    let stage = await this.turnBased.getGlobalVariable(KEY_GLOBAL_STAGE) as string | null;
    if (stage == null || stage === "") {
      this.turnBased.setGlobalVariable(KEY_GLOBAL_STAGE, "start");
      this.turnBased.setGlobalVariable(KEY_GLOBAL_OVER, false);
      this.turnBased.setGlobalVariable(KEY_GLOBAL_WINNER, -1);
      stage = "start";
    }
    let isOver = await this.turnBased.getGlobalVariable(KEY_GLOBAL_OVER) as boolean;
    if (isOver == null) {
      isOver = false;
    }

    // If a finished session arrives, show Game Over immediately
    if (stage === "gameover" || isOver) {
      this.onGameOver();
      return;
    }

    // --- Read per-user bests (User Data) ---
    const [p0Raw, p1Raw] = await Promise.all([
      this.turnBased.getUserVariable(0, KEY_USER_BEST),
      this.turnBased.getUserVariable(1, KEY_USER_BEST),
    ]);

    this.p0Best = Number(p0Raw) || 0;
    this.p1Best = Number(p1Raw) || 0;

    // First overall turn = P1 with both bests at 0
    const isFirstOverall = (this.currentPlayerIndex === 0) && (this.p0Best === 0) && (this.p1Best === 0);

    // --- Baseline UI for a new turn ---
    this.turnStarted = false;
    this.showCaptureBanner(false);
    this.showGameUI(false);
    if (this.groupGameInfo) this.groupGameInfo.enabled = true;

    this.renderBestScores();

    // --- Start screens / Player Turn Card ---
    if (this.groupGameStartP1) this.groupGameStartP1.enabled = isFirstOverall;
    if (this.playerTurnCard) this.playerTurnCard.enabled = !isFirstOverall;

    // Showing previous player's card when not first turn ever
    if (!isFirstOverall && this.playerTurnCard.enabled) {
      // Previous player is the opposite index of the current player
      const lastIdx = 1 - this.currentPlayerIndex;

      if (lastIdx === 0) {
        this.player1TurnCard.enabled = true;
      } else if (lastIdx === 1) {
        this.player2TurnCard.enabled = true;
      }
    }

    // Opponent's best on the start-turn card (non-first turns)
    if (!isFirstOverall && this.startTurnScoreText) {
      const oppBest = Number(await this.turnBased.getOtherUserVariable(KEY_USER_BEST));
      this.startTurnScoreText.text = `${oppBest}`;
    }

    if (this.updateEvt) this.updateEvt.enabled = true;
  }


  // -------- Frame orchestration --------
  private async onUpdate() {
    // Start of play (first tap / card accept flips tapScript.startGame = true)
    if (!this.turnStarted) {
      if (this.tapScript.startGame) {
        this.turnStarted = true;
        if (this.groupGameStartP1) this.groupGameStartP1.enabled = false;
        if (this.playerTurnCard) this.playerTurnCard.enabled = false;
        if (this.groupGameInfo) this.groupGameInfo.enabled = false;
        this.showGameUI(true);
      }
      return;
    }

    // Turn ends when timer finishes
    if (this.timer.timerEnds) {
      const score = this.getScore();

      // Update current user's BEST (User Data)
      if (this.currentPlayerIndex === 0) {
        this.p0Best = Math.max(this.p0Best, score);
        this.turnBased.setUserVariable(0, KEY_USER_BEST, this.p0Best);
      } else {
        this.p1Best = Math.max(this.p1Best, score);
        this.turnBased.setUserVariable(1, KEY_USER_BEST, this.p1Best);
      }

      // Is this the final turn?  (new API is sync)
      const isFinal = !!(await this.turnBased.isFinalTurn?.()) || false;

      if (isFinal) {
        const winnerIdx = this.p0Best > this.p1Best ? 0 : (this.p1Best > this.p0Best ? 1 : -1);
        this.turnBased.setGlobalVariable(KEY_GLOBAL_STAGE, "gameover");
        this.turnBased.setGlobalVariable(KEY_GLOBAL_WINNER, winnerIdx);
        this.turnBased.setGlobalVariable(KEY_GLOBAL_OVER, true);
      } else {
        this.turnBased.setGlobalVariable(KEY_GLOBAL_STAGE, "sealed");
      }

      // Update top bar, then seal the turn (Snap & Send)
      this.renderBestScores();
      this.turnBased.setScore(score);
      this.turnBased.endTurn();
      this.showCaptureBanner(true);

      // Pause updates until next onTurnStart
      if (this.updateEvt) this.updateEvt.enabled = false;
      this.turnStarted = false;
    }
  }

  // -------- Game Over (both sides) --------
  private async onGameOver() {
    // Authoritative reads
    const [p0Raw, p1Raw] = await Promise.all([
      this.turnBased.getUserVariable(0, KEY_USER_BEST),
      this.turnBased.getUserVariable(1, KEY_USER_BEST),
    ]);

    this.p0Best = Number(p0Raw) || 0;
    this.p1Best = Number(p1Raw) || 0;

    // Decide winner and persist final snapshot (Global Data)
    const winnerIdx = this.p0Best > this.p1Best ? 0 : (this.p1Best > this.p0Best ? 1 : -1);

    // Crowns
    this.setCrownsForViewer(winnerIdx);

    // Winner text
    if (this.gameOverResultText) {
      if (winnerIdx === -1) {
        this.gameOverResultText.text = this.labelTie;
      } else if (winnerIdx === this.currentPlayerIndex) {
        const currentName = await this.turnBased.getCurrentUserDisplayName();
        this.gameOverResultText.text = this.labelWin.replace("{name}", currentName || "");
      } else {
        const otherName = await this.turnBased.getOtherUserDisplayName();
        this.gameOverResultText.text = this.labelWin.replace("{name}", otherName || "");
      }
    }

    // Final UI state
    this.showGameOver(true);
    this.showGameUI(false);
    this.showCaptureBanner(false);
    this.showPlayersCards(false);

    if (this.updateEvt) this.updateEvt.enabled = false;
  }

  // -------- Helpers --------
  private getScore(): number {
    if (this.tapScript && this.tapScript.count) {
      return Number(this.tapScript.count) || 0;
    }
  }

  private renderBestScores() {
    if (!this.bestScoreText) return;
    let topScore = 0;
    if (this.p0Best > this.p1Best) {
      topScore = this.p0Best;
    } else {
      topScore = this.p1Best;
    }

    this.bestScoreText.text = this.labelHighScoreFormat
      .replace("{score}", String(topScore));
  }

  public showPlayersCards(on: boolean) {
    if (this.player1Card) this.player1Card.enabled = on;
    if (this.player2Card) this.player2Card.enabled = on;
  }

  private showGameUI(on: boolean) {
    if (this.groupGameUI) this.groupGameUI.enabled = on;
  }

  private showGameOver(on: boolean) {
    if (this.groupGameOver) this.groupGameOver.enabled = on;
  }

  private showCaptureBanner(on: boolean) {
    if (this.captureBanner) this.captureBanner.enabled = on;
  }

  private setCrownsForViewer(winnerIdx: number) {
    // Enable winner's crown
    if (winnerIdx === 0) {
      this.player1Crown.enabled = true;
    } else if (winnerIdx === 1) {
      this.player2Crown.enabled = true;
    }
  }
}
