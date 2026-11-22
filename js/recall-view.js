import { escapeHTML as html } from "./renderers.js";
import { localDay, reviewDay } from "./recall.js";

export function newRecallAttempt(key) {
  return { key, draft: "", revealed: false, hintUsed: false, neededAnswer: false, checks: new Set(), outcome: "", intervalDays: 1 };
}

export function formatReviewDay(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function renderRecallExercise(container, item, attempt, { onChange, onSave, review = false }) {
  const scaffolded = item.kind === "complete";
  const canBeIndependent = () => !attempt.hintUsed && !attempt.neededAnswer && attempt.checks.size === item.rubric.length;
  const stage = review ? "Retrieve without the guide" : scaffolded ? "1. Complete a missing step" : item.kind === "transfer" ? "2. Solve a fresh problem" : "3. Explain from memory";
  container.innerHTML = `<div class="recall-prompt">
    <p class="eyebrow">${stage}</p>
    <h3 id="recallPrompt">${html(item.prompt)}</h3>
    ${item.given ? `<pre class="recall-given">${html(item.given)}</pre>` : ""}
    ${scaffolded ? '<p class="recall-note">This task includes worked support. It is preparation, not a test of full unaided recall.</p>' : ""}
  </div>
  ${!attempt.revealed ? `<div class="recall-attempt">
    <label for="recallDraft">Your attempt <span>(optional scratch notes; not saved)</span></label>
    <textarea id="recallDraft" rows="4" placeholder="Write, think, or say your answer aloud. No recording or AI grading.">${html(attempt.draft)}</textarea>
    ${attempt.hintUsed ? `<p id="recallHint" class="recall-hint" role="status" tabindex="-1">${html(item.hint)}</p>` : ""}
    <div class="practice-navigation">
      <button id="compareRecall">Compare my attempt</button>
      <button id="hintRecall" class="quiet-button" ${attempt.hintUsed ? "disabled" : ""}>Give me a hint</button>
      <button id="revealRecall" class="quiet-button">I can't recall yet</button>
    </div>
    <p class="recall-note">Try before revealing. Familiarity with the explanation is not the same as recalling it.</p>
  </div>` : `<div class="recall-comparison">
    ${attempt.draft.trim() ? `<details class="recall-notes" open><summary>Your original attempt</summary><pre>${html(attempt.draft)}</pre></details>` : ""}
    <h4>Compare with this explanation</h4><p class="recall-model">${html(item.answer)}</p>
    <fieldset class="recall-rubric"><legend>Which points were already in your attempt?</legend>
      ${item.rubric.map((point, index) => `<label><input type="checkbox" data-criterion="${index}" ${attempt.checks.has(index) ? "checked" : ""} /> <span>${html(point)}</span></label>`).join("")}
    </fieldset>
    <fieldset class="recall-rating"><legend>How did it go? <span>Self-assessment, not an automatic grade.</span></legend>
      ${[
        ["independent", scaffolded ? "Completed without an extra hint" : "Recalled without hints"],
        ["assisted", "Partly recalled / used a hint"],
        ["again", "Needed the explanation"]
      ].map(([value, label]) => `<label><input type="radio" name="recallOutcome" value="${value}" ${attempt.outcome === value ? "checked" : ""} ${value === "independent" && !canBeIndependent() ? "disabled" : ""} /> ${label}</label>`).join("")}
    </fieldset>
    <p class="recall-note">${attempt.hintUsed || attempt.neededAnswer ? "A hint or early explanation was used; this attempt cannot count as unaided." : "Choose unaided only if all rubric points were in your attempt before the reveal."}</p>
    ${scaffolded ? '<p class="recall-note">Next, remove the worked support. This completion exercise is not added to the delayed-review queue.</p>' : `<fieldset class="recall-schedule"><legend>When would you like to revisit this?</legend>${[[1, "Tomorrow"], [3, "In three days"], [7, "In a week"]].map(([days, label]) => `<label><input type="radio" name="recallInterval" value="${days}" ${attempt.intervalDays === days ? "checked" : ""} /><span>${label}<small>${formatReviewDay(reviewDay(localDay(), days))}</small></span></label>`).join("")}</fieldset><p class="recall-note">These are practical review intervals, not a personalized forgetting model. No notifications are sent.</p>`}
    <p id="recallError" role="alert"></p>
    <button id="saveRecall">${scaffolded ? "Continue to a fresh problem" : "Save review & continue"}</button>
  </div>`}`;

  if (!attempt.revealed) {
    container.querySelector("#recallDraft").addEventListener("input", (event) => { attempt.draft = event.target.value; });
    container.querySelector("#hintRecall").addEventListener("click", () => {
      attempt.hintUsed = true;
      onChange();
      container.querySelector("#recallHint").focus({ preventScroll: true });
    });
    for (const [id, needed] of [["compareRecall", false], ["revealRecall", true]]) container.querySelector(`#${id}`).addEventListener("click", () => {
      attempt.revealed = true;
      attempt.neededAnswer = needed;
      if (needed) attempt.outcome = "again";
      onChange();
      container.querySelector(".recall-rubric input").focus({ preventScroll: true });
    });
    return;
  }
  for (const input of container.querySelectorAll("[data-criterion]")) input.addEventListener("change", () => {
    const index = Number(input.dataset.criterion);
    if (input.checked) attempt.checks.add(index);
    else attempt.checks.delete(index);
    const independent = container.querySelector('input[value="independent"]');
    independent.disabled = !canBeIndependent();
    if (independent.disabled && independent.checked) { independent.checked = false; attempt.outcome = ""; }
  });
  for (const input of container.querySelectorAll('input[name="recallOutcome"]')) input.addEventListener("change", () => { attempt.outcome = input.value; });
  for (const input of container.querySelectorAll('input[name="recallInterval"]')) input.addEventListener("change", () => { attempt.intervalDays = Number(input.value); });
  container.querySelector("#saveRecall").addEventListener("click", () => {
    if (!attempt.outcome) { container.querySelector("#recallError").textContent = "Choose how the attempt went before continuing."; return; }
    onSave({
      outcome: attempt.outcome, hintUsed: attempt.hintUsed, neededAnswer: attempt.neededAnswer,
      criteriaMet: attempt.checks.size, intervalDays: attempt.intervalDays
    });
  });
}
