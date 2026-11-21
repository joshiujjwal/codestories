import assert from "node:assert/strict";
import test from "node:test";
import { patterns, problems, filterProblems, topics, companies, relatedPatterns, resolveTopicPattern } from "../js/catalog.js";
import { companyTagsByProblem } from "../js/company-tags.js";
import { lessons } from "../js/lessons/index.js";

// Membership reviewed against the linked DesignGurus public LeetCode 75 tables.
const sourceIds = [
  1768, 1071, 1431, 605, 345, 151, 238, 334, 443, 283, 392, 11, 1679,
  643, 1456, 1004, 1493, 1732, 724, 2215, 1207, 1657, 2352, 2390, 735, 394,
  933, 649, 2095, 328, 206, 2130, 104, 872, 1448, 437, 1372, 236, 199, 1161,
  700, 450, 841, 547, 1466, 399, 1926, 994, 215, 2336, 2542, 2462,
  374, 2300, 162, 875, 17, 216, 1137, 746, 198, 790, 62, 1143, 714, 72,
  338, 136, 1318, 208, 1268, 435, 452, 739, 901
];

test("catalog membership matches the reviewed source with valid unique placements and links", () => {
  assert.deepEqual(problems.map((problem) => problem.id).sort((a, b) => a - b), sourceIds.sort((a, b) => a - b));
  assert.equal(new Set(problems.map((problem) => problem.id)).size, problems.length);
  const placements = new Set([...patterns.map((pattern) => pattern.id), "additional"]);
  for (const problem of problems) {
    assert.ok(placements.has(problem.patternId));
    assert.equal(new URL(problem.url).pathname, `/problems/${problem.slug}/`);
    if (problem.lessonId) assert.ok(Object.hasOwn(lessons, problem.lessonId));
  }
});

test("search, difficulty, availability, and pattern filters compose without false matches", () => {
  assert.deepEqual(filterProblems({ query: " 283 " }).map((problem) => problem.id), [283]);
  assert.deepEqual(filterProblems({ query: "maximum average", animated: true }).map((problem) => problem.id), [643]);
  assert.equal(filterProblems({ animated: true, difficulty: "Medium", patternId: "xor" }).length, 0);
  assert.deepEqual(filterProblems({ animated: true, patternId: "dfs", query: "104" }).map((problem) => problem.id), [104]);
  assert.equal(filterProblems({ patternId: "cyclic-sort" }).length, 0);
  assert.ok(filterProblems({ patternId: "additional", query: "trie" }).some((problem) => problem.id === 208));
  assert.equal(filterProblems({ query: "not a problem" }).length, 0);
});

test("company associations cover catalog problems without duplicate or invented entries", () => {
  assert.deepEqual(Object.keys(companyTagsByProblem).map(Number).sort((a, b) => a - b), [...sourceIds].sort((a, b) => a - b));
  for (const problem of problems) {
    assert.ok(topics.includes(problem.topic));
    assert.ok(problem.companies.length > 0);
    assert.equal(new Set(problem.companies).size, problem.companies.length);
    assert.ok(problem.companies.every((company) => typeof company === "string" && company.trim() === company && companies.includes(company)));
  }
});

test("company, source topic, pattern, and search intersect rather than broadening results", () => {
  assert.deepEqual(filterProblems({ company: "Google", topic: "Two Pointers", patternId: "two-pointers" }).map((problem) => problem.id), [283, 392, 11, 1679]);
  assert.deepEqual(filterProblems({ company: "Google", topic: "Two Pointers", patternId: "two-pointers", query: "283" }).map((problem) => problem.id), [283]);
  assert.equal(filterProblems({ company: "Google", topic: "Sliding Window", patternId: "two-pointers" }).length, 0);
  assert.equal(filterProblems({ company: "Unknown company" }).length, 0);
  assert.equal(filterProblems({ topic: "Unknown topic" }).length, 0);
  assert.ok(filterProblems({ query: "google" }).some((problem) => problem.id === 283));
});

test("topics narrow patterns, preserve compatible selections, and reconcile incompatible ones", () => {
  assert.deepEqual(relatedPatterns("Sliding Window").map((pattern) => pattern.id), ["sliding-window"]);
  assert.equal(resolveTopicPattern("Sliding Window", "two-pointers"), "sliding-window");
  assert.deepEqual(relatedPatterns("Bit Manipulation").map((pattern) => pattern.id), ["xor", "dp", "additional"]);
  assert.equal(resolveTopicPattern("Bit Manipulation", "bfs"), "");
  assert.equal(resolveTopicPattern("Bit Manipulation", "dp"), "dp");
  assert.equal(resolveTopicPattern("", "bfs"), "bfs");
});
