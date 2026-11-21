function linked(values) {
  const nodes = values.map((value, index) => ({ id: String(index), value, next: null }));
  nodes.forEach((node, index) => { node.next = nodes[index + 1] ?? null; });
  return { head: nodes[0] ?? null, nodes };
}
function listValues(head) {
  const values = [];
  for (let node = head; node; node = node.next) values.push(node.value);
  return values;
}
function listView(nodes, active, vars = {}) {
  return {
    graph: { kind: "list", nodes: nodes.map((node, index) => ({ id: node.id, label: node.value, x: 50 + index * 95, y: 65 })), edges: nodes.filter((node) => node.next).map((node) => [node.id, node.next.id]) },
    activeNodes: active.filter(Boolean).map((node) => node.id), vars
  };
}
function makeTree(values) {
  if (!values.length || values[0] === null) return null;
  const root = { id: "root", value: values[0], left: null, right: null };
  const queue = [root];
  let index = 1;
  for (let head = 0; head < queue.length && index < values.length; head++) {
    for (const side of ["left", "right"]) {
      const value = values[index++];
      if (value !== null && value !== undefined) {
        const child = { id: queue[head].id + (side === "left" ? "L" : "R"), value, left: null, right: null };
        queue[head][side] = child;
        queue.push(child);
      }
    }
  }
  return root;
}
function serializeTree(root) {
  if (!root) return [];
  const output = [], queue = [root];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    output.push(node ? node.value : null);
    if (node) queue.push(node.left, node.right);
  }
  while (output.at(-1) === null) output.pop();
  return output;
}
function treeView(root, active = [], vars = {}) {
  const nodes = [], edges = [];
  function walk(node, x = 300, y = 45, spread = 140) {
    if (!node) return;
    nodes.push({ id: node.id, label: node.value, x, y });
    for (const [child, direction] of [[node.left, -1], [node.right, 1]]) if (child) {
      edges.push([node.id, child.id]);
      walk(child, x + spread * direction, y + 70, spread / 2);
    }
  }
  walk(root);
  return { graph: { kind: "tree", nodes, edges }, activeNodes: active.filter(Boolean).map((node) => node.id), vars };
}
function graphView(n, edges, active, vars = {}) {
  return { graph: { nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: i })), edges: edges.map(([a, b]) => [String(a), String(b)]) }, activeNodes: active.map(String), vars };
}

