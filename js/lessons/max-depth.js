const balanced = { value: 8, left: { value: 3 }, right: { value: 12, left: { value: 10 }, right: { value: 14 } } };
export const maxDepthLesson = {
  id: "max-depth-104",
  title: "Maximum Depth of Binary Tree",
  pattern: "Depth-First Search",
  outcome: "Follow recursion down and combine child depths on the way back up.",
  warmup: { tree: balanced, label: "Balanced tree" },
  examples: [
    { tree: balanced, label: "Balanced tree" },
    { tree: { value: 5, right: { value: 7, right: { value: 9, right: { value: 11 } } } }, label: "Skewed tree" },
    { tree: { value: 6 }, label: "Single node" },
    { tree: null, label: "Empty tree" }
  ],
  cards: [
    ["What is the depth of an empty tree?", "Zero: there are no nodes on a path."],
    ["What does a node return?", "One plus the larger depth returned by its two children."],
    ["When does a parent know its depth?", "After both child calls have returned."],
    ["What are the solver costs?", "O(n) time and O(h) recursion space, where h is tree height. The teaching trace uses extra storage."]
  ],
  questions: [
    { prompt: "A node's child depths are 1 and 3. What does it return?", choices: ["4", "3"], answer: 0, explanation: "Include the current node: 1 + max(1, 3) = 4." },
    { prompt: "How deep is a chain containing three nodes?", choices: ["3", "2"], answer: 0, explanation: "This lesson counts nodes, not edges, on the longest root-to-leaf path." },
    { prompt: "What are the time and space complexities of recursive DFS for Maximum Depth?", choices: ["O(n) time and O(h) recursion stack space", "O(log n) time and O(1) space"], answer: 0, explanation: "Every node is visited once, and recursion depth grows up to tree height h." }
  ]
};

export function buildMaxDepthTrace(tree) {
  const nodes = [];
  const seen = new Set();
  function collect(node, id = "root", level = 0) {
    if (node === null || node === undefined) return;
    if (typeof node !== "object" || seen.has(node) || !Number.isInteger(node.value) || Math.abs(node.value) > 10000) {
      throw new Error("Use an acyclic binary tree with integer values between -10000 and 10000.");
    }
    if (nodes.length >= 15 || level >= 5) throw new Error("The visual tree accepts at most 15 nodes and 5 levels.");
    seen.add(node);
    nodes.push({ id, value: node.value, level, parent: id === "root" ? null : id.slice(0, -1) });
    collect(node.left, `${id}L`, level + 1);
    collect(node.right, `${id}R`, level + 1);
  }
  collect(tree);
  const snapshots = [];
  const stack = [];
  const returned = {};
  const add = (phase, summary, active, line) => snapshots.push({
    id: `depth-${snapshots.length}`, phase, summary, line,
    state: { nodes: nodes.map((node) => ({ ...node })), active, stack: [...stack], returned: { ...returned } },
    code: summary
  });
  function visit(node, id = "root") {
    stack.push(id);
    add("Enter a subtree", node ? `Visit node ${node.value}; its child depths are not known yet.` : "This subtree is empty.", id, 0);
    if (!node) {
      add("Empty subtree returns", "No nodes here: return 0 to the caller.", id, 1);
      stack.pop();
      return 0;
    }
    const left = visit(node.left, `${id}L`);
    add("Left depth received", `Node ${node.value} receives left depth ${left}.`, id, 2);
    const right = visit(node.right, `${id}R`);
    const depth = 1 + Math.max(left, right);
    returned[id] = depth;
    add("Combine and return", `Node ${node.value}: 1 + max(${left}, ${right}) = ${depth}.`, id, 3);
    stack.pop();
    return depth;
  }
  const result = visit(tree);
  add("Depth complete", `The longest root-to-leaf path contains ${result} nodes.`, null, 4);
  return { snapshots, result };
}
