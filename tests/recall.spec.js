import { expect, test } from "@playwright/test";
import { saveRecallAttempt } from "../js/recall.js";

const key = (lessonId, task = "transfer") => `${lessonId}:recall-v1:${task}`;

async function checkRubric(page) {
  for (const checkbox of await page.locator(".recall-rubric input").all()) await checkbox.check();
}

test("guided learning fades support, records assisted recall, and schedules a later unaided attempt", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-21T12:00:00Z") });
  await page.goto("/#/lesson/move-zeroes-283");
  await page.locator("#timeline button").last().click();
  await page.locator("#markLearned").click();
  await expect(page).toHaveURL(/#\/recall\/move-zeroes-283$/);
  await expect(page.locator("#studyPosition")).toContainText("Task 1 of 3");
  await expect(page.locator("#studyLessonName")).toBeEmpty();
  await expect(page.locator("#recallDraft")).toBeEmpty();
  await page.locator("#compareRecall").click();
  await expect(page.locator('input[value="independent"]')).toBeDisabled();
  await checkRubric(page);
  await page.getByRole("radio", { name: "Completed without an extra hint", exact: true }).check();
  await expect(page.locator(".recall-schedule")).toHaveCount(0);
  await page.locator("#saveRecall").click();
  await expect(page.locator("#studyPosition")).toContainText("Task 2 of 3");
  await expect(page.locator(".recall-model")).toHaveCount(0);
  await page.locator("#recallDraft").fill("[7, 7, 3, 0, 0]; keep order; use two positions.");
  await page.locator("#hintRecall").click();
  await expect(page.locator("#recallHint")).toBeVisible();
  await page.locator("#compareRecall").click();
  await checkRubric(page);
  await expect(page.locator('input[value="independent"]')).toBeDisabled();
  await page.getByRole("radio", { name: "Partly recalled / used a hint", exact: true }).check();
  await page.locator('input[name="recallInterval"][value="3"]').check();
  await page.locator("#saveRecall").click();
  await expect(page.locator("#studyPosition")).toContainText("Task 3 of 3");
  await page.locator("#revealRecall").click();
  await expect(page.getByRole("radio", { name: "Needed the explanation", exact: true })).toBeChecked();
  await page.locator("#saveRecall").click();
  await expect(page.locator("#studyPosition")).toHaveText("End of this practice set");

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")).recall);
  expect(saved.records[key("move-zeroes-283", "complete")].dueOn).toBeNull();
  expect(saved.records[key("move-zeroes-283")]).toMatchObject({ outcome: "assisted", hintUsed: true, dueOn: "2026-11-24" });
  expect(saved.records[key("move-zeroes-283", "explain")]).toMatchObject({ outcome: "again", neededAnswer: true, dueOn: "2026-11-22" });
  expect(JSON.stringify(saved)).not.toContain("use two positions");

  await page.getByRole("navigation", { name: "Learning views" }).getByRole("link", { name: /Review/ }).click();
  await expect(page.locator("#studyPosition")).toHaveText("Nothing due today");
  await page.clock.setSystemTime(new Date("2026-11-22T12:00:00Z"));
  await page.reload();
  await expect(page.locator("#studyPosition")).toContainText("1 due");
  await expect(page.locator("#studyLessonName")).toBeEmpty();
  await expect(page.locator("#catalogDock")).toBeHidden();
  await page.locator("#compareRecall").click();
  await checkRubric(page);
  await page.getByRole("radio", { name: "Recalled without hints", exact: true }).check();
  await page.locator('input[name="recallInterval"][value="7"]').check();
  await page.locator("#saveRecall").click();
  await expect(page.locator("#studyPosition")).toHaveText("Nothing due today");
  const later = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")).recall);
  expect(later.records[key("move-zeroes-283", "explain")]).toMatchObject({ outcome: "independent", delayed: true, dueOn: "2026-11-29" });
});

test("mixed due reviews hide lesson cues and skipping does not claim a recall attempt", async ({ page }) => {
  let recall = null;
  for (const id of ["move-zeroes-283", "max-average-643"]) {
    for (const task of ["transfer", "explain"]) recall = saveRecallAttempt(recall, key(id, task), {
      outcome: "assisted", criteriaMet: 1, intervalDays: 1, today: "2026-11-20"
    });
  }
  await page.clock.install({ time: new Date("2026-11-21T12:00:00Z") });
  await page.addInitScript((recall) => {
    if (!localStorage.getItem("codestories.study")) localStorage.setItem("codestories.study", JSON.stringify({ version: 1, recall }));
  }, recall);
  await page.goto("/#/review");
  await expect(page.locator("#reviewDueCount")).toHaveText("(4)");
  await expect(page.locator("#catalogDock")).toBeHidden();
  await expect(page.locator("#studyLessonName")).toBeEmpty();
  await expect(page.locator("#studyReadStory")).toBeDisabled();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")).recall.current);
  await page.locator("#studyNext").click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")).recall.current);
  expect(first.split(":")[0]).not.toBe(second.split(":")[0]);
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")).recall.records);
  expect(records).toEqual(recall.records);
  await page.locator("#compareRecall").click();
  await expect(page.locator("#studyLessonName")).not.toBeEmpty();
  await expect(page.locator("#studyReadStory")).toBeEnabled();
});

test("recall self-checks work on mobile and a study-set reset keeps other review dates", async ({ page }) => {
  let recall = saveRecallAttempt(null, key("move-zeroes-283"), { outcome: "again", criteriaMet: 0, today: "2026-11-21", intervalDays: 1 });
  recall = saveRecallAttempt(recall, key("story-198"), { outcome: "independent", criteriaMet: 3, today: "2026-11-21", intervalDays: 7 });
  await page.addInitScript((recall) => {
    if (!localStorage.getItem("codestories.study")) localStorage.setItem("codestories.study", JSON.stringify({
      version: 1, filters: { collection: "guided" }, recall, learned: ["move-zeroes-283", "story-198"]
    }));
  }, recall);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/recall/story-198");
  await page.locator("#recallDraft").fill("<b>my attempt</b>");
  await page.locator("#compareRecall").click();
  await expect(page.locator(".recall-notes pre")).toHaveText("<b>my attempt</b>");
  await expect(page.locator(".recall-notes b")).toHaveCount(0);
  await page.locator("#saveRecall").click();
  await expect(page.locator("#recallError")).toContainText("Choose how");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#chooseStudySet").click();
  await page.locator("#problemSearch").fill("283");
  await page.locator("#resetStudy").click();
  await expect(page.locator("#resetMessage")).toContainText("scheduled reviews");
  await page.locator("#confirmResetStudy").click();
  const remaining = await page.evaluate(() => JSON.parse(localStorage.getItem("codestories.study")));
  expect(Object.keys(remaining.recall.records)).toEqual([key("story-198")]);
  expect(remaining.recall.records[key("story-198")].dueOn).toBe("2026-11-28");
  expect(remaining.learned).toEqual(["story-198"]);
});
