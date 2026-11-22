import { patterns, additionalPattern, problems, filterProblems, sources, topics, companies, companyTagSource, companyEvidenceUrl, relatedPatterns, resolveTopicPattern } from "./js/catalog.js";
import { lessons } from "./js/lessons/index.js";
import { createPlayer } from "./js/player.js";
import { loadLearningState, saveLearningState } from "./js/storage.js";
import { renderDiagram, escapeHTML as html } from "./js/renderers.js";
import { loadStudyState, saveStudyState, resetStudyProgress, practiceItems } from "./js/study.js";
import { renderQuestion, renderFlashcard } from "./js/practice.js";
import { isVoiceSupported, speakText, stopVoice } from "./js/voice.js";
import { guides } from "./js/guided/index.js";
import { renderGuidedScene } from "./js/guided/render.js";
import { practiceKey } from "./js/practice-key.js";
import { practiceRecallItems, dueRecallItems, saveRecallAttempt, recallSummary } from "./js/recall.js";
import { newRecallAttempt, renderRecallExercise, formatReviewDay } from "./js/recall-view.js";

const $ = (selector) => document.querySelector(selector);
const initial = loadLearningState();
const initialStudy = loadStudyState();
const state = { lesson: null, player: null, trace: null, input: null, exampleIndex: 0, saved: initial.state, study: initialStudy.state, view: "learn", cardIndex: 0, questionIndex: 0, resetIds: null, voice: false, checkpoints: new Map(), renderedSnapshot: null, recallLessonId: null, recallAttempt: null, recallFinished: false };
let toastTimer;

