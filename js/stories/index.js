import { problems, patterns, additionalPattern } from "../catalog.js";
import { storyTitles } from "../story-titles.js";
import { linearStories } from "./linear.js";
import { structureStories } from "./structures.js";
import { searchStories } from "./search.js";
import { dynamicStories } from "./dynamic.js";

export const storyDefinitions = [...linearStories, ...structureStories, ...searchStories, ...dynamicStories];

function formatInputSummary(input) {
  return Object.entries(input)
    .filter(([key]) => key !== "label")
    .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
    .join(", ");
}

function wrongOutputFor(expected) {
  if (typeof expected === "boolean") return !expected;
  if (typeof expected === "number") {
    return expected === 0 ? 1 : Number.isInteger(expected) ? expected + 1 : Number((expected + 0.5).toFixed(2));
  }
  if (typeof expected === "string") {
    if (expected === "") return "a";
    if (expected.length === 1) return "";
    const reversed = [...expected].reverse().join("");
    return reversed === expected ? `${expected}x` : reversed;
  }
  if (Array.isArray(expected)) {
    if (expected.length === 0) return [0];
    if (expected.length === 1) return typeof expected[0] === "boolean" ? [!expected[0]] : [expected[0], expected[0]];
    const reversed = [...expected].reverse();
    if (JSON.stringify(reversed) !== JSON.stringify(expected)) return reversed;
    return expected.slice(0, -1);
  }
  if (expected && typeof expected === "object") {
    return { ...expected, length: (expected.length ?? 0) + 1 };
  }
  return null;
}

function approachFor(problem) {
  const key = problem.tags[0] || problem.patternId;
  const catalog = {
    "Monotonic stack": ["Monotonic stack maintaining ordered waiting entries", "Sorting all inputs up front and discarding arrival order"],
    "Stack": ["LIFO stack resolving recent unmatched items or nested scopes", "FIFO queue processing oldest items before nested items close"],
    "Queue": ["FIFO queue retaining only active entries in arrival order", "Max heap sorting items by size rather than arrival order"],
    "Queue / simulation": ["Two FIFO queues simulating turn-by-turn elimination", "Sorting senators alphabetically once without re-queuing"],
    "Trie": ["Prefix tree (Trie) sharing character paths across words", "Unordered array scanning every full word on each query"],
    "Min heap": ["Min heap paired with a membership set and next-integer pointer", "Scanning all previously popped numbers linearly on every call"],
    "Priority queues": ["Two boundary min heaps keeping cheapest candidates on both ends", "Single-pass sliding window of fixed width across the middle"],
    "top-k": ["Size-k min heap retaining the best k candidates at its root", "Depth-first recursion exploring every subset in exponential time"],
    "Prefix / suffix": ["Prefix and suffix accumulators combining both sides without division", "Nested brute-force loop recomputing products on every index"],
    "Prefix accumulation": ["Running prefix sum tracking cumulative state in one pass", "Binary search assuming values are sorted monotonically"],
    "Hash set": ["Hash sets computing O(1) expected membership differences", "In-place linked-list pointer reversal"],
    "Frequency map": ["Hash frequency maps comparing counts and key sets", "Breadth-first traversal across a 2D adjacency grid"],
    "Hash map": ["Hash map indexing serialized row signatures for O(1) lookup", "Monotonic stack comparing adjacent column heights"],
    "BST search": ["Binary Search Tree ordering invariant choosing left or right child", "Breadth-first queue inspecting every node on every level"],
    "BST relinking": ["BST ordering relink replacing a removed node with its inorder successor", "Hash set deleting values without reconnecting child pointers"],
    "Linked-list relinking": ["Two in-place linked-list chains (odd and even) joined at the end", "Allocating a 2D dynamic-programming table over node values"],
    "Backtracking": ["Backtracking DFS choosing a step, recursing, and undoing on return", "Greedy single pass that never backtracks after a branch"],
    "Bit operations": ["Bitwise inspection / recurrence updating bit counts directly", "Converting integers to decimal strings and scanning characters"],
    "xor": ["Bitwise XOR cancelling identical pairs in O(1) extra space", "Sorting and storing every pair in a frequency hash table"],
    "sliding-window": ["Sliding window reusing overlapping elements inside a moving range", "Nested brute-force loops recounting every subarray from scratch"],
    "two-pointers": ["Two pointers advancing indices based on ordered comparison", "Breadth-first queue exploring graph neighbors level by level"],
    "fast-slow": ["Fast and slow pointers locating list positions in one traversal", "Copying all linked-list nodes into an auxiliary hash map"],
    "reversal": ["In-place pointer reversal saving next before rewiring links", "Binary search over node values"],
    "bfs": ["Breadth-first search (FIFO queue) expanding layer by layer", "Depth-first recursion diving to a leaf before checking closer neighbors"],
    "dfs": ["Depth-first traversal carrying path state or combining subtree returns", "Sorting all nodes into a min heap by value"],
    "binary-search": ["Binary search halving a sorted range or monotonic predicate", "Linear scan checking every candidate sequentially"],
    "dp": ["Dynamic programming reusing solved subproblems via state transitions", "Greedy local choice ignoring future subproblem interactions"],
    "intervals": ["Sorting intervals and greedily tracking the active boundary", "Breadth-first search over an unweighted adjacency matrix"],
    "Greedy": ["Single-pass greedy scan preserving the local feasibility invariant", "Exponential backtracking enumerating every combination"],
    "Array scan": ["Single linear pass tracking the running extreme before comparing", "Nested O(n²) comparison across every pair of elements"],
    "String arithmetic": ["Concatenation compatibility check combined with Euclidean GCD on lengths", "Sorting characters alphabetically in both strings"],
    "String processing": ["Trimming separators, reversing word order, and joining once", "Reversing characters in place without preserving word boundaries"]
  };
  return catalog[key] ?? ["Linear-time invariant scan with bounded state", "Nested brute-force enumeration over all pairs"];
}

