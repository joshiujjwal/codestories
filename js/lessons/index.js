import { maxAverageLesson, buildMaxAverageTrace, validateMaxAverageInput } from "./max-average.js";
import { imageFeedLesson, buildImageFeedTrace } from "./image-feed.js";
import { moveZeroesLesson, buildMoveZeroesTrace, validateMoveZeroesInput } from "./move-zeroes.js";
import { maxDepthLesson, buildMaxDepthTrace } from "./max-depth.js";
import { storyLessons } from "../stories/index.js";
import { storyTitles } from "../story-titles.js";

export const lessons = {
  ...storyLessons,
  [maxAverageLesson.id]: {
    ...maxAverageLesson, storyTitle: storyTitles[643], track: "algorithm", renderer: "window", supports3D: true,
    story: {
      problem: "Choose a contiguous range of exactly k values with the largest average. Picking separated values is a different problem.",
      move: "Every candidate has the same divisor, so compare sums. Slide by removing the departing value and adding the arriving value.",
      watch: "Initialize the best sum from a real window; starting at zero breaks all-negative inputs."
    },
    examples: [maxAverageLesson.warmup, maxAverageLesson.canonical, maxAverageLesson.review],
    build: ({ nums, k }) => buildMaxAverageTrace(nums, k), validate: validateMaxAverageInput,
    lines: ["let sum = nums.slice(0, k).reduce((a, b) => a + b, 0);", "let best = sum;", "for (let i = k; i < nums.length; i++) {", "  sum = sum - nums[i - k] + nums[i];", "  best = Math.max(best, sum);", "}", "return best / k;"],
    complexity: "Solver: O(n) time, O(1) auxiliary space. Visual snapshots store array state separately."
  },
  [moveZeroesLesson.id]: {
    ...moveZeroesLesson, storyTitle: storyTitles[283], track: "algorithm", renderer: "move", supports3D: false,
    story: {
      problem: "Move zeros behind the nonzero values without changing the nonzeros' relative order.",
      move: "Read finds the next nonzero; write marks its destination. After compaction, fill the unfinished suffix with zeros.",
      watch: "The temporary suffix can contain old values. Only the retained prefix is final until zero filling completes."
    },
    build: ({ nums }) => buildMoveZeroesTrace(nums), validate: validateMoveZeroesInput,
    lines: ["let write = 0;", "for (const value of nums) {", "  if (value !== 0) nums[write++] = value;", "}", "for (let i = write; i < nums.length; i++) nums[i] = 0;"],
    complexity: "Solver: O(n) time, O(1) auxiliary space; mutates the input. Teaching snapshots copy the array."
  },
  [maxDepthLesson.id]: {
    ...maxDepthLesson, storyTitle: storyTitles[104], track: "algorithm", renderer: "tree", supports3D: false,
    story: {
      problem: "Measure the longest root-to-leaf path in nodes. An empty tree has no nodes and depth zero.",
      move: "Each node waits for both child depths, takes the larger one, then adds one for itself.",
      watch: "Do not confuse node-count depth with edge-count depth; a single-node tree has depth one here."
    },
    build: ({ tree }) => buildMaxDepthTrace(tree),
    lines: ["function depth(node) {", "  if (!node) return 0;", "  const left = depth(node.left);", "  return 1 + Math.max(left, depth(node.right));", "}"],
    complexity: "Solver: O(n) time, O(h) recursion space. Trace and diagram data require additional storage."
  },
  [imageFeedLesson.id]: {
    ...imageFeedLesson, storyTitle: storyTitles[imageFeedLesson.id], track: "system", renderer: "system", supports3D: true,
    story: {
      problem: "A reader wants an image feed. The feed's metadata and the image bytes live in different stores.",
      move: "A metadata cache hit avoids a database read; a CDN hit avoids fetching image bytes from object storage.",
      watch: "Caches are fast copies, not durable sources of truth. This walkthrough assumes the durable stores stay healthy."
    },
    warmup: { metadata: "miss", media: "miss", label: "Cache miss" },
    examples: [
      { metadata: "miss", media: "miss", label: "Cache miss" },
      { metadata: "hit", media: "hit", label: "Both caches hit" },
      { metadata: "unavailable", media: "miss", label: "Metadata cache unavailable" }
    ],
    build: buildImageFeedTrace,
    lines: ["metadata = cache.lookup(feed);", "if (!metadata) metadata = timelineDB.read(feed);", "images = CDN.fetch(metadata.imageReferences);"],
    complexity: "A deterministic route illustration, not a traffic simulator. Durable stores are assumed healthy."
  }
};
