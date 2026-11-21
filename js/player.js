export function createPlayer(snapshots, onChange = () => {}) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    throw new Error("A player needs at least one snapshot.");
  }

  const state = { index: 0, playing: false, speed: 1 };
  let timer = null;

  const publish = () => onChange({ ...state, snapshot: snapshots[state.index] });
  const pause = () => {
    state.playing = false;
    if (timer !== null) globalThis.clearInterval(timer);
    timer = null;
    publish();
  };
  const next = () => {
    if (state.index >= snapshots.length - 1) {
      pause();
      return false;
    }
    state.index += 1;
    publish();
    return true;
  };
  const play = () => {
    if (state.index >= snapshots.length - 1) state.index = 0;
    if (timer !== null) globalThis.clearInterval(timer);
    state.playing = true;
    timer = globalThis.setInterval(() => {
      if (!next()) return;
    }, 1200 / state.speed);
    publish();
  };

  return {
    state,
    get snapshots() { return snapshots; },
    play,
    pause,
    next,
    previous() {
      if (state.index === 0) return false;
      state.index -= 1;
      pause();
      return true;
    },
    reset() {
      state.index = 0;
      pause();
    },
    seek(index) {
      if (!Number.isInteger(index) || index < 0 || index >= snapshots.length) return false;
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
      if (timer !== null) globalThis.clearInterval(timer);
      timer = null;
      state.playing = false;
    }
  };
}
