import { expect, test } from "@playwright/test";

test("five distinct guided lessons lead to the preserved full library", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#guidedCollection")).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator(".story-card").evaluateAll((cards) => cards.map((card) => card.dataset.problemId))).toEqual(["283", "643", "994", "739", "198"]);
  await page.getByRole("button", { name: "Read Move Zeroes", exact: true }).click();
  await expect(page.locator("#studio")).toHaveClass(/guided-lesson/);
  await expect(page.locator("#guidedObjective")).toContainText("one pointer moves");
  await expect(page.locator("#markLearned")).toBeDisabled();
  await page.locator("#libraryToggle").click();
  await expect(page.locator(".story-card")).toHaveCount(75);
  await expect(page.locator("#studio")).toBeHidden();
  await expect(page.locator("#allCollection")).toHaveAttribute("aria-pressed", "true");
});

test("compaction asks for a prediction before changing state, then animates the real copy", async ({ page }) => {
  await page.goto("/#/lesson/move-zeroes-283");
  await page.locator("#nextButton").click();
  await expect(page.locator("#predictionSection")).toBeVisible();
  await expect(page.locator("#nextButton")).toBeDisabled();
  await expect(page.locator("#playButton")).toBeDisabled();
  await expect(page.locator('[data-anchor="slot-0"] .guide-value')).toHaveText("0");
  await page.getByRole("radio", { name: "Advance both read and write.", exact: true }).check();
  await page.locator("#predictionCheckQuiz").click();
  await expect(page.locator("#predictionQuizFeedback")).toContainText("unfilled slot");
  await expect(page.locator("#nextButton")).toBeEnabled();
  await expect(page.locator('[data-anchor="slot-0"] .guide-value')).toHaveText("0");
  await page.locator("#nextButton").click();
  await page.locator("#nextButton").click();
  await expect(page.locator("#predictionExercise legend")).toContainText("Where should 4 go");
  await page.locator("#showPrediction").click();
  await page.locator("#nextButton").click();
  await expect(page.locator(".guided-flight")).toBeVisible();
  await expect(page.locator(".guided-flight")).toBeInViewport();
  await expect(page.locator('[data-anchor="slot-0"]')).toBeInViewport();
  await expect(page.locator('[data-anchor="slot-0"] .guide-value')).toHaveText("4");
  await expect(page.locator('[data-anchor="slot-1"] .guide-value')).toHaveText("4");
  await page.locator("#timeline button").last().click();
  await expect(page.locator("#guidedProof")).toContainText("Two consecutive passes");
  await expect(page.locator("#markLearned")).toBeEnabled();
  await page.locator("#resetButton").click();
  await page.locator("#nextButton").click();
  await expect(page.locator("#nextButton")).toBeDisabled();
  await expect(page.locator("#predictionQuizFeedback")).toBeEmpty();
});

test("narrated autoplay finishes speaking before advancing and pauses for the learner", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    window.voiceRequests = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { speak(utterance) { window.voiceRequests.push(utterance); }, cancel() {} }
    });

  });
  await page.goto("/#/lesson/move-zeroes-283");
  await page.locator("#voiceToggle").click();
  await page.locator("#playButton").click();
  await expect.poll(() => page.evaluate(() => window.voiceRequests.length)).toBe(2);
  await page.clock.runFor(10000);
  await expect(page.locator("#stepCounter")).toContainText("STEP 1");
  await page.evaluate(() => window.voiceRequests.at(-1).onend());
  await page.clock.runFor(700);
  await expect(page.locator("#stepCounter")).toContainText("STEP 2");
  await expect(page.locator("#predictionSection")).toBeVisible();
  await expect(page.locator("#playButton")).toBeDisabled();
  await page.clock.runFor(15000);
  await expect(page.locator("#stepCounter")).toContainText("STEP 2");
  await page.getByRole("navigation", { name: "Learning views" }).getByRole("link", { name: "Quiz", exact: true }).click();
  await page.evaluate(() => window.voiceRequests.at(-1).onend());
  await page.clock.runFor(5000);
  await expect(page.locator("#studio")).toBeHidden();
  await expect(page.locator("#studyPanel")).toBeVisible();
});

