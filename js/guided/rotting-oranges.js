import { frame, prediction, guidedTrace } from "./model.js";

const proof = {
  invariant: "The frontier for minute m contains cells first reached at minute m. Every fresh neighbor is marked when it is enqueued.",
  reason: "All sources begin at zero. FIFO processing reaches each cell by a shortest path; the answer is the largest of those earliest arrival times. Leftover fresh cells are unreachable.",
  time: "Scan rows × columns cells once. Each cell enters the queue at most once and checks four neighbors: O(rows × columns).",
  space: "The queue can hold O(rows × columns) cells. Per-cell times and arrows in this drawing explain the waves; they are not required by the in-place solver.",
  narration: "Every starting orange joins the same queue at minute zero. The queue processes one distance layer before the next, so the first wave reaching a cell is the fastest one. Mark the cell at discovery so it cannot join the queue twice. Four neighbor checks per cell make the work proportional to the grid's size. The queue can also grow as large as the grid."
};

export const orangesGuide = {
  subtitle: "Start together. Spread one minute at a time.",
  objective: "See why several starting points belong in one queue.",
  examples: [
    { grid: [[2, 1, 1, 0], [1, 1, 1, 1], [0, 1, 1, 2]], label: "Two sources, two waves" },
    { grid: [[1, 0, 2]], label: "An unreachable orange" },
    { grid: [[2, 1, 0], [0, 1, 1]], label: "One source, three waves" },
    { grid: [[2, 0], [0, 0]], label: "No fresh fruit" }
  ],
  proof,
  decorate(trace, input) {
    const times = input.grid.map((row) => row.map((value) => value === 2 ? 0 : null));
    const sources = [];
    input.grid.forEach((row, r) => row.forEach((value, c) => { if (value === 2) sources.push([r, c]); }));
    let grid = structuredClone(input.grid);
    const freshCount = () => grid.flat().filter((value) => value === 1).length;
    const start = frame(trace.snapshots[0], "Every rotten orange is a starting point",
      "Rot spreads up, down, left, or right in one minute. Empty cells block it. All starting oranges spread at the same time.",
      { kind: "oranges", grid, times, minute: 0, frontier: sources, fresh: freshCount() }, { chapter: "Set up" });
    const snapshots = [start];
    if (freshCount()) snapshots.push(prediction(start, {
      prompt: "When do the initially rotten oranges join the queue?",
      choices: ["All at minute zero.", "One source first; the others after it finishes.", "Only sources touching the top row."],
      answer: 0,
      feedback: [
        "Right. One shared queue lets the fastest wave reach each cell first.",
        "Sequential sources invent a delay that the problem does not have.",
        "Every rotten orange is a source, regardless of its position."
      ],
      explanation: "Multi-source BFS is ordinary BFS with several starting cells at distance zero."
    }));
    const waves = new Map();
    for (const source of trace.snapshots) {
      if (source.phase !== "Spread to a fresh neighbor") continue;
      const minute = source.state.vars.minute;
      if (!waves.has(minute)) waves.set(minute, []);
      waves.get(minute).push(source);
    }
    let minute = 0;
    for (const [time, events] of waves) {
      minute = time;
      const changed = events.flatMap((source) => source.state.activeGrid);
      const edges = [];
      for (const [r, c] of changed) {
        const from = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].find(([nr, nc]) => times[nr]?.[nc] === time - 1);
        if (!from) throw new Error("A BFS wave is missing a predecessor in the previous minute.");
        edges.push([from, [r, c]]);
      }
      for (const [r, c] of changed) times[r][c] = time;
      const source = events.at(-1);
      grid = structuredClone(source.state.grid);
      snapshots.push(frame(source, `Minute ${time}: ${changed.length} ${changed.length === 1 ? "orange changes" : "oranges change"}`,
        "These cells share an arrival time. They become the next frontier; they cannot spread a second step in the same minute.",
        { kind: "oranges", grid, times, minute, frontier: changed, changed, edges, fresh: freshCount() }, { chapter: "Run" }));
    }
    snapshots.push(frame(trace.snapshots.at(-1),
      trace.result === -1 ? "The wave has nowhere else to go" : "No fresh oranges remain",
      trace.result === -1 ? `${freshCount()} fresh ${freshCount() === 1 ? "orange is" : "oranges are"} still isolated. More time will not create a path: return -1.`
        : `Return ${trace.result}. ${trace.result === 0 ? "Nothing needed to spread, so do not add an extra minute." : "Count elapsed minutes, not the number of queue removals."}`,
      { kind: "oranges", grid, times, minute, frontier: [], fresh: freshCount(), result: trace.result, done: true }, { chapter: "Result" }));
    return guidedTrace(trace, snapshots, proof);
  },
  questions: [
    {
      prompt: "In the row [rotten, fresh, fresh, fresh, rotten], how many minutes until all fruit is rotten?",
      choices: ["1 minute.", "2 minutes.", "4 minutes."],
      answer: 1,
      feedback: ["One minute changes only the cells next to either end. The middle still waits.", "Both ends spread together. Their neighbors rot at minute 1; the middle rots at minute 2.", "That treats the row as a single-source walk and ignores the other starting orange."],
      explanation: "The nearest source determines each orange's arrival time."
    },
    {
      prompt: "For [rotten, empty, fresh], what should the solver return?",
      choices: ["2, because the fruit is two columns away.", "0, because the source cannot move.", "−1, because fresh fruit is unreachable."],
      answer: 2,
      feedback: ["Rot cannot jump over an empty cell.", "Zero means no fresh oranges needed to change. One fresh orange remains here.", "No queue expansion can cross the empty cell; waiting longer cannot help."],
      explanation: "Check the remaining fresh count when the queue is exhausted."
    },
    {
      prompt: "Two cells discover the same fresh neighbor in one minute. When should that neighbor be marked rotten?",
      choices: ["When first enqueued.", "Only when removed from the queue.", "Only after the whole search."],
      answer: 0,
      feedback: ["The second discovery now sees an already-marked cell and does not enqueue it again.", "Both parents could enqueue it before either copy is processed, duplicating work and fresh-count updates.", "The same fresh cell could be discovered repeatedly."],
      explanation: "Marking at discovery ensures one enqueue and one fresh-count decrement per cell."
    },
    {
      prompt: "With R rows and C columns, what bounds the work and queue storage?",
      choices: ["O(R + C) time and O(1) queue space.", "O(RC) time and O(RC) queue space.", "O((RC)²) time because BFS has a loop inside a loop."],
      answer: 1,
      feedback: ["The solver must inspect cells throughout the grid, not just one row and column.", "Each cell is scanned and enqueued at most once; each checks four neighbors.", "The inner loop checks only four directions. It does not rescan the whole grid per cell."],
      explanation: "Count how often each cell is processed, not how many loop statements are present."
    }
  ],
  cards: [
    ["Rotting Oranges: what is in the initial BFS queue?", "Every initially rotten orange, all tagged with minute zero. None must wait for another source to finish."],
    ["Why do BFS waves give the earliest rotting times?", "Every edge takes one minute. FIFO processing expands all distance-m cells before distance-(m + 1) cells."],
    ["Why mark a fresh cell when enqueuing it?", "So two parents cannot enqueue it twice or decrement the fresh count twice."],
    ["When is the answer −1, and what are the costs?", "When the queue finishes with fresh cells remaining. Scanning and processing the grid costs O(RC) time and at most O(RC) queue space."]
  ]
};