function wrongComplexityFor(cost) {
  if (/O\(1\)/.test(cost)) return "O(n²) time and O(n) auxiliary space.";
  if (/log/i.test(cost)) return "O(n²) brute-force time without logarithmic pruning.";
  if (/O\(n²\)|O\(mn\)|O\(rows/.test(cost)) return "O(n) time and O(1) space using a single-pass pointer.";
  if (/O\(n|O\(m \+ n|O\(\|t\|/.test(cost)) return "O(n²) time and O(n²) auxiliary table space.";
  return "O(n³) time enumerating all triples.";
}

function makeChoicePair(correctText, wrongText, seed) {
  const answer = seed % 2;
  const choices = answer ? [wrongText, correctText] : [correctText, wrongText];
  return { choices, answer };
}

function initialState(input) {
  const arrays = {}, vars = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "label") continue;
    if (Array.isArray(value)) arrays[key] = value;
    else vars[key] = value;
  }
  return { arrays, vars };
}

export function buildStoryTrace(definition, input) {
  const snapshots = [];
  const step = (phase, summary, state = {}, line = 0) => {
    if (snapshots.length >= 3000) throw new Error("This example exceeds the visual walkthrough's step limit.");
    snapshots.push({ id: `story-${snapshots.length}`, phase, summary, state: structuredClone(state), line });
  };
  step("Meet the input", definition.goal, initialState(input));
  const result = definition.run(structuredClone(input), step);
  step("Put the answer together", `Result: ${JSON.stringify(result)}. ${definition.idea}`, {
    ...snapshots.at(-1).state, output: result
  }, definition.code.split("\n").length - 1);
  return { snapshots, result: structuredClone(result) };
}

export const storyLessons = Object.fromEntries(storyDefinitions.map((definition) => {
  const problem = problems.find((problem) => problem.id === definition.id);
  if (!problem) throw new Error(`Story ${definition.id} is not in the catalog.`);
  const pattern = [...patterns, additionalPattern].find((pattern) => pattern.id === problem.patternId);
  const id = `story-${definition.id}`;
  const examples = definition.cases.map(([input], index) => ({
    ...structuredClone(input), label: index === 0 ? "Worked example" : "Try another case"
  }));
  const [workedInput, workedOutput] = definition.cases[0];
  const [mechanism, wrongMechanism] = approachFor(problem);
  const expectedText = JSON.stringify(workedOutput);
  const wrongOutputText = JSON.stringify(wrongOutputFor(workedOutput));
  const wrongCost = wrongComplexityFor(definition.cost);
  const traceQuiz = makeChoicePair(expectedText, wrongOutputText, definition.id);
  const dsaQuiz = makeChoicePair(`${mechanism} — ${definition.idea}`, wrongMechanism, definition.id + 1);
  const costQuiz = makeChoicePair(definition.cost, wrongCost, definition.id + 2);
  return [id, {
    id, title: problem.title, storyTitle: storyTitles[definition.id], pattern: pattern.name, track: "algorithm", renderer: "story", supports3D: false,
    outcome: definition.goal,
    story: { problem: definition.goal, move: definition.idea, watch: definition.trap },
    warmup: examples[0], examples, lines: definition.code.split("\n"),
    build: (input) => buildStoryTrace(definition, input),
    complexity: `Solver: ${definition.cost} Teaching snapshots use additional memory.`,
    cards: [
      [`In "${storyTitles[definition.id]}" (${problem.title}), which data structure or algorithm solves it?`, `${mechanism}. ${definition.idea}`],
      [`Trace "${storyTitles[definition.id]}" on ${formatInputSummary(workedInput)}. What does it return?`, `${expectedText}. ${definition.idea}`],
      [`What are the time and space complexities of ${problem.title}?`, definition.cost],
      [`What edge case or bug breaks a naive solution for ${problem.title}?`, definition.trap]
    ],
    questions: [
      {
        prompt: `In "${storyTitles[definition.id]}" (${problem.title}), what does the algorithm return for ${formatInputSummary(workedInput)}?`,
        ...traceQuiz,
        explanation: `Running ${mechanism.toLowerCase()} on this input returns ${expectedText}. ${definition.idea}`
      },
      {
        prompt: `Which data structure or algorithmic approach powers ${problem.title}?`,
        ...dsaQuiz,
        explanation: `${mechanism}. ${definition.idea} ${definition.trap}`
      },
      {
        prompt: `What are the time and space complexities of this ${problem.title} solution?`,
        ...costQuiz,
        explanation: `${definition.cost} ${definition.idea}`
      }
    ]
  }];
}));
