import { expect, test } from "@playwright/test";

test("the theme reveal starts at the button and keeps the selected bank level", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#bank").click();
  const filter = page.getByLabel("Word collection");
  await filter.selectOption("1");
  await expect(page.locator("#theme")).toBeHidden();
  const header = page.getByRole("banner");
  const settings = header.getByRole("button", { name: "Settings", exact: true });
  await settings.click();
  const theme = header.getByRole("button", { name: "Switch to dark mode" });
  await expect(theme).toBeVisible();
  await expect(theme).toHaveText("☾");
  const box = (await theme.boundingBox())!;
  const settingsBox = (await settings.boundingBox())!;
  expect(box.x + box.width).toBeLessThan(settingsBox.x);
  expect(box.y + box.height / 2).toBeCloseTo(settingsBox.y + settingsBox.height / 2);
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--reveal-origin")))
    .toBe(`${box.x + box.width / 2}px ${box.y + box.height / 2}px`);
  const paintDuration = () => page.evaluate(() => document.getAnimations().find(animation =>
    animation instanceof CSSAnimation && animation.animationName === "circular-paint")?.effect?.getTiming().duration);
  await expect.poll(paintDuration).toBe(420);
  await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished)));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const light = header.getByRole("button", { name: "Switch to light mode" });
  await expect(light).toHaveText("☼");
  await light.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await paintDuration()).toBeUndefined();
  await page.getByRole("button", { name: "Back to study" }).click();
  await expect(page.locator("#theme")).toBeHidden();
  await expect(filter).toHaveValue("1");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
