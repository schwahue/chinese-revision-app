import { expect, test } from "@playwright/test";
import { progressKey } from "../../src/storage.ts";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("switching between 了 and 我 keeps the mobile definition in place", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    Object.assign(saved.prompt, { word: "忘记", example: 1, sentence: "我 忘记 了 他 的 名字 。" });
    localStorage.setItem(key, JSON.stringify(saved));
  }, progressKey);
  await page.reload();
  const entry = page.locator("#entry");
  async function expectCueAtWord() {
    const word = await page.locator('.sentence [aria-expanded="true"]').boundingBox();
    const row = await entry.boundingBox();
    const expected = Math.max(5, Math.min(row!.width - 5, word!.x + word!.width / 2 - row!.x));
    const left = await entry.evaluate(el => parseFloat(getComputedStyle(el, "::before").left));
    expect(Math.abs(left - expected)).toBeLessThan(1);
  }
  await page.getByRole("button", { name: "了", exact: true }).tap();
  await expect(entry.locator(".pinyin")).toHaveText("le");
  await expectCueAtWord();
  const position = await entry.boundingBox();
  const meaning = await entry.locator(".meaning").boundingBox();
  await page.getByRole("button", { name: "我", exact: true }).tap();
  await expect(entry.locator(".meaning")).toHaveText("I");
  expect(await entry.boundingBox()).toEqual(position);
  expect((await entry.locator(".meaning").boundingBox())!.x).toBe(meaning!.x);
  await expectCueAtWord();
  await page.getByRole("button", { name: "我", exact: true }).tap();
  await expect(entry).toHaveCount(0);
  await page.getByRole("button", { name: "我", exact: true }).tap();
  await entry.tap();
  await expect(page.locator(".headword h1")).toHaveText("我");
});

test("moving the review highlight across wrapped lines fades it in place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const heading = page.locator(".sentence");
  await expect(heading.locator(".target")).toBeVisible();
  // Force a deterministic wrap independent of the installed Han font metrics.
  const frames = await heading.evaluate(el => {
    el.style.width = "2em";
    const target = el.querySelector<HTMLButtonElement>(".target")!;
    const other = Array.from(el.querySelectorAll("button")).find(button =>
      Math.abs(button.offsetTop - target.offsetTop) > target.offsetHeight / 2)!;
    other.focus();
    const animation = other.querySelector(".word-highlight")!.getAnimations()[0];
    return (animation.effect as KeyframeEffect).getKeyframes().map(frame => frame.opacity);
  });
  expect(frames).toEqual(["0.25", "1"]);
});
