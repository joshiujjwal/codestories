export class MinHeap {
  constructor(compare = (a, b) => a - b) { this.items = []; this.compare = compare; }
  get size() { return this.items.length; }
  peek() { return this.items[0]; }
  push(value) {
    this.items.push(value);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[parent], this.items[index]) <= 0) break;
      [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
      index = parent;
    }
  }
  pop() {
    if (!this.size) throw new Error("Cannot pop an empty heap.");
    const first = this.items[0], last = this.items.pop();
    if (this.size) {
      this.items[0] = last;
      let index = 0;
      while (true) {
        let smallest = index;
        for (const child of [2 * index + 1, 2 * index + 2]) {
          if (child < this.size && this.compare(this.items[child], this.items[smallest]) < 0) smallest = child;
        }
        if (smallest === index) break;
        [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
        index = smallest;
      }
    }
    return first;
  }
}

export const searchStories = [
  {
    id: 215, cases: [[{ nums: [7, 2, 9, 4, 6], k: 2 }, 7], [{ nums: [4, 4, 4], k: 2 }, 4]],
    goal: "Find the kth largest value, counting duplicates as separate positions.",
    idea: "A size-k min heap retains the largest k values; its root is the smallest retained value.",
    trap: "Removing duplicates changes the requested rank.", cost: "O(n log k) time and O(k) auxiliary space.",
    code: "for value: push into min heap\nif heap exceeds k: pop its minimum\nreturn heap minimum",
    run({ nums, k }, step) {
      const heap = new MinHeap();
      nums.forEach((value, i) => {
        heap.push(value);
        const removed = heap.size > k ? heap.pop() : null;
        step("Retain the strongest candidates", `${value} enters${removed === null ? "" : `; ${removed} is discarded`}.`, { arrays: { input: nums, "min heap": heap.items }, active: { input: [i], "min heap": [0] }, vars: { k } }, 1);
      });
      return heap.peek();
    }
  },
  {
    id: 2336, cases: [[{ operations: [["pop"], ["pop"], ["add", 1], ["pop"], ["pop"]] }, [1, 2, null, 1, 3]], [{ operations: [["add", 5], ["pop"]] }, [null, 1]]],
    goal: "Pop the smallest positive integer from an infinite set, with the option to add removed values back.",
    idea: "A counter represents the untouched infinite tail; a heap and set hold distinct smaller values added back.",
    trap: "Adding the same removed value repeatedly must not create duplicate set members.", cost: "O(log(a + 1)) per heap operation, O(a) space for added-back values.",
    code: "next = 1; addedBack = min heap plus membership set\npop heap if nonempty, otherwise return next++\nadd x only if x < next and not already added back",
    run({ operations }, step) {
      const heap = new MinHeap(), present = new Set(), output = [];
      let next = 1;
      for (const [operation, value] of operations) {
        let answer = null;
        if (operation === "pop") {
          if (heap.size) { answer = heap.pop(); present.delete(answer); } else answer = next++;
        } else if (value < next && !present.has(value)) { heap.push(value); present.add(value); }
        output.push(answer);
        step(operation === "pop" ? "Take the smallest available" : "Add a removed value back", operation === "pop" ? `Return ${answer}. The untouched tail begins at ${next}.` : `Add-back request ${value} preserves set uniqueness.`, { arrays: { "added-back heap": heap.items, results: output }, vars: { next, operation, value: value ?? "—" } }, operation === "pop" ? 1 : 2);
      }
      return output;
    }
  },
  {
    id: 2542, cases: [[{ a: [5, 2, 4], b: [3, 8, 6], k: 2 }, 36], [{ a: [2], b: [7], k: 1 }, 14]],
    goal: "Choose k indexes to maximize the sum from the first array multiplied by the minimum from the second.",
    idea: "Sweep second-array values in descending order; keep the largest k first-array values in a min heap.",
    trap: "Maximizing the sum alone ignores the multiplier imposed by the minimum.", cost: "O(n log n + n log k) time and O(n + k) space for sorted pairs and heap.",
    code: "sort pairs by second value descending\npush first value; maintain a size-k min heap and its sum\nwhen size is k: score = sum * current second value",
    run({ a, b, k }, step) {
      const pairs = a.map((value, i) => [value, b[i]]).sort((x, y) => y[1] - x[1]);
      const heap = new MinHeap();
      let sum = 0, best = 0;
      for (const [value, minimum] of pairs) {
        heap.push(value); sum += value;
        if (heap.size > k) sum -= heap.pop();
        if (heap.size === k) best = Math.max(best, sum * minimum);
        step("Lower the multiplier boundary", `At multiplier ${minimum}, the retained sum is ${sum}${heap.size === k ? ` and score is ${sum * minimum}` : "; more values are needed"}.`, { arrays: { "sorted pairs": pairs.map(([x, y]) => `${x} × ${y}`), "retained heap": heap.items }, vars: { sum, minimum, best, k } }, 2);
      }
      return best;
    }
  },
  {
    id: 2462, cases: [[{ costs: [8, 3, 6, 2, 5], k: 3, candidates: 1 }, 13], [{ costs: [4, 4, 2], k: 2, candidates: 2 }, 6]],
    goal: "Hire k workers by repeatedly choosing the cheapest eligible worker from the two ends, breaking ties by index.",
    idea: "A heap stores the two eligible boundary pools. Refill from the side of the worker just selected.",
    trap: "Overlapping boundary pools must not enqueue the same worker twice.", cost: "O((c + k) log(c + 1)) time and O(c) space, with c capped by n.",
    code: "enqueue up to candidates workers from each end, without overlap\npop by (cost, original index)\nrefill from that worker's side while unseen workers remain",
    run({ costs, k, candidates }, step) {
      const heap = new MinHeap((a, b) => a.cost - b.cost || a.index - b.index);
      let left = 0, right = costs.length - 1, total = 0;
      for (let i = 0; i < candidates && left <= right; i++) { heap.push({ cost: costs[left], index: left++, side: "left" }); }
      for (let i = 0; i < candidates && left <= right; i++) { heap.push({ cost: costs[right], index: right--, side: "right" }); }
      for (let hired = 0; hired < k; hired++) {
        const worker = heap.pop();
        total += worker.cost;
        if (left <= right) {
          const index = worker.side === "left" ? left++ : right--;
          heap.push({ cost: costs[index], index, side: worker.side });
        }
        step("Hire and refill one side", `Hire index ${worker.index} for ${worker.cost}; total ${total}.`, { arrays: { costs, "eligible heap": heap.items.map((item) => `${item.index}: ${item.cost}`) }, active: { costs: [worker.index] }, vars: { total, left, right } }, 1);
      }
      return total;
    }
  },
  {
    id: 374, cases: [[{ n: 10, secret: 7 }, 7], [{ n: 1, secret: 1 }, 1]],
    goal: "Find a hidden number using only higher/lower responses from a comparison oracle.",
    idea: "Each midpoint comparison excludes half the remaining interval. This walkthrough simulates the oracle with a preset secret.",
    trap: "A higher response refers to the secret, not to which bound should decrease.", cost: "O(log n) comparisons and O(1) space.",
    code: "low = 1; high = n\ncompare midpoint with the oracle\nraise low if secret is higher; lower high if secret is lower\nreturn on an equal response",
    run({ n, secret }, step) {
      let low = 1, high = n;
      while (low <= high) {
        const mid = low + Math.floor((high - low) / 2);
        const response = mid === secret ? "equal" : mid < secret ? "higher" : "lower";
        step("Ask the oracle", `Guess ${mid}; the oracle says ${response}.`, { vars: { low, mid, high, response } }, 1);
        if (mid === secret) return mid;
        if (mid < secret) low = mid + 1; else high = mid - 1;
      }
      throw new Error("The preset secret must be inside the search range.");
    }
  },
  {
    id: 2300, cases: [[{ spells: [2, 4], potions: [1, 3, 5, 7], success: 12 }, [1, 3]], [{ spells: [1], potions: [2, 3], success: 10 }, [0]]],
    goal: "For every spell, count potions whose product reaches the success threshold.",
    idea: "Sorted positive potions make success monotonic. Binary search for the first successful potion.",
    trap: "The threshold is inclusive: a product equal to success counts.", cost: "O(m log m + n log m) time and sorting space.",
    code: "sort potions\nfor each spell, lower-bound search for spell * potion >= success\ncount = potion length - first successful index",
    run({ spells, potions, success }, step) {
      potions.sort((a, b) => a - b);
      return spells.map((spell) => {
        let low = 0, high = potions.length;
        while (low < high) {
          const mid = Math.floor((low + high) / 2), product = spell * potions[mid];
          step("Find the first successful partner", `${spell} × ${potions[mid]} = ${product}; success requires ${success}.`, { arrays: { potions }, active: { potions: [mid] }, vars: { spell, low, mid, high } }, 1);
          if (product >= success) high = mid; else low = mid + 1;
        }
        return potions.length - low;
      });
    }
  },
  {
    id: 162, cases: [[{ nums: [1, 3, 2, 5, 4] }, 3], [{ nums: [9] }, 0]],
    goal: "Find an index strictly higher than its neighbors; outside neighbors are treated as negative infinity.",
    idea: "If midpoint rises toward its right neighbor, a peak exists on the right; otherwise one exists at or left of midpoint.",
    trap: "The array need not be sorted; binary search follows local slopes instead.", cost: "O(log n) time and O(1) space.",
    code: "low = 0; high = last\nif nums[mid] < nums[mid+1]: low = mid+1\nelse: high = mid\nreturn low",
    run({ nums }, step) {
      let low = 0, high = nums.length - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2), rising = nums[mid] < nums[mid + 1];
        step("Follow a local slope", `${nums[mid]} to ${nums[mid + 1]} ${rising ? "rises, so keep the right side" : "falls, so keep midpoint and the left side"}.`, { arrays: { heights: nums }, active: { heights: [mid, mid + 1] }, vars: { low, mid, high } }, rising ? 1 : 2);
        if (rising) low = mid + 1; else high = mid;
      }
      return low;
    }
  },
  {
    id: 875, cases: [[{ piles: [4, 9, 13], hours: 8 }, 4], [{ piles: [5], hours: 5 }, 1]],
    goal: "Find the smallest integer eating speed that finishes all piles within the hour limit.",
    idea: "At a candidate speed, sum rounded-up pile times. Feasibility is monotonic in speed.",
    trap: "Unused time in one hour cannot be transferred to a different pile in that hour.", cost: "O(n log M) time and O(1) auxiliary space, for maximum pile M.",
    code: "search speed from 1 to maximum pile\nneeded = sum(ceil(pile / speed))\nif needed <= hours: keep the slower half\nelse: require a faster speed",
    run({ piles, hours }, step) {
      let low = 1, high = Math.max(...piles);
      while (low < high) {
        const speed = Math.floor((low + high) / 2), times = piles.map((pile) => Math.ceil(pile / speed));
        const needed = times.reduce((a, b) => a + b, 0);
        step("Test a candidate speed", `Speed ${speed} needs ${needed} hours, ${needed <= hours ? "within" : "beyond"} the budget ${hours}.`, { arrays: { piles, "hours per pile": times }, vars: { low, speed, high, needed, budget: hours } }, 1);
        if (needed <= hours) high = speed; else low = speed + 1;
      }
      return low;
    }
  }
];
