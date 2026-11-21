import { escapeHTML as html } from "./renderers.js";

export function renderQuestion(container, lesson, index, { answer, onAnswer, onRetry, onNext, prefix = "" }) {
  const id = (name) => prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
  const item = lesson.questions[index];
  const answered = Number.isInteger(answer);
  const isCorrect = answered && answer === item.answer;
  container.innerHTML = `<p class="eyebrow">Quiz ${index + 1} of ${lesson.questions.length}</p><fieldset><legend>${html(item.prompt)}</legend>${item.choices.map((choice, choiceIndex) => {
    const stateClass = answered ? (choiceIndex === item.answer ? "choice-correct" : answer === choiceIndex ? "choice-wrong" : "") : "";
    return `<label class="${stateClass}"><input type="radio" name="${id("quizAnswer")}" value="${choiceIndex}" ${answered ? "disabled" : ""} ${answer === choiceIndex ? "checked" : ""} /> <span>${html(choice)}</span></label>`;
  }).join("")}</fieldset><div class="practice-actions"><button id="${id("checkQuiz")}" ${answered ? "disabled" : ""}>Check answer</button></div><p id="${id("quizFeedback")}" class="quiz-feedback ${answered ? (isCorrect ? "feedback-correct" : "feedback-wrong") : ""}" role="status">${answered ? `${isCorrect ? "Correct." : "Not yet."} ${html(item.explanation)}` : ""}</p><div class="practice-navigation"><button id="${id("retryQuestion")}" class="quiet-button ${answered ? "" : "hidden"}">Try again</button><button id="${id("nextQuestion")}" class="quiet-button ${answered ? "" : "hidden"}">Next question →</button></div>`;
  container.querySelector(`#${id("checkQuiz")}`).addEventListener("click", () => {
    const chosen = container.querySelector("input:checked");
    if (!chosen) { container.querySelector(`#${id("quizFeedback")}`).textContent = "Choose an answer before checking."; return; }
    onAnswer(Number(chosen.value));
    container.querySelector(`#${id("retryQuestion")}`).focus({ preventScroll: true });
  });
  container.querySelector(`#${id("retryQuestion")}`).addEventListener("click", () => { onRetry(); container.querySelector("input").focus({ preventScroll: true }); });
  container.querySelector(`#${id("nextQuestion")}`).addEventListener("click", () => {
    onNext();
    (container.querySelector("input:not(:disabled)") ?? container.querySelector(`#${id("retryQuestion")}`)).focus({ preventScroll: true });
  });
}

export function renderFlashcard(container, lesson, index, { known, onRemember, onAgain, onNext, prefix = "" }) {
  const id = (name) => prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
  const [question, answer] = lesson.cards[index];
  container.innerHTML = `<div class="flashcard-face"><p class="eyebrow">Flashcard ${index + 1} of ${lesson.cards.length}${known ? " · Remembered" : ""}</p><h3>${html(question)}</h3><p id="${id("cardAnswer")}" class="flashcard-answer hidden">${html(answer)}</p></div><div class="practice-navigation"><button id="${id("revealCard")}">Reveal answer</button><button id="${id("rememberCard")}" disabled>Remember & next</button><button id="${id("studyCardAgain")}" class="quiet-button ${known ? "" : "hidden"}">Study again</button><button id="${id("nextCard")}" class="quiet-button">Next card →</button></div>`;
  container.querySelector(`#${id("revealCard")}`).addEventListener("click", () => {
    container.querySelector(`#${id("cardAnswer")}`).classList.remove("hidden");
    container.querySelector(`#${id("revealCard")}`).disabled = true;
    container.querySelector(`#${id("rememberCard")}`).disabled = false;
  });
  for (const [name, action] of [["rememberCard", onRemember], ["studyCardAgain", onAgain], ["nextCard", onNext]]) {
    container.querySelector(`#${id(name)}`).addEventListener("click", () => { action(); container.querySelector(`#${id("revealCard")}`).focus({ preventScroll: true }); });
  }
}
