import assert from "node:assert/strict";
import test from "node:test";

import { createPlayer } from "../js/player.js";

test("should start paused and respect stepping boundaries", () => {
  const player = createPlayer([{ id: "one" }, { id: "two" }]);
  assert.equal(player.state.playing, false);
  assert.equal(player.previous(), false);
  assert.equal(player.next(), true);
  assert.equal(player.state.index, 1);
  assert.equal(player.next(), false);
  player.reset();
  assert.equal(player.state.index, 0);
  assert.equal(player.state.playing, false);
});

test("should pause when manually seeking", () => {
  const player = createPlayer([{ id: "one" }, { id: "two" }]);
  player.play();
  player.seek(1);
  assert.equal(player.state.playing, false);
  assert.equal(player.state.index, 1);
});

test("autoplay stops on a prediction and cannot advance until a response", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let answered = false;
  const player = createPlayer([{ id: "setup" }, { id: "predict" }, { id: "result" }], () => {}, {
    isBlocked: (snapshot) => snapshot.id === "predict" && !answered
  });
  player.play();
  t.mock.timers.tick(1200);
  assert.equal(player.state.index, 1);
  assert.equal(player.state.playing, false);
  assert.equal(player.next(), false);
  assert.equal(player.play(), false);
  t.mock.timers.tick(5000);
  assert.equal(player.state.index, 1);
  answered = true;
  assert.equal(player.next(), true);
  assert.equal(player.state.index, 2);
  player.dispose();
});

test("narrated playback waits for completion and ignores a stale completion after navigation", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let finish;
  const player = createPlayer([{ id: "one" }, { id: "two" }], () => {}, {
    beforeAdvance: () => new Promise((resolve) => { finish = resolve; })
  });
  player.play();
  await Promise.resolve();
  t.mock.timers.tick(50000);
  assert.equal(player.state.index, 0);
  player.seek(0);
  finish();
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.tick(50000);
  assert.equal(player.state.index, 0);
  player.dispose();
});
