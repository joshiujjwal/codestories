import { patterns, additionalPattern, problems, filterProblems, sources, topics, companies, companyTagSource, companyEvidenceUrl, relatedPatterns, resolveTopicPattern } from "./js/catalog.js";
import { lessons } from "./js/lessons/index.js";
import { createPlayer } from "./js/player.js";
import { loadLearningState, saveLearningState } from "./js/storage.js";
import { renderDiagram, escapeHTML as html } from "./js/renderers.js";
import { loadStudyState, saveStudyState, resetStudyProgress, practiceItems } from "./js/study.js";
import { renderQuestion, renderFlashcard } from "./js/practice.js";
import { isVoiceSupported, speakText, stopVoice } from "./js/voice.js";

const $ = (selector) => document.querySelector(selector);
const initial = loadLearningState();
const initialStudy = loadStudyState();
const state = { lesson: null, player: null, trace: null, input: null, exampleIndex: 0, saved: initial.state, study: initialStudy.state, view: "learn", cardIndex: 0, questionIndex: 0, resetIds: null, voice: false };
let toastTimer;

function syncVoiceButton() {
  const supported = isVoiceSupported();
  $("#voiceToggle").disabled = !supported;
  $("#speakStep").disabled = !supported;
  $("#voiceToggle").textContent = supported ? (state.voice ? "Voice: On" : "Voice: Off") : "Voice: N/A";
  $("#voiceToggle").setAttribute("aria-pressed", String(state.voice));
}
function narrateCurrent(includeTitle = false) {
  if (!state.lesson || !state.player) return;
  const snapshot = state.player.snapshots[state.player.state.index];
  const prefix = includeTitle ? `${state.lesson.storyTitle || state.lesson.title}. ${state.lesson.story.move}. ` : "";
  if (!speakText(`${prefix}${snapshot.phase}. ${snapshot.summary}`)) {
    showToast("Voice narration is unavailable in this browser.");
  }
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
  $("#libraryToggle").setAttribute("aria-pressed", String(view === "learn" && !state.lesson));
  document.querySelectorAll("[data-study-view]").forEach((link) => {
    if (link.dataset.studyView === view) link.setAttribute("aria-current", "page");
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
  $("#libraryToggle").setAttribute("aria-pressed", String(state.view === "learn"));
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
    $("#patternFilter").value = pattern?.id ?? "";
    saveFilters();
    renderCatalog();
  } else if (type === "quiz" || type === "flashcards") {
    setView(type);
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
  state.study.filters = { query: $("#problemSearch").value, topic: $("#topicFilter").value, patternId: $("#patternFilter").value, company: $("#companyFilter").value };
  state.resetIds = null;
  $("#resetConfirmation").classList.add("hidden");
  persistStudy();
}
function currentMatches() {
  return filterProblems({
    query: $("#problemSearch").value,
    patternId: $("#patternFilter").value,
    topic: $("#topicFilter").value,
    company: $("#companyFilter").value
  }).sort((a, b) => {
    const order = (id) => [...patterns, additionalPattern].find((pattern) => pattern.id === id).order;
    return order(a.patternId) - order(b.patternId) || a.id - b.id;
  });
}
function renderCatalog() {
  const matches = currentMatches();
  $("#resultCount").textContent = `${matches.length} of 75 stories`;
  $("#libraryCountBadge").textContent = `(${matches.length})`;
  $("#emptyResults").classList.toggle("hidden", matches.length !== 0);
  const grouped = new Map();
  for (const problem of matches) {
    const pattern = [...patterns, additionalPattern].find((item) => item.id === problem.patternId);
    if (!grouped.has(pattern.id)) grouped.set(pattern.id, { pattern, items: [] });
    grouped.get(pattern.id).items.push(problem);
  }
  $("#problemList").innerHTML = [...grouped.values()].map(({ pattern, items }) => {
    const learnedInGroup = items.filter((item) => state.study.learned.includes(item.lessonId)).length;
    const rows = items.map((problem) => {
      const learned = state.study.learned.includes(problem.lessonId);
      const companyTags = problem.companies.length
        ? `<details class="company-tags"><summary>${problem.companies.length} companies</summary><p>${problem.companies.map((company) => `<a href="${companyEvidenceUrl(company)}" target="_blank" rel="noopener noreferrer">${html(company)}</a>`).join(" · ")}</p></details>`
        : `<span class="company-tags">No company tags</span>`;
      return `<article class="story-card ${state.lesson?.id === problem.lessonId ? "selected" : ""} ${learned ? "is-learned" : ""}" data-problem-id="${problem.id}"><div class="card-head"><span class="row-num">${problem.id}. ${html(problem.title)}</span><div class="card-badges"><span class="row-diff diff-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>${learned ? `<span class="learned-pill">✓ Learned</span>` : ""}</div></div><h4 class="card-story-title">${html(problem.storyTitle)}</h4><p class="card-summary">${html(problem.summary)}</p><div class="card-foot"><span class="topic-tag">${html(problem.topic)}</span>${companyTags}<button class="story-row-btn" data-lesson-id="${problem.lessonId}" aria-label="Read ${html(problem.title)}">Read story →</button></div></article>`;
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
  setView("learn");
  state.cardIndex = 0;
  state.questionIndex = 0;
  const remembered = state.saved.lessons[id];
  state.exampleIndex = Math.min(remembered?.exampleIndex ?? 0, state.lesson.examples.length - 1);
  state.input = { ...state.lesson.examples[state.exampleIndex] };
  if (remembered?.input) state.input = { ...state.input, ...remembered.input };
  state.trace = state.lesson.build(state.input);
  state.player = createPlayer(state.trace.snapshots, renderStep);
  const index = state.trace.snapshots.findIndex((snapshot) => snapshot.id === remembered?.stepId);
  if (index >= 0) state.player.state.index = index;
  $("#timeline").replaceChildren();
  $("#studio").classList.remove("hidden");
  $("#storyHook").textContent = state.lesson.storyTitle || state.lesson.title;
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
  $("#stepCounter").textContent = `PANEL ${playerState.index + 1} OF ${state.trace.snapshots.length}`;
  $("#phase").textContent = state.input.label;
  $("#stepHeading").textContent = snapshot.phase;
  $("#stepSummary").textContent = snapshot.summary;
  $("#scrubber").max = state.trace.snapshots.length - 1;
  $("#scrubber").value = playerState.index;
  $("#scrubber").setAttribute("aria-valuetext", `${playerState.index + 1}: ${snapshot.phase}`);
  $("#playButton").textContent = playerState.playing ? "Pause" : "Play";
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
  $("#scene").innerHTML = renderDiagram(state.lesson.renderer, snapshot);
  $("#scene").classList.toggle("generic-scene", state.lesson.renderer === "story");
  if (speak && state.voice) narrateCurrent(false);
  persist();
}
function rebuild(input, exampleIndex = state.exampleIndex) {
  const trace = state.lesson.build(input);
  state.player.dispose();
  state.input = input;
  state.exampleIndex = exampleIndex;
  state.trace = trace;
  state.player = createPlayer(trace.snapshots, renderStep);
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
  const key = `${lessonId}:${index}`;
  return {
    prefix, answer: state.study.quiz.answers[key],
    onAnswer: (answer) => { state.study.quiz.answers[key] = answer; persistStudy(); renderStudySummary(currentMatches()); redraw(); },
    onRetry: () => { delete state.study.quiz.answers[key]; persistStudy(); renderStudySummary(currentMatches()); redraw(); },
    onNext: next
  };
}
function cardOptions(lessonId, index, redraw, next, prefix = "") {
  const key = `${lessonId}:${index}`;
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
  $("#learningProgress").textContent = `${learned}/${matches.length} marked learned · ${answered}/${questions.length} quiz answers · ${remembered}/${cards.length} cards remembered`;
  const next = nextLearningStory(matches);
  $("#continueLearning").disabled = !next;
  $("#continueLearning").textContent = learned === matches.length && matches.length ? "Review stories" : matches.some((problem) => state.saved.lessons[problem.lessonId]) || learned ? "Continue learning" : "Start learning";
  $("#resetStudy").disabled = !matches.length;
}
function renderStudyView(matches = currentMatches()) {
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
  const done = items.every((entry) => mode === "quiz" ? Object.hasOwn(state.study.quiz.answers, entry.key) : state.study.flashcards.known.includes(entry.key));
  $("#studyComplete").textContent = done ? "You have practiced this set. Review any item, or reset this study set to start fresh." : "Practice at your own pace. Your position and progress are saved in this browser.";
}
function movePractice(offset) {
  const items = practiceItems(currentMatches(), state.view);
  if (!items.length) return;
  const index = items.findIndex((item) => item.key === state.study[state.view].current);
  state.study[state.view].current = items[(Math.max(index, 0) + offset + items.length) % items.length].key;
  persistStudy();
  renderStudyView();
}

$("#libraryToggle").addEventListener("click", () => { navigate("/"); $("#problemSearch").focus(); });
$("#voiceToggle").addEventListener("click", () => {
  state.voice = !state.voice;
  syncVoiceButton();
  if (state.voice) narrateCurrent(true);
  else stopVoice();
});
$("#speakStep").addEventListener("click", () => narrateCurrent(state.player?.state.index === 0));
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
  const matches = currentMatches();
  const next = matches.find((problem) => !state.study.learned.includes(problem.lessonId));
  if (next) navigate(`/lesson/${next.lessonId}`);
  else { renderCatalog(); $("#readerProgress").textContent = "This study set is marked learned. Try a quiz or flashcards, or revisit any story."; showToast("Your study set is marked learned. Practice whenever you are ready."); }
});
$("#studyPrevious").addEventListener("click", () => movePractice(-1));
$("#studyNext").addEventListener("click", () => movePractice(1));
$("#studyReadStory").addEventListener("click", () => navigate(`/lesson/${state.study[state.view].current.split(":")[0]}`));
$("#resetStudy").addEventListener("click", () => {
  state.resetIds = currentMatches().map((problem) => problem.lessonId);
  $("#resetMessage").textContent = `Reset learning, quiz answers, flashcard recall, and walkthrough positions for ${state.resetIds.length === 1 ? "this story" : `these ${state.resetIds.length} stories`}? Other study progress and your filters will stay.`;
  $("#resetConfirmation").classList.remove("hidden");
  $("#confirmResetStudy").focus({ preventScroll: true });
});
$("#cancelResetStudy").addEventListener("click", () => { state.resetIds = null; $("#resetConfirmation").classList.add("hidden"); $("#resetStudy").focus(); });
$("#confirmResetStudy").addEventListener("click", () => {
  const ids = state.resetIds;
  if (!ids) return;
  state.study = resetStudyProgress(state.study, ids);
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
$("#resetButton").addEventListener("click", () => state.player.reset());
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
document.addEventListener("visibilitychange", () => { if (document.hidden) { state.player?.pause(); stopVoice(); } });
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
