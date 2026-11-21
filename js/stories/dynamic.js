function trieNode(prefix = "") { return { prefix, children: new Map(), end: false, suggestions: [] }; }
function trieView(root, active = "", vars = {}) {
  const nodes = [], edges = [];
  function visit(node) {
    const id = `prefix:${node.prefix}`;
    nodes.push({ id, label: node.prefix ? `${node.prefix.at(-1)}${node.end ? " (word)" : ""}` : "root" });
    for (const child of node.children.values()) { edges.push([id, `prefix:${child.prefix}`]); visit(child); }
  }
  visit(root);
  return { graph: { nodes, edges }, activeNodes: [`prefix:${active}`], vars };
}

export const dynamicStories = [
  {
    id: 17, cases: [[{ digits: "27" }, ["ap", "aq", "ar", "as", "bp", "bq", "br", "bs", "cp", "cq", "cr", "cs"]], [{ digits: "" }, []]],
    goal: "Generate every letter string represented by a sequence of phone keypad digits.",
    idea: "Choose one letter for each digit, recurse, then undo that choice before trying the next.",
    trap: "Seven and nine each map to four letters, not three.", cost: "O(d × 4^d) output-sensitive time and O(d) recursion space, excluding results.",
    code: "if all digits are used: save the current word\nfor each letter mapped by the current digit:\n  choose letter; recurse; undo choice",
    run({ digits }, step) {
      const map = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };
      const path = [], output = [];
      if (!digits) return output;
      function visit(index) {
        if (index === digits.length) {
          output.push(path.join(""));
          step("Save a complete word", `${path.join("")} uses exactly one letter per digit.`, { arrays: { digits: [...digits], choices: path, words: output } }); return;
        }
        for (const letter of map[digits[index]]) {
          path.push(letter);
          step("Choose a letter", `Digit ${digits[index]} contributes ${letter}.`, { arrays: { digits: [...digits], choices: path }, active: { digits: [index] } }, 1);
          visit(index + 1);
          path.pop();
          step("Undo and try another branch", `Return to the prefix ${path.join("") || "empty"}.`, { arrays: { choices: path }, vars: { completed: output.length } }, 2);
        }
      }
      visit(0);
      return output;
    }
  },
  {
    id: 216, cases: [[{ k: 3, target: 9 }, [[1, 2, 6], [1, 3, 5], [2, 3, 4]]], [{ k: 2, target: 3 }, [[1, 2]]]],
    goal: "Choose exactly k distinct digits from one through nine that add to the target.",
    idea: "Choose digits in increasing order to avoid duplicates; prune when the count or remaining sum cannot fit.",
    trap: "Reusing a digit or returning fewer than k digits violates the constraints.", cost: "O(k × 2^9) upper-bound enumeration time with pruning; O(k) path space.",
    code: "search(nextDigit, remainingSum, path)\nif path has k digits: save only when remainingSum == 0\nchoose each larger feasible digit; recurse; undo",
    run({ k, target }, step) {
      const path = [], output = [];
      function visit(start, remaining) {
        if (path.length === k) {
          if (remaining === 0) { output.push([...path]); step("Save a valid combination", `${path.join(" + ")} = ${target}.`, { arrays: { choices: path, solutions: output.map((row) => row.join("+")) } }, 1); }
          return;
        }
        for (let value = start; value <= 9 && value <= remaining; value++) {
          if (9 - value + 1 < k - path.length) break;
          path.push(value);
          step("Choose an unused digit", `Choose ${value}; remaining sum ${remaining - value}.`, { arrays: { choices: path }, vars: { remaining: remaining - value, slots: k - path.length } }, 2);
          visit(value + 1, remaining - value);
          path.pop();
          step("Undo the choice", "The next branch starts with the previous path, not the completed branch.", { arrays: { choices: path }, vars: { remaining } }, 2);
        }
      }
      visit(1, target);
      return output;
    }
  },
  {
    id: 1137, cases: [[{ n: 5 }, 7], [{ n: 0 }, 0]],
    goal: "Build the nth Tribonacci value from the three previous values, starting with 0, 1, 1.",
    idea: "Only the latest three terms are needed to compute the next term.",
    trap: "Using two earlier terms computes Fibonacci, not Tribonacci.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "a = 0; b = 1; c = 1\nrepeat for indexes 3 through n:\n  (a, b, c) = (b, c, a+b+c)\nreturn the appropriate base or c",
    run({ n }, step) {
      if (n < 3) return [0, 1, 1][n];
      let a = 0, b = 1, c = 1;
      for (let i = 3; i <= n; i++) {
        const next = a + b + c;
        step("Combine three earlier terms", `Term ${i}: ${a} + ${b} + ${c} = ${next}.`, { arrays: { earlier: [a, b, c] }, vars: { index: i, next } }, 2);
        [a, b, c] = [b, c, next];
      }
      return c;
    }
  },
  {
    id: 746, cases: [[{ costs: [8, 3, 7, 2] }, 5], [{ costs: [5, 2] }, 2]],
    goal: "Reach the position beyond the last stair, paying each stair you step from, with one- or two-step moves.",
    idea: "The cost to arrive at position i is the cheaper of arriving from i−1 or i−2 and paying that earlier stair.",
    trap: "You may start at stair zero or one; neither arrival initially costs anything.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "previousTwo = previousOne = 0\nfor i from 2 through cost.length:\n  next = min(previousOne + cost[i-1], previousTwo + cost[i-2])\n  shift the two earlier answers",
    run({ costs }, step) {
      let two = 0, one = 0;
      for (let i = 2; i <= costs.length; i++) {
        const viaOne = one + costs[i - 1], viaTwo = two + costs[i - 2], next = Math.min(viaOne, viaTwo);
        step("Choose the cheaper arrival", `Position ${i} costs min(${viaOne}, ${viaTwo}) = ${next}.`, { arrays: { costs }, active: { costs: [i - 1, i - 2] }, vars: { position: i, viaOne, viaTwo, next } }, 2);
        [two, one] = [one, next];
      }
      return one;
    }
  },
  {
    id: 198, cases: [[{ nums: [4, 1, 7, 3] }, 11], [{ nums: [5] }, 5]],
    goal: "Choose the most valuable houses without choosing adjacent houses.",
    idea: "For each house, compare skipping it with taking it plus the best answer two positions earlier.",
    trap: "Always choosing the locally larger adjacent house can block a better overall choice.", cost: "O(n) time and O(1) auxiliary solver space.",
    code: "twoBack = oneBack = 0\nfor value:\n  next = max(oneBack, twoBack + value)\n  shift earlier answers",
    run({ nums }, step) {
      let two = 0, one = 0;
      nums.forEach((value, i) => {
        const take = two + value, skip = one, next = Math.max(take, skip);
        step("Take or skip this house", `At index ${i}, take gives ${take}; skip gives ${skip}.`, { arrays: { houses: nums }, active: { houses: [i] }, vars: { take, skip, best: next } }, 2);
        [two, one] = [one, next];
      });
      return one;
    }
  },
  {
    id: 790, cases: [[{ n: 4 }, 11], [{ n: 1 }, 1]],
    goal: "Count tilings of a two-row board using dominoes and L-shaped trominoes, including their rotations.",
    idea: "Accounting for both complete and gapped boundaries yields F(n) = 2F(n−1) + F(n−3), with bases 1, 1, 2.",
    trap: "Using only domino placements misses tilings whose gaps are closed by trominoes.", cost: "O(n) time and O(n) DP space in this walkthrough; counts use modulus 1,000,000,007.",
    code: "F[0] = 1; F[1] = 1; F[2] = 2\nfor i >= 3:\n  F[i] = (2*F[i-1] + F[i-3]) mod 1000000007",
    run({ n }, step) {
      const dp = [1, 1, 2], mod = 1000000007;
      step("Start from small boards", "Width zero has one empty tiling; widths one and two have one and two tilings.", { arrays: { tilings: dp.slice(0, Math.min(3, n + 1)) } });
      for (let i = 3; i <= n; i++) {
        dp[i] = (2 * dp[i - 1] + dp[i - 3]) % mod;
        step("Include closed gap arrangements", `Width ${i}: 2 × ${dp[i - 1]} + ${dp[i - 3]} = ${dp[i]} modulo ${mod}.`, { arrays: { tilings: dp }, active: { tilings: [i, i - 1, i - 3] }, vars: { width: i } }, 2);
      }
      return dp[n];
    }
  },
  {
    id: 62, cases: [[{ rows: 3, cols: 4 }, 10], [{ rows: 1, cols: 4 }, 1]],
    goal: "Count routes from the top-left to the bottom-right of a grid, moving only right or down.",
    idea: "Every route into a cell arrives from above or from the left; add those disjoint counts.",
    trap: "Diagonal moves are not permitted and must not contribute to the count.", cost: "O(rows × columns) time and table space.",
    code: "paths[0][0] = 1\nfor each other cell:\n  paths[row][col] = paths from above + paths from left",
    run({ rows, cols }, step) {
      const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
      dp[0][0] = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (r || c) dp[r][c] = (dp[r - 1]?.[c] ?? 0) + (dp[r][c - 1] ?? 0);
        step("Count arrivals at a cell", `Cell (${r}, ${c}) has ${dp[r][c]} routes from the start.`, { grid: dp, activeGrid: [[r, c]], vars: { row: r, column: c } }, 2);
      }
      return dp[rows - 1][cols - 1];
    }
  },
  {
    id: 1143, cases: [[{ a: "stone", b: "tone" }, 4], [{ a: "ab", b: "cd" }, 0]],
    goal: "Find the length of the longest sequence that appears in both strings in order, allowing gaps.",
    idea: "Matching final characters extend a smaller prefix answer; otherwise take the better answer after dropping one final character.",
    trap: "A subsequence need not be contiguous, unlike a substring.", cost: "O(mn) time and O(mn) table space.",
    code: "start with a zero border in the DP table\nif a[i-1] == b[j-1]: dp[i][j] = 1 + dp[i-1][j-1]\nelse: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
    run({ a, b }, step) {
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
        const match = a[i - 1] === b[j - 1];
        dp[i][j] = match ? 1 + dp[i - 1][j - 1] : Math.max(dp[i - 1][j], dp[i][j - 1]);
        step(match ? "Extend a shared sequence" : "Keep the better prefix", `Prefixes ${a.slice(0, i)} and ${b.slice(0, j)} share length ${dp[i][j]}.`, { grid: dp, activeGrid: [[i, j]], arrays: { "row letters": [...a], "column letters": [...b] } }, match ? 1 : 2);
      }
      return dp[a.length][b.length];
    }
  },
  {
    id: 714, cases: [[{ prices: [2, 5, 3, 8, 4, 9], fee: 2 }, 7], [{ prices: [4, 3, 2], fee: 1 }, 0]],
    goal: "Maximize trading profit when each sale pays a fee and only one share may be held at once.",
    idea: "Track the best cash while holding and not holding a share; compute both next states from the previous states.",
    trap: "Subtracting the fee on both purchase and sale charges it twice.", cost: "O(n) time and O(1) space.",
    code: "cash = 0; hold = -first price\nnextCash = max(cash, hold + price - fee)\nnextHold = max(hold, cash - price)\nupdate both; return cash",
    run({ prices, fee }, step) {
      let cash = 0, hold = -prices[0];
      for (let i = 1; i < prices.length; i++) {
        const nextCash = Math.max(cash, hold + prices[i] - fee), nextHold = Math.max(hold, cash - prices[i]);
        step("Compare buying, selling, and waiting", `Price ${prices[i]} gives cash ${nextCash} or held-share balance ${nextHold}.`, { arrays: { prices }, active: { prices: [i] }, vars: { cash: nextCash, hold: nextHold, fee } }, 1);
        cash = nextCash; hold = nextHold;
      }
      return cash;
    }
  },
  {
    id: 72, cases: [[{ a: "cart", b: "cat" }, 1], [{ a: "", b: "hi" }, 2]],
    goal: "Transform one word into another with the fewest insertions, deletions, and replacements.",
    idea: "A DP cell stores the cost for two prefixes; equal characters cost nothing, otherwise choose the cheapest of three edits.",
    trap: "Different lengths do not imply that only insertions or deletions are needed.", cost: "O(mn) time and O(mn) table space.",
    code: "initialize borders with insertion/deletion counts\nif characters match: copy diagonal\nelse: 1 + min(delete above, insert left, replace diagonal)",
    run({ a, b }, step) {
      const dp = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
      step("Price the empty-prefix edits", "Building from empty needs insertions; reducing to empty needs deletions.", { grid: dp });
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
        const match = a[i - 1] === b[j - 1];
        dp[i][j] = match ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        step(match ? "Keep a matching character" : "Choose the cheapest edit", `Transform ${a.slice(0, i)} into ${b.slice(0, j)} with ${dp[i][j]} edits.`, { grid: dp, activeGrid: [[i, j]], arrays: { source: [...a], target: [...b] } }, match ? 1 : 2);
      }
      return dp[a.length][b.length];
    }
  },
  {
    id: 338, cases: [[{ n: 5 }, [0, 1, 1, 2, 1, 2]], [{ n: 0 }, [0]]],
    goal: "Count set bits in every integer from zero through n.",
    idea: "Removing the lowest bit leaves floor(i/2), whose count is already known; add the removed bit.",
    trap: "A number's value is not its count of one bits.", cost: "O(n) time and O(n) output space.",
    code: "bits[0] = 0\nfor i from 1 through n:\n  bits[i] = bits[floor(i/2)] + (i % 2)",
    run({ n }, step) {
      const bits = [0];
      for (let i = 1; i <= n; i++) {
        bits[i] = bits[Math.floor(i / 2)] + i % 2;
        step("Reuse the shorter binary prefix", `${i.toString(2)} has ${bits[i]} set bits.`, { arrays: { counts: bits }, active: { counts: [i, Math.floor(i / 2)] }, vars: { number: i, binary: i.toString(2) } }, 2);
      }
      return bits;
    }
  },
  {
    id: 136, cases: [[{ nums: [6, 2, 6, 8, 2] }, 8], [{ nums: [-3, -3, 7] }, 7]],
    goal: "Find the one value that occurs once when every other value occurs exactly twice.",
    idea: "XOR is order-independent; equal pairs cancel and zero leaves the remaining value unchanged.",
    trap: "This cancellation rule does not solve arbitrary occurrence-count patterns.", cost: "O(n) time and O(1) space for 32-bit integer values.",
    code: "answer = 0\nfor value: answer = answer XOR value\nreturn answer",
    run({ nums }, step) {
      let answer = 0;
      nums.forEach((value, i) => {
        const previous = answer; answer ^= value;
        step("Cancel paired bits", `${previous} XOR ${value} = ${answer}.`, { arrays: { input: nums }, active: { input: [i] }, vars: { answer, binary: (answer >>> 0).toString(2) } }, 1);
      });
      return answer;
    }
  },
  {
    id: 1318, cases: [[{ a: 5, b: 2, c: 1 }, 2], [{ a: 0, b: 0, c: 7 }, 3]],
    goal: "Flip the fewest input bits so a OR b equals c.",
    idea: "Handle each bit independently: a target zero clears every input one; a target one needs a flip only if both inputs are zero.",
    trap: "When both inputs have one and the target is zero, two flips are required.", cost: "O(log maximum value) time and O(1) space.",
    code: "for each bit of a, b, c:\n  if target bit is 0: add both input bits\n  else if both input bits are 0: add 1",
    run({ a, b, c }, step) {
      let flips = 0, position = 0;
      while (a || b || c) {
        const x = a % 2, y = b % 2, target = c % 2, added = target ? Number(!x && !y) : x + y;
        flips += added;
        step("Repair one bit position", `Bit ${position}: ${x} OR ${y} must equal ${target}; add ${added} flips.`, { arrays: { "input bits": [x, y], target: [target] }, vars: { position, flips } }, target ? 2 : 1);
        a = Math.floor(a / 2); b = Math.floor(b / 2); c = Math.floor(c / 2); position++;
      }
      return flips;
    }
  },
  {
    id: 208, cases: [[{ operations: [["insert", "tea"], ["search", "te"], ["startsWith", "te"], ["insert", "te"], ["search", "te"]] }, [null, false, true, null, true]], [{ operations: [["insert", ""], ["search", ""]] }, [null, true]]],
    goal: "Store words and distinguish complete-word lookup from prefix lookup.",
    idea: "Character edges share prefixes; a separate word-end marker distinguishes a word from an unfinished prefix.",
    trap: "A path existing for a prefix does not imply that prefix was inserted as a complete word.", cost: "O(word length) per operation and O(total inserted characters) space.",
    code: "insert: create missing character edges; mark the final node\nsearch: follow edges and require a word-end marker\nstartsWith: follow edges without requiring a word-end marker",
    run({ operations }, step) {
      const root = trieNode(), output = [];
      for (const [operation, word] of operations) {
        let node = root, exists = true;
        for (const character of word) {
          if (!node.children.has(character)) {
            if (operation === "insert") node.children.set(character, trieNode(node.prefix + character));
            else { exists = false; break; }
          }
          node = node.children.get(character);
          step("Follow a character edge", `${operation}: reach prefix ${node.prefix}.`, trieView(root, node.prefix, { operation, word }));
        }
        if (operation === "insert") node.end = true;
        const result = operation === "insert" ? null : exists && (operation === "startsWith" || node.end);
        output.push(result);
        step("Check the word boundary", `${operation}(${word || "empty"}) returns ${result === null ? "no value" : result}.`, { ...trieView(root, node.prefix), arrays: { results: output } }, operation === "search" ? 1 : 2);
      }
      return output;
    }
  },
  {
    id: 1268, cases: [[{ products: ["bag", "bat", "box", "book"], word: "bo" }, [["bag", "bat", "book"], ["book", "box"]]], [{ products: ["a"], word: "z" }, [[]]]],
    goal: "After each typed character, suggest up to three lexicographically smallest products sharing that prefix.",
    idea: "Insert sorted products into a trie, caching at most three suggestions on each prefix node.",
    trap: "Suggestions must follow lexicographic order, not insertion order from an unsorted catalog.", cost: "Sorting plus O(total product characters + query length) trie work; O(total product characters) space.",
    code: "insert sorted products into a trie\ncache the first three products at each traversed prefix\nwalk each query character and read its cached suggestions",
    run({ products, word }, step) {
      const root = trieNode();
      products.sort();
      for (const product of products) {
        let node = root;
        for (const character of product) {
          if (!node.children.has(character)) node.children.set(character, trieNode(node.prefix + character));
          node = node.children.get(character);
          if (node.suggestions.length < 3) node.suggestions.push(product);
        }
        node.end = true;
        step("Index a product's prefixes", `${product} joins the sorted prefix index.`, trieView(root, product), 1);
      }
      const output = [];
      let node = root, prefix = "";
      for (const character of word) {
        prefix += character; node = node?.children.get(character);
        output.push(node ? [...node.suggestions] : []);
        step("Read suggestions for the typed prefix", `${prefix}: ${output.at(-1).join(", ") || "no matching products"}.`, { ...trieView(root, prefix), arrays: { suggestions: output.at(-1) } }, 2);
      }
      return output;
    }
  },
  {
    id: 435, cases: [[{ intervals: [[1, 4], [2, 3], [3, 5], [6, 8]] }, 1], [{ intervals: [[1, 2], [2, 3]] }, 0]],
    goal: "Remove the fewest intervals so that the remaining intervals do not overlap.",
    idea: "Keep compatible intervals in increasing end-time order; the earliest finish leaves the most room for future choices.",
    trap: "Intervals that touch at an endpoint are compatible in this problem.", cost: "O(n log n) time and sorting space.",
    code: "sort intervals by end\nkeep an interval if start >= previous kept end\notherwise increment removals",
    run({ intervals }, step) {
      intervals.sort((a, b) => a[1] - b[1]);
      let end = -Infinity, removed = 0;
      for (let i = 0; i < intervals.length; i++) {
        const [start, finish] = intervals[i], keep = start >= end;
        if (keep) end = finish; else removed++;
        step(keep ? "Keep the earliest compatible finish" : "Remove an overlap", `[${start}, ${finish}] ${keep ? "extends the schedule" : "overlaps the last kept interval"}.`, { arrays: { intervals: intervals.map((row) => `[${row.join(", ")}]`) }, active: { intervals: [i] }, vars: { end, removed } }, keep ? 1 : 2);
      }
      return removed;
    }
  },
  {
    id: 452, cases: [[{ intervals: [[1, 5], [2, 4], [6, 9], [8, 10]] }, 2], [{ intervals: [[1, 2], [2, 3]] }, 1]],
    goal: "Place the fewest arrows so every balloon interval contains an arrow position.",
    idea: "Sort by ending position and place an arrow at the earliest uncovered end; it also covers every interval containing that point.",
    trap: "Unlike non-overlapping intervals, balloons touching an arrow endpoint are burst by that arrow.", cost: "O(n log n) time and sorting space.",
    code: "sort balloons by end\nif start > current arrow: place arrow at this end\notherwise reuse the current arrow",
    run({ intervals }, step) {
      intervals.sort((a, b) => a[1] - b[1]);
      let arrow = null, count = 0;
      for (let i = 0; i < intervals.length; i++) {
        const [start, end] = intervals[i], place = arrow === null || start > arrow;
        if (place) { arrow = end; count++; }
        step(place ? "Place a new arrow" : "Reuse the arrow", `Balloon [${start}, ${end}] is covered at ${arrow}.`, { arrays: { balloons: intervals.map((row) => `[${row.join(", ")}]`) }, active: { balloons: [i] }, vars: { arrow, count } }, place ? 1 : 2);
      }
      return count;
    }
  },
  {
    id: 739, cases: [[{ nums: [60, 63, 61, 65] }, [1, 2, 1, 0]], [{ nums: [70, 70] }, [0, 0]]],
    goal: "For each day, count the days until a strictly warmer temperature, or zero if none arrives.",
    idea: "A decreasing stack of unresolved indexes lets a new warmer day answer several earlier days at once.",
    trap: "An equal temperature does not resolve a waiting day.", cost: "O(n) amortized time and O(n) space.",
    code: "for day i:\n  while stack top is cooler: answer[top] = i - pop()\n  push i",
    run({ nums }, step) {
      const stack = [], output = Array(nums.length).fill(0);
      nums.forEach((temperature, i) => {
        while (stack.length && nums[stack.at(-1)] < temperature) {
          const previous = stack.pop(); output[previous] = i - previous;
          step("Answer an earlier waiting day", `Day ${previous} waits ${i - previous} days for ${temperature}.`, { arrays: { temperatures: nums, waits: output, stack }, active: { temperatures: [previous, i], waits: [previous] } }, 1);
        }
        stack.push(i);
        step("Keep unresolved days", "Stack temperatures decrease or stay equal from bottom to top.", { arrays: { temperatures: nums, stack }, active: { temperatures: [i] } }, 2);
      });
      return output;
    }
  },
  {
    id: 901, cases: [[{ prices: [80, 70, 75, 75, 90] }, [1, 1, 2, 3, 5]], [{ prices: [5, 5] }, [1, 2]]],
    goal: "For each price, count consecutive days ending today whose prices are no greater than today's.",
    idea: "A decreasing stack stores a price with its absorbed span; pop nonhigher prices and add their spans.",
    trap: "Equal prices are included in a span and must be absorbed.", cost: "O(n) amortized total time and O(n) space.",
    code: "span = 1\nwhile stack.top.price <= price: span += pop().span\npush (price, span); return span",
    run({ prices }, step) {
      const stack = [], output = [];
      prices.forEach((price, i) => {
        let span = 1;
        while (stack.length && stack.at(-1)[0] <= price) {
          const [previous, days] = stack.pop(); span += days;
          step("Absorb an earlier block", `Price ${previous} contributes its whole ${days}-day span.`, { arrays: { prices, stack: stack.map(([p, s]) => `${p}: ${s} days`) }, active: { prices: [i] }, vars: { price, span } }, 1);
        }
        stack.push([price, span]); output.push(span);
        step("Save today's combined span", `${price} covers ${span} consecutive days.`, { arrays: { prices, spans: output, stack: stack.map(([p, s]) => `${p}: ${s} days`) }, active: { prices: [i] } }, 2);
      });
      return output;
    }
  }
];
