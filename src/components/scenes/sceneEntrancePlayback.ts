/** One bounded entrance clock, shared by the object and the camera director. */
export class SceneEntrancePlayback {
  private sample?: (time: number) => void;
  private drawn = false;
  private listeners = new Set<() => void>();
  connect(sample: (time: number) => void) {
    this.sample = sample;
    this.drawn = false;
    return () => {
      if (this.sample === sample) this.sample = undefined;
    };
  }
  seek(time: number) {
    this.sample?.(time);
  }
  markDrawn() {
    if (this.drawn) return;
    this.drawn = true;
    for (const listener of this.listeners) listener();
    this.listeners.clear();
  }
  whenDrawn(listener: () => void) {
    if (this.drawn) listener();
    else this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
