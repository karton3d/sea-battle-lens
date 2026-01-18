@component
export class Timer extends BaseScriptComponent {
  // UI
  @input('Component.Text') timerText;

  // Dependency (reads .startGame:boolean)
  @input('Component.ScriptComponent') tapScript;

  // Config
  @input('number') startSeconds:number = 10;
  @input('string') prefix:string = "Timer: ";

  // Public State
  public timerEnds:boolean = false; // becomes true when timer reaches 0

  // Internal State
  private running:boolean = false;
  private hasStarted:boolean = false;
  private endTime:number = 0;

  private updateEvt: UpdateEvent;
  private startEvt: OnStartEvent;

  onAwake() {
    this.startEvt = this.createEvent("OnStartEvent");
    this.startEvt.bind(() => this.onStart())
  }

  private onStart() {

    this.reset();
    this.renderRemaining(this.startSeconds); // initial UI

    this.updateEvt = this.createEvent("UpdateEvent");
    this.updateEvt.bind(() => this.onUpdate());
  }

  // Reinitialize to pre-game state
  private reset() {
    this.timerEnds = false;
    this.running = false;
    this.hasStarted = false;
    this.endTime = 0;
  }
 
  private start(seconds?:number) {
    let dur = this.startSeconds;
    if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
      dur = Math.floor(seconds);
    } else {
      dur = Math.floor(this.startSeconds);
    }

    this.running = true;
    this.hasStarted = true;
    this.timerEnds = false;
    this.endTime = getTime() + dur;
    this.renderRemaining(dur);
  }

  /** Remaining seconds, clamped to [0, ∞). */
  private getRemaining(): number {
    const remaining = this.endTime - getTime();

    if (!this.running) {
      // Before start: return configured duration
      if (!this.hasStarted){
        return Math.floor(this.startSeconds);
      }

      // After it already ended: clamp to 0
      return Math.max(0, Math.ceil(remaining));
    }

    // Running: countdown live
    return Math.max(0, Math.ceil(remaining));
  }

  private renderRemaining(value:number) {
    if (!this.timerText) return;
    const clamped = Math.max(0, Math.floor(value));
    this.timerText.text = `${this.prefix}${clamped}`;
  }

  private onUpdate() {
    // If we haven't started yet, watch the tap script’s startGame flag
    if (!this.hasStarted) {
      if (this.tapScript.startGame === true){
        this.start(this.startSeconds);
      } else {
        // exit until the game starts
        return;
      }
    }

    if (!this.running) return;

    const remaining = this.getRemaining();
    this.renderRemaining(remaining);

    if (remaining <= 0) {
      // Stop updating display at 0
      this.running = false;
      this.timerEnds = true;
    }
  }
}
