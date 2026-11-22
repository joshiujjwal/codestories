import { frame, prediction, guidedTrace } from "./model.js";

const proof = {
  invariant: "oneBack is the best total for the previous prefix; twoBack is the best total for the prefix before that.",
  reason: "Every valid choice either skips today's house or takes it. Taking it excludes the neighbor, so combine today's value with twoBack, not oneBack. Choose the larger total.",
  time: "Each of n houses makes one addition, one comparison, and a fixed number of assignments: O(n). No subsets are enumerated.",
  space: "The next decision needs only two earlier totals: O(1) auxiliary space. Prefix totals drawn under the houses are teaching history, not a required solver table.",
  narration: "Any valid solution either takes the current house or skips it. Taking it rules out the neighbor, so use the best total from two positions back. Skipping keeps the previous best total. Comparing those two possibilities covers every valid choice. Each house takes constant work, so total time is linear. Only two earlier totals are needed when returning the amount, so extra space is constant."
};

export const robberGuide = {
  subtitle: "Choose between two prefixes, not two neighbors.",
  objective: "Understand the take/skip recurrence and why a local greedy choice fails.",
  examples: [
    { nums: [4, 5, 4], label: "The greedy trap" },
    { nums: [5], label: "One house" },
    { nums: [2, 7, 9, 3, 1], label: "A longer street" },
    { nums: [0, 0, 0], label: "All values are zero" }
  ],
  proof,
  decorate(trace, input) {
    const history = [];
    const start = frame(trace.snapshots[0], "No neighboring houses",
      "Choosing the largest house is tempting. Instead, keep the best total for each prefix and decide whether to take or skip the next house.",
      { kind: "robber", values: input.nums, day: -1, twoBack: 0, oneBack: 0, history: [], best: 0, pending: true }, { chapter: "Set up" });
    const snapshots = [start];
    let last = start;
    for (const source of trace.snapshots.slice(1, -1)) {
      const day = source.state.active.houses[0];
      const { take, skip, best } = source.state.vars;
      const guide = { kind: "robber", values: input.nums, day, twoBack: take - input.nums[day], oneBack: skip, take, skip, best, history: [...history] };
      if (day === 2) snapshots.push(prediction(
        frame(source, "Two earlier answers are available", "", guide),
        {
          prompt: "If we TAKE the current house, which earlier total can we safely add?",
          choices: ["oneBack: the best total through the neighbor.", "twoBack: the best total before the neighbor.", "Neither: taking a house discards every earlier choice."],
          answer: 1,
          feedback: [
            "oneBack may include the adjacent house. Adding both could violate the rule.",
            "Right. That prefix ends before the neighbor, so it cannot contain an adjacent chosen house.",
            "Earlier nonadjacent houses remain eligible. Their best total is already summarized by twoBack."
          ],
          explanation: "TAKE = twoBack + value. SKIP = oneBack. Keep the larger of the two."
        },
        { ...guide, pending: true }
      ));
      history.push(best);
      last = frame(source,
        take > skip ? `Taking house ${day} wins` : take < skip ? `Skipping house ${day} wins` : `Either choice gives ${best}`,
        `Take: ${guide.twoBack} + ${input.nums[day]} = ${take}. Skip: ${skip}. Store ${best} as the new best prefix total.`,
        { ...guide, history: [...history] }, { chapter: "Run" });
      snapshots.push(last);
    }
    snapshots.push(frame(trace.snapshots.at(-1), "The best total need not include the last house",
      `Return ${trace.result}. Each decision compared complete valid prefixes, not just the values of adjacent houses.`,
      { ...last.guide, done: true, result: trace.result }, { chapter: "Result" }));
    return guidedTrace(trace, snapshots, proof);
  },
  questions: [
    {
      prompt: "For the street [3, 4, 3], what is the largest total without taking neighbors?",
      choices: ["4, by taking the largest house.", "7, by taking a 3 and its neighbor 4.", "6, by taking the first and last houses."],
      answer: 2,
      feedback: ["A local maximum is not necessarily the best combination. The two outer houses total 6.", "Those houses are adjacent, so that total is invalid.", "The outer houses are not adjacent. Together they beat the middle house."],
      explanation: "The greedy choice of the larger neighbor can block a better combined choice."
    },
    {
      prompt: "Before a house worth 6, twoBack = 8 and oneBack = 9. What is the new best total?",
      choices: ["15 = 9 + 6.", "14 = max(9, 8 + 6).", "9 = max(9, 6)."],
      answer: 1,
      feedback: ["The total 9 may include the adjacent house. Adding 6 is not necessarily safe.", "Taking gives 14 from the nonadjacent prefix; skipping keeps 9.", "Taking today's house can retain earlier nonadjacent choices, not just today's value."],
      explanation: "Compare the best valid take branch against the best valid skip branch."
    },
    {
      prompt: "After computing best = max(oneBack, twoBack + value), how do the summaries advance?",
      choices: ["twoBack gets old oneBack; oneBack gets best.", "Set both summaries to best.", "Discard both summaries and start at zero."],
      answer: 0,
      feedback: ["Correct. Each name must describe the proper prefix before the next house.", "Then the next take branch could include an adjacent house through the wrong prefix.", "That loses useful solved subproblems and reduces the search to isolated houses."],
      explanation: "Keep the old oneBack before replacing it. The two summaries have different jobs."
    },
    {
      prompt: "This version returns only the maximum amount. What storage does its recurrence require?",
      choices: ["A table of all O(n²) house pairs.", "Two prefix totals: O(1) extra space, with O(n) time.", "All subsets: O(2^n) extra space."],
      answer: 1,
      feedback: ["No pair table is needed; each choice depends on two prior prefixes.", "One constant-sized update per house, keeping only the two totals needed by the next step.", "The recurrence summarizes alternatives rather than enumerating them."],
      explanation: "Reconstructing the chosen houses is a different output requirement and may use additional history."
    }
  ],
  cards: [
    ["House Robber: what are the two branches at house i?", "Skip it: keep the best prefix through i − 1. Take it: add its value to the best prefix through i − 2."],
    ["Why can't taking the current house use oneBack?", "oneBack may already include its neighbor. twoBack ends before that neighbor, making the combination valid."],
    ["Why does 'take the largest neighbor' fail on [4, 5, 4]?", "The middle 5 blocks both outer houses. Taking 4 + 4 yields 8, so a local choice misses the global optimum."],
    ["Why O(n) time and O(1) auxiliary space for the amount-only answer?", "Each house uses one take/skip comparison. Only the two previous prefix totals are needed; the drawn history is optional."]
  ]
};
