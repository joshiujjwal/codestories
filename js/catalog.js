import { companyTagSource, companyTagsByProblem } from "./company-tags.js";
import { storyTitles } from "./story-titles.js";

export { companyTagSource };

const patternRows = [
  ["sliding-window", "Sliding Window", "Reuse work inside a moving contiguous range.", "A subarray or substring has a fixed length or a budget.", "Update the state when a value enters or leaves.", "For [3, 5, 2], a size-two window changes from sum 8 to sum 7.", "Noncontiguous choices need another approach."],
  ["two-pointers", "Two Pointers", "Give two positions different jobs.", "Compare two ends, match two sequences, or compact an array.", "Each move must make progress without discarding a valid answer.", "A read pointer finds values; a write pointer builds the kept prefix.", "Explain why each pointer moves; two indexes alone are not a proof."],
  ["fast-slow", "Fast & Slow Pointers", "Different speeds expose a list's structure.", "Find a linked-list middle or detect a cycle without a visited set.", "The fast pointer advances twice for each slow step.", "On a five-node chain, the slow pointer reaches the middle as fast reaches the end.", "Choose and explain which middle an even-length list uses."],
  ["intervals", "Merge Intervals", "Order ranges before reasoning about overlap.", "Meetings, ranges, or a minimum number of removals.", "Compare the next range with the boundary of the current choice.", "[1, 4] and [3, 6] overlap; [1, 4] and [5, 6] do not.", "Some interval problems select ranges rather than merge them."],
  ["cyclic-sort", "Cyclic Sort", "A value's destination can reveal missing values.", "Values lie in a dense, bounded index-like range.", "Place each eligible value at its expected index.", "With values 1 through 3, value 2 belongs at index 1.", "Duplicates and out-of-range values need explicit guards."],
  ["reversal", "In-place Reversal of a Linked List", "Change links while preserving the unvisited tail.", "Reverse a chain or a segment without a second list.", "Save next before overwriting the current link.", "A → B → C becomes C → B → A using previous/current/next.", "Relinking a list is not the same as reversing an array."],
  ["bfs", "Breadth-First Search", "Explore the nearest layer before the next.", "Tree levels or shortest paths in an unweighted graph.", "A queue contains the next frontier; mark graph nodes when enqueuing.", "Visit the root, then both children, then their children.", "Weighted shortest paths require more than ordinary BFS."],
  ["dfs", "Depth-First Search", "Finish one branch before returning to its parent.", "Subtree results, paths, components, or reachability.", "Each frame owns a node and combines its child results.", "A subtree of depth 2 under a parent contributes a depth of 3.", "Graphs need visited state; recursion space grows with depth."],
  ["two-heaps", "Two Heaps", "Maintain a boundary between two ordered halves.", "Repeated median queries while values arrive.", "Keep the halves balanced and every lower value below the upper half.", "For 2, 4, 9, the lower half and upper half meet at median 4.", "Two unrelated priority queues do not automatically use this median pattern."],
  ["subsets", "Subsets", "Build a choice set one decision at a time.", "Generate all include/exclude choices.", "Every partial choice branches into taking or skipping an item.", "For [A, B], the choices are [], [A], [B], and [A, B].", "Constrained combinations are separately tagged as backtracking."],
  ["binary-search", "Modified Binary Search", "Discard a provably impossible half.", "Sorted input, a local slope, or a monotonic feasibility test.", "The answer stays inside the surviving search bounds.", "If speed 4 is feasible and feasibility is monotonic, larger speeds are feasible too.", "Define the predicate and boundary convention before coding."],
  ["xor", "Bitwise XOR", "Equal pairs cancel without a frequency table.", "Every value appears twice except one.", "x XOR x is 0; x XOR 0 is x.", "7 XOR 3 XOR 7 leaves 3.", "General bit counting and OR constraints are not XOR cancellation."],
  ["top-k", "Top K Elements", "Keep a bounded set of the best candidates.", "Kth largest or a best-k score.", "A size-k min heap exposes the weakest retained candidate.", "Keeping the best two of 4, 9, 2 retains 4 and 9.", "An unbounded minimum queue belongs under general heap techniques."],
  ["k-way", "K-way Merge", "Choose the next head from several sorted streams.", "Merge multiple sorted lists or streams.", "The heap holds one eligible head per source.", "Merge [1, 5] and [2, 4] by repeatedly taking the smaller head.", "The input streams must each satisfy the ordering assumption."],
  ["dp", "Dynamic Programming", "Reuse smaller answers instead of recomputing them.", "Repeated subproblems, counting ways, or optimal choices.", "Define a state, base cases, and a valid dependency order.", "At a house, compare skipping it with taking it plus the best nonadjacent prefix.", "This overview is broader than the classic 0/1-knapsack pattern."],
  ["topological", "Topological Sort", "Schedule dependencies before dependents.", "Prerequisites in a directed graph.", "Process nodes with no remaining prerequisites.", "If A must precede B, A appears before B in a valid order.", "A directed cycle means a complete ordering does not exist."]
];