export const structureStories = [
  {
    id: 2095, cases: [[{ nums: [8, 2, 5, 9, 4] }, [8, 2, 9, 4]], [{ nums: [1] }, []]],
    goal: "Remove the middle linked-list node; for even lengths, remove the later middle.",
    idea: "Fast advances twice while slow advances once. Keep slow's predecessor to bypass the middle.",
    trap: "Deleting a value rather than changing a link leaves the original list structure intact.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "while fast and fast.next:\n  previous = slow; slow = slow.next\n  fast = fast.next.next\nprevious.next = slow.next",
    run({ nums }, step) {
      const { head, nodes } = linked(nums);
      if (!head?.next) { step("Remove the only node", "A one-node list becomes empty.", listView(nodes, [head])); return []; }
      let slow = head, fast = head, previous = null;
      while (fast?.next) {
        previous = slow; slow = slow.next; fast = fast.next.next;
        step("Move at different speeds", `Slow is at ${slow.value}; fast is ${fast?.value ?? "past the end"}.`, listView(nodes, [slow, fast], { slow: slow.value, fast: fast?.value ?? "end" }), 1);
      }
      previous.next = slow.next;
      step("Bypass the middle", `${previous.value} now links directly to ${slow.next?.value ?? "the end"}.`, listView(nodes, [previous, slow]), 3);
      return listValues(head);
    }
  },
  {
    id: 328, cases: [[{ nums: [4, 7, 2, 9, 5] }, [4, 2, 5, 7, 9]], [{ nums: [1, 2] }, [1, 2]]],
    goal: "Group nodes at odd positions first, followed by nodes at even positions, preserving each group's order.",
    idea: "Maintain two chains and keep the even head so the odd tail can reconnect to it.",
    trap: "Odd and even describe positions, not the parity of stored values.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "odd = head; even = evenHead = head.next\nwhile even and even.next:\n  link odd to the next odd; advance odd\n  link even to the next even; advance even\nodd.next = evenHead",
    run({ nums }, step) {
      const { head, nodes } = linked(nums);
      if (!head) return [];
      let odd = head, even = head.next;
      const evenHead = even;
      while (even?.next) {
        odd.next = even.next; odd = odd.next;
        even.next = odd.next; even = even.next;
        step("Extend the two chains", "Odd-position and even-position nodes retain their original order within each chain.", listView(nodes, [odd, even]), 2);
      }
      odd.next = evenHead;
      step("Join the groups", "The odd tail now points to the saved even head.", listView(nodes, [odd, evenHead]), 4);
      return listValues(head);
    }
  },
  {
    id: 206, cases: [[{ nums: [3, 8, 1] }, [1, 8, 3]], [{ nums: [] }, []]],
    goal: "Reverse a linked list by changing its links, without allocating another list.",
    idea: "Save next before changing current.next; previous holds the reversed prefix.",
    trap: "Overwriting next before saving it loses the unvisited tail.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "previous = null; current = head\nwhile current:\n  next = current.next; current.next = previous\n  previous = current; current = next\nreturn previous",
    run({ nums }, step) {
      const { head, nodes } = linked(nums);
      let previous = null, current = head;
      while (current) {
        const next = current.next;
        current.next = previous;
        step("Reverse one link", `${current.value} points back to ${previous?.value ?? "null"}; the tail is saved separately.`, listView(nodes, [current, next], { previous: previous?.value ?? "null", next: next?.value ?? "null" }), 2);
        previous = current; current = next;
      }
      return listValues(previous);
    }
  },
  {
    id: 2130, cases: [[{ nums: [2, 5, 8, 4] }, 13], [{ nums: [1, 1] }, 2]],
    goal: "Pair the first and last nodes, the second and second-last, and find the largest twin sum.",
    idea: "Find the midpoint, reverse the second half, then traverse the two halves together.",
    trap: "Adjacent pairs are not twin pairs; twins mirror positions across the list.", cost: "O(n) time and O(1) auxiliary solver space; the second half is relinked.",
    code: "find midpoint with fast/slow pointers\nreverse the second half\nwalk first half and reversed half together\nkeep the maximum pair sum",
    run({ nums }, step) {
      const { head, nodes } = linked(nums);
      let slow = head, fast = head;
      while (fast?.next) { slow = slow.next; fast = fast.next.next; step("Locate the second half", "Slow reaches the boundary at half speed.", listView(nodes, [slow, fast])); }
      let previous = null;
      while (slow) {
        const next = slow.next; slow.next = previous; previous = slow; slow = next;
        step("Reverse the second half", "Mirrored positions can now be visited in the same direction.", listView(nodes, [previous, slow]), 1);
      }
      let first = head, second = previous, best = -Infinity;
      while (second) {
        best = Math.max(best, first.value + second.value);
        step("Measure a twin pair", `${first.value} + ${second.value} = ${first.value + second.value}.`, listView(nodes, [first, second], { best }), 2);
        first = first.next; second = second.next;
      }
      return best;
    }
  },
  {
    id: 872, cases: [[{ a: [5, 2, 8, null, 3, 7, 9], b: [1, 3, 4, null, null, 7, 9] }, true], [{ a: [1, 2, 3], b: [1, 3, 2] }, false]],
    goal: "Compare the left-to-right leaf sequences of two trees, ignoring their internal shapes.",
    idea: "A depth-first traversal that visits left before right emits leaves in the required order.",
    trap: "Matching the set of leaves is insufficient when their order differs.", cost: "O(n + m) time; leaf output and O(h) recursion space.",
    code: "collect leaves by DFS, left before right\ncompare both leaf sequences position by position",
    run({ a, b }, step) {
      function leaves(root, name) {
        const output = [];
        function visit(node) {
          if (!node) return;
          if (!node.left && !node.right) output.push(node.value);
          step("Visit a possible leaf", `${name}: ${node.value} ${!node.left && !node.right ? "is a leaf" : "has children"}.`, { ...treeView(root, [node]), arrays: { leaves: output } });
          visit(node.left); visit(node.right);
        }
        visit(root);
        return output;
      }
      const first = leaves(makeTree(a), "First tree"), second = leaves(makeTree(b), "Second tree");
      step("Compare leaf order", "The sequences must agree at every position.", { arrays: { first, second } }, 1);
      return JSON.stringify(first) === JSON.stringify(second);
    }
  },
  {
    id: 1448, cases: [[{ tree: [4, 2, 7, 1, 3, 6, 9] }, 3], [{ tree: [2, 2, 2] }, 3]],
    goal: "Count nodes with no larger value on their path from the root.",
    idea: "Carry the maximum of the active path down each branch; equal values still qualify.",
    trap: "A maximum from a different branch must not disqualify the current node.", cost: "O(n) time and O(h) recursion space.",
    code: "DFS(node, pathMaximum)\ncount node when node.value >= pathMaximum\nrecurse with max(pathMaximum, node.value)",
    run({ tree }, step) {
      const root = makeTree(tree);
      let count = 0;
      function visit(node, maximum) {
        if (!node) return;
        const good = node.value >= maximum;
        if (good) count++;
        step(good ? "This node qualifies" : "An ancestor is larger", `Node ${node.value} compares with path maximum ${maximum === -Infinity ? "none" : maximum}.`, treeView(root, [node], { count, pathMaximum: maximum === -Infinity ? "none" : maximum }), 1);
        maximum = Math.max(maximum, node.value);
        visit(node.left, maximum); visit(node.right, maximum);
      }
      visit(root, -Infinity);
      return count;
    }
  },
  {
    id: 437, cases: [[{ tree: [3, 1, 4, 2, null, -1, 1], target: 3 }, 3], [{ tree: [1, 1, 1], target: 2 }, 2]],
    goal: "Count downward paths that sum to the target; a path may start below the root.",
    idea: "A current prefix minus an earlier active-path prefix equals the sum between them. Undo counts when returning.",
    trap: "Keeping prefix counts from a completed sibling branch creates paths that do not exist.", cost: "O(n) expected time and O(h) active prefix/recursion space.",
    code: "prefixCounts[0] = 1\nat node: sum += value; answer += prefixCounts[sum-target]\nadd sum; recurse into children\nremove sum when returning",
    run({ tree, target }, step) {
      const root = makeTree(tree), counts = new Map([[0, 1]]);
      let answer = 0;
      function visit(node, sum) {
        if (!node) return;
        sum += node.value;
        const added = counts.get(sum - target) ?? 0;
        answer += added;
        counts.set(sum, (counts.get(sum) ?? 0) + 1);
        step("Match active prefixes", `Prefix ${sum} needs an earlier prefix ${sum - target}; ${added} paths end here.`, { ...treeView(root, [node], { sum, target, answer }), arrays: { prefixes: [...counts].map(([value, count]) => `${value}: ${count}`) } }, 1);
        visit(node.left, sum); visit(node.right, sum);
        counts.set(sum, counts.get(sum) - 1);
        step("Leave this branch", `Remove prefix ${sum} from the active path before exploring another branch.`, treeView(root, [node], { answer }), 3);
      }
      visit(root, 0);
      return answer;
    }
  },
  {
    id: 1372, cases: [[{ tree: [1, null, 2, 3, null, null, 4] }, 3], [{ tree: [7] }, 0]],
    goal: "Find the longest path whose left and right edge directions alternate.",
    idea: "At each node, a left edge extends the parent's right-ending path, and a right edge extends its left-ending path.",
    trap: "Zigzag length counts edges, not nodes.", cost: "O(n) time and O(h) recursion space.",
    code: "DFS(node, leftLength, rightLength)\nupdate best\nvisit left child with (rightLength + 1, 0)\nvisit right child with (0, leftLength + 1)",
    run({ tree }, step) {
      const root = makeTree(tree);
      let best = 0;
      function visit(node, left, right) {
        if (!node) return;
        best = Math.max(best, left, right);
        step("Alternate the incoming direction", `At ${node.value}, left-ending length is ${left}, right-ending length is ${right}.`, treeView(root, [node], { left, right, best }), 1);
        visit(node.left, right + 1, 0); visit(node.right, 0, left + 1);
      }
      visit(root, 0, 0);
      return best;
    }
  },
  {
    id: 236, cases: [[{ tree: [6, 2, 9, 1, 4, 8, 10], p: 1, q: 4 }, 2], [{ tree: [6, 2, 9, 1, 4, 8, 10], p: 6, q: 8 }, 6]],
    goal: "Find the lowest tree node whose subtree contains both target nodes.",
    idea: "A subtree returns a target or ancestor candidate. A node receiving candidates from both children is the meeting point.",
    trap: "One target may itself be the ancestor of the other; do not require two separate child branches.", cost: "O(n) time and O(h) recursion space.",
    code: "if node is null or a target: return node\nleft = search(node.left); right = search(node.right)\nif both exist: return node\nreturn the nonempty candidate",
    run({ tree, p, q }, step) {
      const root = makeTree(tree);
      function visit(node) {
        if (!node) return null;
        if (node.value === p || node.value === q) {
          step("Return a target", `${node.value} is one of the requested nodes.`, treeView(root, [node], { p, q })); return node;
        }
        const left = visit(node.left), right = visit(node.right);
        const candidate = left && right ? node : left ?? right;
        step("Combine child candidates", `Node ${node.value} returns ${candidate?.value ?? "no candidate"}.`, treeView(root, [node], { left: left?.value ?? "none", right: right?.value ?? "none" }), 2);
        return candidate;
      }
      return visit(root)?.value ?? null;
    }
  },
  {
    id: 199, cases: [[{ tree: [5, 2, 8, null, 3, 7, 9] }, [5, 8, 9]], [{ tree: [] }, []]],
    goal: "Record the value visible furthest to the right on each tree level.",
    idea: "A left-to-right breadth-first level ends at the rightmost visible node.",
    trap: "Following only right child links misses levels where only a left subtree continues.", cost: "O(n) time and O(w) frontier space.",
    code: "frontier = [root]\nfor each level: record frontier.last.value\nbuild the next frontier left to right",
    run({ tree }, step) {
      const root = makeTree(tree), output = [];
      let frontier = root ? [root] : [];
      while (frontier.length) {
        output.push(frontier.at(-1).value);
        step("Look from the right", `The rightmost value on this level is ${frontier.at(-1).value}.`, { ...treeView(root, frontier), arrays: { visible: output } }, 1);
        frontier = frontier.flatMap((node) => [node.left, node.right].filter(Boolean));
      }
      return output;
    }
  },
  {
    id: 1161, cases: [[{ tree: [4, 3, 7, -2, 1, 2, 3] }, 2], [{ tree: [-7, -9, -2] }, 1]],
    goal: "Find the earliest one-based level with the greatest sum of values.",
    idea: "Sum one BFS frontier at a time; update the winner only on a strictly larger sum.",
    trap: "Starting the best sum at zero breaks trees whose level sums are all negative.", cost: "O(n) time and O(w) frontier space.",
    code: "bestSum = negative infinity; level = 1\nsum the current frontier\nif sum > bestSum: save this level\nadvance to the next frontier",
    run({ tree }, step) {
      const root = makeTree(tree);
      let frontier = root ? [root] : [], level = 1, bestSum = -Infinity, bestLevel = 0;
      while (frontier.length) {
        const sum = frontier.reduce((total, node) => total + node.value, 0);
        if (sum > bestSum) { bestSum = sum; bestLevel = level; }
        step("Sum a level", `Level ${level} has sum ${sum}; the earliest best level is ${bestLevel}.`, treeView(root, frontier, { level, sum, bestSum, bestLevel }), 1);
        frontier = frontier.flatMap((node) => [node.left, node.right].filter(Boolean)); level++;
      }
      return bestLevel;
    }
  },
  {
    id: 700, cases: [[{ tree: [6, 3, 9, 1, 5], target: 3 }, [3, 1, 5]], [{ tree: [6, 3, 9], target: 8 }, []]],
    goal: "Find a value in a binary search tree and return the subtree rooted there.",
    idea: "The ordering invariant chooses exactly one child: smaller targets go left, larger targets go right.",
    trap: "Scanning both subtrees discards the BST's useful ordering.", cost: "O(h) search time and O(1) iterative solver space; subtree serialization is display work.",
    code: "while node:\n  if value == target: return node\n  choose left if target is smaller, otherwise right\nreturn null",
    run({ tree, target }, step) {
      const root = makeTree(tree);
      let node = root;
      while (node) {
        step("Use the ordering rule", `Compare target ${target} with ${node.value}.`, treeView(root, [node], { target }), 1);
        if (node.value === target) return serializeTree(node);
        node = target < node.value ? node.left : node.right;
      }
      return [];
    }
  },
  {
    id: 450, cases: [[{ tree: [6, 3, 9, 1, 5, 8, 10], key: 6 }, [8, 3, 9, 1, 5, null, 10]], [{ tree: [3], key: 3 }, []]],
    goal: "Delete a BST value while preserving the order of all remaining nodes.",
    idea: "A node with two children can take its right subtree's minimum value, then remove that successor.",
    trap: "Dropping a two-child node without reconnecting its subtrees loses values.", cost: "O(h) time and O(h) recursive solver space.",
    code: "search for key using BST ordering\nif one child is absent: return the other\notherwise copy the inorder successor\nremove that successor from the right subtree",
    run({ tree, key }, step) {
      let root = makeTree(tree);
      function remove(node, target) {
        if (!node) return null;
        step("Find the node to remove", `Compare ${target} with ${node.value}.`, treeView(root, [node], { key: target }));
        if (target < node.value) node.left = remove(node.left, target);
        else if (target > node.value) node.right = remove(node.right, target);
        else {
          if (!node.left) return node.right;
          if (!node.right) return node.left;
          let successor = node.right;
          while (successor.left) successor = successor.left;
          node.value = successor.value;
          step("Use the inorder successor", `Replace the value with ${successor.value}, the smallest value on the right.`, treeView(root, [node, successor]), 2);
          node.right = remove(node.right, successor.value);
        }
        return node;
      }
      root = remove(root, key);
      step("Reconnect the ordered tree", "Every surviving left subtree remains smaller than its parent.", treeView(root), 3);
      return serializeTree(root);
    }
  },
  {
    id: 841, cases: [[{ rooms: [[1, 2], [3], [], []] }, true], [{ rooms: [[1], [], []] }, false]],
    goal: "Start in room zero and use discovered keys to reach every room.",
    idea: "A visited set prevents repeated work while a DFS stack carries newly reachable rooms.",
    trap: "Possessing a key somewhere does not help until its room is reachable.", cost: "O(V + E) time and O(V + E) space for this stack-based walkthrough.",
    code: "stack = [0]; visited = empty\npop a room; skip if visited\nmark visited; push its keys\nreturn visited.size == room count",
    run({ rooms }, step) {
      const edges = rooms.flatMap((keys, room) => keys.map((key) => [room, key]));
      const stack = [0], visited = new Set();
      while (stack.length) {
        const room = stack.pop();
        if (visited.has(room)) continue;
        visited.add(room); stack.push(...rooms[room]);
        step("Unlock a reachable room", `Room ${room} contributes keys ${rooms[room].join(", ") || "none"}.`, { ...graphView(rooms.length, edges, [room]), arrays: { visited: [...visited], stack } }, 2);
      }
      return visited.size === rooms.length;
    }
  },
  {
    id: 547, cases: [[{ grid: [[1, 1, 0], [1, 1, 0], [0, 0, 1]] }, 2], [{ grid: [[1]] }, 1]],
    goal: "Count groups of cities connected directly or through other cities.",
    idea: "Each DFS launched from an unvisited city discovers exactly one connected component.",
    trap: "Counting direct roads is not the same as counting connected groups.", cost: "O(n²) time for an adjacency matrix and O(n) space.",
    code: "for each unvisited city:\n  provinces++\n  DFS all connected, unvisited neighbors",
    run({ grid }, step) {
      const visited = new Set();
      let provinces = 0;
      for (let city = 0; city < grid.length; city++) {
        if (visited.has(city)) continue;
        provinces++;
        visited.add(city);
        const stack = [city];
        while (stack.length) {
          const current = stack.pop();
          grid[current].forEach((connected, neighbor) => {
            if (connected && !visited.has(neighbor)) { visited.add(neighbor); stack.push(neighbor); }
          });
          step("Grow one province", `City ${current} belongs to province ${provinces}.`, { grid, activeGrid: [[current, current]], arrays: { visited: [...visited], stack }, vars: { provinces } }, 2);
        }
      }
      return provinces;
    }
  },
  {
    id: 1466, cases: [[{ n: 5, edges: [[0, 1], [2, 1], [2, 3], [4, 3]] }, 2], [{ n: 2, edges: [[1, 0]] }, 0]],
    goal: "Reverse the fewest roads in a tree-shaped road network so every city can reach city zero.",
    idea: "Traverse undirected connections outward from zero; an original edge pointing outward must be reversed.",
    trap: "Traversal direction is not the same as the original road direction.", cost: "O(n) time and O(n) space.",
    code: "store each road in both traversal directions with a reversal flag\nDFS from city 0\ncount flagged edges used to reach unvisited cities",
    run({ n, edges }, step) {
      const adjacency = Array.from({ length: n }, () => []);
      edges.forEach(([a, b]) => { adjacency[a].push([b, 1]); adjacency[b].push([a, 0]); });
      const visited = new Set([0]), stack = [0];
      let changes = 0;
      while (stack.length) {
        const city = stack.pop();
        for (const [neighbor, reverse] of adjacency[city]) if (!visited.has(neighbor)) {
          visited.add(neighbor); changes += reverse; stack.push(neighbor);
          step(reverse ? "Reverse an outward road" : "Keep an inward road", `The connection from ${neighbor} toward ${city} ${reverse ? "needs reversal" : "already points toward zero"}.`, graphView(n, edges, [city, neighbor], { changes }), 2);
        }
      }
      return changes;
    }
  },
  {
    id: 399, cases: [[{ equations: [["a", "b"], ["b", "c"]], values: [2, 3], queries: [["a", "c"], ["c", "a"], ["x", "x"]] }, [6, 1 / 6, -1]], [{ equations: [["u", "v"]], values: [4], queries: [["u", "u"], ["v", "u"]] }, [1, .25]]],
    goal: "Answer division queries using known ratios and chains of related variables.",
    idea: "Each ratio is a weighted edge; reversing it uses its reciprocal. Multiply along a reachable path.",
    trap: "An unknown variable divided by itself is still unknown, not automatically one.", cost: "O(V + E) per query and O(V + E) graph space.",
    code: "add a→b with weight value, b→a with reciprocal\nfor each query, DFS with a running product\nreturn -1 if either variable is unknown or no path exists",
    run({ equations, values, queries }, step) {
      const adjacency = new Map();
      equations.forEach(([a, b], i) => {
        if (!adjacency.has(a)) adjacency.set(a, []);
        if (!adjacency.has(b)) adjacency.set(b, []);
        adjacency.get(a).push([b, values[i]]); adjacency.get(b).push([a, 1 / values[i]]);
      });
      const graph = { nodes: [...adjacency.keys()].map((id) => ({ id, label: id })), edges: equations };
      return queries.map(([from, to]) => {
        if (!adjacency.has(from) || !adjacency.has(to)) { step("Unknown variable", `Cannot establish ${from}/${to}.`, { graph, vars: { query: `${from}/${to}`, result: -1 } }, 2); return -1; }
        const stack = [[from, 1]], visited = new Set();
        while (stack.length) {
          const [node, product] = stack.pop();
          if (visited.has(node)) continue;
          visited.add(node);
          step("Carry a ratio along the path", `${from}/${node} = ${product}.`, { graph, activeNodes: [node], vars: { query: `${from}/${to}`, product } }, 1);
          if (node === to) return product;
          for (const [neighbor, weight] of adjacency.get(node)) stack.push([neighbor, product * weight]);
        }
        return -1;
      });
    }
  },
  {
    id: 1926, cases: [[{ grid: [["+", "+", "."], [".", ".", "."], ["+", "+", "+"]], entrance: [1, 1] }, 1], [{ grid: [["+", ".", "+"], ["+", "+", "+"]], entrance: [0, 1] }, -1]],
    goal: "Find the fewest steps from the entrance to another open boundary cell.",
    idea: "BFS explores distance layers; mark cells when enqueuing so the first exit found is nearest.",
    trap: "The entrance itself does not count as an exit, even on the boundary.", cost: "O(rows × columns) time and space.",
    code: "queue the entrance at distance 0; mark visited\npop a cell; return distance for a different boundary exit\nenqueue each unvisited open neighbor",
    run({ grid, entrance }, step) {
      const queue = [[...entrance, 0]], seen = new Set([entrance.join(",")]);
      for (let head = 0; head < queue.length; head++) {
        const [row, col, distance] = queue[head];
        step("Explore a distance layer", `Cell (${row}, ${col}) is ${distance} steps from the entrance.`, { grid, activeGrid: [[row, col]], vars: { distance }, arrays: { queue: queue.slice(head + 1).map(([r, c]) => `${r},${c}`) } }, 1);
        if (distance > 0 && (row === 0 || col === 0 || row === grid.length - 1 || col === grid[0].length - 1)) return distance;
        for (const [r, c] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) {
          const key = `${r},${c}`;
          if (grid[r]?.[c] === "." && !seen.has(key)) { seen.add(key); queue.push([r, c, distance + 1]); }
        }
      }
      return -1;
    }
  },
  {
    id: 994, cases: [[{ grid: [[2, 1, 0], [0, 1, 1]] }, 3], [{ grid: [[1, 0, 2]] }, -1]],
    goal: "Spread rot from every initially rotten orange and measure when all reachable fresh oranges have changed.",
    idea: "A multi-source queue carries times; all initially rotten cells start at minute zero.",
    trap: "Spreading from only one source can overestimate time or miss reachable cells.", cost: "O(rows × columns) time and space.",
    code: "enqueue all rotten cells at minute 0; count fresh\nfor each queued cell: infect fresh neighbors at minute + 1\nreturn last minute if no fresh remain, otherwise -1",
    run({ grid }, step) {
      const queue = [];
      let fresh = 0, minute = 0;
      grid.forEach((row, r) => row.forEach((value, c) => { if (value === 2) queue.push([r, c, 0]); if (value === 1) fresh++; }));
      for (let head = 0; head < queue.length; head++) {
        const [row, col, time] = queue[head];
        minute = Math.max(minute, time);
        for (const [r, c] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) if (grid[r]?.[c] === 1) {
          grid[r][c] = 2; fresh--; queue.push([r, c, time + 1]);
          step("Spread to a fresh neighbor", `Cell (${r}, ${c}) rots at minute ${time + 1}.`, { grid, activeGrid: [[r, c]], vars: { minute: time + 1, fresh } }, 1);
        }
      }
      step("Check for isolated fresh fruit", `${fresh} fresh oranges remain.`, { grid, vars: { minute, fresh } }, 2);
      return fresh ? -1 : minute;
    }
  }
];
