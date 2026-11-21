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
