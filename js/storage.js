import { lessons as registry } from "./lessons/index.js";

const KEY = "codestories.learning";
const knownModes = new Set(["learn", "explore", "review"]);
const knownViews = new Set(["2d", "3d"]);

export function sanitizeLearningState(value) {
  const lessons = {};
  if (!value || value.version !== 1 || !value.lessons || typeof value.lessons !== "object" || Array.isArray(value.lessons)) return { version: 1, lessons };
  for (const [id, entry] of Object.entries(value.lessons)) {
    const lesson = Object.hasOwn(registry, id) ? registry[id] : null;
    if (!lesson || !entry || typeof entry !== "object") continue;
    let input = null;
    if (entry.input && typeof entry.input === "object") {
      if (lesson.validate) {
        const valid = lesson.validate(entry.input.nums, entry.input.k);
        if (!valid.error) input = valid.value;
      } else if (lesson.renderer === "system" && ["hit", "miss", "unavailable"].includes(entry.input.metadata) && ["hit", "miss"].includes(entry.input.media)) {
        input = { metadata: entry.input.metadata, media: entry.input.media };
      }
      if (input) input.label = typeof entry.input.label === "string" ? entry.input.label.slice(0, 80) : "Saved exploration";
    }
    lessons[id] = {
      stepId: typeof entry.stepId === "string" ? entry.stepId.slice(0, 100) : null,
      mode: knownModes.has(entry.mode) ? entry.mode : "learn",
      view: lesson.supports3D && knownViews.has(entry.view) ? entry.view : "2d",
      exampleIndex: Number.isInteger(entry.exampleIndex) && entry.exampleIndex >= 0 && entry.exampleIndex < lesson.examples.length ? entry.exampleIndex : 0,
      input,
      complete: entry.complete === true,
      assisted: Array.isArray(entry.assisted) ? entry.assisted.filter((item) => typeof item === "string").slice(0, 4) : []
    };
  }
  return { version: 1, lessons };
}

export function loadLearningState() {
  try {
    return { state: sanitizeLearningState(JSON.parse(localStorage.getItem(KEY))), persistent: true };
  } catch (error) {
    return { state: { version: 1, lessons: {} }, persistent: false, error: "Progress is available for this session only." };
  }
}

export function saveLearningState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitizeLearningState(state)));
    return { persistent: true };
  } catch (error) {
    return { persistent: false, error: "Progress could not be saved in this browser." };
  }
}
