import assert from "node:assert/strict";
import test from "node:test";
import { lessons } from "../js/lessons/index.js";
import { guides } from "../js/guided/index.js";

function build(id, input) {
  const original = structuredClone(input);
  const trace = lessons[id].build(input);
  assert.deepEqual(input, original);
  assert.equal(new Set(trace.snapshots.map((snapshot) => snapshot.id)).size, trace.snapshots.length);
  assert.ok(trace.snapshots.at(-1).proof);
  const first = structuredClone(trace.snapshots[0].guide);
  trace.snapshots.at(-1).guide.testMutation = true;
  assert.deepEqual(trace.snapshots[0].guide, first);
  return trace;
}

test("guided compaction preserves the finished prefix while honestly showing the unfinished tail", () => {
  for (const nums of [[0, 4, 0, 2, 9], [0, 3, 3, 0], [0, 0], [4, 2], []]) {
    const trace = build("move-zeroes-283", { nums });
    const kept = nums.filter((value) => value !== 0);
    assert.deepEqual(trace.result, [...kept, ...Array(nums.length - kept.length).fill(0)]);
    for (const { guide } of trace.snapshots) assert.deepEqual(guide.values.slice(0, guide.write), kept.slice(0, guide.write));
    const copy = trace.snapshots.find((snapshot) => snapshot.guide.copy?.from !== snapshot.guide.copy?.to);
    if (nums[0] === 0 && kept.length) {
      assert.ok(copy);
      assert.equal(copy.guide.values[0], kept[0]);
      assert.equal(copy.guide.values[1], nums[1]);
    }
  }
});

test("guided windows retain exactly their adjacent values and a real best sum even when all values are negative", () => {
  for (const [nums, k] of [[[2, 4, 6, 8], 2], [[-8, -3, -5], 2], [[0, 0], 1], [[4, -2, 1], 3]]) {
    const trace = build("max-average-643", { nums, k });
    const sums = Array.from({ length: nums.length - k + 1 }, (_, i) => nums.slice(i, i + k).reduce((a, b) => a + b, 0));
    assert.equal(trace.result.bestSum, Math.max(...sums));
    for (const { guide } of trace.snapshots) {
      assert.equal(guide.sum, nums.slice(guide.start, guide.start + k).reduce((a, b) => a + b, 0));
      assert.ok(sums.includes(guide.bestSum));
    }
  }
});

test("guided BFS groups simultaneous arrivals without adding same-minute cascades", () => {
  const trace = build("story-994", lessons["story-994"].examples[0]);
  assert.equal(trace.result, 2);
  const waves = trace.snapshots.filter((snapshot) => snapshot.guide.changed);
  assert.deepEqual(waves.map(({ guide }) => [guide.minute, guide.changed.length]), [[1, 4], [2, 4]]);
  for (const { guide } of waves) {
    for (const [from, to] of guide.edges) {
      assert.equal(guide.times[from[0]][from[1]], guide.minute - 1);
      assert.equal(guide.times[to[0]][to[1]], guide.minute);
      assert.equal(Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]), 1);
    }
  }
  for (const [grid, expected] of [[[[2, 1, 0], [0, 1, 1]], 3], [[[1, 0, 2]], -1], [[[2]], 0], [[[0]], 0], [[[1]], -1]]) {
    assert.equal(build("story-994", { grid }).result, expected);
  }
});

test("guided waiting stacks keep equal temperatures and resolve multiple days by index distance", () => {
  for (const nums of [[60, 63, 61, 65], [70, 70], [70, 68, 68, 72], [80, 70, 60], []]) {
    const trace = build("story-739", { nums });
    const expected = nums.map((value, i) => {
      const offset = nums.slice(i + 1).findIndex((later) => later > value);
      return offset < 0 ? 0 : offset + 1;
    });
    assert.deepEqual(trace.result, expected);
    for (const { guide } of trace.snapshots) {
      assert.ok(guide.stack.every((index, i) => i === 0 || nums[guide.stack[i - 1]] >= nums[index]));
      if (guide.resolved !== null && guide.resolved !== undefined) assert.equal(guide.waits[guide.resolved], guide.day - guide.resolved);
    }
  }
  const trace = lessons["story-739"].build(lessons["story-739"].warmup);
  assert.ok(trace.snapshots.some((snapshot) => snapshot.question?.prompt.includes("should we stop")));
});

function bestSubset(values) {
  let best = 0;
  for (let mask = 0; mask < 2 ** values.length; mask++) {
    if (mask & (mask << 1)) continue;
    best = Math.max(best, values.reduce((sum, value, i) => sum + ((mask & (1 << i)) ? value : 0), 0));
  }
  return best;
}

test("guided take/skip diagrams show valid prefix dependencies, including the greedy counterexample", () => {
  for (const nums of [[4, 5, 4], [2, 7, 9, 3, 1], [5], [0, 0, 0], []]) {
    const trace = build("story-198", { nums });
    assert.equal(trace.result, bestSubset(nums));
    for (const { guide } of trace.snapshots) {
      if (guide.day < 0) continue;
      assert.equal(guide.twoBack, bestSubset(nums.slice(0, Math.max(0, guide.day - 1))));
      assert.equal(guide.oneBack, bestSubset(nums.slice(0, guide.day)));
      guide.history.forEach((total, i) => assert.equal(total, bestSubset(nums.slice(0, i + 1))));
    }
  }
});

test("each guided worked example has an answerable pause before the explanation", () => {
  for (const id of Object.keys(guides)) {
    const lesson = lessons[id], trace = lesson.build(lesson.warmup);
    const pauses = trace.snapshots.filter((snapshot) => snapshot.question);
    assert.ok(pauses.length, id);
    for (const { question } of pauses) {
      assert.equal(new Set(question.choices).size, question.choices.length);
      assert.equal(question.feedback.length, question.choices.length);
      assert.ok(question.feedback[question.answer]);
    }
    for (const question of lesson.questions) assert.equal(question.feedback.length, question.choices.length);
  }
});
