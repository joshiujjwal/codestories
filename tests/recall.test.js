import assert from "node:assert/strict";
import test from "node:test";
import { lessons } from "../js/lessons/index.js";
import { resetStudyProgress } from "../js/study.js";
import { recallItems, localDay, reviewDay, saveRecallAttempt, dueRecallItems, recallSummary, sanitizeRecallState } from "../js/recall.js";

const key = (lessonId, id = "transfer") => `${lessonId}:recall-v1:${id}`;
const rating = { outcome: "independent", criteriaMet: 3, intervalDays: 1, today: "2026-11-21" };

test("fresh recall inputs are unseen in the walkthrough presets and match real solver results", () => {
  for (const item of recallItems.filter((item) => item.fixture)) {
    const lesson = lessons[item.lessonId];
    const original = structuredClone(item.fixture.input);
    assert.deepEqual(lesson.build(item.fixture.input).result, item.fixture.expected, item.lessonId);
    assert.deepEqual(item.fixture.input, original);
    for (const example of lesson.examples) {
      const { label, ...input } = example;
      assert.notDeepEqual(input, item.fixture.input, `${item.lessonId} needs a fresh transfer input`);
    }
  }
});

test("review dates use calendar days across month ends, leap days, and clock changes", () => {
  assert.equal(reviewDay("2026-11-21", 1), "2026-11-22");
  assert.equal(reviewDay("2026-11-21", 3), "2026-11-24");
  assert.equal(reviewDay("2026-11-21", 7), "2026-11-28");
  assert.equal(reviewDay("2026-10-31", 1), "2026-11-01");
  assert.equal(reviewDay("2028-02-28", 1), "2028-02-29");
  assert.equal(reviewDay("2026-12-30", 3), "2027-01-02");
  assert.equal(localDay(new Date(2026, 10, 21, 23, 59)), "2026-11-21");
  assert.throws(() => reviewDay("2026-02-30", 1), /Choose/);
  assert.throws(() => reviewDay("2026-11-21", 0), /Choose/);
});

test("worked completion and same-day success never count as later unaided recall", () => {
  let state = saveRecallAttempt(null, key("move-zeroes-283", "complete"), rating);
  assert.equal(state.records[key("move-zeroes-283", "complete")].dueOn, null);
  assert.deepEqual(dueRecallItems(state, "2026-12-01"), []);
  state = saveRecallAttempt(state, key("move-zeroes-283"), rating);
  assert.equal(recallSummary(state, "2026-11-21").delayedIndependent, 0);
  assert.equal(dueRecallItems(state, "2026-11-21").length, 0);
  assert.equal(dueRecallItems(state, "2026-11-22").length, 1);
  state = saveRecallAttempt(state, key("move-zeroes-283"), { ...rating, today: "2026-11-22", intervalDays: 7 });
  assert.equal(recallSummary(state, "2026-11-22").delayedIndependent, 1);
  assert.equal(state.records[key("move-zeroes-283")].dueOn, "2026-11-29");
  assert.equal(state.records[key("move-zeroes-283")].reviews, 2);
});

test("hints, early reveals, and incomplete self-checks cannot be stored as unaided", () => {
  for (const invalid of [{ hintUsed: true }, { neededAnswer: true }, { criteriaMet: 2 }]) {
    assert.throws(() => saveRecallAttempt(null, key("story-198"), { ...rating, ...invalid }), /Unaided/);
  }
  const state = saveRecallAttempt(null, key("story-198"), { ...rating, outcome: "assisted", hintUsed: true, criteriaMet: 2 });
  assert.equal(state.records[key("story-198")].outcome, "assisted");
  assert.equal(state.records[key("story-198")].hintUsed, true);
});

test("due prompts alternate lessons, exclude future items, and remain unchanged when inspected", () => {
  let state = null;
  for (const lesson of ["move-zeroes-283", "max-average-643"]) {
    for (const task of ["transfer", "explain"]) state = saveRecallAttempt(state, key(lesson, task), rating);
  }
  state = saveRecallAttempt(state, key("story-198"), { ...rating, intervalDays: 7 });
  const original = structuredClone(state);
  const due = dueRecallItems(state, "2026-11-22");
  assert.equal(due.length, 4);
  assert.notEqual(due[0].lessonId, due[1].lessonId);
  assert.notEqual(due[1].lessonId, due[2].lessonId);
  assert.ok(due.every((item) => item.kind !== "complete" && item.lessonId !== "story-198"));
  assert.deepEqual(state, original);
});

test("corrupt records and old revisions are discarded, while only selected review progress resets", () => {
  let recall = saveRecallAttempt(null, key("move-zeroes-283"), rating);
  recall = saveRecallAttempt(recall, key("story-198"), { ...rating, intervalDays: 3 });
  recall.records["move-zeroes-283:old:transfer"] = recall.records[key("move-zeroes-283")];
  recall.records[key("max-average-643")] = { ...recall.records[key("story-198")], dueOn: "broken" };
  recall.draft = "scratch notes must not persist";
  const sanitized = sanitizeRecallState(recall);
  assert.deepEqual(Object.keys(sanitized.records).sort(), [key("move-zeroes-283"), key("story-198")].sort());
  assert.equal(sanitized.draft, undefined);
  const result = resetStudyProgress({ version: 1, recall, learned: ["move-zeroes-283", "story-198"] }, ["move-zeroes-283"]);
  assert.deepEqual(Object.keys(result.recall.records), [key("story-198")]);
  assert.deepEqual(result.learned, ["story-198"]);
});
