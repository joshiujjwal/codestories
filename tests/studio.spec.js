import { expect, test } from "@playwright/test";
import { problems } from "../js/catalog.js";
import { lessons } from "../js/lessons/index.js";
import { practiceKey } from "../js/practice-key.js";

const windowKey = practiceKey(lessons["max-average-643"], 0);

test("landing page explains what the site is, how to navigate, shows all 75 stories, and supports voice narration", async ({ page }) => {
  await page.addInitScript(() => {
    const spoken = [];
    window.__voiceLog = { spoken };
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak(utterance) { spoken.push(utterance.text); },
        cancel() {}
      }
    });
  });
  await page.goto("/");
  await expect(page.locator("#landingGuide")).toBeVisible();
  await expect(page.locator("#landingGuide")).toContainText("Learn an algorithm by making its next decision");
  await expect(page.getByRole("list", { name: "How to navigate" })).toBeVisible();
  await expect(page.locator("#studio")).toBeHidden();
  await expect(page.locator(".story-card")).toHaveCount(5);
  await page.locator("#allCollection").click();
  await expect(page.locator(".story-card")).toHaveCount(75);
  await page.getByRole("searchbox", { name: "Find a story" }).fill("Showdown");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Read Asteroid Collision", exact: true }).click();
  await expect(page.locator("#studio")).toBeVisible();
  await expect(page.locator("#landingGuide")).toBeHidden();
  await expect(page.locator("#storyHook")).toHaveText("Space Rock Showdown");
  await expect(page.locator("#lessonTitle")).toHaveText("Asteroid Collision");
  await expect(page.locator("#voiceToggle")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#speakStep").click();
  expect(await page.evaluate(() => window.__voiceLog.spoken.at(-1))).toContain("Space Rock Showdown");
  await page.locator("#voiceToggle").click();
  await expect(page.locator("#voiceToggle")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#nextButton").click();
  expect(await page.evaluate(() => window.__voiceLog.spoken.at(-1))).toContain("Record the survivors");
  await page.locator("#voiceToggle").click();
  await expect(page.locator("#voiceToggle")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Close story" }).click();
  await expect(page.locator("#studio")).toBeHidden();
  await expect(page.locator("#landingGuide")).toBeVisible();
});

test("topic selection reconciles and persists only related coding patterns", async ({ page }) => {
  await page.goto("/");
  await page.locator("#allCollection").click();
  await page.locator("#patternFilter").selectOption("dp");
  await page.locator("#topicFilter").selectOption("Sliding Window");
  await expect(page.locator("#patternFilter")).toHaveValue("sliding-window");
  await expect(page.locator("#patternFilter option")).toHaveCount(2);
  await expect(page.locator(".story-card")).toHaveCount(4);
  await page.locator("#topicFilter").selectOption("Bit Manipulation");
  await expect(page.locator("#patternFilter")).toHaveValue("");
  expect(await page.locator("#patternFilter option").evaluateAll((options) => options.map((option) => option.value))).toEqual(["", "xor", "dp", "additional"]);
  await page.locator("#patternFilter").selectOption("dp");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("#topicFilter")).toHaveValue("Bit Manipulation");
  await expect(page.locator("#patternFilter")).toHaveValue("dp");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.locator("#topicFilter").selectOption("Graphs / DFS");
  await expect(page.locator("#patternFilter")).toHaveValue("dfs");
  await page.getByRole("button", { name: "Reset search and filters" }).click();
  await expect(page.locator("#patternFilter option")).toHaveCount(18);
  await expect(page.locator(".story-card")).toHaveCount(75);
});

