import { frame, guidedTrace } from "./model.js";

const proof = {
  invariant: "Before write: exactly the nonzeros read so far, in their original order.",
  reason: "A zero adds nothing. A nonzero extends that prefix by one. Once reading ends, only the unused tail needs zeros.",
  time: "Read visits n values. Filling visits at most n slots. Two consecutive passes add to at most 2n visits: O(n), not O(n²).",
  space: "The solver changes the same array and keeps two indexes: O(1) auxiliary space. Animation snapshots are display storage, not solver space.",
  narration: "The kept prefix is the promise: all the nonzeros seen so far, in the original order. Zeros do not grow it; nonzeros grow it by one. At the end, fill only the unfinished tail. Two passes are still linear work, because we add their costs, not multiply them. Two indexes give constant extra storage."
};

export const moveGuide = {
  subtitle: "Close the gaps. Keep the order.",
  objective: "Explain why one pointer moves at a zero and the other stays.",
  extraExamples: [{ nums: [0, 3, 3, 0, 8], label: "Equal nonzeros both survive" }],
  proof,
  decorate(trace, input) {
    let askedZero = false, askedCopy = false;
    const snapshots = trace.snapshots.map((source) => {
      const { values, read, write, complete } = source.state;
      const filling = source.phase === "Fill the suffix";
      const guide = { kind: "move", values, original: input.nums, read: filling || complete ? null : read, write, done: complete, filling: filling ? read : null };
      let phase = source.phase, summary = source.summary;
      const extra = { chapter: "Run" };
      if (source.phase === "Prepare two jobs") {
        phase = "Two jobs, one array";
        summary = "Keep the nonzeros in order. Read examines a value; write marks the next slot in the kept prefix.";
        extra.chapter = "Set up";
      } else if (source.phase === "Inspect the next value" && values[read] === 0 && !askedZero) {
        askedZero = true;
        phase = "A zero leaves a gap";
        summary = "Read is on a zero. Decide which pointer should move.";
        extra.chapter = "Predict";
        extra.question = {
          prompt: "Read found zero. What happens next?",
          choices: ["Advance read; leave write here.", "Advance both read and write.", "Advance write; leave read here."],
          answer: 0,
          feedback: [
            "Yes. A zero contributes nothing to the kept prefix. Write waits for the next nonzero.",
            "That would leave an unfilled slot in the prefix. Only read has finished a job.",
            "That skips a destination without inspecting another value. Read, not write, needs to advance."
          ],
          explanation: "The kept prefix grows only when a nonzero is copied."
        };
      } else if (source.phase === "Inspect the next value" && values[read] !== 0 && read > write && !askedCopy) {
        askedCopy = true;
        phase = "A nonzero can fill the gap";
        summary = `Read found ${values[read]}. Write is waiting at index ${write}.`;
        extra.chapter = "Predict";
        extra.question = {
          prompt: `Where should ${values[read]} go?`,
          choices: ["At the end, after the other nonzeros.", `Into index ${write}, then advance write.`, "Into a sorted position based on its value."],
          answer: 1,
          feedback: [
            "That can change the order. The first nonzero seen must be the first nonzero kept.",
            "Exactly. Fill the earliest available slot. Reading left to right preserves the original order.",
            "Sorting solves a different problem. The values must keep their original order."
          ],
          explanation: "Copy from read into write. The old tail can temporarily contain duplicate values."
        };
      } else if (source.phase === "Keep this nonzero") {
        const destination = write - 1;
        guide.copy = { from: `slot-${read}`, to: `slot-${destination}`, text: String(values[destination]) };
        phase = read === destination ? "Already in the right slot" : `Copy ${values[destination]} into the gap`;
        summary = `${write === 1 ? "The first slot is" : `The first ${write} slots are`} now settled. Values at or after write are still unfinished; do not interpret them as the result.`;
      } else if (filling) {
        phase = "Finish the tail";
        summary = `All nonzeros are kept. Replace index ${read} with zero without touching the prefix.`;
      }
      return frame(source, phase, summary, guide, extra);
    });
    return guidedTrace(trace, snapshots, proof);
  },
  questions: [
    {
      prompt: "Move Zeroes: what should [0, 6, 0, 1, 6] become?",
      choices: ["[6, 1, 6, 0, 0]", "[1, 6, 6, 0, 0]", "[6, 1, 0, 0, 0]"],
      answer: 0,
      feedback: ["Both sixes survive, and 6, 1, 6 stay in that order.", "This sorts the nonzeros. Their original order must stay unchanged.", "Equal values are not duplicates to remove. Both sixes must remain."],
      explanation: "Keep the nonzero subsequence, then fill the rest with zeros."
    },
    {
      prompt: "Read meets another zero while write points at a gap. Which index advances?",
      choices: ["Only write.", "Both indexes.", "Only read."],
      answer: 2,
      feedback: ["No value was kept, so the destination has not been used.", "Advancing write leaves a gap inside the supposedly finished prefix.", "Read finished examining that value. Write still needs a nonzero."],
      explanation: "Read counts inspected values; write counts kept nonzeros."
    },
    {
      prompt: "After the first copy, [0, 4, 0, 2] becomes [4, 4, 0, 2] with write = 1. Is this a bug?",
      choices: ["Yes: the whole array must be valid after each copy.", "No: only indexes before write are finished.", "No: the algorithm is allowed to keep extra fours."],
      answer: 1,
      feedback: ["Only the prefix invariant is promised during the loop.", "Correct. The old four is in the unfinished tail. Later writes and zero filling replace it.", "The final result cannot contain an extra four. Temporary tail values are not the output."],
      explanation: "An in-place intermediate state need not look like the final result."
    },
    {
      prompt: "One loop scans n values; the next fills at most n zeros. What are the solver costs?",
      choices: ["O(n²) time, O(1) extra space.", "O(n) time, O(n) extra space.", "O(n) time, O(1) extra space."],
      answer: 2,
      feedback: ["The loops are consecutive, not nested: n + n, not n × n.", "The solver does not allocate an output array; it rewrites the input.", "At most 2n visits and two indexes. The number of visits grows linearly."],
      explanation: "Ignore the teaching animation's recorded snapshots when measuring solver space."
    }
  ],
  cards: [
    ["Move Zeroes: what does write mean?", "The next free slot in the kept prefix. Its index also equals the number of nonzeros kept so far."],
    ["Why does copying left to right preserve nonzero order?", "Every new nonzero is appended after the ones already seen. No value can jump ahead of an earlier nonzero."],
    ["Why can an intermediate array contain duplicate nonzeros?", "Only the prefix before write is settled. Old values in the tail will be overwritten or zero-filled."],
    ["Why are two passes still O(n), with O(1) extra space?", "At most n inspections plus n tail writes. The solver stores indexes, not a second array."]
  ]
};
