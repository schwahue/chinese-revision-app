import { expect, test } from "@playwright/test";

test("the Word Bank reuses one moving highlight and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  await page.mouse.move(0, 0);
  const rows = page.locator("[data-word]");
  await rows.first().hover();
  const highlight = page.locator(".list .word-highlight");
  expect(await highlight.evaluate(el => el.getAnimations().length)).toBe(0);

  // Freeze the glide midway and change direction before it lands.
  const jump = await rows.evaluateAll(buttons => {
    const mark = buttons[0].querySelector(".word-highlight")!;
    const enter = (i: number) => buttons[i].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    enter(4);
    const animation = mark.getAnimations()[0];
    animation.pause();
    animation.currentTime = 70;
    const from = mark.getBoundingClientRect().top;
    enter(1);
    return Math.abs(mark.getBoundingClientRect().top - from);
  });
  expect(jump).toBeLessThan(1);
  await expect(rows.nth(1).locator(".word-highlight")).toHaveCount(1);
  await page.mouse.move(0, 0);
  await expect(highlight).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#collection").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(rows.nth(1)).toBeFocused();
  await expect(rows.nth(1).locator(".word-highlight")).toHaveCount(1);
  expect(await highlight.evaluate(el => el.getAnimations().length)).toBe(0);
});
