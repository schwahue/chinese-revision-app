import { expect, test, type Page } from "@playwright/test";
import { readProgress, seedProgress } from "./helpers/progress.ts";
import { progressKey } from "../../src/storage.ts";
import { fresh, localDay } from "../../src/review.ts";

const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

test("add catalogue matches only and review them alongside an existing custom word", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  const saved = fresh();
  const customId = "custom-caffeine";
  saved.myWords = [customId];
  saved.custom[customId] = { hanzi: "咖啡因", pinyin: "kāfēiyīn" };
  await seedProgress(page, saved);
  await btn(page, "Word Bank").click();
  await btn(page, "Add word").click();
  await page.getByLabel("Search by pinyin").fill("xuexi");
  await expect(btn(page, "Add a different word")).toHaveCount(0);
  await btn(page, "Add 学习 xuéxí").press("Enter");
  await expect(btn(page, "Added 学习 xuéxí")).toBeVisible();
  await page.getByLabel("Search by pinyin").fill("kāfēiyīn");
  await expect(page.getByRole("status").filter({ hasText: "No HSK matches." })).toBeVisible();
  await expect(btn(page, "Add custom word")).toHaveCount(0);
  await btn(page, "Done").click();
  await expect(page.locator(".list li")).toHaveCount(2);
  await expect(btn(page, "Review personal words")).toBeVisible();
  await btn(page, "Review").click();
  await expect(page.locator(".custom-head")).toHaveText("咖啡因");
  await btn(page, "Show pinyin").click();
  await expect(page.locator("#pronunciation")).toHaveText("kāfēiyīn");
  await expect.poll(async () => (await readProgress(page)).prompt.looked).toBe(true);
  await page.reload();
  await expect(page.locator(".custom-head")).toHaveText("咖啡因");
  await btn(page, "Next").click();
  await expect(page.locator(".target")).toHaveText("学习");
  await btn(page, "Next").click();
  await expect(btn(page, "Keep practising HSK")).toBeVisible();
  await page.reload();
  await btn(page, "Keep practising HSK").click();
  await expect(page.locator(".target")).toBeVisible();
  await expect(page.locator(".progress-stack")).toHaveAccessibleName(/2 words reviewed/);
  const s = await readProgress(page);
  expect(s.history[customId].step).toBe(0);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  expect(s.history[customId].due).toBe(localDay(tomorrow));
  await page.reload();
  await expect(page.locator(".target")).toBeVisible();
  expect((await readProgress(page)).prompt.id).toBe(s.prompt.id);
});

test("v4 migration, concurrent membership and custom removal preserve credit and reject stale Next", async ({ page, context }) => {
  const id = "custom-example";
  const saved = fresh();
  const legacy = { day: saved.day, credited: [], history: {}, reviewLevels: [1],
    prompt: { id: "v4-existing", word: "复习", sentence: "我 在 复习 课文 。", looked: true, example: 0 } };
  await page.goto("/favicon.png");
  await page.evaluate(s => localStorage.setItem("chinese-revision.v4", JSON.stringify(s)), legacy);
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("复习");
  expect((await readProgress(page)).prompt).toEqual(legacy.prompt);
  await page.evaluate(({ key, id }) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    s.myWords = [id]; s.custom = { [id]: { hanzi: "咖啡因", pinyin: "kāfēiyīn" } };
    s.prompt = null;
    localStorage.setItem(key, JSON.stringify(s));
    localStorage.setItem("chinese-revision.v4", "{}");
  }, { key: progressKey, id });
  await page.reload();
  await expect(page.locator(".custom-head")).toBeVisible();
  const other = await context.newPage();
  await other.goto("/");
  await btn(other, "Word Bank").click();
  await other.locator("[data-word]").click();
  await btn(other, "Edit word").click();
  await other.getByLabel("Pinyin", { exact: true }).fill("kā fēi yīn");
  await btn(other, "Save word").click();
  await btn(page, "Show pinyin").click();
  await expect(page.locator("#pronunciation")).toHaveText("kā fēi yīn");
  // Keep the action bound to the old prompt even if the tab redraws after removal.
  const staleNext = await btn(page, "Next").elementHandle();
  await other.locator("[data-word]").click();
  await btn(other, "Remove from Personal").click();
  await expect.poll(async () => (await readProgress(other)).myWords).toEqual([]);
  await staleNext!.evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator(".target")).toBeVisible();
  const state = await readProgress(page);
  expect(state.history[id]).toBeUndefined();
  expect(state.credited).toEqual([]);
  expect(state.myWords).toEqual([]);
  expect(state.reviewLevels).toEqual([1]);
});

test("catalogue search preserves sense selection after IME composition", async ({ page }) => {
  await page.goto("/");
  await btn(page, "Word Bank").click();
  await btn(page, "Add word").click();
  const input = page.getByLabel("Search by pinyin");
  await input.focus();
  await input.evaluate(el => {
    el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    (el as HTMLInputElement).value = "huan";
    el.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
    el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
  });
  await btn(page, "Add 还 huán").click();
  await btn(page, "Done").click();
  await expect(page.locator('[data-word="还#678"]')).toBeVisible();
  expect((await readProgress(page)).myWords).toEqual(["还#678"]);
  expect((await readProgress(page)).custom).toEqual({});
});

