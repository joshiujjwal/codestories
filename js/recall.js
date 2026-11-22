import { recallPrompts } from "./guided/recall.js";

export const recallItems = Object.entries(recallPrompts).flatMap(([lessonId, prompts]) => prompts.map((prompt) => ({
  ...prompt, lessonId, key: `${lessonId}:recall-v1:${prompt.id}`
})));
const byKey = new Map(recallItems.map((item) => [item.key, item]));
const outcomes = new Set(["independent", "assisted", "again"]);
const intervals = new Set([1, 3, 7]);
const record = (value) => value && typeof value === "object" && !Array.isArray(value);

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function reviewDay(today, days) {
  if (!validDay(today) || !intervals.has(days)) throw new Error("Choose tomorrow, three days, or a week for the next review.");
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function sanitizeRecallState(value) {
  const state = { current: null, records: {} };
  if (!record(value)) return state;
  state.current = byKey.has(value.current) ? value.current : null;
  if (!record(value.records)) return state;
  for (const [key, entry] of Object.entries(value.records)) {
    const item = byKey.get(key);
    if (!item || !record(entry) || !outcomes.has(entry.outcome) || !validDay(entry.lastOn)) continue;
    if (!Number.isInteger(entry.criteriaMet) || entry.criteriaMet < 0 || entry.criteriaMet > item.rubric.length) continue;
    if (entry.outcome === "independent" && (entry.hintUsed === true || entry.neededAnswer === true || entry.criteriaMet !== item.rubric.length)) continue;
    const scheduled = item.kind !== "complete";
    if (scheduled && (!intervals.has(entry.intervalDays) || entry.dueOn !== reviewDay(entry.lastOn, entry.intervalDays))) continue;
    state.records[key] = {
      outcome: entry.outcome,
      lastOn: entry.lastOn,
      dueOn: scheduled ? entry.dueOn : null,
      intervalDays: scheduled ? entry.intervalDays : null,
      hintUsed: entry.hintUsed === true,
      neededAnswer: entry.neededAnswer === true,
      criteriaMet: entry.criteriaMet,
      delayed: entry.delayed === true,
      reviews: Number.isSafeInteger(entry.reviews) && entry.reviews > 0 ? entry.reviews : 1
    };
  }
  return state;
}

export function practiceRecallItems(matches) {
  return matches.flatMap(({ lessonId }) => recallItems.filter((item) => item.lessonId === lessonId));
}

export function saveRecallAttempt(value, key, {
  outcome, hintUsed = false, neededAnswer = false, criteriaMet, intervalDays = 1, today = localDay()
}) {
  const item = byKey.get(key);
  if (!item || !outcomes.has(outcome) || !validDay(today)) throw new Error("Choose how the recall attempt went before saving.");
  if (!Number.isInteger(criteriaMet) || criteriaMet < 0 || criteriaMet > item.rubric.length) throw new Error("Check which points were in your attempt.");
  if (outcome === "independent" && (hintUsed || neededAnswer || criteriaMet !== item.rubric.length)) {
    throw new Error("Unaided recall needs all rubric points and no hint or early explanation.");
  }
  const state = sanitizeRecallState(value);
  const previous = state.records[key];
  const scheduled = item.kind !== "complete";
  state.records[key] = {
    outcome, hintUsed, neededAnswer, criteriaMet,
    lastOn: today,
    dueOn: scheduled ? reviewDay(today, intervalDays) : null,
    intervalDays: scheduled ? intervalDays : null,
    delayed: Boolean(previous && previous.lastOn < today),
    reviews: (previous?.reviews ?? 0) + 1
  };
  state.current = key;
  return state;
}

export function dueRecallItems(value, today = localDay()) {
  if (!validDay(today)) throw new Error("A valid local calendar date is needed for review.");
  const state = sanitizeRecallState(value);
  const due = recallItems.filter((item) => item.kind !== "complete" && state.records[item.key]?.dueOn <= today)
    .sort((a, b) => state.records[a.key].dueOn.localeCompare(state.records[b.key].dueOn) || a.key.localeCompare(b.key));
  const groups = new Map();
  for (const item of due) {
    if (!groups.has(item.lessonId)) groups.set(item.lessonId, []);
    groups.get(item.lessonId).push(item);
  }
  const mixed = [];
  while ([...groups.values()].some((group) => group.length)) {
    for (const group of groups.values()) if (group.length) mixed.push(group.shift());
  }
  return mixed;
}

export function recallSummary(value, today = localDay()) {
  const state = sanitizeRecallState(value);
  const entries = Object.entries(state.records).filter(([key]) => byKey.get(key).kind !== "complete").map(([, entry]) => entry);
  return {
    practiced: entries.length,
    delayedIndependent: entries.filter((entry) => entry.delayed && entry.outcome === "independent").length,
    due: dueRecallItems(state, today).length,
    nextDue: entries.map((entry) => entry.dueOn).filter((day) => day > today).sort()[0] ?? null
  };
}

export function resetRecallProgress(value, ids) {
  const state = sanitizeRecallState(value);
  const selected = new Set(ids);
  for (const key of Object.keys(state.records)) if (selected.has(byKey.get(key).lessonId)) delete state.records[key];
  if (state.current && selected.has(byKey.get(state.current).lessonId)) state.current = null;
  return state;
}