function syncVoiceButton() {
  const supported = isVoiceSupported();
  $("#voiceToggle").disabled = !supported;
  $("#speakStep").disabled = !supported;
  $("#voiceToggle").textContent = supported ? (state.voice ? "Voice: On" : "Voice: Off") : "Voice: N/A";
  $("#voiceToggle").setAttribute("aria-pressed", String(state.voice));
}
function narrationText(snapshot, includeTitle = false) {
  if (snapshot.question) {
    const response = state.checkpoints.get(snapshot.id);
    return response ? `${Number.isInteger(response.answer) ? snapshot.question.feedback[response.answer] : ""} ${snapshot.question.explanation}`
      : `${snapshot.question.prompt} ${snapshot.question.choices.map((choice, i) => `Option ${i + 1}: ${choice}`).join(". ")}`;
  }
  if (snapshot.proof) return snapshot.proof.narration;
  const prefix = includeTitle ? state.lesson.guide ? `${state.lesson.title}. ` : `${state.lesson.storyTitle || state.lesson.title}. ${state.lesson.story.move}. ` : "";
  return `${prefix}${snapshot.phase}. ${snapshot.summary}`;
}
function voiceError(message) {
  state.voice = false;
  state.player?.pause();
  syncVoiceButton();
  showToast(message);
}
function narrateCurrent(includeTitle = false) {
  if (!state.lesson || !state.player) return;
  const snapshot = state.player.snapshots[state.player.state.index];
  if (!speakText(narrationText(snapshot, includeTitle), { onError: voiceError })) {
    showToast("Voice narration is unavailable in this browser.");
  }
}
function createLessonPlayer(trace) {
  return createPlayer(trace.snapshots, renderStep, {
    delay: (snapshot) => state.voice ? 650 : state.lesson.guide ? Math.max(2400, Math.min(7000, snapshot.summary.split(/\s+/).length * 240)) : 1200,
    isBlocked: (snapshot) => Boolean(snapshot.question && !state.checkpoints.has(snapshot.id)),
    beforeAdvance: (snapshot) => {
      if (!state.voice) return;
      return new Promise((resolve) => {
        if (!speakText(narrationText(snapshot), {
          onEnd: resolve, onCancel: resolve, onError: (message) => { voiceError(message); resolve(); }
        })) { voiceError("Narration is unavailable. Continue with the next step."); resolve(); }
      });
    },
    onError: (error) => showToast(`Playback stopped: ${error.message}`)
  });
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function persist() {
  if (!state.lesson || !state.player) return;
  state.saved.lessons[state.lesson.id] = {
    ...(state.saved.lessons[state.lesson.id] ?? {}),
    stepId: state.player.snapshots[state.player.state.index].id,
    exampleIndex: state.exampleIndex, mode: "learn", view: "2d",
    input: ["window", "move", "system"].includes(state.lesson.renderer) ? state.input : null
  };
  const result = saveLearningState(state.saved);
  if (!result.persistent) showToast(result.error);
}
function persistStudy() {
  const result = saveStudyState(state.study);
  if (!result.persistent) showToast(result.error);
}
function setView(view) {
  state.view = view;
  if (view !== "learn") stopVoice();
  $("#landingGuide").classList.toggle("hidden", view !== "learn" || Boolean(state.lesson));
  $("#studyPanel").classList.toggle("hidden", view === "learn");
  $("#problemList").classList.toggle("hidden", view !== "learn");
  $("#systemExtra").classList.toggle("hidden", view !== "learn");
  $("#catalogDock").classList.toggle("hidden", view === "review" || view === "recall");
  document.querySelectorAll("[data-study-view]").forEach((link) => {
    if (link.dataset.studyView === (view === "recall" ? "quiz" : view)) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
function navigate(path) {
  if (location.hash === `#${path}`) route();
  else location.hash = path;
}
function closeStory() {
  stopVoice();
  state.player?.dispose();
  state.player = null;
  state.lesson = null;
  $("#studio").classList.add("hidden");
  $("#landingGuide").classList.toggle("hidden", state.view !== "learn");
  state.renderedSnapshot = null;
  renderCatalog();
}
function route() {
  const [, type, id] = location.hash.slice(1).split("/");
  if (type === "lesson" && Object.hasOwn(lessons, id)) openStory(id);
  else if (type === "problem") {
    const problem = problems.find((problem) => problem.id === Number(id));
    if (problem) openStory(problem.lessonId);
    else { setView("learn"); closeStory(); showToast("That problem is not in this collection."); }
  } else if (type === "pattern") {
    setView("learn");
    closeStory();
    const pattern = [...patterns, additionalPattern].find((pattern) => pattern.id === id);
    resetFilters();
    state.study.filters.collection = "all";
    $("#patternFilter").value = pattern?.id ?? "";
    saveFilters();
    renderCatalog();
  } else if (type === "library") {
    setView("learn");
    state.study.filters.collection = "all";
    saveFilters();
    closeStory();
    $("#catalogDock").scrollIntoView({ block: "start" });
  } else if (type === "recall" || type === "review") {
    if (id && !Object.hasOwn(guides, id)) {
      setView("learn"); closeStory(); showToast("Recall practice is available for the five guided lessons."); return;
    }
    state.recallLessonId = type === "recall" ? id ?? null : null;
    state.recallAttempt = null;
    state.recallFinished = false;
    setView(type);
    closeStory();
    window.scrollTo({ top: 0, behavior: "instant" });
    $("#studyTitle").focus({ preventScroll: true });
  } else if (type === "quiz" || type === "flashcards") {
    state.recallLessonId = null;
    state.recallAttempt = null;
    state.recallFinished = false;
    setView(type === "quiz" && state.study.filters.collection === "guided" ? "recall" : type);
    closeStory();
    window.scrollTo({ top: 0, behavior: "instant" });
    $("#studyTitle").focus({ preventScroll: true });
  } else if (location.hash === "#credits") {
    $("#credits").open = true;
  } else {
    setView("learn");
    closeStory();
    if (type && type !== "learn") showToast("That story is not available. Choose one below.");
  }
}
function resetFilters() {
  for (const id of ["problemSearch", "patternFilter", "topicFilter", "companyFilter"]) $(`#${id}`).value = "";
  syncPatternOptions();
}
function syncPatternOptions() {
  const topic = $("#topicFilter").value;
  const selected = resolveTopicPattern(topic, $("#patternFilter").value);
  const related = relatedPatterns(topic);
  $("#patternFilter").innerHTML = `<option value="">${topic ? "All related patterns" : "All patterns"}</option>${related.map((pattern) => `<option value="${pattern.id}">${html(pattern.name)}</option>`).join("")}`;
  $("#patternFilter").value = selected;
  $("#patternFilterNote").textContent = topic
    ? `${related.length} related coding ${related.length === 1 ? "pattern" : "patterns"} for ${topic}. Some topics use more than one approach.`
    : "Choose a topic to see its related coding patterns.";
}
function saveFilters() {
  state.study.filters = { ...state.study.filters, query: $("#problemSearch").value, topic: $("#topicFilter").value, patternId: $("#patternFilter").value, company: $("#companyFilter").value };
  state.resetIds = null;
  state.recallAttempt = null;
  state.recallFinished = false;
  $("#resetConfirmation").classList.add("hidden");
  persistStudy();
}
function currentMatches() {
  return filterProblems({
    query: $("#problemSearch").value,
    patternId: $("#patternFilter").value,
    topic: $("#topicFilter").value,
    company: $("#companyFilter").value
  }).filter((problem) => state.study.filters.collection !== "guided" || Object.hasOwn(guides, problem.lessonId)).sort((a, b) => {
    if (state.study.filters.collection === "guided") return Object.keys(guides).indexOf(a.lessonId) - Object.keys(guides).indexOf(b.lessonId);
    const order = (id) => [...patterns, additionalPattern].find((pattern) => pattern.id === id).order;
    return order(a.patternId) - order(b.patternId) || a.id - b.id;
  });
}
function guidedCatalog(matches) {
  return matches.map((problem, index) => {
    const lesson = lessons[problem.lessonId];
    return `<article class="story-card guided-course-row" data-problem-id="${problem.id}"><span class="course-number">${String(index + 1).padStart(2, "0")}</span><div><p class="eyebrow">${html(problem.difficulty)} · ${html(lesson.pattern)}</p><h3>${html(problem.title)}</h3><p>${html(lesson.guide.objective)}</p>${state.study.learned.includes(problem.lessonId) ? '<span class="guided-label">Walkthrough finished</span>' : ""}</div><button data-lesson-id="${problem.lessonId}" aria-label="Read ${html(problem.title)}">Start lesson →</button></article>`;
  }).join("");
}
function renderCatalog() {
  const matches = currentMatches();
  const guided = state.study.filters.collection === "guided";
  $("#resultCount").textContent = `${matches.length} of ${guided ? "5 guided lessons" : "75 stories"}`;
  $("#guidedCollection").setAttribute("aria-pressed", String(guided));
  $("#allCollection").setAttribute("aria-pressed", String(!guided));
  $("#collectionNote").textContent = guided ? "Five walkthroughs with prediction pauses and hand-written practice." : "Original library. Guided lessons carry a Guided label.";
  $("#emptyResults").textContent = guided ? "No guided lessons match. Clear the filters or choose Full library to search all 75 problems." : "No stories match. Adjust filters or reset.";
  $("#emptyResults").classList.toggle("hidden", matches.length !== 0);
  const grouped = new Map();
  for (const problem of matches) {
    const pattern = [...patterns, additionalPattern].find((item) => item.id === problem.patternId);
    if (!grouped.has(pattern.id)) grouped.set(pattern.id, { pattern, items: [] });
    grouped.get(pattern.id).items.push(problem);
  }
  $("#problemList").innerHTML = guided ? guidedCatalog(matches) : [...grouped.values()].map(({ pattern, items }) => {
    const learnedInGroup = items.filter((item) => state.study.learned.includes(item.lessonId)).length;
    const rows = items.map((problem) => {
      const learned = state.study.learned.includes(problem.lessonId);
      const companyTags = problem.companies.length
        ? `<details class="company-tags"><summary>${problem.companies.length} companies</summary><p>${problem.companies.map((company) => `<a href="${companyEvidenceUrl(company)}" target="_blank" rel="noopener noreferrer">${html(company)}</a>`).join(" · ")}</p></details>`
        : `<span class="company-tags">No company tags</span>`;
      const guide = lessons[problem.lessonId].guide;
      return `<article class="story-card ${state.lesson?.id === problem.lessonId ? "selected" : ""} ${learned ? "is-learned" : ""}" data-problem-id="${problem.id}"><div class="card-head"><span class="row-num">${problem.id}. ${html(problem.title)}</span><div class="card-badges">${guide ? '<span class="guided-label">Guided</span>' : ""}<span class="row-diff diff-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>${learned ? `<span class="learned-pill">✓ Learned</span>` : ""}</div></div><h4 class="card-story-title">${html(guide?.subtitle ?? problem.storyTitle)}</h4><p class="card-summary">${html(guide?.objective ?? problem.summary)}</p><div class="card-foot"><span class="topic-tag">${html(problem.topic)}</span>${companyTags}<button class="story-row-btn" data-lesson-id="${problem.lessonId}" aria-label="Read ${html(problem.title)}">${guide ? "Start lesson" : "Read story"} →</button></div></article>`;
    }).join("");
    return `<section class="curriculum-group"><h3 class="curriculum-group-head"><span>${html(pattern.name)}</span><span>${learnedInGroup}/${items.length} learned</span></h3><div class="curriculum-grid">${rows}</div></section>`;
  }).join("");
  renderStudySummary(matches);
  if (state.view !== "learn") renderStudyView(matches);
}
function openStory(id, { focus = true } = {}) {
  stopVoice();
  state.player?.dispose();
  state.lesson = lessons[id];
  state.checkpoints.clear();
  state.renderedSnapshot = null;
  if (!state.lesson.guide && state.study.filters.collection === "guided") {
    state.study.filters.collection = "all";
    persistStudy();
  }
  setView("learn");
  state.cardIndex = 0;
  state.questionIndex = 0;
  const remembered = state.saved.lessons[id];
  state.exampleIndex = Math.min(remembered?.exampleIndex ?? 0, state.lesson.examples.length - 1);
  state.input = { ...state.lesson.examples[state.exampleIndex] };
  if (remembered?.input) state.input = { ...state.input, ...remembered.input };
  state.trace = state.lesson.build(state.input);
  state.player = createLessonPlayer(state.trace);
  const index = state.trace.snapshots.findIndex((snapshot) => snapshot.id === remembered?.stepId);
  if (index >= 0) state.player.state.index = index;
  $("#timeline").replaceChildren();
  $("#studio").classList.remove("hidden");
  $("#studio").classList.toggle("guided-lesson", Boolean(state.lesson.guide));
  $("#guidedObjective").classList.toggle("hidden", !state.lesson.guide);
  $("#guidedObjective").textContent = state.lesson.guide?.objective ?? "";
  $("#storyHook").textContent = state.lesson.guide?.subtitle ?? state.lesson.storyTitle ?? state.lesson.title;
  $("#lessonTitle").textContent = state.lesson.title;
  $("#lessonPattern").textContent = state.lesson.pattern;
  $("#storyProblem").textContent = state.lesson.story.problem;
  $("#storyMove").textContent = state.lesson.story.move;
  $("#storyWatch").textContent = state.lesson.story.watch;
  $("#complexity").textContent = state.lesson.complexity;
  const problem = problems.find((problem) => problem.lessonId === id);
  if (problem && state.study.learningCurrent !== id) { state.study.learningCurrent = id; persistStudy(); }
  $("#learningActions").classList.toggle("hidden", !problem);
  $("#readerProgress").textContent = state.study.learned.includes(id) ? "You marked this story learned. Revisit the walkthrough anytime." : "Can you explain the key move? Mark it learned when you are ready.";
  $("#originalProblem").classList.toggle("hidden", !problem);
  if (problem) $("#originalProblem").href = problem.url;
  const pattern = [...patterns, additionalPattern].find((pattern) => pattern.id === problem?.patternId);
  $("#patternNotes").classList.toggle("hidden", !pattern);
  if (pattern) $("#patternOverview").innerHTML = `<p>${html(pattern.description)}</p><p><b>Look for:</b> ${html(pattern.cue)}</p><p><b>Example:</b> ${html(pattern.example)}</p><p>${html(pattern.caveat)}</p>`;
  if (state.lesson.guide) $("#patternOverview").innerHTML = `<p><b>${html(state.lesson.pattern)}</b></p><p>${html(state.lesson.guide.proof.invariant)}</p><p>${html(state.lesson.guide.proof.reason)}</p>`;
  $("#exampleSelect").innerHTML = state.lesson.examples.map((example, index) => `<option value="${index}">${html(example.label)}</option>`).join("");
  syncInputs();
  $("#inputError").textContent = "";
  $("#customExamples").open = false;
  $("#customExamples").classList.toggle("hidden", !["window", "move", "system"].includes(state.lesson.renderer));
  $("#algorithmInput").classList.toggle("hidden", !["window", "move"].includes(state.lesson.renderer));
  $("#systemInput").classList.toggle("hidden", state.lesson.renderer !== "system");
  $("#kLabel").classList.toggle("hidden", state.lesson.renderer !== "window");
  $("#numberHelp").textContent = state.lesson.renderer === "window" ? "1–12 integers from −10000 to 10000. k must fit the array." : "0–12 integers from −10000 to 10000. An empty field means an empty array.";
  renderCatalog();
  renderPractice();
  renderStep({ ...state.player.state, snapshot: state.player.snapshots[state.player.state.index] }, { speak: false });
  if (state.voice && focus) narrateCurrent(true);
  if (focus) {
    $("#lessonTitle").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
function syncInputs() {
  $("#exampleSelect").value = state.exampleIndex;
  $("#numbersInput").value = state.input.nums?.join(", ") ?? "";
  $("#kInput").value = state.input.k ?? 1;
  $("#metadataSelect").value = state.input.metadata ?? "miss";
  $("#mediaSelect").value = state.input.media ?? "miss";
}
function renderStep(playerState, { speak = true } = {}) {
  const snapshot = playerState.snapshot;
  const changed = state.renderedSnapshot !== snapshot;
  const hadFrame = Boolean(state.renderedSnapshot);
  if (changed) stopVoice();
  $("#stepCounter").textContent = `${state.lesson.guide ? "STEP" : "PANEL"} ${playerState.index + 1} OF ${state.trace.snapshots.length}`;
  $("#phase").textContent = snapshot.chapter ? `${snapshot.chapter} · ${state.input.label}` : state.input.label;
  $("#stepHeading").textContent = snapshot.phase;
  $("#stepSummary").textContent = snapshot.question ? "Pause before the next update. Try a prediction, or reveal the explanation." : snapshot.summary;
  $("#scrubber").max = state.trace.snapshots.length - 1;
  $("#scrubber").value = playerState.index;
  $("#scrubber").setAttribute("aria-valuetext", `${playerState.index + 1}: ${snapshot.phase}`);
  $("#playButton").textContent = playerState.playing ? "Pause" : "Play";
  $("#nextButton").textContent = state.lesson.guide ? "Next step →" : "Next panel →";
  $("#previousButton").disabled = playerState.index === 0;
  $("#nextButton").disabled = playerState.index === state.trace.snapshots.length - 1;
  const line = snapshot.line ?? (state.lesson.renderer === "window" ? (snapshot.state.outgoing === null ? 0 : 3) : 0);
  $("#code").innerHTML = state.lesson.lines.map((code, index) => `<span class="code-line ${index === line ? "current-line" : ""}">${html(code)}</span>`).join("");
  if (!$("#timeline").children.length) $("#timeline").innerHTML = state.trace.snapshots.map((step, index) => `<button data-step="${index}" aria-label="Step ${index + 1}: ${html(step.phase)}">${index + 1}</button>`).join("");
  [...$("#timeline").children].forEach((button, index) => {
    button.classList.toggle("current", index === playerState.index);
    if (index === playerState.index) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  $("#scene").classList.toggle("guided-scene", Boolean(snapshot.guide));
  $("#scene").classList.toggle("generic-scene", !snapshot.guide && state.lesson.renderer === "story");
  if (snapshot.guide) {
    if (changed) renderGuidedScene($("#scene"), snapshot, { animate: Boolean(state.renderedSnapshot) });
  } else if (changed) $("#scene").innerHTML = renderDiagram(state.lesson.renderer, snapshot);
  state.renderedSnapshot = snapshot;
  renderPrediction(snapshot);
  $("#guidedProof").classList.toggle("hidden", !snapshot.proof);
  $("#guidedProof").innerHTML = snapshot.proof ? `<h3>Why this works</h3><p>${html(snapshot.proof.invariant)}</p><p>${html(snapshot.proof.reason)}</p><dl><dt>Time</dt><dd>${html(snapshot.proof.time)}</dd><dt>Extra space</dt><dd>${html(snapshot.proof.space)}</dd></dl>` : "";
  $("#markLearned").disabled = Boolean(state.lesson.guide && !snapshot.proof);
  $("#markLearned").textContent = state.lesson.guide ? "Continue to recall practice" : "Mark learned & continue";
  if (state.lesson.guide) $("#readerProgress").textContent = snapshot.proof ? "The walkthrough is finished. Next: complete a missing step, then try without the guide. This is not a recall score yet." : "The final step explains correctness and complexity. Predictions repeat when you restart.";
  if (snapshot.guide && changed && hadFrame) {
    const target = snapshot.proof ? $("#guidedProof") : snapshot.question ? $("#predictionSection") : $("#scene");
    const top = target.getBoundingClientRect().top;
    const headerBottom = $(".topbar").getBoundingClientRect().bottom;
    if (top < headerBottom + 8 || top > window.innerHeight - 120) {
      window.scrollBy({ top: top - headerBottom - 12, behavior: "instant" });
    }
  }
  if (!playerState.playing && !changed) stopVoice();
  if (speak && state.voice && changed && !playerState.playing) narrateCurrent(false);
  persist();
}
function renderPrediction(snapshot) {
  $("#predictionSection").classList.toggle("hidden", !snapshot.question);
  const pending = snapshot.question && !state.checkpoints.has(snapshot.id);
  $("#playButton").disabled = Boolean(pending);
  $("#nextButton").disabled = Boolean(pending) || state.player.state.index === state.trace.snapshots.length - 1;
  if (!snapshot.question) { $("#predictionExercise").replaceChildren(); return; }
  $("#showPrediction").classList.toggle("hidden", !pending);
  const response = state.checkpoints.get(snapshot.id);
  renderQuestion($("#predictionExercise"), { questions: [snapshot.question] }, 0, {
    prefix: "prediction", heading: "Predict the next move", checkLabel: "Check prediction", showNext: false,
    answer: response?.answer, revealed: response?.revealed,
    onAnswer: (answer) => { state.checkpoints.set(snapshot.id, { answer }); renderPrediction(snapshot); if (state.voice) narrateCurrent(); },
    onRetry: () => { state.checkpoints.delete(snapshot.id); renderPrediction(snapshot); },
    onNext: () => state.player.next()
  });
}
function rebuild(input, exampleIndex = state.exampleIndex) {
  const trace = state.lesson.build(input);
  state.player.dispose();
  stopVoice();
  state.checkpoints.clear();
  state.renderedSnapshot = null;
  state.input = input;
  state.exampleIndex = exampleIndex;
  state.trace = trace;
  state.player = createLessonPlayer(trace);
  $("#timeline").replaceChildren();
  $("#inputError").textContent = "";
  syncInputs();
  renderStep({ ...state.player.state, snapshot: trace.snapshots[0] });
}
function renderPractice() {
  $("#quizSection").classList.toggle("hidden", !$("#quizOptIn").checked);
  $("#flashcardSection").classList.toggle("hidden", !$("#flashcardOptIn").checked);
  if ($("#quizOptIn").checked) renderQuiz(); else $("#quizSection").replaceChildren();
  if ($("#flashcardOptIn").checked) renderCard(); else $("#flashcardSection").replaceChildren();
}
function questionOptions(lessonId, index, redraw, next, prefix = "") {
  const key = practiceKey(lessons[lessonId], index);
  return {
    prefix, answer: state.study.quiz.answers[key],
    onAnswer: (answer) => { state.study.quiz.answers[key] = answer; persistStudy(); renderStudySummary(currentMatches()); redraw(); },
    onRetry: () => { delete state.study.quiz.answers[key]; persistStudy(); renderStudySummary(currentMatches()); redraw(); },
    onNext: next
  };
}
function cardOptions(lessonId, index, redraw, next, prefix = "") {
  const key = practiceKey(lessons[lessonId], index);
  return {
    prefix, known: state.study.flashcards.known.includes(key),
    onRemember: () => {
      if (!state.study.flashcards.known.includes(key)) state.study.flashcards.known.push(key);
      persistStudy(); renderStudySummary(currentMatches()); next();
    },
    onAgain: () => { state.study.flashcards.known = state.study.flashcards.known.filter((item) => item !== key); persistStudy(); renderStudySummary(currentMatches()); redraw(); },
    onNext: next
  };
}
function renderCard() {
  renderFlashcard($("#flashcardSection"), state.lesson, state.cardIndex, cardOptions(state.lesson.id, state.cardIndex, renderCard, () => { state.cardIndex = (state.cardIndex + 1) % state.lesson.cards.length; renderCard(); }));
}
function renderQuiz() {
  renderQuestion($("#quizSection"), state.lesson, state.questionIndex, questionOptions(state.lesson.id, state.questionIndex, renderQuiz, () => { state.questionIndex = (state.questionIndex + 1) % state.lesson.questions.length; renderQuiz(); }));
}
function nextLearningStory(matches) {
  return matches.find((problem) => problem.lessonId === state.study.learningCurrent && !state.study.learned.includes(problem.lessonId))
    ?? matches.find((problem) => !state.study.learned.includes(problem.lessonId)) ?? matches[0];
}
function renderStudySummary(matches) {
  const learned = matches.filter((problem) => state.study.learned.includes(problem.lessonId)).length;
  const questions = practiceItems(matches, "quiz");
  const cards = practiceItems(matches, "flashcards");
  const answered = questions.filter((item) => Object.hasOwn(state.study.quiz.answers, item.key)).length;
  const remembered = cards.filter((item) => state.study.flashcards.known.includes(item.key)).length;
  $("#studySetTitle").textContent = `${state.study.filters.topic || "Your selected stories"} · ${matches.length} ${matches.length === 1 ? "story" : "stories"}`;
  $("#learningProgress").textContent = `${learned}/${matches.length} ${state.study.filters.collection === "guided" ? "walkthroughs finished" : "marked learned"} · ${answered}/${questions.length} quiz answers · ${remembered}/${cards.length} cards reviewed`;
  const next = nextLearningStory(matches);
  $("#continueLearning").disabled = !next;
  $("#continueLearning").textContent = learned === matches.length && matches.length ? "Review stories" : matches.some((problem) => state.saved.lessons[problem.lessonId]) || learned ? "Continue learning" : "Start learning";
  $("#resetStudy").disabled = !matches.length;
  const selected = new Set(matches.map((problem) => problem.lessonId));
  const scoped = { records: Object.fromEntries(Object.entries(state.study.recall.records).filter(([key]) => selected.has(key.split(":")[0]))) };
  const stats = recallSummary(scoped);
  $("#recallProgress").textContent = `${stats.practiced} recall prompts self-checked · ${stats.delayedIndependent} reported unaided recall on a later day · ${stats.due} due`;
  $("#reviewDueCount").textContent = `(${recallSummary(state.study.recall).due})`;
}
function renderStudyView(matches = currentMatches()) {
  $("#startRecallFromCards").classList.add("hidden");
  if (state.view === "recall" || state.view === "review") { renderRecallView(matches); return; }
  const mode = state.view;
  const items = practiceItems(matches, mode);
  $("#studyTitle").textContent = mode === "quiz" ? "Quiz your understanding" : "Recall the key move";
  if (!items.length) {
    $("#studyPosition").textContent = "No practice items in this set";
    $("#studyLessonName").textContent = "";
    $("#studyExercise").replaceChildren();
    $("#studyComplete").textContent = "";
    $("#studyReadStory").disabled = true;
    $("#studyPrevious").disabled = true;
    $("#studyNext").disabled = true;
    return;
  }
  let index = items.findIndex((item) => item.key === state.study[mode].current);
  if (index < 0) {
    index = items.findIndex((item) => mode === "quiz" ? !Object.hasOwn(state.study.quiz.answers, item.key) : !state.study.flashcards.known.includes(item.key));
    if (index < 0) index = 0;
    state.study[mode].current = items[index].key;
    persistStudy();
  }
  const item = items[index];
  const lesson = lessons[item.lessonId];
  $("#studyPosition").textContent = `${mode === "quiz" ? "Question" : "Card"} ${index + 1} of ${items.length} · ${matches.length} stories`;
  $("#studyLessonName").textContent = lesson.storyTitle ? `${lesson.storyTitle} · ${lesson.title}` : lesson.title;
  $("#studyReadStory").disabled = false;
  $("#studyPrevious").disabled = items.length < 2;
  $("#studyNext").disabled = items.length < 2;
  const next = () => movePractice(1);
  const redraw = () => renderStudyView();
  if (mode === "quiz") renderQuestion($("#studyExercise"), lesson, item.index, questionOptions(item.lessonId, item.index, redraw, next, "study"));
  else renderFlashcard($("#studyExercise"), lesson, item.index, cardOptions(item.lessonId, item.index, redraw, next, "study"));
  $("#startRecallFromCards").classList.toggle("hidden", mode !== "flashcards" || !lesson.guide);
  const done = items.every((entry) => mode === "quiz" ? Object.hasOwn(state.study.quiz.answers, entry.key) : state.study.flashcards.known.includes(entry.key));
  $("#studyComplete").textContent = mode === "flashcards" && lesson.guide ? "Try recalling before revealing. Marking a card reviewed is not a delayed recall check; use the practice link below for self-checks and review dates." : done ? "You have practiced this set. Review any item, or reset this study set to start fresh." : "Practice at your own pace. Your position and progress are saved in this browser.";
}
function recallDeck(matches = currentMatches()) {
  if (state.view === "review") return dueRecallItems(state.study.recall);
  return practiceRecallItems(state.recallLessonId ? [{ lessonId: state.recallLessonId }] : matches);
}
function renderRecallView(matches = currentMatches()) {
  $("#startRecallFromCards").classList.add("hidden");
  const items = recallDeck(matches);
  const review = state.view === "review";
  const stats = recallSummary(state.study.recall);
  $("#studyTitle").textContent = review ? "Recall after a delay" : "Reconstruct it, then compare";
  $("#studyLessonName").textContent = "";
  $("#studyReadStory").disabled = true;
  if (!items.length || state.recallFinished) {
    $("#studyPosition").textContent = state.recallFinished ? "End of this practice set" : review ? "Nothing due today" : "No practice items in this set";
    $("#studyPrevious").disabled = true;
    $("#studyNext").disabled = true;
    $("#studyExercise").innerHTML = `<div class="recall-empty"><p>${review ? "Only scheduled transfer and explanation prompts appear here. Worked-step completion is practice with support, not a delayed recall check." : state.recallFinished ? "You reached the end of this set. Only saved self-checks count as attempts; watching and skipping do not." : "Choose guided lessons in the collection filters, or return to Learn."}</p><p>${stats.nextDue ? `Next scheduled review: <b>${formatReviewDay(stats.nextDue)}</b>.` : "No future review is scheduled yet."}</p>${state.recallFinished ? '<button id="repeatRecall">Practice this set again</button>' : ""}<a href="#/learn">Back to learning</a></div>`;
    $("#studyComplete").textContent = "A familiar-looking answer is not proof of retention. Later, unaided recall is recorded separately.";
    $("#repeatRecall")?.addEventListener("click", () => {
      state.recallFinished = false;
      state.recallAttempt = null;
      state.study.recall.current = items[0].key;
      renderRecallView();
    });
    return;
  }
  let index = items.findIndex((item) => item.key === state.study.recall.current);
  if (index < 0) index = 0;
  const item = items[index];
  if (state.study.recall.current !== item.key) {
    state.study.recall.current = item.key;
    persistStudy();
  }
  if (state.recallAttempt?.key !== item.key) state.recallAttempt = newRecallAttempt(item.key);
  $("#studyPosition").textContent = review ? `${items.length} due · mixed across practiced lessons` : `Task ${index + 1} of ${items.length} · support gradually removed`;
  $("#studyLessonName").textContent = state.recallAttempt.revealed ? `${lessons[item.lessonId].title} · ${lessons[item.lessonId].pattern}` : "";
  $("#studyReadStory").disabled = !state.recallAttempt.revealed;
  $("#studyPrevious").disabled = review || index === 0;
  $("#studyNext").disabled = false;
  renderRecallExercise($("#studyExercise"), item, state.recallAttempt, {
    review,
    onChange: () => renderRecallView(),
    onSave: (attempt) => {
      state.study.recall = saveRecallAttempt(state.study.recall, item.key, attempt);
      persistStudy();
      state.recallAttempt = null;
      if (!review) {
        if (index + 1 < items.length) state.study.recall.current = items[index + 1].key;
        else state.recallFinished = true;
        persistStudy();
      }
      renderStudySummary(currentMatches());
      renderRecallView();
      $("#studyTitle").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  });
  $("#studyComplete").textContent = review ? "Pattern and lesson labels stay hidden until comparison. Only self-checks and review dates are saved in this browser." : state.recallAttempt.revealed ? "Only self-checks and review dates are saved. Your scratch notes stay on this page." : "";
}
function moveRecall(offset) {
  const items = recallDeck();
  const index = items.findIndex((item) => item.key === state.study.recall.current);
  if (!items.length || index < 0) return;
  if (index + offset >= items.length) {
    if (state.view === "review") { state.study.recall.current = items[0].key; }
    else state.recallFinished = true;
  } else if (index + offset >= 0) state.study.recall.current = items[index + offset].key;
  state.recallAttempt = null;
  persistStudy();
  renderRecallView();
  $("#studyTitle").focus({ preventScroll: true });
}
function movePractice(offset) {
  if (state.view === "recall" || state.view === "review") { moveRecall(offset); return; }
  const items = practiceItems(currentMatches(), state.view);
  if (!items.length) return;
  const index = items.findIndex((item) => item.key === state.study[state.view].current);
  state.study[state.view].current = items[(Math.max(index, 0) + offset + items.length) % items.length].key;
  persistStudy();
  renderStudyView();
}

$("#libraryToggle").addEventListener("click", () => navigate("/library"));
for (const [id, collection] of [["guidedCollection", "guided"], ["allCollection", "all"]]) $(`#${id}`).addEventListener("click", () => {
  state.study.filters.collection = collection;
  if ((state.view === "quiz" || state.view === "recall") && !state.recallLessonId) {
    state.recallAttempt = null;
    state.recallFinished = false;
    setView(collection === "guided" ? "recall" : "quiz");
  }
  saveFilters();
  renderCatalog();
});
$("#voiceToggle").addEventListener("click", () => {
  const playing = state.player?.state.playing;
  state.player?.pause();
  stopVoice();
  state.voice = !state.voice;
  syncVoiceButton();
  if (playing) state.player.play();
  else if (state.voice) narrateCurrent(true);
});
$("#speakStep").addEventListener("click", () => { state.player?.pause(); narrateCurrent(state.player?.state.index === 0); });
$("#showPrediction").addEventListener("click", () => {
  const snapshot = state.player.snapshots[state.player.state.index];
  state.checkpoints.set(snapshot.id, { revealed: true });
  renderPrediction(snapshot);
  $("#nextButton").focus({ preventScroll: true });
  if (state.voice) narrateCurrent();
});
$("#problemList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-lesson-id]");
  if (button) navigate(`/lesson/${button.dataset.lessonId}`);
});
$("#problemSearch").addEventListener("input", () => { saveFilters(); renderCatalog(); });
for (const id of ["patternFilter", "topicFilter", "companyFilter"]) $(`#${id}`).addEventListener("change", () => {
  if (id === "topicFilter") syncPatternOptions();
  saveFilters(); renderCatalog();
});
$("#clearSearch").addEventListener("click", () => { resetFilters(); saveFilters(); renderCatalog(); $("#problemSearch").focus(); });
$("#closeStory").addEventListener("click", () => { navigate("/"); $("#problemSearch").focus(); });
$("#startSystem").addEventListener("click", () => navigate("/lesson/image-feed-read"));
$("#continueLearning").addEventListener("click", () => {
  const next = nextLearningStory(currentMatches());
  if (next) navigate(`/lesson/${next.lessonId}`);
});
$("#markLearned").addEventListener("click", () => {
  if (!state.study.learned.includes(state.lesson.id)) state.study.learned.push(state.lesson.id);
  persistStudy();
  if (state.lesson.guide) { navigate(`/recall/${state.lesson.id}`); return; }
  const matches = currentMatches();
  const next = matches.find((problem) => !state.study.learned.includes(problem.lessonId));
  if (next) navigate(`/lesson/${next.lessonId}`);
  else { renderCatalog(); $("#readerProgress").textContent = "This study set is marked learned. Try a quiz or flashcards, or revisit any story."; showToast("Your study set is marked learned. Practice whenever you are ready."); }
});
$("#studyPrevious").addEventListener("click", () => movePractice(-1));
$("#studyNext").addEventListener("click", () => movePractice(1));
$("#studyReadStory").addEventListener("click", () => {
  const key = state.view === "recall" || state.view === "review" ? state.study.recall.current : state.study[state.view].current;
  if (key) navigate(`/lesson/${key.split(":")[0]}`);
});
$("#startRecallFromCards").addEventListener("click", () => {
  const key = state.study.flashcards.current;
  if (key) navigate(`/recall/${key.split(":")[0]}`);
});
$("#resetStudy").addEventListener("click", () => {
  state.resetIds = currentMatches().map((problem) => problem.lessonId);
  $("#resetMessage").textContent = `Reset walkthroughs, quiz answers, flashcards, recall self-checks, and scheduled reviews for ${state.resetIds.length === 1 ? "this story" : `these ${state.resetIds.length} stories`}? Other study progress and your filters will stay.`;
  $("#resetConfirmation").classList.remove("hidden");
  $("#confirmResetStudy").focus({ preventScroll: true });
});
$("#cancelResetStudy").addEventListener("click", () => { state.resetIds = null; $("#resetConfirmation").classList.add("hidden"); $("#resetStudy").focus(); });
$("#confirmResetStudy").addEventListener("click", () => {
  const ids = state.resetIds;
  if (!ids) return;
  state.study = resetStudyProgress(state.study, ids);
  state.recallAttempt = null;
  state.recallFinished = false;
  for (const id of ids) delete state.saved.lessons[id];
  persistStudy();
  const result = saveLearningState(state.saved);
  if (!result.persistent) showToast(result.error);
  state.resetIds = null;
  $("#resetConfirmation").classList.add("hidden");
  if (state.lesson && ids.includes(state.lesson.id)) openStory(state.lesson.id);
  else renderCatalog();
  $("#resetStudy").focus({ preventScroll: true });
});
$("#previousButton").addEventListener("click", () => state.player.previous());
$("#nextButton").addEventListener("click", () => { state.player.pause(); state.player.next(); });
$("#playButton").addEventListener("click", () => state.player.state.playing ? state.player.pause() : state.player.play());
$("#resetButton").addEventListener("click", () => { stopVoice(); state.checkpoints.clear(); state.player.reset(); });
$("#scrubber").addEventListener("input", (event) => state.player.seek(Number(event.target.value)));
$("#timeline").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-step]");
  if (button) state.player.seek(Number(button.dataset.step));
});
$("#exampleSelect").addEventListener("change", () => {
  const index = Number($("#exampleSelect").value);
  rebuild({ ...state.lesson.examples[index] }, index);
});
$("#applyNumbers").addEventListener("click", () => {
  const text = $("#numbersInput").value.trim();
  const parts = text ? text.split(",").map((value) => value.trim()) : [];
  if (parts.some((part) => !/^-?\d+$/.test(part))) { $("#inputError").textContent = "Use comma-separated integers; do not leave blank entries."; return; }
  const valid = state.lesson.validate(parts.map(Number), Number($("#kInput").value));
  if (valid.error) { $("#inputError").textContent = valid.error; return; }
  rebuild({ ...valid.value, label: "Your example" });
});
$("#applyScenario").addEventListener("click", () => rebuild({ metadata: $("#metadataSelect").value, media: $("#mediaSelect").value, label: "Your scenario" }));
for (const id of ["quizOptIn", "flashcardOptIn"]) $(`#${id}`).addEventListener("change", () => {
  if (state.player?.state.playing) state.player.pause();
  renderPractice();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { state.player?.pause(); stopVoice(); }
  else {
    renderStudySummary(currentMatches());
    if (state.view === "review") renderRecallView();
  }
});
document.addEventListener("keydown", (event) => {
  if (!state.player || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest("input, select, textarea, button, a, summary")) return;
  if (event.key === "ArrowRight") { event.preventDefault(); state.player.pause(); state.player.next(); }
  else if (event.key === "ArrowLeft") { event.preventDefault(); state.player.previous(); }
  else if (event.key === " ") { event.preventDefault(); state.player.state.playing ? state.player.pause() : state.player.play(); }
});
window.addEventListener("hashchange", route);
$("#sourceList").innerHTML = sources.map((source) => `<p><a href="${source.url}" target="_blank" rel="noopener noreferrer">${html(source.name)} ↗</a><span>${html(source.role)}</span></p>`).join("");
$("#topicFilter").innerHTML = `<option value="">All topics</option>${topics.map((topic) => `<option value="${html(topic)}">${html(topic)}</option>`).join("")}`;
$("#companyFilter").innerHTML = `<option value="">All companies</option>${companies.map((company) => `<option value="${html(company)}">${html(company)}</option>`).join("")}`;
$("#problemSearch").value = state.study.filters.query;
$("#topicFilter").value = state.study.filters.topic;
$("#companyFilter").value = state.study.filters.company;
syncPatternOptions();
$("#patternFilter").value = state.study.filters.patternId;
$("#companyTagSource").href = companyTagSource.url;
syncVoiceButton();
setView("learn");
renderCatalog();
route();
if (!initial.persistent) showToast(initial.error);
if (!initialStudy.persistent) showToast(initialStudy.error);