test("the last personal word triggers the existing ten-word milestone and the caught-up screen", async ({ page }) => {
  const id = "custom-milestone";
  const s = fresh();
  s.myWords = [id];
  s.custom[id] = { hanzi: "咖啡因", pinyin: "kāfēiyīn" };
  s.credited = ["我", "是", "了", "借", "书", "学习", "地图", "学校", "在"];
  await seedProgress(page, s);
  await btn(page, "Next").click();
  await expect(page.locator(".victory.tier-10")).toBeVisible();
  await expect(page.locator('.word-slice[title="咖啡因"]')).toHaveCount(1);
  await btn(page, "Continue").click();
  await expect(btn(page, "Keep practising HSK")).toBeVisible();
  await btn(page, "Word Bank").click();
  await btn(page, "Review personal words").click();
  await expect(btn(page, "Keep practising HSK")).toBeVisible();
  expect((await readProgress(page)).credited).toHaveLength(10);
});

test("search membership updates in place and an unrelated add leaves an open guide alone", async ({ page, context }) => {
  const other = await context.newPage();
  for (const tab of [page, other]) {
    await tab.goto("/");
    await btn(tab, "Word Bank").click();
    await btn(tab, "Add word").click();
    await tab.getByLabel("Search by pinyin").fill("xuexi");
  }
  const query = page.getByLabel("Search by pinyin");
  await btn(other, "Add 学习 xuéxí").click();
  await expect(btn(page, "Added 学习 xuéxí")).toBeDisabled();
  await expect(query).toBeFocused();
  await btn(other, "Done").click();
  await other.locator('[data-word="学习"]').click();
  await btn(other, "Remove from Personal").click();
  await expect(btn(page, "Add 学习 xuéxí")).toBeEnabled();
  await expect(query).toHaveValue("xuexi");
  await btn(page, "Add 学习 xuéxí").click();
  await btn(page, "Done").click();
  await page.locator('[data-word="学习"]').click();
  const guide = page.locator("details").first();
  await guide.locator("summary").click();
  await expect(guide.locator(".strokes")).toBeVisible();
  await btn(other, "Add word").click();
  await other.getByLabel("Search by pinyin").fill("ditu");
  await btn(other, "Add 地图 dìtú").click();
  await btn(other, "Done").click();
  await expect(guide.locator(".strokes")).toBeVisible();
  await other.locator('[data-word="学习"]').click();
  await btn(other, "Remove from Personal").click();
  await expect(page.locator('[data-word="地图"]')).toBeVisible();
});

test("correcting a reviewed custom word to HSK preserves its one credit after reload", async ({ page }) => {
  const s = fresh();
  const from = "custom-class";
  s.custom[from] = { hanzi: "学习", pinyin: "xuéxiā" };
  s.myWords = [from];
  s.credited = [from];
  s.history[from] = { visits: 1, step: 1, last: s.day, due: s.day };
  await seedProgress(page, s);
  await btn(page, "Word Bank").click();
  await page.locator("[data-word]").click();
  await btn(page, "Edit word").click();
  await page.getByLabel("Pinyin", { exact: true }).fill("xuéxí");
  await btn(page, "Save word").click();
  await page.locator(".matches button").click();
  await expect(page.locator('[data-word="学习"]')).toBeVisible();
  await page.reload();
  await expect(btn(page, "Keep practising HSK")).toBeVisible();
  const saved = await readProgress(page);
  expect(saved.credited).toEqual(["学习"]);
  expect(saved.history).toEqual({ 学习: s.history[from] });
});

test("Personal pages eight words at a time with review above the list and recovers an emptied last page", async ({ page }) => {
  const s = fresh();
  for (let i = 0; i < 17; i++) {
    const id = "custom-page-" + i;
    s.myWords.push(id);
    s.custom[id] = { hanzi: "词", pinyin: "cí" };
  }
  await seedProgress(page, s);
  await btn(page, "Word Bank").click();
  const rows = page.locator(".list [data-word]");
  await expect(rows).toHaveCount(8);
  expect((await btn(page, "Review personal words").boundingBox())!.y).toBeLessThan((await rows.first().boundingBox())!.y);
  await btn(page, "Page 3").click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-word", s.myWords[16]);
  await rows.first().click();
  await btn(page, "Remove from Personal").click();
  await expect(btn(page, "Page 2")).toHaveAttribute("aria-current", "page");
  await expect(rows).toHaveCount(8);
  await btn(page, "Review personal words").click();
  expect((await readProgress(page)).prompt.word).toBe(s.myWords[0]);
});

test("starting Personal retains an eligible displayed prompt even when another word is due", async ({ page }) => {
  const progress = fresh();
  progress.myWords = ["custom-open", "书"];
  progress.custom["custom-open"] = { hanzi: "咖啡因", pinyin: "kāfēiyīn" };
  progress.prompt = { kind: "word", word: "custom-open", id: "in-progress", looked: true, personal: true };
  progress.history["书"] = { due: progress.day, last: progress.day, step: 1, visits: 1 };
  await seedProgress(page, progress);
  await btn(page, "Word Bank").click();
  await btn(page, "Review personal words").click();
  await expect(page.locator(".custom-head")).toHaveText("咖啡因");
  expect((await readProgress(page)).prompt).toEqual(progress.prompt);
});
