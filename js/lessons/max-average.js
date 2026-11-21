export const maxAverageLesson = {
  id: "max-average-643",
  title: "Maximum Average Subarray I",
  pattern: "Sliding Window",
  outcome: "Predict each fixed-window update and solve a fresh contiguous-range example.",
  warmup: { nums: [2, 4, 6, 8], k: 2, label: "Warm-up" },
  canonical: { nums: [1, 12, -5, -6, 50, 3], k: 4, label: "LeetCode 643 example" },
  review: { nums: [4, -2, 1, 6, -3], k: 2, label: "Fresh review" },
  cards: [
    ["What is a fixed window?", "A contiguous group with an exact, unchanged length k."],
    ["What leaves when a window slides?", "The leftmost old value."],
    ["What enters when a window slides?", "The next value immediately right of the window."],
    ["Why compare sums here?", "Each window has the same k, so the biggest sum has the biggest average."],
    ["What is the invariant?", "Every completed window contains exactly k adjacent values."],
    ["What is the optimized complexity?", "O(n) time and O(1) auxiliary solver space."]
  ],
  questions: [
    { prompt: "What makes a window contiguous?", choices: ["Its values are adjacent in the array.", "It contains the largest values."], answer: 0, explanation: "A subarray is a consecutive slice. Picking separated large values creates a different problem." },
    { prompt: "When [2, 4] becomes [4, 6], what update is correct?", choices: ["6 - 2 + 6", "6 - 4 + 6"], answer: 0, explanation: "The leftmost old value leaves; the overlapping 4 remains counted once." },
    { prompt: "Why can this lesson compare sums instead of averages?", choices: ["Every candidate has the same divisor k.", "Sums are always larger than averages."], answer: 0, explanation: "With a fixed k, dividing every sum by the same positive number preserves their order." },
    { prompt: "For [4, -2, 1, 6, -3], k = 2, which range wins?", choices: ["Indexes 2..3, average 3.5", "Indexes 0..1, average 1"], answer: 0, explanation: "The window [1, 6] has sum 7 and average 3.5." }
  ]
};

export function validateMaxAverageInput(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0) return { error: "Enter at least one number." };
  if (nums.length > 12) return { error: "The visualizer accepts at most 12 integers." };
  if (!nums.every((value) => Number.isInteger(value) && value >= -10000 && value <= 10000)) {
    return { error: "Use integers between -10000 and 10000." };
  }
  if (!Number.isInteger(k) || k < 1 || k > nums.length) {
    return { error: "Window size k must be between 1 and the number of values." };
  }
  return { value: { nums: [...nums], k } };
}

export function buildMaxAverageTrace(nums, k) {
  const valid = validateMaxAverageInput(nums, k);
  if (valid.error) throw new Error(valid.error);
  const values = valid.value.nums;
  const windows = [];
  let sum = values.slice(0, k).reduce((total, value) => total + value, 0);
  let bestSum = sum;
  let bestStart = 0;

  windows.push({ start: 0, end: k - 1, sum, average: sum / k, outgoing: null, incoming: null, bestSum, bestStart });
  for (let start = 1; start <= values.length - k; start += 1) {
    const outgoing = values[start - 1];
    const incoming = values[start + k - 1];
    sum = sum - outgoing + incoming;
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = start;
    }
    windows.push({ start, end: start + k - 1, sum, average: sum / k, outgoing, incoming, bestSum, bestStart });
  }

  const snapshots = windows.map((window, index) => ({
    id: `window-${index}`,
    phase: index === 0 ? "Initialize the first complete window" : "Slide one value out and one value in",
    summary: index === 0
      ? `The first ${k} values sum to ${window.sum}.`
      : `${window.sum + window.outgoing - window.incoming} − ${window.outgoing} + ${window.incoming} = ${window.sum}.`,
    state: { values, k, ...window },
    code: index === 0 ? "sum = first window" : "sum = sum - outgoing + incoming"
  }));
  snapshots.push({
    id: "result",
    phase: "Return the winning average",
    summary: `The best range is ${bestStart}..${bestStart + k - 1}. Its sum ${bestSum} divided by ${k} gives average ${bestSum / k}.`,
    state: { values, k, ...windows[bestStart] },
    code: "return bestSum / k",
    line: 6
  });

  return {
    windows,
    snapshots,
    result: { bestSum, average: bestSum / k, range: [bestStart, bestStart + k - 1] }
  };
}
