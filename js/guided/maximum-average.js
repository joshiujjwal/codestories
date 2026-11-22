import { frame, prediction, guidedTrace } from "./model.js";

const proof = {
  invariant: "The running sum contains exactly the k values inside the current window.",
  reason: "Remove only the departing value and add only the arriving value. The overlap stays counted once. Every possible start position is visited.",
  time: "Build the first sum in k additions. Then make n − k constant-size updates: O(k + n − k) = O(n).",
  space: "Only the current sum, best sum, and indexes are needed: O(1) auxiliary space. No list of all window sums is needed by the solver.",
  narration: "The overlap does not change. Subtract the one value that leaves, and add the one that enters. Now the sum describes exactly the new window. We visit every possible start position, keeping the best sum. One initial sum and constant work per shift give linear time. Keeping just sums and indexes gives constant extra space."
};

export const windowGuide = {
  subtitle: "Keep the overlap. Change only the edges.",
  objective: "Update one window without recounting its shared values.",
  extraExamples: [
    { nums: [-8, -3, -5], k: 2, label: "All-negative windows" },
    { nums: [4, -2, 1], k: 3, label: "Only one possible window" }
  ],
  proof,
  decorate(trace, input) {
    const snapshots = [];
    trace.snapshots.forEach((source, index) => {
      const state = source.state;
      const done = source.id === "result";
      const guide = {
        kind: "window", ...state, done,
        equation: done ? `best sum ${state.bestSum} / ${input.k} values = ${trace.result.average}`
          : index === 0 ? `${input.nums.slice(0, input.k).join(" + ")} = ${state.sum}`
          : `${trace.snapshots[index - 1].state.sum} − (${state.outgoing}) + (${state.incoming}) = ${state.sum}`
      };
      const current = frame(source,
        done ? "Keep the best complete window" : index === 0 ? `Start with ${input.k} neighbors` : "Only two values change membership",
        done ? `Indexes ${trace.result.range.join("..")} give average ${trace.result.average}. All candidates used the same divisor.`
          : index === 0 ? `The first complete sum is ${state.sum}. Set best to this real sum, even when it is negative.`
          : `${state.outgoing} leaves on the left; ${state.incoming} enters on the right. ${input.k === 1 ? "There is no overlap in a one-value window." : input.k === 2 ? "The overlapping value stays counted once." : `The ${input.k - 1} overlapping values stay counted once.`}`,
        guide, { chapter: index === 0 ? "Set up" : "Run" });
      snapshots.push(current);
      if (index === 0 && trace.windows.length > 1) snapshots.push(prediction(current, {
        prompt: "Slide the window one place to the right. Which update keeps the overlap counted once?",
        choices: [
          "Add the arriving value; keep the entire old sum.",
          "Subtract the departing value; add the arriving value.",
          "Sort the values; keep the largest k of them."
        ],
        answer: 1,
        feedback: [
          "That leaves the departing value in the sum and grows the group to k + 1 values.",
          "Yes. The shared values are already in the sum. Only the two edges change.",
          "Sorting destroys adjacency. A subarray must be a consecutive slice of the original input."
        ],
        explanation: "A sliding update preserves the window's membership, not just its size."
      }));
    });
    return guidedTrace(trace, snapshots, proof);
  },
  questions: [
    {
      prompt: "For [5, −2, 3, 8] and k = 2, what is the largest average of adjacent pairs?",
      choices: ["6.5, from 5 and 8.", "5.5, from 3 and 8.", "3.5, from all four values."],
      answer: 1,
      feedback: ["5 and 8 are not adjacent. That is not a valid window.", "The pair sums are 3, 1, and 11. The largest average is 11 / 2.", "The candidate must contain exactly two values, not the entire array."],
      explanation: "Keep both constraints: consecutive positions and exactly k values."
    },
    {
      prompt: "The window [3, −1] has sum 2. A 4 arrives, producing [−1, 4]. What is the new sum?",
      choices: ["2 − 3 + 4 = 3.", "2 − (−1) + 4 = 7.", "2 + 4 = 6."],
      answer: 0,
      feedback: ["Remove 3, the value that leaves. Keep −1 counted once.", "−1 remains inside the new window. Removing it throws away the overlap.", "The old left edge would remain counted, making the sum too large."],
      explanation: "Subtract the old left edge, not an arbitrary value from the window."
    },
    {
      prompt: "For [−8, −3, −5] and k = 2, why must best NOT start at zero?",
      choices: ["Zero represents an empty window, which is allowed.", "Negative averages should be rounded up to zero.", "Zero would beat every valid negative window."],
      answer: 2,
      feedback: ["An empty window violates k = 2.", "Rounding changes the answer. The best valid average here is −4.", "Initialize from the first complete window. The candidate sums are −11 and −8."],
      explanation: "The best answer must come from a candidate that actually exists."
    },
    {
      prompt: "How much solver work is needed after computing the first k-value sum?",
      choices: ["Re-add k values at each start: O(nk) time.", "Two edge operations per shift: O(n) total time, O(1) extra space.", "Sort the input first: O(n log n) time."],
      answer: 1,
      feedback: ["That is the repeated-work solution. The running sum reuses the overlap.", "k initial additions plus n − k constant-size shifts is linear; only a few numbers are kept.", "Sorting is unnecessary and destroys the original adjacency constraint."],
      explanation: "The speedup comes from retaining exactly the state the next window shares."
    }
  ],
  cards: [
    ["Maximum Average: what must the running sum represent?", "Exactly the k adjacent values inside the current window. A shift removes the old left edge and adds the new right edge."],
    ["Why can we compare sums instead of averages?", "Every candidate has the same positive divisor k, so dividing does not change their order."],
    ["What breaks if best starts at zero?", "All-negative inputs. Zero could win despite not being the average of any valid window."],
    ["Where does O(n) time and O(1) extra space come from?", "k additions for the first window, then n − k constant-size updates. Store sums and indexes, not all candidate windows."]
  ]
};
