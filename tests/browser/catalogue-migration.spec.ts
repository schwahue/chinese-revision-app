import { expect, test } from "@playwright/test";
import { fresh } from "../../src/review.ts";
import { progressKey } from "../../src/storage.ts";

test("saved words outside the revised catalogue retain membership, prompts and review history", async ({ page }) => {
  await page.goto("/favicon.png");
  const saved = fresh();
  saved.myWords = ["北京", "我"];
  saved.credited = ["支"];
  saved.history["支"] = { last: saved.day, due: saved.day, step: 1, visits: 2 };
  saved.prompt = { word: "北京", id: "existing-prompt", personal: true, looked: true,
    sentence: "我们 坐 高铁 去 北京 。", example: 0 };
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), { key: progressKey, saved });
  await page.goto("/");
  await expect(page.locator(".custom-head")).toHaveText("北京");
  await page.getByRole("button", { name: "Show pinyin" }).click();
  await expect(page.locator("#pronunciation")).toHaveText("Běijīng");
  await page.reload();
  await expect(page.locator(".custom-head")).toHaveText("北京");
  const restored = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), progressKey);
  const [beijing, wo] = restored.myWords;
  const [zhi] = restored.credited;
  expect(wo).toBe("我");
  expect(restored.custom[beijing]).toEqual({ hanzi: "北京", pinyin: "Běijīng" });
  expect(restored.custom[zhi]).toEqual({ hanzi: "支", pinyin: "zhī" });
  expect(restored.myWords).not.toContain(zhi);
  expect(restored.history[zhi]).toEqual(saved.history["支"]);
  expect(restored.prompt).toMatchObject({ word: beijing, id: "existing-prompt", looked: true, kind: "word" });
});
