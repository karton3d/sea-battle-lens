@component
export class TapButton extends BaseScriptComponent {
  
  @input('Component.Script') timerScript

  @input('Component.Text') buttonText;   // the “Tap To Start” text element
  @input('Component.Text') counterText;  // the “Score: X” text element

  // Config
  @input('string') startLabel: string = "Tap To Start";
  @input('string') tapLabel:   string = "Tap";
  @input('string') counterPrefix: string = "Score: ";

  // State
  public startGame: boolean = false; // becomes true on first tap
  public count: number = 0;

  private updateEvent: UpdateEvent;
  private tapEvent: TapEvent;
    
  onAwake() {
    // Listen for taps directly
    this.tapEvent = this.createEvent("TapEvent");
    this.tapEvent.bind(() => this.onTap());

    this.updateEvent = this.createEvent("UpdateEvent");
    this.updateEvent.bind(() => this.onUpdate());

    // Init UI
    this.refreshTexts(true);
  }

  private onTap() {
    if (!this.startGame) {
      this.startGame = true;
      if (this.buttonText){
        this.buttonText.text = this.tapLabel;
      }
    }

    this.count++;
    this.refreshTexts(false);
  }

  private refreshTexts(isInit: boolean) {
    if (isInit && this.buttonText) {
      this.buttonText.text = this.startLabel;
    }
    if (this.counterText) {
      this.counterText.text = `${this.counterPrefix}${this.count}`;
    }
  }

  private onUpdate(){
    if(this.timerScript.timerEnds){
      this.tapEvent.enabled = false;
      this.getSceneObject().enabled = false;
    }
  }
}
