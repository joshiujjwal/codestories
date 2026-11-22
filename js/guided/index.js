import { moveGuide } from "./move-zeroes.js";
import { windowGuide } from "./maximum-average.js";
import { orangesGuide } from "./rotting-oranges.js";
import { temperaturesGuide } from "./daily-temperatures.js";
import { robberGuide } from "./house-robber.js";

export const guides = {
  "move-zeroes-283": moveGuide,
  "max-average-643": windowGuide,
  "story-994": orangesGuide,
  "story-739": temperaturesGuide,
  "story-198": robberGuide
};

export function applyGuides(registry) {
  for (const [id, guide] of Object.entries(guides)) {
    const base = registry[id];
    if (!base) throw new Error(`Guided lesson ${id} has no underlying solver.`);
    const examples = guide.examples ?? [...base.examples, ...(guide.extraExamples ?? [])];
    registry[id] = {
      ...base,
      pattern: guide.pattern ?? base.pattern,
      guide,
      practiceVersion: "guided-v1",
      examples,
      warmup: examples[0],
      questions: guide.questions,
      cards: guide.cards,
      build: (input) => guide.decorate(base.build(input), input)
    };
  }
}
