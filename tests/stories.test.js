import assert from "node:assert/strict";
import test from "node:test";
import { storyDefinitions, buildStoryTrace } from "../js/stories/index.js";
import { problems, filterProblems } from "../js/catalog.js";
import { lessons } from "../js/lessons/index.js";
import { MinHeap } from "../js/stories/search.js";
import { renderDiagram } from "../js/renderers.js";

for (const definition of storyDefinitions) {
  test(`story ${definition.id} computes its worked and boundary cases without changing inputs`, () => {
    for (const [input, expected] of definition.cases) {
      const original = structuredClone(input);
      const trace = buildStoryTrace(definition, input);
      assert.deepEqual(trace.result, expected);
      assert.deepEqual(input, original);
      assert.deepEqual(trace.snapshots.at(-1).state.output, expected);
      assert.equal(trace.snapshots[0].phase, "Meet the input");
      assert.ok(trace.snapshots.length >= 2);
      assert.ok(trace.snapshots.every((snapshot) => snapshot.summary && snapshot.phase));
      for (const snapshot of trace.snapshots) assert.ok(renderDiagram("story", snapshot).length > 0);
    }
  });
}

test("every LeetCode 75 problem has an original story, unique story title, and a real trace builder", () => {
  const covered = new Set();
  const titles = new Set();
  for (const problem of problems) {
    const lesson = lessons[problem.lessonId];
    assert.ok(problem.storyTitle && lesson.storyTitle === problem.storyTitle, problem.title);
    titles.add(problem.storyTitle);
    assert.ok(lesson.story.problem && lesson.story.move && lesson.story.watch, problem.title);
    assert.ok(lesson.questions.length >= 3, `${problem.title} should have >=3 quiz questions`);
    assert.ok(lesson.cards.length >= 4, `${problem.title} should have >=4 flashcards`);
    for (const question of lesson.questions) {
      assert.ok(question.prompt && question.explanation);
      assert.ok(!/Ignore this warning|What protects correctness/.test(question.prompt + question.choices.join(" ")));
      assert.equal(new Set(question.choices).size, question.choices.length, `${problem.title}: ${question.prompt}`);
      assert.ok(question.answer >= 0 && question.answer < question.choices.length);
    }
    for (const [front, back] of lesson.cards) {
      assert.ok(front && back && front !== back);
      assert.notEqual(front, "What is the central move?");
    }
    const trace = lesson.build(lesson.warmup);
    assert.ok(trace.snapshots.length >= 2, problem.title);
    covered.add(problem.id);
  }
  assert.equal(covered.size, 75);
  assert.equal(titles.size, 75);
  assert.deepEqual(filterProblems({ query: "Showdown" }).map((problem) => problem.id), [735]);
  assert.ok(lessons["image-feed-read"].storyTitle.length > 0);
});

test("heap maintains ordering across duplicates, ties, and interleaved operations", () => {
  const heap = new MinHeap();
  [5, 1, 3, 1, -2].forEach((value) => heap.push(value));
  assert.equal(heap.pop(), -2);
  heap.push(0);
  assert.deepEqual(Array.from({ length: heap.size }, () => heap.pop()), [0, 1, 1, 3, 5]);
  assert.throws(() => heap.pop(), /empty heap/);
});
