import { frame, prediction, guidedTrace } from "./model.js";

const proof = {
  invariant: "The stack holds unanswered day indexes. Their temperatures decrease or stay equal from bottom to top.",
  reason: "A warmer arrival answers the top day, then may answer the new top too. It is the first warmer arrival for each popped day; otherwise that day would already have been removed.",
  time: "Each day is pushed once and popped at most once. All while-loop iterations together total at most n pops: O(n), not O(n²).",
  space: "A non-increasing input leaves n indexes waiting: O(n) stack space, plus the O(n) answer array.",
  narration: "The stack keeps unanswered days, with cooler or equal temperatures on top. A warmer arrival answers the top, then checks the next one. That is the first warmer day for every index it removes. One arrival can do a lot of work, but each day can be removed only once. Across the whole run, the work is linear. In a cooling sequence, every day may remain on the stack."
};

export const temperaturesGuide = {
  pattern: "Monotonic stack",
  subtitle: "Keep the unanswered days. Let warmth resolve them.",
  objective: "Explain why one arrival can pop several days, but an equal temperature pops none.",
  proof,
  decorate(trace, input) {
    let stack = [], waits = input.nums.map(() => "?"), askedMultiple = false;
    const start = frame(trace.snapshots[0], "Each day asks: how long until warmer?",
      "Store unanswered day indexes, not just temperatures. Index differences will tell us how many days they waited.",
      { kind: "temperatures", values: input.nums, day: 0, stack, waits }, { chapter: "Set up" });
    const snapshots = [start, prediction(start, {
      prompt: "If tomorrow has exactly the same temperature, does it answer today's question?",
      choices: ["Yes. Equal is warm enough.", "No. The later temperature must be strictly higher."],
      answer: 1,
      feedback: ["The problem asks for warmer, not equal. Removing an equal day loses an unanswered question.", "Correct. Equal temperatures stay on the waiting stack."],
      explanation: "Pop while old temperature < today's temperature, not ≤."
    })];
    for (const source of trace.snapshots.slice(1, -1)) {
      const resolved = source.phase === "Answer an earlier waiting day" ? source.state.active.temperatures[0] : null;
      const day = source.state.active.temperatures.at(-1);
      stack = [...source.state.arrays.stack];
      if (resolved !== null) waits[resolved] = source.state.arrays.waits[resolved];
      const guide = { kind: "temperatures", values: input.nums, day, stack, waits: [...waits], resolved };
      if (resolved !== null) guide.copy = { from: `waiting-${resolved}`, to: `answer-${resolved}`, text: String(waits[resolved]) };
      const current = frame(source,
        resolved === null ? `Day ${day} joins the waiting stack` : `Day ${day} answers day ${resolved}`,
        resolved === null ? `${input.nums[day]}° has not seen a future warmer day yet. Keep its index so a later arrival can answer it.`
          : `${input.nums[day]}° is warmer than ${input.nums[resolved]}°. The wait is ${day} − ${resolved} = ${waits[resolved]} ${waits[resolved] === 1 ? "day" : "days"}. Check the new stack top before pushing today.`,
        guide, { chapter: "Run" });
      snapshots.push(current);
      if (!askedMultiple && resolved === null && stack.length > 1 && input.nums[day + 1] > input.nums[stack.at(-2)]) {
        askedMultiple = true;
        snapshots.push(prediction(current, {
          prompt: `${input.nums[day + 1]}° arrives next. After answering the top day, should we stop?`,
          choices: ["Yes. One arrival can answer only one day.", "No. Compare the arrival with the new top as well.", "Clear the entire stack without comparing."],
          answer: 1,
          feedback: ["Several earlier days may all be cooler than the same arrival.", "Yes. Keep popping cooler days; stop only at a day that is not cooler or an empty stack.", "A day as warm as the arrival must remain unresolved. Comparisons protect it."],
          explanation: "This is why the algorithm needs while, not a single if."
        }, { ...guide, day: day + 1, resolved: null }));
      }
    }
    snapshots.push(frame(trace.snapshots.at(-1), "The remaining days have no warmer future",
      "No arrivals remain. Unanswered days get zero; zero is a sentinel, not a same-day warmer temperature.",
      { kind: "temperatures", values: input.nums, day: input.nums.length, stack, waits: trace.result, done: true }, { chapter: "Result" }));
    return guidedTrace(trace, snapshots, proof);
  },
  questions: [
    {
      prompt: "For [70, 68, 68, 72], how many days does each day wait for a strictly warmer temperature?",
      choices: ["[3, 1, 1, 0]", "[1, 1, 1, 0]", "[3, 2, 1, 0]"],
      answer: 2,
      feedback: ["The second 68 is equal, so it does not answer the first 68.", "A cooler next day is not an answer. The first day must wait for 72.", "72 answers all three earlier days. Their index distances are 3, 2, and 1."],
      explanation: "Distances use day indexes; comparisons use temperatures."
    },
    {
      prompt: "The waiting stack contains day 1 at 73° and day 2 at 71°. Day 3 is 75°. What should happen?",
      choices: ["Pop both days, recording waits 1 and 2.", "Pop only day 2, then push day 3.", "Record wait 75 − 71 = 4 for day 2."],
      answer: 0,
      feedback: ["Pop day 2 for a one-day wait, then day 1 for a two-day wait. 75 is warmer than both.", "The new top is also cooler. An if statement would miss it.", "Subtract indexes, not temperatures. The output asks for days, not degrees."],
      explanation: "One arrival may resolve several unanswered days."
    },
    {
      prompt: "Why must the stack store indexes rather than temperatures alone?",
      choices: ["Indexes make the input sorted.", "Indexes locate the answer slot and give the waiting distance.", "Indexes guarantee constant stack space."],
      answer: 1,
      feedback: ["The input remains in its original order.", "For popped index j on day i, write answer[j] = i − j. The temperature is input[j].", "A decreasing input can still keep all n day indexes waiting."],
      explanation: "An index connects the comparison, the output position, and the distance."
    },
    {
      prompt: "The for-loop contains a while-loop. Why is the total time still O(n)?",
      choices: ["The while-loop always runs once.", "The stack never contains more than two days.", "Each index can be pushed and popped only once."],
      answer: 2,
      feedback: ["One warm arrival can pop many days.", "A decreasing sequence can leave every day waiting.", "A costly arrival removes work that cannot be repeated. Total pops across all arrivals are at most n."],
      explanation: "The stack needs O(n) space in the worst case; amortized time counts operations over the whole run."
    }
  ],
  cards: [
    ["Daily Temperatures: what does the waiting stack contain?", "Indexes of days with no warmer answer yet. Temperatures at those indexes are non-increasing from bottom to top."],
    ["Why is the comparison < rather than ≤?", "Equal temperature is not warmer. Equal-valued days stay unresolved until a strictly warmer arrival."],
    ["A day i resolves waiting day j. What do we write?", "answer[j] = i − j. Store indexes so you can locate the output slot and measure days, not degrees."],
    ["How can many pops on one day still be O(n) overall?", "Every day enters the stack once and leaves at most once. At most n pushes + n pops, with O(n) worst-case stack space."]
  ]
};
