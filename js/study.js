import { problems, topics, companies, resolveTopicPattern } from "./catalog.js";
import { lessons } from "./lessons/index.js";
import { practiceKey } from "./practice-key.js";
import { sanitizeRecallState, resetRecallProgress } from "./recall.js";

const KEY = "codestories.study";
const lessonIds = new Set(problems.map((problem) => problem.lessonId));
const questionKeys = new Map(problems.flatMap((problem) => lessons[problem.lessonId].questions.map((question, index) => [practiceKey(lessons[problem.lessonId], index), question])));
const cardKeys = new Set(problems.flatMap((problem) => lessons[problem.lessonId].cards.map((card, index) => practiceKey(lessons[problem.lessonId], index))));
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const validList = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter((key) => allowed.has(key)))] : [];

export function sanitizeStudyState(value) {
  const state = {
    version: 1, filters: { query: "", topic: "", patternId: "", company: "", collection: "guided" },
    learned: [], learningCurrent: null, quiz: { answers: {}, current: null }, flashcards: { known: [], current: null },
    recall: sanitizeRecallState(null)
  };
  if (!record(value) || value.version !== 1) return state;
  state.recall = sanitizeRecallState(value.recall);
  state.filters.collection = "all";
  if (record(value.filters)) {
    const topic = topics.includes(value.filters.topic) ? value.filters.topic : "";
    state.filters = {
      query: typeof value.filters.query === "string" ? value.filters.query.slice(0, 160) : "",
      topic, patternId: resolveTopicPattern(topic, value.filters.patternId),
      company: companies.includes(value.filters.company) ? value.filters.company : "",
      collection: value.filters.collection === "guided" ? "guided" : "all"
    };
  }
  state.learned = validList(value.learned, lessonIds);
  state.learningCurrent = lessonIds.has(value.learningCurrent) ? value.learningCurrent : null;
  if (record(value.quiz)) {
    if (record(value.quiz.answers)) {
      for (const [key, answer] of Object.entries(value.quiz.answers)) {
        const question = questionKeys.get(key);
        if (question && Number.isInteger(answer) && answer >= 0 && answer < question.choices.length) state.quiz.answers[key] = answer;
      }
    }
    state.quiz.current = questionKeys.has(value.quiz.current) ? value.quiz.current : null;
  }
  if (record(value.flashcards)) {
    state.flashcards.known = validList(value.flashcards.known, cardKeys);
    state.flashcards.current = cardKeys.has(value.flashcards.current) ? value.flashcards.current : null;
  }
  return state;
}

export function practiceItems(matches, mode) {
  return matches.flatMap((problem) => lessons[problem.lessonId][mode === "quiz" ? "questions" : "cards"].map((item, index) => ({
    key: practiceKey(lessons[problem.lessonId], index), lessonId: problem.lessonId, index
  })));
}

export function resetStudyProgress(value, ids) {
  const state = sanitizeStudyState(value);
  const reset = new Set(ids.filter((id) => lessonIds.has(id)));
  const belongs = (key) => reset.has(key.split(":")[0]);
  state.learned = state.learned.filter((id) => !reset.has(id));
  if (reset.has(state.learningCurrent)) state.learningCurrent = null;
  for (const key of Object.keys(state.quiz.answers)) if (belongs(key)) delete state.quiz.answers[key];
  state.flashcards.known = state.flashcards.known.filter((key) => !belongs(key));
  if (state.quiz.current && belongs(state.quiz.current)) state.quiz.current = null;
  if (state.flashcards.current && belongs(state.flashcards.current)) state.flashcards.current = null;
  state.recall = resetRecallProgress(state.recall, ids);
  return state;
}

export function loadStudyState() {
  try {
    return { state: sanitizeStudyState(JSON.parse(localStorage.getItem(KEY))), persistent: true };
  } catch (error) {
    return { state: sanitizeStudyState(null), persistent: false, error: "Study progress is available for this session only." };
  }
}

export function saveStudyState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitizeStudyState(state)));
    return { persistent: true };
  } catch (error) {
    return { persistent: false, error: "Study progress could not be saved in this browser." };
  }
}
