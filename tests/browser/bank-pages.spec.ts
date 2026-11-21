import { expect, test } from "@playwright/test";
import bank from "../../src/words.json" with { type: "json" };

test("the compact pager keeps every page reachable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 766 });
  await page.goto("/");
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  const pager = page.getByRole("navigation", { name: "Word Bank pages" });
  const buttons = pager.getByRole("button");
  const levels = Object.values(bank).filter(entry => entry.level === 3);
  const lastLevelPage = Math.ceil(levels.length / 8);
  const allPages = Math.ceil(Object.keys(bank).length / 8);
  const fullPageHeight = await page.locator(".list").evaluate(list => list.clientHeight);
  await expect(buttons).toHaveText(["1", "2", "3", "4", String(lastLevelPage)]);
  await buttons.last().click();
  await expect(page.locator("[data-word]")).toHaveCount(levels.length % 8 || 8);
  expect(await page.locator(".list").evaluate(list => list.clientHeight)).toBe(fullPageHeight);
  await page.getByLabel("Word collection").selectOption("all");
  await expect(buttons).toHaveText(["1", "2", "3", "4", String(allPages)]);
  for (let n = 2; n <= allPages; n++) {
    await pager.getByRole("button", { name: "Page " + n, exact: true }).click();
    await expect(pager.locator('[aria-current="page"]')).toHaveText(String(n));
    await expect(buttons).toHaveCount(5);
    if (n === 7) {
      await expect(buttons).toHaveText(["1", "6", "7", "8", String(allPages)]);
      await expect(pager.locator("span")).toHaveCount(2);
      const tops = await buttons.evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      expect(new Set(tops).size).toBe(1);
    }
  }
  await expect(buttons).toHaveText([1, allPages - 3, allPages - 2, allPages - 1, allPages].map(String));
  await expect(page.locator("[data-word]")).toHaveCount(Object.keys(bank).length % 8 || 8);
  expect(await page.locator(".list").evaluate(list => list.clientHeight)).toBe(fullPageHeight);
  await pager.getByRole("button", { name: "Page 1", exact: true }).press("Enter");
  await expect(page.locator("[data-word]").first()).toBeFocused();
});

test("Word Bank keeps its header and collection controls in place across lists", async ({ page }) => {
  for (const width of [573, 320, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    await page.goto("/");
    await page.locator("#bank").click();
    const positions = () => page.locator(".brand, nav, #collection").evaluateAll(elements =>
      elements.map(element => {
        const { x, y } = element.getBoundingClientRect();
        return { x, y };
      }));
    const empty = await positions();
    await page.getByLabel("Word collection").selectOption("3");
    expect(await positions()).toEqual(empty);
    await page.getByLabel("Word collection").selectOption("my");
    expect(await positions()).toEqual(empty);
    const add = page.getByRole("button", { name: "Add word", exact: true });
    const box = (await add.boundingBox())!;
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
    await add.click();
    expect(await positions()).toEqual(empty);
    await expect(page.getByLabel("Search by pinyin")).toBeFocused();
    expect((await page.locator(".capture").boundingBox())!.y).toBeGreaterThanOrEqual(box.y + box.height);
    await page.getByRole("button", { name: "Done" }).click();
    await expect(add).toBeFocused();
    const nav = await page.locator("nav").boundingBox();
    const tools = await page.locator(".bank-tools").boundingBox();
    expect(tools!.y - (nav!.y + nav!.height)).toBeCloseTo(20, 0);
  }
});

test("the collection dropdown opens on Personal and switches the list by keyboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#bank").click();
  const picker = page.getByRole("combobox", { name: "Word collection" });
  await expect(picker).toHaveValue("my");
  await expect(picker.locator("option")).toHaveText(["Personal", "All HSK", "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5"]);
  await picker.press("h");
  await expect(picker).toHaveValue("1");
  await expect(page.locator("[data-word]").first()).toBeVisible();
  await picker.selectOption("my");
  await expect(picker).toHaveValue("my");
  await expect(picker).toBeFocused();
  await expect(page.getByRole("button", { name: "Add word", exact: true })).toBeVisible();
});

test("word rows animate on level and page changes, respecting reduced motion", async ({ page }) => {
  await page.goto("/");
  await page.locator("#bank").click();
  const picker = page.getByLabel("Word collection");
  const rows = page.locator(".list > li");
  const rowAnimation = () => rows.evaluateAll(items =>
    items.map(item => item.getAnimations().some(a => a.effect instanceof KeyframeEffect &&
      a.effect.getKeyframes().some(frame => frame.opacity === "0.25"))));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await picker.selectOption("3");
  expect(await rowAnimation()).toEqual(Array(8).fill(true));
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  expect(await rowAnimation()).toEqual(Array(8).fill(true));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await picker.selectOption("1");
  expect(await rowAnimation()).toEqual(Array(8).fill(false));
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  expect(await rowAnimation()).toEqual(Array(8).fill(false));
});

for (const width of [320, 573, 1024]) {
  test(`the collection picker opens below navigation and centers the current level at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 768 });
    await page.goto("/");
    await page.locator("#bank").click();
    const picker = page.getByLabel("Word collection");
    const row = (name: string) => picker.getByRole("option", { name, exact: true });
    const trigger = (await picker.boundingBox())!;
    await picker.click();
    await expect(row("Personal")).toBeInViewport({ ratio: .98 });
    expect((await row("Personal").boundingBox())!.y).toBeCloseTo(trigger.y + 1, 0);
    await picker.press("Escape");
    await picker.selectOption("3");
    await picker.click();
    for (const name of ["HSK 2", "HSK 3", "HSK 4"]) await expect(row(name)).toBeInViewport({ ratio: .98 });
    expect((await row("HSK 2").boundingBox())!.y).toBeCloseTo(trigger.y + 1, 0);
    await row("HSK 5").scrollIntoViewIfNeeded();
    await expect(picker).toHaveValue("3");
    await picker.press("Escape");
    await picker.press("Space");
    await expect(row("HSK 2")).toBeInViewport({ ratio: .98 });
    await row("HSK 2").click();
    await expect(picker).toHaveValue("2");
    await picker.selectOption("5");
    await picker.press("Space");
    await expect(row("HSK 5")).toBeInViewport({ ratio: .98 });
    expect((await row("HSK 3").boundingBox())!.y).toBeCloseTo(trigger.y + 1, 0);
    await picker.press("Escape");
    await expect(picker).toBeFocused();
  });
}
