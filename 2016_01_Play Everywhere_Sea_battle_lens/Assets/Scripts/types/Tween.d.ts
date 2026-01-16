interface TweenGroup {
    getAll(): Tween[];
    removeAll(): void;
    add(tween: Tween): void;
    remove(tween: Tween): void;
    update(time?: number, preserve?: boolean): boolean;
}

interface Tween<T = any> {
    getId(): number;
    isPlaying(): boolean;
    to(properties: Partial<T>, duration?: number): this;
    start(time?: number | string): this;
    stop(): this;
    end(): this;
    stopChainedTweens(): void;
    delay(amount: number): this;
    repeat(times: number): this;
    repeatDelay(amount: number): this;
    yoyo(yoyo: boolean): this;
    easing(easing: (k: number) => number): this;
    interpolation(interpolation: (v: number[], k: number) => number): this;
    chain(...tweens: Tween[]): this;
    onStart(callback: (object: T) => void): this;
    onUpdate(callback: (object: T) => void): this;
    onComplete(callback: (object: T) => void): this;
    onStop(callback: (object: T) => void): this;
    update(time: number): boolean;
}

interface TweenStatic extends TweenGroup {
    Group: new () => TweenGroup;
    Tween: new <T = any>(object: T, group?: TweenGroup) => Tween<T>;
    Easing: {
        Linear: { None: (k: number) => number };
        Quadratic: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Cubic: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Quartic: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Quintic: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Sinusoidal: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Exponential: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Circular: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Elastic: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Back: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
        Bounce: { In: (k: number) => number; Out: (k: number) => number; InOut: (k: number) => number };
    };
    Interpolation: {
        Linear: (v: number[], k: number) => number;
        Bezier: (v: number[], k: number) => number;
        CatmullRom: (v: number[], k: number) => number;
    };
    now(): number;
    nextId(): number;
}

declare var TWEEN: TweenStatic;