test("guided learning and filtered practice persist, retry, and reset without clearing other stories", async ({ page }) => {
  await page.addInitScript((key) => {
    if (!localStorage.getItem("codestories.study")) {
      localStorage.setItem("codestories.study", JSON.stringify({
        version: 1, filters: { query: "283", topic: "Two Pointers", patternId: "two-pointers", company: "Google" },
        learned: ["max-average-643"],
        quiz: { answers: { [key]: 1 } },
        flashcards: { known: [key] }
      }));
      localStorage.setItem("codestories.learning", JSON.stringify({ version: 1, lessons: { "max-average-643": { stepId: "window-1" } } }));
      localStorage.setItem("unrelated.app", "keep");
    }
  }, windowKey);
  await page.goto("/");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await expect(page.locator("#learningProgress")).toContainText("0/1 marked learned");
  await page.locator("#continueLearning").click();
  await expect(page.locator("#lessonTitle")).toHaveText("Move Zeroes");
  await page.locator("#timeline button").last().click();
  await page.locator("#markLearned").click();
  await expect(page.locator("#learningProgress")).toContainText("1/1 marked learned");
  await page.reload();
  await expect(page.locator("#learningProgress")).toContainText("1/1 marked learned");
  const views = page.getByRole("navigation", { name: "Learning views" });
  await views.getByRole("link", { name: "Quiz", exact: true }).click();
  await expect(page.locator("#studyLessonName")).toHaveText("The Careful Compactor · Move Zeroes");
  await expect(page.locator("#studyQuizFeedback")).toBeEmpty();
  await page.getByRole("radio", { name: "[6, 1, 6, 0, 0]", exact: true }).check();
  await page.locator("#studyCheckQuiz").click();
  await expect(page.locator("#studyQuizFeedback")).toContainText("Correct.");
  await page.locator("#studyNextQuestion").click();
  await page.reload();
  await expect(page.locator("#studyPosition")).toContainText("Question 2 of");
  await page.locator("#studyPrevious").click();
  await expect(page.locator("#studyQuizFeedback")).toContainText("Correct.");
  await page.locator("#studyRetryQuestion").click();
  await expect(page.locator("#studyQuizFeedback")).toBeEmpty();
  await expect(page.getByRole("radio").first()).toBeFocused();
  await page.getByRole("radio", { name: "[6, 1, 6, 0, 0]", exact: true }).check();
  await page.locator("#studyCheckQuiz").click();
  await views.getByRole("link", { name: "Flashcards", exact: true }).click();
  await expect(page.locator("#studyCardAnswer")).toBeHidden();
  await expect(page.locator("#studyRememberCard")).toBeDisabled();
  await page.locator("#studyRevealCard").click();
  await page.locator("#studyRememberCard").click();
  await page.reload();
  await expect(page.locator("#studyPosition")).toContainText("Card 2 of");
  await expect(page.locator("#studyCardAnswer")).toBeHidden();
  await page.locator("#studyPrevious").click();
  await page.locator("#studyStudyCardAgain").click();
  await expect(page.locator("#studyCardAnswer")).toBeHidden();
  await page.locator("#studyRevealCard").click();
  await page.locator("#studyRememberCard").click();
  await page.locator("#resetStudy").click();
  await page.locator("#cancelResetStudy").click();
  await expect(page.locator("#learningProgress")).toContainText("1/1 marked learned");
  await page.locator("#resetStudy").click();
  await page.locator("#confirmResetStudy").click();
  const saved = await page.evaluate(() => ({
    study: JSON.parse(localStorage.getItem("codestories.study")),
    learning: JSON.parse(localStorage.getItem("codestories.learning")),
    unrelated: localStorage.getItem("unrelated.app")
  }));
  expect(saved.study.learned).toEqual(["max-average-643"]);
  expect(saved.study.quiz.answers).toEqual({ [windowKey]: 1 });
  expect(saved.study.flashcards.known).toEqual([windowKey]);
  expect(saved.learning.lessons["move-zeroes-283"]).toBeUndefined();
  expect(saved.learning.lessons["max-average-643"].stepId).toBe("window-1");
  expect(saved.unrelated).toBe("keep");
  await expect(page.locator("#learningProgress")).toContainText("0/1 marked learned");
  await views.getByRole("link", { name: "Learn", exact: true }).click();
  await page.locator("#continueLearning").click();
  await expect(page.locator("#stepCounter")).toContainText("STEP 1");
  await expect(page.locator("#quizSection")).toBeHidden();
});

test("empty practice and unavailable storage remain explicit and usable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Storage.prototype, "setItem", { value() { throw new Error("Storage blocked"); } }));
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Find a story" }).fill("no such story");
  await expect(page.locator("#toast")).toContainText("could not be saved");
  await page.getByRole("navigation", { name: "Learning views" }).getByRole("link", { name: "Quiz", exact: true }).click();
  await expect(page.locator("#studyPosition")).toHaveText("No practice items in this set");
  await expect(page.locator(".recall-empty")).toContainText("Choose guided lessons");
  await expect(page.locator("#studyNext")).toBeDisabled();
  await page.locator("#chooseStudySet").click();
  await page.getByRole("button", { name: "Reset search and filters" }).click();
  await page.getByRole("navigation", { name: "Learning views" }).getByRole("link", { name: "Quiz", exact: true }).click();
  await expect(page.locator("#recallPrompt")).not.toBeEmpty();
  await expect(page.locator(".recall-model")).toHaveCount(0);
});

