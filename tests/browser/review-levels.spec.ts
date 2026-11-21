import { expect, test, type Page } from "@playwright/test";
import { progressKey } from "../../src/storage.ts";
import { localDay } from "../../src/review.ts";
import { bank, reviewPool } from "../../src/vocabulary.ts";

const saved = (page: Page) => page.evaluate(k => JSON.parse(localStorage.getItem(k)!), progressKey);
test("Review honours saved levels without displaying the picker", async ({ page, context }) => {
  await page.goto("/favicon.png");
  await page.evaluate(({ key, day }) => {
    localStorage.setItem(key, JSON.stringify({ day, reviewLevels: [1, 2], credited: [], history: {}, prompt: null }));
  }, { key: progressKey, day: localDay() });
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  await expect(page.locator("#review-levels")).toHaveCount(0);
  const first = await saved(page);
  expect([1, 2]).toContain(bank[first.prompt.word].level);
  await page.locator(".target").click();
  await expect.poll(async () => (await saved(page)).prompt.looked).toBe(true);
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator(".target")).toBeVisible();
  expect((await saved(other)).prompt).toEqual({ ...first.prompt, looked: true });
  await other.locator("#next").click();
  await expect.poll(async () => (await saved(page)).credited).toContain(first.prompt.word);
  await page.reload();
  await expect(page.locator(".target")).toBeVisible();
  expect((await saved(page)).reviewLevels).toEqual([1, 2]);
});

test("an exhausted level opens Word Bank and preserves credits", async ({ page }) => {
  await page.goto("/favicon.png");
  await page.evaluate(({ key, day, credited }) => {
    localStorage.setItem(key, JSON.stringify({ day, reviewLevels: [2], credited, history: {}, prompt: null }));
  }, { key: progressKey, day: localDay(), credited: reviewPool([2]) });
  await page.goto("/");
  await expect(page.getByLabel("Word collection")).toHaveValue("3");
  await page.locator("#review").click();
  await expect(page.getByText("You’ve reviewed every word in these levels today.")).toBeVisible();
  await expect(page.locator("#next")).toHaveCount(0);
  expect((await saved(page)).credited).toHaveLength(200);
});

test("a v3 session imports once with Level 3 and keeps its unfinished lookup", async ({ page }) => {
  const day = localDay();
  const legacy = { day, credited: ["借"], history: { 借: { last: day, due: day, visits: 2, step: 1 } },
    prompt: { word: "复习", sentence: "我 在 复习 课文 。", id: "old-v3", example: 0, looked: true } };
  await page.goto("/favicon.png");
  await page.evaluate(s => localStorage.setItem("chinese-revision.v3", JSON.stringify(s)), legacy);
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("复习");
  expect(await saved(page)).toEqual({ ...legacy, reviewLevels: [3], myWords: [], custom: {}, extraHSK: false });
  await page.evaluate(() => localStorage.setItem("chinese-revision.v3", "{}"));
  await page.reload();
  await expect(page.locator(".target")).toHaveText("复习");
  expect(await saved(page)).toEqual({ ...legacy, reviewLevels: [3], myWords: [], custom: {}, extraHSK: false });
});
