export const recallPrompts = {
  "move-zeroes-283": [
    {
      id: "complete", kind: "complete",
      prompt: "Finish this copy and say where write moves next.",
      given: "array = [5, 5, 0, 2]\nread = 3; write = 1\narray[write] = _____\nwrite = _____",
      hint: "Read identifies the value to keep. Write identifies its destination.",
      answer: "Copy array[read], which is 2, into index 1. Then increment write to 2. The array is temporarily [5, 2, 0, 2]; the last two positions are still unfinished.",
      rubric: ["Copied 2 from read into index 1.", "Advanced write to 2, not to read.", "Allowed temporary old values in the unfinished tail."]
    },
    {
      id: "transfer", kind: "transfer",
      prompt: "Move the zeros to the end without changing the other values' order. Give the result and describe how you would produce it in the same array.",
      given: "values = [0, 7, 7, 0, 3]",
      hint: "Think about the next input position to inspect and the next output position to fill.",
      answer: "[7, 7, 3, 0, 0]. Scan left to right, copying each nonzero into the next kept position. Both sevens survive. After the scan, fill the unused tail with zeros.",
      rubric: ["Produced [7, 7, 3, 0, 0], keeping both sevens.", "Preserved order rather than sorting.", "Described compaction followed by zero filling."],
      fixture: { input: { nums: [0, 7, 7, 0, 3] }, expected: [7, 7, 3, 0, 0] }
    },
    {
      id: "explain", kind: "explain",
      prompt: "Move all zeros to the end of an array while keeping the other values in order. Reconstruct an in-place solution, state the invariant that preserves order, and derive its costs.",
      hint: "Count what happens to each input value, rather than counting loop statements.",
      answer: "Before write are exactly the nonzeros already seen, in their original order. Each new nonzero extends that prefix. The scan costs n visits and filling costs at most n more: O(n) time. Two indexes, with no second array, use O(1) auxiliary space.",
      rubric: ["Stated what is true before write, not about the whole array.", "Explained stable order through left-to-right appending.", "Derived O(n) time and O(1) extra space from the operations."]
    }
  ],
  "max-average-643": [
    {
      id: "complete", kind: "complete",
      prompt: "Complete the update from the first pair to the next pair. Which value stays counted?",
      given: "values = [6, -1, 4, 2]; k = 2\nold window = [6, -1]; old sum = 5\nnew window = [-1, 4]\nnew sum = 5 - _____ + _____",
      hint: "The shared -1 did not leave. Look at the departing and arriving edges.",
      answer: "5 - 6 + 4 = 3. Remove 6 and add 4. The overlapping -1 remains counted once.",
      rubric: ["Removed 6, not the overlapping -1.", "Added the arriving 4.", "Computed the new sum as 3."]
    },
    {
      id: "transfer", kind: "transfer",
      prompt: "Find the largest average of exactly two adjacent values. Give the winning positions and show how your running sum changes.",
      given: "values = [8, -4, 4, 6]; k = 2",
      hint: "The candidates must be consecutive slices of the original input, not the two largest values.",
      answer: "Pair sums are 4, 0, and 10. Positions 2..3 contain [4, 6], with average 5. Each shift removes the previous left edge and adds the next value. Choosing 8 and 6 would violate adjacency.",
      rubric: ["Chose [4, 6] at positions 2..3, giving average 5.", "Obtained sums 4, 0, and 10 in input order.", "Updated only the departing and arriving values."],
      fixture: { input: { nums: [8, -4, 4, 6], k: 2 }, expected: { bestSum: 10, average: 5, range: [2, 3] } }
    },
    {
      id: "explain", kind: "explain",
      prompt: "Find the largest average of exactly k adjacent array values. What state would you reuse between candidates? Explain why best cannot always start at zero, and derive the time and space bounds.",
      hint: "A valid initial best must correspond to a real candidate, even when every candidate is negative.",
      answer: "The sum represents exactly the k adjacent values in the current window. Initialize best from the first complete window; zero may beat every valid negative candidate. k initial additions plus n - k constant-size shifts give O(n) time, with O(1) auxiliary space for sums and indexes.",
      rubric: ["Defined exact window membership as the invariant.", "Explained the all-negative counterexample to best = 0.", "Derived O(n) time and O(1) extra space, without storing every window."]
    }
  ],
  "story-994": [
    {
      id: "complete", kind: "complete",
      prompt: "Complete the next frontier. All starting rotten cells act at the same time.",
      given: "One row: [2, 1, 1, 2]\n2 = rotten; 1 = fresh\nMinute 0 frontier: (0,0), (0,3)\nMinute 1 frontier: _____",
      hint: "Give each starting cell one orthogonal step. Do not finish one source before using the other.",
      answer: "The minute 1 frontier is (0,1), (0,2). Both middle oranges rot in the same minute, each reached from its nearer source.",
      rubric: ["Included both middle cells.", "Assigned both arrival time 1.", "Did not process the starting sources as separate sequential searches."]
    },
    {
      id: "transfer", kind: "transfer",
      prompt: "Rot moves to fresh orthogonal neighbors once per minute. How long until no fresh fruit remains? Describe the waves before giving the total.",
      given: "2 = rotten; 1 = fresh; 0 = empty\n[2, 1, 0]\n[1, 1, 1]\n[0, 1, 2]",
      hint: "Start from both 2s at minute zero. Label each cell by its first arrival time.",
      answer: "Two minutes. At minute 1, cells (0,1), (1,0), (1,2), and (2,1) rot. At minute 2, the center (1,1) rots. Both sources start together, and empty cells are not traversable.",
      rubric: ["Started from both rotten cells at minute zero.", "Kept the four minute-1 arrivals in one wave.", "Reached the center at minute 2, without a same-minute cascade."],
      fixture: { input: { grid: [[2, 1, 0], [1, 1, 1], [0, 1, 2]] }, expected: 2 }
    },
    {
      id: "explain", kind: "explain",
      prompt: "Rot spreads to orthogonal fresh neighbors once per minute. Some fresh fruit remains after every reachable cell has been processed. Explain the return value, when to mark discovered cells, and the work/storage bounds.",
      hint: "Time cannot create a path across empty cells. Also ask how two parents could discover the same neighbor.",
      answer: "Return -1: leftover fresh fruit is unreachable. Mark a fresh neighbor when enqueuing it, so it is counted and enqueued only once. Scan R times C cells and check four directions per processed cell: O(RC) time. The queue can store O(RC) cells.",
      rubric: ["Explained why unreachable fruit means -1, not more waiting.", "Marked on enqueue to prevent duplicate discoveries.", "Derived O(RC) time and O(RC) worst-case queue space."]
    }
  ],
  "story-739": [
    {
      id: "complete", kind: "complete",
      prompt: "Fill the waiting distance, then decide whether another old day can also be answered.",
      given: "temperatures = [72, 69, 73]\nwaiting indexes = [0, 1]\ntoday = 2\nj = pop() // j is 1\nanswer[j] = _____",
      hint: "The output counts days, not degrees. After a pop, compare the arrival with the new top.",
      answer: "answer[1] = 2 - 1 = 1. The new top, day 0 at 72 degrees, is also cooler than 73, so pop it and write answer[0] = 2. Then keep day 2 waiting for a future arrival.",
      rubric: ["Subtracted indexes to get a one-day wait.", "Continued to resolve day 0 as well.", "Kept the current day for a future warmer arrival."]
    },
    {
      id: "transfer", kind: "transfer",
      prompt: "For each day, give the number of days until a strictly warmer temperature. Explain what happens to the two equal temperatures.",
      given: "temperatures = [71, 70, 70, 74, 73]",
      hint: "Equal is not warmer. The 74 can answer several older days, but it does not answer itself.",
      answer: "[3, 2, 1, 0, 0]. Day 3 at 74 degrees answers days 0, 1, and 2. The two 70s do not answer each other. Neither of the last two days has a warmer future.",
      rubric: ["Produced waits [3, 2, 1, 0, 0].", "Kept equal temperatures unresolved.", "Used zero for both days with no warmer future."],
      fixture: { input: { nums: [71, 70, 70, 74, 73] }, expected: [3, 2, 1, 0, 0] }
    },
    {
      id: "explain", kind: "explain",
      prompt: "For each day's temperature, find how long until a strictly warmer day. Reconstruct the state needed for unanswered days, and explain why processing many old days on one arrival can still give linear total time.",
      hint: "A day that has been removed cannot be removed again. Its index also tells you where to write its answer.",
      answer: "Keep unanswered indexes in a stack whose temperatures are non-increasing from bottom to top. A strictly warmer arrival pops cooler days and uses index differences for their waits. Each day is pushed once and popped at most once, so total time is O(n). A cooling sequence can require O(n) stack space.",
      rubric: ["Stored indexes of unanswered days, with the temperature ordering.", "Used a strict comparison and index distances.", "Explained O(n) amortized time and O(n) worst-case stack space."]
    }
  ],
  "story-198": [
    {
      id: "complete", kind: "complete",
      prompt: "Complete the take/skip decision, then advance the two summaries without losing the old oneBack.",
      given: "current value = 4\ntwoBack = 3; oneBack = 5\ntake = _____ + 4\nskip = _____\nnew best = _____",
      hint: "Taking this house rules out its neighbor. Use the prefix that ends before that neighbor.",
      answer: "take = 3 + 4 = 7; skip = 5; new best = 7. For the next house, twoBack becomes the old oneBack, 5, and oneBack becomes 7.",
      rubric: ["Added 4 to twoBack = 3, not oneBack = 5.", "Compared 7 against the skip total 5.", "Shifted summaries to twoBack = 5 and oneBack = 7."]
    },
    {
      id: "transfer", kind: "transfer",
      prompt: "Choose a maximum total without taking adjacent houses. Give a valid selection and explain why taking the largest house first is not enough.",
      given: "houses = [2, 9, 8, 3, 7]",
      hint: "At each position, compare the best valid take branch with the best valid skip branch, rather than comparing just neighboring values.",
      answer: "The maximum is 17, from positions 0, 2, and 4: 2 + 8 + 7. The best prefix totals are 2, 9, 10, 12, 17. Starting with the largest house, 9, can miss the better combination of the two earlier nonadjacent choices and 7.",
      rubric: ["Found 17 using a nonadjacent selection.", "Compared complete take/skip prefix totals.", "Explained why a local maximum does not guarantee the best combination."],
      fixture: { input: { nums: [2, 9, 8, 3, 7] }, expected: 17 }
    },
    {
      id: "explain", kind: "explain",
      prompt: "Choose a maximum total from houses without taking adjacent houses. Reconstruct the amount-only recurrence, define its saved state, explain why both branches are sufficient, and derive its costs.",
      hint: "Every valid solution either includes the current house or excludes it. What restriction does including it add?",
      answer: "oneBack is the best previous prefix; twoBack is the best prefix before its neighbor. Set next = max(oneBack, twoBack + value), then shift the old oneBack into twoBack and next into oneBack. The branches cover taking or skipping the house. One constant-sized update per house gives O(n) time and O(1) auxiliary space.",
      rubric: ["Defined the two saved prefix totals correctly.", "Reconstructed take/skip and the safe state update.", "Explained coverage of both branches and the O(n)/O(1) bounds."]
    }
  ]
};
