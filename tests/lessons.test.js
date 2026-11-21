import assert from "node:assert/strict";
import test from "node:test";

import { buildMaxAverageTrace, validateMaxAverageInput } from "../js/lessons/max-average.js";
import { buildImageFeedTrace } from "../js/lessons/image-feed.js";
import { buildMoveZeroesTrace, validateMoveZeroesInput } from "../js/lessons/move-zeroes.js";
import { buildMaxDepthTrace, maxDepthLesson } from "../js/lessons/max-depth.js";

test("should create correct fixed-window sums for LeetCode 643", () => {
  const trace = buildMaxAverageTrace([1, 12, -5, -6, 50, 3], 4);
  assert.deepEqual(trace.windows.map((window) => window.sum), [2, 51, 42]);
  assert.equal(trace.result.average, 12.75);
  assert.deepEqual(trace.result.range, [1, 4]);
  assert.match(trace.snapshots.at(-1).summary, /average 12.75/);
});

test("should retain earliest range when maximum window sums tie", () => {
  const trace = buildMaxAverageTrace([4, 1, 4, 1], 2);
  assert.deepEqual(trace.result.range, [0, 1]);
});

test("should not use zero as the initial best sum for all-negative inputs", () => {
  const trace = buildMaxAverageTrace([-8, -3, -6], 2);
  assert.equal(trace.result.bestSum, -9);
  assert.deepEqual(trace.result.range, [1, 2]);
});

test("should reject visual inputs outside the accepted range", () => {
  assert.match(validateMaxAverageInput([], 1).error, /at least/i);
  assert.match(validateMaxAverageInput([1, 2.5], 1).error, /integers/i);
  assert.match(validateMaxAverageInput(Array.from({ length: 13 }, () => 1), 1).error, /12/i);
  assert.match(validateMaxAverageInput([1, 2], 3).error, /between/i);
});

test("should keep Timeline DB off a metadata cache hit", () => {
  const trace = buildImageFeedTrace({ metadata: "hit", media: "hit" });
  assert.equal(trace.events.some((event) => event.to === "timeline-db"), false);
  assert.equal(trace.events.some((event) => event.to === "object-storage"), false);
});

test("should populate cache after a metadata miss before responding", () => {
  const trace = buildImageFeedTrace({ metadata: "miss", media: "miss" });
  const populate = trace.events.findIndex((event) => event.kind === "populate-cache");
  const respond = trace.events.findIndex((event) => event.kind === "response" && event.to === "reader");
  assert.ok(populate >= 0);
  assert.ok(populate < respond);
});

test("fixed windows handle both smallest and whole-array windows", () => {
  assert.equal(buildMaxAverageTrace([-4, 3, 2], 1).result.average, 3);
  assert.equal(buildMaxAverageTrace([-4, 3, 2], 3).result.average, 1 / 3);
});

test("move-zeroes traces compact stably without changing the input or earlier snapshots", () => {
  for (const input of [[], [0, 0], [4, 4, 9], [0, -3, 0, 2, -3], [1, 0]]) {
    const before = [...input];
    const trace = buildMoveZeroesTrace(input);
    const nonzeros = input.filter((value) => value !== 0);
    assert.deepEqual(trace.result, [...nonzeros, ...Array(input.length - nonzeros.length).fill(0)]);
    assert.deepEqual(input, before);
    assert.deepEqual(trace.snapshots[0].state.values, before);
    if (trace.result.length) {
      trace.result[0] = 99;
      assert.deepEqual(trace.snapshots[0].state.values, before);
      assert.notEqual(trace.snapshots.at(-1).state.values[0], 99);
    }
  }
});

test("move-zeroes rejects invalid visual input but accepts an empty array", () => {
  assert.ok(validateMoveZeroesInput([]).value);
  for (const input of [null, [1.5], [Infinity], [10001], Array(13).fill(1)]) {
    assert.ok(validateMoveZeroesInput(input).error);
  }
});

test("tree traces return node-count depths and keep earlier frames and returns unchanged", () => {
  const expected = [3, 4, 1, 0];
  maxDepthLesson.examples.forEach((example, index) => {
    const before = structuredClone(example.tree);
    const trace = buildMaxDepthTrace(example.tree);
    assert.equal(trace.result, expected[index]);
    assert.deepEqual(example.tree, before);
    assert.deepEqual(trace.snapshots[0].state.returned, {});
    assert.deepEqual(trace.snapshots.at(-1).state.stack, []);
    assert.equal(trace.snapshots[0].state.stack.length, 1);
  });
});

test("tree visualizer rejects cyclic, shared, invalid, and oversized structures explicitly", () => {
  const cyclic = { value: 1 };
  cyclic.left = cyclic;
  const shared = { value: 2 };
  assert.throws(() => buildMaxDepthTrace(cyclic), /acyclic/);
  assert.throws(() => buildMaxDepthTrace({ value: 1, left: shared, right: shared }), /acyclic/);
  assert.throws(() => buildMaxDepthTrace({ value: 1.5 }), /integer/);
  const deep = Array.from({ length: 6 }, (_, index) => ({ value: index }));
  deep.slice(0, -1).forEach((node, index) => { node.left = deep[index + 1]; });
  assert.throws(() => buildMaxDepthTrace(deep[0]), /5 levels/);
});

test("unavailable metadata cache still reads the database and respects CDN hit/miss", () => {
  for (const media of ["hit", "miss"]) {
    const trace = buildImageFeedTrace({ metadata: "unavailable", media });
    assert.ok(trace.events.some((event) => event.to === "timeline-db"));
    assert.equal(trace.events.some((event) => event.kind === "populate-cache"), false);
    assert.equal(trace.events.some((event) => event.to === "object-storage"), media === "miss");
  }
});