test("landing filters compose, retain selections while reading, show evidence, and reset on mobile", async ({ page }) => {
  await page.goto("/");
  await page.locator("#allCollection").click();
  await page.getByRole("combobox", { name: "Coding pattern", exact: true }).selectOption("two-pointers");
  await page.getByRole("combobox", { name: "Topic", exact: true }).selectOption("Two Pointers");
  await page.getByRole("combobox", { name: "Company", exact: true }).selectOption("Google");
  await expect(page.locator(".story-card")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Find a story" }).fill("283");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.locator(".company-tags summary").click();
  await expect(page.locator(".company-tags").getByRole("link", { name: "Google", exact: true })).toHaveAttribute("href", /\/blob\/[a-f0-9]{40}\/Google\/5\.%20All\.csv$/);
  await expect(page.locator("#companyTagNote")).toContainText("historical community reports");
  await page.getByRole("button", { name: "Read Move Zeroes", exact: true }).click();
  await page.getByRole("button", { name: "Close story" }).click();
  await expect(page.locator("#landingGuide")).toBeVisible();
  await expect(page.locator("#companyFilter")).toHaveValue("Google");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.getByRole("combobox", { name: "Topic", exact: true }).selectOption("Sliding Window");
  await expect(page.locator(".story-card")).toHaveCount(0);
  await expect(page.locator("#emptyResults")).toBeVisible();
  await page.getByRole("button", { name: "Reset search and filters", exact: true }).click();
  await expect(page.locator(".story-card")).toHaveCount(75);
  for (const id of ["problemSearch", "patternFilter", "topicFilter", "companyFilter"]) await expect(page.locator(`#${id}`)).toHaveValue("");
  await expect(page.getByRole("searchbox", { name: "Find a story" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("combobox", { name: "Topic", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Coding pattern", exact: true })).toBeFocused();
  await page.getByRole("combobox", { name: "Topic", exact: true }).selectOption("Multidimensional Dynamic Programming");
  await expect(page.locator(".story-card")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/#/pattern/cyclic-sort");
  await expect(page.locator("#patternFilter")).toHaveValue("cyclic-sort");
  await expect(page.locator("#emptyResults")).toBeVisible();
});

test("one page offers all stories, simple search, and independent practice opt-ins", async ({ page }) => {
  await page.goto("/");
  await page.locator("#allCollection").click();
  await expect(page.locator(".story-card")).toHaveCount(75);
  await page.getByRole("searchbox", { name: "Find a story" }).fill("283");
  await expect(page.locator(".story-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Read Move Zeroes", exact: true }).click();
  await expect(page.locator("#lessonTitle")).toHaveText("Move Zeroes");
  await expect(page.locator("#quizSection")).toBeHidden();
  await expect(page.locator("#flashcardSection")).toBeHidden();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Quiz", exact: true }).check();
  await expect(page.locator("#quizSection")).toBeVisible();
  await expect(page.locator("#flashcardSection")).toBeHidden();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#quizFeedback")).toHaveText("Choose an answer before checking.");
  await page.getByRole("radio", { name: "[6, 1, 6, 0, 0]", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#quizFeedback")).toContainText("Correct.");
  await page.getByRole("checkbox", { name: "Flashcards", exact: true }).check();
  await expect(page.locator("#cardAnswer")).toBeHidden();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.locator("#cardAnswer")).toBeVisible();
  await page.getByRole("checkbox", { name: "Quiz", exact: true }).uncheck();
  await expect(page.locator("#quizSection")).toBeEmpty();
  await expect(page.locator("#flashcardSection")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Quiz", exact: true })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Flashcards", exact: true })).not.toBeChecked();
});

test("custom input and paused progress survive reload, without forcing old review or 3D modes", async ({ page }) => {
  await page.goto("/#/lesson/move-zeroes-283");
  await page.getByText("Try your own input", { exact: true }).click();
  await page.getByLabel("Numbers", { exact: true }).fill("0, 6, 0, 1, 6");
  await page.getByRole("button", { name: "Apply input", exact: true }).click();
  await page.locator("#timeline button").last().click();
  await expect(page.locator("#scene .guide-result")).toContainText("[6, 1, 6, 0, 0]");
  await expect(page.locator("#timeline button").last()).toBeFocused();
  await page.reload();
  await expect(page.locator("#scene .guide-result")).toContainText("[6, 1, 6, 0, 0]");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.getByText("Try your own input", { exact: true }).click();
  await page.getByLabel("Numbers", { exact: true }).fill("1,,2");
  await page.getByRole("button", { name: "Apply input", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("blank entries");
  await page.getByRole("button", { name: "Close story" }).click();
  await expect(page.locator("#studio")).toBeHidden();
  await page.locator("#allCollection").click();
  await expect(page.locator(".story-card")).toHaveCount(75);
});

test("tree presets and the preserved system story work without separate pages", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#/lesson/max-depth-104");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption({ label: "Empty tree" });
  await page.locator("#timeline button").last().click();
  await expect(page.locator("#stepSummary")).toContainText("0 nodes");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption({ label: "Skewed tree" });
  await page.locator("#timeline button").last().click();
  await expect(page.locator("#stepSummary")).toContainText("4 nodes");
  await page.reload();
  await expect(page.locator("#stepSummary")).toContainText("4 nodes");
  await page.getByRole("button", { name: "Read the system story", exact: false }).click();
  await page.getByText("Try your own input", { exact: true }).click();
  await page.getByRole("combobox", { name: "Metadata cache", exact: true }).selectOption("unavailable");
  await page.getByRole("combobox", { name: "Image CDN", exact: true }).selectOption("hit");
  await page.getByRole("button", { name: "Trace request", exact: true }).click();
  await page.locator("#timeline button").nth(4).click();
  await expect(page.locator("#stepSummary")).toContainText("Timeline Db");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Close story" }).click();
  await page.waitForTimeout(1400);
  expect(errors).toEqual([]);
});

test("every one of the 75 stories renders its actual walkthrough, alternate case, and optional practice", async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const problem of problems) {
    await page.evaluate((id) => { location.hash = `/lesson/${id}`; }, problem.lessonId);
    await expect(page.locator("#lessonTitle")).toHaveText(problem.title);
    await expect(page.locator("#storyProblem")).not.toBeEmpty();
    await expect(page.locator("#storyMove")).not.toBeEmpty();
    await expect(page.locator("#scene")).not.toBeEmpty();
    await page.locator("#timeline button").last().click();
    await expect(page.locator("#stepSummary")).not.toBeEmpty();
    await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("1");
    await expect(page.locator("#stepCounter")).toContainText(/(?:PANEL|STEP) 1/);
    await page.locator("#timeline button").last().click();
    await expect(page.locator("#scene")).not.toBeEmpty();
    await page.getByRole("checkbox", { name: "Quiz", exact: true }).check();
    await expect(page.locator("#quizSection legend")).not.toBeEmpty();
    await page.getByRole("checkbox", { name: "Flashcards", exact: true }).check();
    await expect(page.locator("#flashcardSection h3")).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test("mobile, keyboard, and reduced motion work for arrays, grids, graphs, tries, and trees", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/lesson/story-238");
  await page.locator("#lessonTitle").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#stepCounter")).toContainText("PANEL 2");
  expect(await page.locator(".state-cell.active").first().evaluate((cell) => getComputedStyle(cell).animationName)).toBe("none");
  for (const id of ["story-62", "story-841", "story-208", "story-2130", "max-depth-104"]) {
    await page.evaluate((id) => { location.hash = `/lesson/${id}`; }, id);
    await expect(page.locator("#scene")).toBeVisible();
    await page.locator("#timeline button").last().click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("pattern search, credits, and stale saved steps remain usable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("codestories.learning", JSON.stringify({
    version: 1, lessons: { "max-average-643": { stepId: "removed", mode: "review", view: "3d" } }
  })));
  await page.goto("/#/lesson/max-average-643");
  await expect(page.locator("#stepCounter")).toContainText("STEP 1");
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#quizSection")).toBeHidden();
  await page.getByRole("button", { name: "Close story" }).click();
  await page.locator("#allCollection").click();
  await page.getByRole("searchbox", { name: "Find a story" }).fill("sliding window");
  await expect(page.locator(".story-card")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Find a story" }).fill("no such story");
  await expect(page.locator("#emptyResults")).toBeVisible();
  await page.getByRole("button", { name: "Reset search and filters", exact: true }).click();
  await expect(page.locator(".story-card")).toHaveCount(75);
  await page.getByRole("link", { name: "Sources & credits" }).click();
  await expect(page.locator("#sourceList").getByRole("link", { name: /neetcode/i })).toBeVisible();
  await expect(page.locator("#credits")).toContainText("not the same problem set");
});
