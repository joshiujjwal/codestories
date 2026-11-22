import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeStudyState, resetStudyProgress, practiceItems } from "../js/study.js";
import { problems } from "../js/catalog.js";
import { lessons } from "../js/lessons/index.js";
import { practiceKey } from "../js/practice-key.js";

const moveKey = practiceKey(lessons["move-zeroes-283"], 0);
const windowKey = practiceKey(lessons["max-average-643"], 0);

test("stored study data reconciles topics and rejects unknown or malformed practice progress", () => {
  const state = sanitizeStudyState({
    version: 1,
    filters: { query: "283", topic: "Two Pointers", patternId: "dfs", company: "Unknown" },
    learned: ["move-zeroes-283", "move-zeroes-283", "unknown"],
    learningCurrent: "unknown",
    quiz: { current: "unknown:0", answers: { [moveKey]: 0, "move-zeroes-283:1": 99, "move-zeroes-283:999": 0, "unknown:0": 0 } },
    flashcards: { current: moveKey, known: [moveKey, moveKey, "unknown:0"] }
  });
  assert.deepEqual(state.filters, { query: "283", topic: "Two Pointers", patternId: "two-pointers", company: "", collection: "all" });
  assert.deepEqual(state.learned, ["move-zeroes-283"]);
  assert.equal(state.learningCurrent, null);
  assert.deepEqual(state.quiz.answers, { [moveKey]: 0 });
  assert.equal(state.quiz.current, null);
  assert.deepEqual(state.flashcards.known, [moveKey]);
  assert.equal(state.flashcards.current, moveKey);
});

test("resetting a study set clears only its recall, completion, and cursors", () => {
  const original = {
    version: 1, filters: { query: "283" },
    learned: ["move-zeroes-283", "max-average-643"], learningCurrent: "move-zeroes-283",
    quiz: { current: moveKey, answers: { [moveKey]: 0, [windowKey]: 1 } },
    flashcards: { current: windowKey, known: [moveKey, windowKey] }
  };
  const result = resetStudyProgress(original, ["move-zeroes-283"]);
  assert.deepEqual(result.learned, ["max-average-643"]);
  assert.equal(result.learningCurrent, null);
  assert.deepEqual(result.quiz.answers, { [windowKey]: 1 });
  assert.equal(result.quiz.current, null);
  assert.deepEqual(result.flashcards.known, [windowKey]);
  assert.equal(result.flashcards.current, windowKey);
  assert.equal(result.filters.query, "283");
  assert.equal(original.learned.length, 2);
});

test("rewritten pilot questions never inherit old answers, while library and reading progress survive", () => {
  const state = sanitizeStudyState({
    version: 1, learned: ["move-zeroes-283", "story-735"], learningCurrent: "move-zeroes-283",
    quiz: { current: "move-zeroes-283:0", answers: { "move-zeroes-283:0": 2, "story-735:0": 0, [moveKey]: 1 } },
    flashcards: { known: ["move-zeroes-283:0", "story-735:0"] }
  });
  assert.deepEqual(state.quiz.answers, { "story-735:0": 0, [moveKey]: 1 });
  assert.equal(state.quiz.current, null);
  assert.deepEqual(state.flashcards.known, ["story-735:0"]);
  assert.deepEqual(state.learned, ["move-zeroes-283", "story-735"]);
  assert.equal(state.learningCurrent, "move-zeroes-283");
});

test("practice queues include only selected stories and invalid storage starts clean", () => {
  const matches = problems.filter((problem) => problem.id === 283);
  for (const mode of ["quiz", "flashcards"]) {
    const items = practiceItems(matches, mode);
    assert.ok(items.length > 0);
    assert.ok(items.every((item) => item.lessonId === "move-zeroes-283"));
    assert.equal(new Set(items.map((item) => item.key)).size, items.length);
    assert.deepEqual(practiceItems([], mode), []);
  }
  assert.deepEqual(sanitizeStudyState({ version: 99 }), sanitizeStudyState(null));
  assert.deepEqual(sanitizeStudyState({ version: 1, quiz: [], flashcards: [], learned: {} }).learned, []);
});