export const patterns = patternRows.map(([id, name, description, cue, invariant, example, caveat], order) => ({
  id, name, order, description, cue, invariant, example, caveat
}));

export const sources = [
  { name: "Designed to Scale · Dilum Sanjaya", role: "Visual and interaction inspiration", url: "https://designed-to-scale.vercel.app/#/" },
  { name: "DesignGurus · Arslan Ahmad", role: "LeetCode 75 catalog and pattern reference", url: "https://www.designgurus.io/blog/leetcode-75" },
  { name: "DesignGurus pattern guide", role: "Supplemental pattern reference; current guide covers 20 patterns", url: "https://www.designgurus.io/blog/top-lc-patterns" },
  { name: "LeetCode", role: "Original problems and official LeetCode 75 study plan", url: "https://leetcode.com/studyplan/leetcode-75/" },
  { name: "NeetCode", role: "Supplemental Blind 75 videos — a different problem list", url: "https://www.youtube.com/playlist?list=PLot-Xpze53ldVwtstag2TL4HQhAnC8ATf" },
  { name: companyTagSource.name, role: "Historical company associations from public community CSVs; not verified current interview lists", url: companyTagSource.url },
  { name: "IES · Organizing Instruction and Study", role: "Learning-design reference: spaced review, retrieval, worked examples, and explanatory questions", url: "https://ies.ed.gov/ncee/wwc/PracticeGuide/1" }
];