test("speech errors are visible and leave manual learning usable", async ({ page }) => {
  await page.addInitScript(() => {
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { speak(utterance) { queueMicrotask(() => utterance.onerror({ error: "not-allowed" })); }, cancel() {} }
    });
  });
  await page.goto("/#/lesson/move-zeroes-283");
  await page.locator("#voiceToggle").click();
  await expect(page.locator("#voiceToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#toast")).toContainText("not-allowed");
  await expect(page.locator("#playButton")).toHaveText("Play");
  await page.locator("#nextButton").click();
  await expect(page.locator("#predictionSection")).toBeVisible();
  await page.locator("#showPrediction").click();
  await expect(page.locator("#nextButton")).toBeEnabled();
});

test("guided diagrams expose overlap, simultaneous waves, waiting indexes, and nonadjacent DP dependencies", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/lesson/max-average-643");
  await page.locator("#nextButton").click();
  await page.locator("#showPrediction").click();
  await page.locator("#nextButton").click();
  await expect(page.locator(".guide-equation")).toHaveText("6 − (2) + (6) = 10");
  await page.locator("#exampleSelect").selectOption({ label: "All-negative windows" });
  await page.locator("#timeline button").last().click();
  await expect(page.locator(".guide-result")).toContainText("-4");

  await page.goto("/#/lesson/story-994");
  await expect(page.locator(".orange-cell.rotten")).toHaveCount(2);
  await page.locator("#nextButton").click();
  await page.locator("#showPrediction").click();
  await page.locator("#nextButton").click();
  await expect(page.locator(".orange-cell.rotten")).toHaveCount(6);
  await expect(page.locator(".frontier-cell")).toHaveCount(4);
  await page.locator("#timeline button").last().click();
  await expect(page.locator(".guide-result")).toContainText("2 minutes");
  await page.locator("#exampleSelect").selectOption("1");
  await page.locator("#timeline button").last().click();
  await expect(page.locator(".guide-result")).toContainText("-1");

  await page.goto("/#/lesson/story-739");
  await page.getByRole("button", { name: /Step \d+: Day 3 answers day 2/ }).click();
  await expect(page.locator(".waiting-day")).toHaveCount(1);
  await expect(page.locator('[data-anchor="answer-2"] .guide-value')).toHaveText("1");
  await page.locator("#nextButton").click();
  await expect(page.locator(".waiting-day")).toHaveCount(0);
  await expect(page.locator('[data-anchor="answer-1"] .guide-value')).toHaveText("2");
  await page.locator("#exampleSelect").selectOption("1");
  await page.locator("#timeline button").last().click();
  await expect(page.locator(".guide-result")).toContainText("[0, 0]");

  await page.goto("/#/lesson/story-198");
  await page.getByRole("button", { name: /Step \d+: Your turn/ }).click();
  await expect(page.locator(".dp-decision strong").first()).toHaveText("4 + 4 = ?");
  await page.locator("#showPrediction").click();
  await page.locator("#nextButton").click();
  await expect(page.locator(".dp-decision .chosen strong")).toHaveText("4 + 4 = 8");
  await page.locator("#timeline button").last().click();
  await expect(page.locator("#guidedProof")).toContainText("not oneBack");
  expect(errors).toEqual([]);
});

test("every guided case stays readable on mobile, including final explanations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const id of ["move-zeroes-283", "max-average-643", "story-994", "story-739", "story-198"]) {
    await page.evaluate((id) => { location.hash = `/lesson/${id}`; }, id);
    await expect(page.locator("#scene")).toHaveClass(/guided-scene/);
    const cases = await page.locator("#exampleSelect option").count();
    for (let index = 0; index < cases; index++) {
      await page.locator("#exampleSelect").selectOption(String(index));
      await page.locator("#timeline button").last().click();
      await expect(page.locator("#guidedProof")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
