export function createPlayer(snapshots, onChange = () => {}, {
  delay = 1200,
  isBlocked = () => false,
  beforeAdvance = null,
  onError = (error) => { throw error; }
} = {}) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    throw new Error("A player needs at least one snapshot.");
  }

  const state = { index: 0, playing: false, speed: 1 };
  let timer = null;
  let generation = 0;
  let disposed = false;

  const publish = () => onChange({ ...state, snapshot: snapshots[state.index] });
  const clearTimer = () => {
    generation += 1;
    if (timer !== null) globalThis.clearTimeout(timer);
    timer = null;
  };
  const pause = () => {
    if (disposed) return;
    clearTimer();
    state.playing = false;
    publish();
  };
  const schedule = () => {
    if (disposed || !state.playing) return;
    const token = generation;
    const snapshot = snapshots[state.index];
    const ready = () => {
      if (disposed || !state.playing || token !== generation) return;
      const duration = typeof delay === "function" ? delay(snapshot) : delay;
      timer = globalThis.setTimeout(next, duration / state.speed);
    };
    if (!beforeAdvance) { ready(); return; }
    Promise.resolve().then(() => {
      if (disposed || !state.playing || token !== generation) return;
      return beforeAdvance(snapshot);
    }).then(ready, (error) => {
      if (disposed || token !== generation) return;
      pause();
      onError(error);
    });
  };
  const next = () => {
    if (disposed) return false;
    if (isBlocked(snapshots[state.index]) || state.index >= snapshots.length - 1) {
      pause();
      return false;
    }
    clearTimer();
    state.index += 1;
    if (isBlocked(snapshots[state.index]) || state.index === snapshots.length - 1) state.playing = false;
    publish();
    schedule();
    return true;
  };
  const play = () => {
    if (disposed) return false;
    clearTimer();
    if (state.index >= snapshots.length - 1) state.index = 0;
    if (isBlocked(snapshots[state.index])) {
      state.playing = false;
      publish();
      return false;
    }
    state.playing = true;
    publish();
    schedule();
    return true;
  };

  return {
    state,
    get snapshots() { return snapshots; },
    play,
    pause,
    next,
    previous() {
      if (disposed || state.index === 0) return false;
      state.index -= 1;
      pause();
      return true;
    },
    reset() {
      if (disposed) return;
      state.index = 0;
      pause();
    },
    seek(index) {
      if (disposed || !Number.isInteger(index) || index < 0 || index >= snapshots.length) return false;
      state.index = index;
      pause();
      return true;
    },
    setSpeed(speed) {
      if (![0.5, 1, 1.5, 2].includes(speed)) return false;
      state.speed = speed;
      if (state.playing) play();
      else publish();
      return true;
    },
    dispose() {
      clearTimer();
      disposed = true;
      state.playing = false;
    }
  };
}
