import { expect, test } from "@playwright/test";

test("the theme reveal starts at the button and keeps the selected bank level", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#bank").click();
  const filter = page.getByLabel("Word collection");
  await filter.selectOption("1");
  const theme = page.getByRole("button", { name: "Switch to dark mode" });
  const box = (await theme.boundingBox())!;
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--reveal-origin")))
    .toBe(`${box.x + box.width / 2}px ${box.y + box.height / 2}px`);
  await expect.poll(() => page.evaluate(() => document.getAnimations().some(a =>
    a instanceof CSSAnimation && a.animationName === "reveal-theme"))).toBe(true);
  await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished)));
  await expect(filter).toHaveValue("1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Switch to light mode" }).press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => document.getAnimations().some(a =>
    a instanceof CSSAnimation && a.animationName === "reveal-theme"))).toBe(false);
});
