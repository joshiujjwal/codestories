export const moveZeroesLesson = {
  id: "move-zeroes-283",
  title: "Move Zeroes",
  pattern: "Two Pointers",
  outcome: "Explain how read and write pointers preserve the order of nonzero values.",
  warmup: { nums: [0, 4, 0, 2, 9], label: "Warm-up" },
  examples: [
    { nums: [0, 4, 0, 2, 9], label: "Mixed values" },
    { nums: [0, 0, 0], label: "All zeros" },
    { nums: [3, 3, 8], label: "No zeros" },
    { nums: [], label: "Empty array" }
  ],
  cards: [
    ["What does the write pointer mean?", "The next index where a retained nonzero belongs."],
    ["Why is the order stable?", "The read pointer visits values from left to right and writes them in that same order."],
    ["What must happen after compaction?", "Fill the remaining suffix with zeros."],
    ["What space does the solver use?", "O(1) auxiliary space. The teaching trace stores copies, which cost more."]
  ],
  questions: [
    { prompt: "What is the result for [0, 6, 0, 1, 6]?", choices: ["[6, 1, 6, 0, 0]", "[1, 6, 6, 0, 0]"], answer: 0, explanation: "Nonzeros keep their original order; this is compaction, not sorting." },
    { prompt: "A read pointer meets zero. What happens to write?", choices: ["It stays at the next free retained position.", "It advances with read."], answer: 0, explanation: "Only a nonzero value claims a position in the retained prefix." },
    { prompt: "What are the time and space complexities of this in-place two-pointer solution?", choices: ["O(n) time and O(1) auxiliary space", "O(n log n) time and O(n) auxiliary space"], answer: 0, explanation: "Each index is visited at most twice with only read and write integer indices." }
  ]
};

export function validateMoveZeroesInput(nums) {
  if (!Array.isArray(nums) || nums.length > 12) return { error: "Use an array of at most 12 integers." };
  if (!nums.every((value) => Number.isInteger(value) && Math.abs(value) <= 10000)) {
    return { error: "Use integers between -10000 and 10000." };
  }
  return { value: { nums: [...nums] } };
}

export function buildMoveZeroesTrace(nums) {
  const valid = validateMoveZeroesInput(nums);
  if (valid.error) throw new Error(valid.error);
  const values = valid.value.nums;
  const snapshots = [];
  let write = 0;
  const add = (phase, summary, read, line, complete = false) => snapshots.push({
    id: `move-${snapshots.length}`, phase, summary, line,
    state: { values: [...values], read, write, complete },
    code: `read=${read ?? "done"}, write=${write}`
  });
  add("Prepare two jobs", "Read scans the input; write marks the next retained position.", 0, 0);
  for (let read = 0; read < values.length; read += 1) {
    const value = values[read];
    add("Inspect the next value", `Read sees ${value} at index ${read}.`, read, 1);
    if (value !== 0) {
      const destination = write;
      values[write] = value;
      write += 1;
      add("Keep this nonzero", `Place ${value} at index ${destination}; the retained prefix has ${write} values.`, read, 2);
    } else {
      add("Skip the zero", "Zero does not claim a retained position. Write stays put.", read, 1);
    }
  }
  for (let index = write; index < values.length; index += 1) {
    values[index] = 0;
    add("Fill the suffix", `Index ${index} becomes zero; the retained prefix stays unchanged.`, index, 4);
  }
  add("Compaction complete", `Result: [${values.join(", ")}]. Nonzero order is preserved.`, null, 4, true);
  return { snapshots, result: [...values] };
}