// Source topics are retained even when the selected solving approach changes placement.
const groups = [
  ["Array / String", [
    [1768, "Merge Strings Alternately", "merge-strings-alternately", "Easy", "two-pointers", "Advance through each string and append its next character in turn."],
    [1071, "Greatest Common Divisor of Strings", "greatest-common-divisor-of-strings", "Easy", "additional", "Check concatenation compatibility, then use the greatest common divisor of the lengths.", "String arithmetic"],
    [1431, "Kids With the Greatest Number of Candies", "kids-with-the-greatest-number-of-candies", "Easy", "additional", "Compare each child's possible total with the current maximum.", "Array scan"],
    [605, "Can Place Flowers", "can-place-flowers", "Easy", "additional", "Scan for empty plots whose neighbors allow a placement.", "Greedy"],
    [345, "Reverse Vowels of a String", "reverse-vowels-of-a-string", "Easy", "two-pointers", "Find vowels from both ends and exchange the matched pair."],
    [151, "Reverse Words in a String", "reverse-words-in-a-string", "Medium", "additional", "Separate words from whitespace and rebuild them in reverse order.", "String processing"],
    [238, "Product of Array Except Self", "product-of-array-except-self", "Medium", "additional", "Combine products accumulated on either side of each position.", "Prefix / suffix"],
    [334, "Increasing Triplet Subsequence", "increasing-triplet-subsequence", "Medium", "additional", "Track the smallest first and second candidates until a larger third value arrives.", "Greedy"],
    [443, "String Compression", "string-compression", "Medium", "two-pointers", "Read equal-character runs and write their compact representation."]
  ]],
  ["Two Pointers", [
    [283, "Move Zeroes", "move-zeroes", "Easy", "two-pointers", "Compact nonzero values in order, then fill the unused suffix with zero."],
    [392, "Is Subsequence", "is-subsequence", "Easy", "two-pointers", "Advance the smaller sequence only when the current characters match."],
    [11, "Container With Most Water", "container-with-most-water", "Medium", "two-pointers", "Move the shorter boundary after measuring the current container."],
    [1679, "Max Number of K-Sum Pairs", "max-number-of-k-sum-pairs", "Medium", "two-pointers", "Sort and compare the sum at the two ends with the target.", "Sorting"]
  ]],
  ["Sliding Window", [
    [643, "Maximum Average Subarray I", "maximum-average-subarray-i", "Easy", "sliding-window", "Reuse the overlap between consecutive windows of the same size."],
    [1456, "Maximum Number of Vowels in a Substring of Given Length", "maximum-number-of-vowels-in-a-substring-of-given-length", "Medium", "sliding-window", "Update a vowel count as a fixed-length substring moves."],
    [1004, "Max Consecutive Ones III", "max-consecutive-ones-iii", "Medium", "sliding-window", "Keep a range whose zero count fits the allowed replacement budget."],
    [1493, "Longest Subarray of 1's After Deleting One Element", "longest-subarray-of-1s-after-deleting-one-element", "Medium", "sliding-window", "Allow at most one zero in the window and account for the required deletion."]
  ]],
  ["Prefix Sum", [
    [1732, "Find the Highest Altitude", "find-the-highest-altitude", "Easy", "additional", "Accumulate changes and remember the greatest running altitude.", "Prefix accumulation"],
    [724, "Find Pivot Index", "find-pivot-index", "Easy", "additional", "Compare the sum before an index with the remaining sum after it.", "Prefix accumulation"]
  ]],
  ["Hash Map / Set", [
    [2215, "Find the Difference of Two Arrays", "find-the-difference-of-two-arrays", "Easy", "additional", "Use sets to identify values present on just one side.", "Hash set"],
    [1207, "Unique Number of Occurrences", "unique-number-of-occurrences", "Easy", "additional", "Count values and check whether any two frequencies are equal.", "Frequency map"],
    [1657, "Determine if Two Strings Are Close", "determine-if-two-strings-are-close", "Medium", "additional", "Compare character membership and the collection of frequencies.", "Frequency map"],
    [2352, "Equal Row and Column Pairs", "equal-row-and-column-pairs", "Medium", "additional", "Count row signatures and look up matching column signatures.", "Hash map"]
  ]],
  ["Stack", [
    [2390, "Removing Stars From a String", "removing-stars-from-a-string", "Medium", "additional", "Maintain the retained characters and remove the latest on a star.", "Stack"],
    [735, "Asteroid Collision", "asteroid-collision", "Medium", "additional", "Resolve a new left-moving asteroid against the surviving right-moving stack top.", "Stack"],
    [394, "Decode String", "decode-string", "Medium", "additional", "Save nested counts and prefixes until their closing brackets arrive.", "Stack"]
  ]],
  ["Queue", [
    [933, "Number of Recent Calls", "number-of-recent-calls", "Easy", "additional", "Discard timestamps outside the recent interval and count those remaining.", "Queue"],
    [649, "Dota2 Senate", "dota2-senate", "Medium", "additional", "Compare the next eligible senator from each side and requeue the survivor.", "Queue / simulation"]
  ]],
  ["Linked List", [
    [2095, "Delete the Middle Node of a Linked List", "delete-the-middle-node-of-a-linked-list", "Medium", "fast-slow", "Find the middle while keeping the preceding link available."],
    [328, "Odd Even Linked List", "odd-even-linked-list", "Medium", "additional", "Build chains for odd and even positions, then connect them.", "Linked-list relinking"],
    [206, "Reverse Linked List", "reverse-linked-list", "Easy", "reversal", "Save the next node, reverse the current link, and advance."],
    [2130, "Maximum Twin Sum of a Linked List", "maximum-twin-sum-of-a-linked-list", "Medium", "fast-slow", "Find the midpoint, reverse one half, and compare mirrored pair sums.", "In-place reversal"]
  ]],
  ["Binary Tree / DFS", [
    [104, "Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "Easy", "dfs", "Return one plus the deeper child depth, with zero for an empty subtree."],
    [872, "Leaf-Similar Trees", "leaf-similar-trees", "Easy", "dfs", "Collect each tree's leaves in traversal order and compare the sequences."],
    [1448, "Count Good Nodes in Binary Tree", "count-good-nodes-in-binary-tree", "Medium", "dfs", "Carry the largest value on the current root-to-node path."],
    [437, "Path Sum III", "path-sum-iii", "Medium", "dfs", "Track prefix-sum frequencies along the active path.", "Prefix sums", "Hash map"],
    [1372, "Longest ZigZag Path in a Binary Tree", "longest-zigzag-path-in-a-binary-tree", "Medium", "dfs", "Track alternating directions and restart the length when a direction repeats."],
    [236, "Lowest Common Ancestor of a Binary Tree", "lowest-common-ancestor-of-a-binary-tree", "Medium", "dfs", "Combine whether each child subtree contains a target."]
  ]],
  ["Binary Tree / BFS", [
    [199, "Binary Tree Right Side View", "binary-tree-right-side-view", "Medium", "bfs", "Visit one level at a time and retain its rightmost visible value."],
    [1161, "Maximum Level Sum of a Binary Tree", "maximum-level-sum-of-a-binary-tree", "Medium", "bfs", "Sum each frontier and remember the earliest best level."]
  ]],
  ["Binary Search Tree", [
    [700, "Search in a Binary Search Tree", "search-in-a-binary-search-tree", "Easy", "additional", "Use the ordering invariant to choose one child at each comparison.", "BST search"],
    [450, "Delete Node in a BST", "delete-node-in-a-bst", "Medium", "additional", "Remove a matching node while preserving its children's ordering.", "BST relinking"]
  ]],
  ["Graphs / DFS", [
    [841, "Keys and Rooms", "keys-and-rooms", "Medium", "dfs", "Explore reachable rooms using the keys collected so far."],
    [547, "Number of Provinces", "number-of-provinces", "Medium", "dfs", "Start a traversal at every unvisited city to count components.", "Union find alternative"],
    [1466, "Reorder Routes to Make All Paths Lead to the City Zero", "reorder-routes-to-make-all-paths-lead-to-the-city-zero", "Medium", "dfs", "Traverse undirected connections while counting edges oriented away from zero."],
    [399, "Evaluate Division", "evaluate-division", "Medium", "dfs", "Multiply edge ratios along a path in a weighted relationship graph."]
  ]],
  ["Graphs / BFS", [
    [1926, "Nearest Exit from Entrance in Maze", "nearest-exit-from-entrance-in-maze", "Medium", "bfs", "Explore outward until a reachable border cell other than the entrance is found."],
    [994, "Rotting Oranges", "rotting-oranges", "Medium", "bfs", "Expand all rotten sources together, counting the elapsed frontiers."]
  ]],
  ["Heap / Priority Queue", [
    [215, "Kth Largest Element in an Array", "kth-largest-element-in-an-array", "Medium", "top-k", "Keep the largest k candidates with the weakest retained value at the heap root."],
    [2336, "Smallest Number in Infinite Set", "smallest-number-in-infinite-set", "Medium", "additional", "Combine the next untouched integer with ordered values added back.", "Min heap"],
    [2542, "Maximum Subsequence Score", "maximum-subsequence-score", "Medium", "top-k", "Sweep ordered multipliers while retaining a best-k sum.", "Sorting"],
    [2462, "Total Cost to Hire K Workers", "total-cost-to-hire-k-workers", "Medium", "additional", "Choose the cheapest eligible candidate across the two boundary pools.", "Priority queues"]
  ]],
  ["Binary Search", [
    [374, "Guess Number Higher or Lower", "guess-number-higher-or-lower", "Easy", "binary-search", "Use each comparison to narrow the hidden number's interval."],
    [2300, "Successful Pairs of Spells and Potions", "successful-pairs-of-spells-and-potions", "Medium", "binary-search", "Locate the first sorted potion that reaches the success threshold."],
    [162, "Find Peak Element", "find-peak-element", "Medium", "binary-search", "Follow a rising local slope while narrowing the candidate interval."],
    [875, "Koko Eating Bananas", "koko-eating-bananas", "Medium", "binary-search", "Search the smallest speed whose total time fits the limit."]
  ]],
  ["Backtracking", [
    [17, "Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Medium", "additional", "Choose one mapped letter per digit, then undo and try another.", "Backtracking"],
    [216, "Combination Sum III", "combination-sum-iii", "Medium", "additional", "Explore increasing digit choices while respecting the sum and count.", "Backtracking"]
  ]],
  ["1D Dynamic Programming", [
    [1137, "N-th Tribonacci Number", "n-th-tribonacci-number", "Easy", "dp", "Carry the three earlier terms needed for the next value."],
    [746, "Min Cost Climbing Stairs", "min-cost-climbing-stairs", "Easy", "dp", "Compute the cheaper way to arrive at each step."],
    [198, "House Robber", "house-robber", "Medium", "dp", "Compare skipping the current house with taking it after a nonadjacent prefix."],
    [790, "Domino and Tromino Tiling", "domino-and-tromino-tiling", "Medium", "dp", "Track complete and partial board boundaries as columns are filled."]
  ]],
  ["Multidimensional Dynamic Programming", [
    [62, "Unique Paths", "unique-paths", "Medium", "dp", "Combine the counts arriving from the allowed neighboring cells."],
    [1143, "Longest Common Subsequence", "longest-common-subsequence", "Medium", "dp", "Combine shorter prefix answers, extending when the current characters match."],
    [714, "Best Time to Buy and Sell Stock with Transaction Fee", "best-time-to-buy-and-sell-stock-with-transaction-fee", "Medium", "dp", "Track the best totals while holding and not holding a share."],
    [72, "Edit Distance", "edit-distance", "Medium", "dp", "Choose the cheapest prefix transformation through insertion, deletion, or replacement."]
  ]],
  ["Bit Manipulation", [
    [338, "Counting Bits", "counting-bits", "Easy", "dp", "Reuse the bit count of half the number and add its lowest bit.", "Bit operations"],
    [136, "Single Number", "single-number", "Easy", "xor", "Cancel equal pairs with XOR to isolate the unpaired value."],
    [1318, "Minimum Flips to Make a OR b Equal to c", "minimum-flips-to-make-a-or-b-equal-to-c", "Medium", "additional", "Inspect each bit position and count the changes needed by the OR constraint.", "Bit operations"]
  ]],
  ["Trie", [
    [208, "Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "Medium", "additional", "Represent character prefixes with child links and separate word-end markers.", "Trie"],
    [1268, "Search Suggestions System", "search-suggestions-system", "Medium", "additional", "Walk product prefixes to collect a bounded set of matching suggestions.", "Trie", "Binary search alternative"]
  ]],
  ["Intervals", [
    [435, "Non-overlapping Intervals", "non-overlapping-intervals", "Medium", "intervals", "Choose early-ending compatible ranges to minimize removals.", "Greedy"],
    [452, "Minimum Number of Arrows to Burst Balloons", "minimum-number-of-arrows-to-burst-balloons", "Medium", "intervals", "Group intersecting ranges around a shared endpoint.", "Greedy"]
  ]],
  ["Monotonic Stack", [
    [739, "Daily Temperatures", "daily-temperatures", "Medium", "additional", "Resolve waiting indexes when a warmer temperature arrives.", "Monotonic stack"],
    [901, "Online Stock Span", "online-stock-span", "Medium", "additional", "Absorb earlier nonhigher prices together with their stored spans.", "Monotonic stack"]
  ]]
];

const lessonIds = { 643: "max-average-643", 283: "move-zeroes-283", 104: "max-depth-104" };
export const problems = groups.flatMap(([topic, rows]) => rows.map(([id, title, slug, difficulty, patternId, summary, ...tags]) => ({
  id, title, storyTitle: storyTitles[id], slug, difficulty, patternId, summary, topic, tags, companies: companyTagsByProblem[id],
  url: `https://leetcode.com/problems/${slug}/`,
  lessonId: lessonIds[id] ?? `story-${id}`
})));

export const topics = groups.map(([topic]) => topic);
export const companies = [...new Set(problems.flatMap((problem) => problem.companies))].sort((a, b) => a.localeCompare(b));

export function companyEvidenceUrl(company) {
  return `${companyTagSource.evidenceBaseUrl}${encodeURIComponent(company)}/5.%20All.csv`;
}

export const additionalPattern = {
  id: "additional", name: "Additional techniques", order: 16,
  description: "Useful approaches that do not fit the classic 16 without stretching their meaning.",
  cue: "Prefix totals, membership, nested state, greedy decisions, or specialized structures.",
  invariant: "Name the actual technique rather than forcing a familiar pattern.",
  example: "A character stack handles undo; a trie handles shared prefixes.",
  caveat: "These problems remain part of the same LeetCode 75 catalog."
};

export function relatedPatterns(topic = "") {
  const ids = new Set(problems.filter((problem) => !topic || problem.topic === topic).map((problem) => problem.patternId));
  return [...patterns, additionalPattern].filter((pattern) => !topic || ids.has(pattern.id));
}

export function resolveTopicPattern(topic, patternId = "") {
  const related = relatedPatterns(topic);
  if (related.some((pattern) => pattern.id === patternId)) return patternId;
  return topic && related.length === 1 ? related[0].id : "";
}

export function filterProblems({ query = "", difficulty = "", animated = false, patternId = "", topic = "", company = "" } = {}) {
  const term = query.trim().toLowerCase();
  return problems.filter((problem) =>
    (!term || `${problem.id} ${problem.title} ${problem.storyTitle} ${problem.topic} ${problem.tags.join(" ")} ${problem.companies.join(" ")} ${[...patterns, additionalPattern].find((pattern) => pattern.id === problem.patternId).name}`.toLowerCase().includes(term)) &&
    (!difficulty || problem.difficulty === difficulty) &&
    (!animated || problem.lessonId !== null) &&
    (!patternId || problem.patternId === patternId) &&
    (!topic || problem.topic === topic) &&
    (!company || problem.companies.includes(company))
  );
}
