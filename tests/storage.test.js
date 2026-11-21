import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeLearningState } from "../js/storage.js";

test("should discard unknown lesson and invalid persisted state", () => {
  const state = sanitizeLearningState({
    version: 1,
    lessons: { unknown: { stepId: "nope" }, "max-average-643": { stepId: "warmup-1", mode: "learn" } }
  });
  assert.deepEqual(Object.keys(state.lessons), ["max-average-643"]);
});

test("legacy progress survives and new lessons keep only valid bounded inputs", () => {
  const state = sanitizeLearningState({
    version: 1,
    lessons: {
      "max-average-643": { stepId: "window-1", mode: "explore", view: "2d", complete: true },
      "move-zeroes-283": { stepId: "move-2", view: "3d", input: { nums: [0, 3], label: "Saved exploration" } },
      "max-depth-104": { exampleIndex: 1, input: { tree: { value: 99 } } },
      "image-feed-read": { input: { metadata: "unavailable", media: "hit" } }
    }
  });
  assert.equal(state.lessons["max-average-643"].stepId, "window-1");
  assert.equal(state.lessons["max-average-643"].complete, true);
  assert.deepEqual(state.lessons["move-zeroes-283"].input.nums, [0, 3]);
  assert.equal(state.lessons["move-zeroes-283"].view, "2d");
  assert.equal(state.lessons["max-depth-104"].exampleIndex, 1);
  assert.equal(state.lessons["max-depth-104"].input, null);
  assert.equal(state.lessons["image-feed-read"].input.metadata, "unavailable");
});

test("corrupt state and invalid stored examples cannot become runnable input", () => {
  assert.deepEqual(sanitizeLearningState({ version: 1, lessons: null }), { version: 1, lessons: {} });
  const state = sanitizeLearningState({
    version: 1, lessons: {
      "max-average-643": { input: { nums: [1, 2], k: 9 }, exampleIndex: 100 },
      "image-feed-read": { input: { metadata: "invalid", media: "hit" } }
    }
  });
  assert.equal(state.lessons["max-average-643"].input, null);
  assert.equal(state.lessons["max-average-643"].exampleIndex, 0);
  assert.equal(state.lessons["image-feed-read"].input, null);
});
