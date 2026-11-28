import { expect, test } from "@playwright/test";
import { fresh } from "../../src/review.ts";
import { seedProgress } from "./helpers/progress.ts";
import guides from "../../data/characters.json" with { type: "json" };

test("both bundled faces render every writing-guide component and font name", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Rendered font inspection uses Chromium DevTools.");
  await page.goto("/#settings");
  const labels = await page.locator("#han-font option").allTextContents();
  const components = Object.values(guides.characters).map(guide => guide.radical + guide.structure);
  const characters = [...new Set([...labels, ...components].join("").match(/\p{Script=Han}/gu))].join("");
  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#font-preview-hanzi" });
  for (const [value, postScriptName] of [["hei", "NotoSansCJKsc-Regular"], ["song", "NotoSerifCJKsc-Regular"]]) {
    await page.getByLabel("Chinese font").selectOption(value);
    await page.locator("#font-preview-hanzi").evaluate(async (sample, characters) => {
      sample.textContent = characters;
      await document.fonts.load("16px " + getComputedStyle(sample).fontFamily, characters);
    }, characters);
    await expect.poll(async () => {
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
      return fonts;
    }).toEqual([expect.objectContaining({ postScriptName, isCustomFont: true })]);
  }
});

test("the chosen typeface follows Chinese through review, lookup, writing guides and milestones", async ({ page }) => {
  await page.goto("/");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  for (const [value, family] of [["song", /Study Song/], ["hei", /Study Hei/]] as const) {
    await settings.click();
    await page.getByLabel("Chinese font").selectOption(value);
    await expect(page.locator("#settings-toast-message [lang=zh-Hans]")).toHaveCSS("font-family", family);
    await page.getByRole("button", { name: "Back to study" }).click();
    await expect(page.locator(".brand")).toHaveCSS("font-family", family);
    const word = page.locator(".target");
    await word.hover();
    await expect(word).toHaveCSS("font-family", family);
    await expect(page.locator("#entry strong")).toHaveCSS("font-family", family);
    await expect(page.locator("#entry .pinyin")).toHaveCSS("font-family", /Andika/);
    await word.click();
    for (const selector of [".headword h1", ".usage h2", ".memory-cue [lang=zh-Hans]", ".writing-guide summary"]) {
      await expect(page.locator(selector).first()).toHaveCSS("font-family", family);
    }
    await page.locator(".writing-guide summary").first().click();
    await expect(page.locator(".character-facts [lang=zh-Hans]").first()).toHaveCSS("font-family", family);
    await page.goto("/?preview=10");
    await expect(page.locator(".victory h1")).toHaveCSS("font-family", family);
    await expect(page.locator(".cheer-reading [lang=zh-Latn]")).toHaveCSS("font-family", /Andika/);
    await page.goto("/");
  }
});

test("personal words keep hanzi and pinyin fonts in messages, review and editing", async ({ page }) => {
  const saved = fresh();
  saved.myWords = ["custom-reading"];
  saved.custom["custom-reading"] = { hanzi: "学习", pinyin: "xuéxǐ" };
  await seedProgress(page, saved);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Chinese font").selectOption("song");
  await page.getByRole("button", { name: "Back to study" }).click();
  await expect(page.locator(".custom-head")).toHaveCSS("font-family", /Study Song/);
  await page.getByRole("button", { name: "Show pinyin" }).click();
  await expect(page.locator("#pronunciation")).toHaveCSS("font-family", /Andika/);
  await page.locator("#bank").click();
  await page.getByRole("button", { name: "Add word", exact: true }).click();
  const search = page.getByLabel("Search by pinyin");
  await search.fill("地图");
  await expect(search).toHaveCSS("font-family", /Study Song/);
  await search.fill("ditu");
  await expect(search).toHaveCSS("font-family", /Andika/);
  await expect(page.locator(".match-text strong").first()).toHaveCSS("font-family", /Study Song/);
  await page.getByRole("button", { name: "Add 地图 dìtú", exact: true }).click();
  await expect(page.locator(".capture [role=status] [lang=zh-Hans]")).toHaveCSS("font-family", /Study Song/);
  await page.getByRole("button", { name: "Done" }).click();
  await page.locator('[data-word="custom-reading"]').click();
  await expect(page.locator(".headword h1")).toHaveCSS("font-family", /Study Song/);
  await page.getByRole("button", { name: "Edit word" }).click();
  await expect(page.getByLabel("Chinese characters")).toHaveCSS("font-family", /Study Song/);
  await expect(page.getByLabel("Pinyin", { exact: true })).toHaveCSS("font-family", /Andika/);
  await page.getByRole("button", { name: "Save word" }).click();
  await expect(page.getByRole("button", { name: /Save my reading/ }).locator("[lang=zh-Latn]")).toHaveCSS("font-family", /Andika/);
});

test("Chinese font switches independently of pinyin and survives reload", async ({ page }) => {
  await page.goto("/");
  await page.locator("#bank").click();
  const collection = page.getByLabel("Word collection");
  await collection.selectOption("1");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  const back = page.getByRole("button", { name: "Back to study" });
  const control = page.getByLabel("Chinese font");
  const hanzi = page.locator(".list [lang=zh-Hans]").first();
  const reading = page.locator(".bank-pinyin").first();
  await expect(control).toBeHidden();
  await settings.click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(control).toHaveValue("hei");
  for (const [value, family] of [["song", "Study Song"], ["hei", "Study Hei"], ["song", "Study Song"]]) {
    await control.selectOption(value);
    await back.click();
    await expect(collection).toBeVisible();
    await expect(collection).toHaveValue("1");
    await expect(hanzi).toHaveCSS("font-family", new RegExp(family));
    await expect(reading).toHaveCSS("font-family", /Andika/);
    expect(await page.evaluate(async ({ family, sample }) => {
      const fonts = await document.fonts.load('16px "' + family + '"', sample);
      return fonts.some(font => font.status === "loaded");
    }, { family, sample: await hanzi.innerText() })).toBe(true);
    await settings.click();
  }
  expect(await page.evaluate(async () =>
    (await document.fonts.load("16px Andika", "gāng nǚ lǜ")).length)).toBeGreaterThan(0);
  await back.click();
  await page.reload();
  await settings.click();
  await expect(control).toHaveValue("song");
});

test("Settings previews the chosen font and browser Back preserves a Word Bank draft", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Word Bank" }).click();
  await page.getByRole("button", { name: "Add word", exact: true }).click();
  const draft = page.getByLabel("Search by pinyin");
  await draft.fill("lǜ");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await settings.click();
  await expect(settings).toBeFocused();
  await expect(settings).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Chinese font").selectOption("song");
  await expect(page.locator('.font-preview [lang="zh-Hans"]')).toHaveCSS("font-family", /Study Song/);
  await expect(page.getByRole("status")).toHaveText("Chinese font set to 宋体. Saved in this browser.");
  await page.goBack();
  await expect(draft).toHaveValue("lǜ");
  await expect(settings).toBeFocused();
  await page.goForward();
  await page.reload();
  await expect(page.getByLabel("Chinese font")).toHaveValue("song");
});

test("the same gear toggles Settings at the same position and preserves the current collection", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Word Bank" }).click();
  const collection = page.getByLabel("Word collection");
  await collection.selectOption("2");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  const heading = page.getByRole("heading", { name: "Settings", exact: true });
  await expect(settings).toHaveAttribute("aria-controls", "settings-page");
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  const bounds = (await settings.boundingBox())!;

  await settings.click();
  await expect(heading).toBeVisible();
  await expect(page).toHaveURL(/#settings$/);
  await expect(settings).toHaveAttribute("aria-expanded", "true");
  expect(await settings.boundingBox()).toEqual(bounds);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(collection).toHaveValue("2");
  await expect(collection).toBeVisible();
  await expect(settings).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(settings).toHaveAttribute("aria-expanded", "true");
  await expect(settings).toBeFocused();
  await page.keyboard.press("Space");
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(collection).toBeVisible();
  await expect(page).not.toHaveURL(/#settings$/);

  await settings.dblclick();
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(collection).toBeVisible();
});

test("the Settings reveal paints over the study view and lets a second click through", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const gear = page.getByRole("button", { name: "Settings", exact: true });
  const bounds = (await gear.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const settings = page.locator("#settings-page");
  const study = page.locator("#study-scene");
  const sentence = page.locator(".sentence");
  await expect(sentence).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const originalPosition = await sentence.boundingBox();
  await page.mouse.click(x, y);
  await expect(gear).toHaveAttribute("aria-expanded", "true");
  const initialPaint = await settings.evaluate(panel => {
    const animation = panel.getAnimations().find(animation =>
      animation instanceof CSSAnimation && animation.animationName === "circular-paint");
    if (!animation) return null;
    animation.pause();
    animation.currentTime = 0;
    const bounds = panel.getBoundingClientRect();
    return { duration: animation.effect?.getTiming().duration, clipPath: getComputedStyle(panel).clipPath,
      left: bounds.left, top: bounds.top };
  });
  expect(initialPaint).toMatchObject({ duration: 420 });
  const [radius, originX, originY] = initialPaint!.clipPath.match(/-?\d+(?:\.\d+)?(?=px)/g)!.map(Number);
  expect(radius).toBe(0);
  expect(originX).toBeCloseTo(x - initialPaint!.left, 2);
  expect(originY).toBeCloseTo(y - initialPaint!.top, 2);
  await expect(study).toBeVisible();
  await expect(study).toHaveAttribute("inert", "");
  expect(await sentence.boundingBox()).toEqual(originalPosition);
  await study.locator("#bank").evaluate(button => button.focus());
  await expect(gear).toBeFocused();

  await page.mouse.click(x, y);
  await expect(gear).toHaveAttribute("aria-expanded", "false");
  await expect(settings).toHaveAttribute("inert", "");
  await expect(settings).toBeHidden();
  await expect(sentence).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gear.click();
  await expect(settings).toBeVisible();
  await expect(study).toBeHidden();
  expect(await settings.evaluate(panel => panel.getAnimations().length)).toBe(0);
});

test("the Chinese font preview paints over the previous typeface and keeps pinyin still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#settings");
  const font = page.getByLabel("Chinese font");
  const hanzi = page.locator("#font-preview-hanzi");
  const previous = page.locator('#font-preview-hanzi + p[aria-hidden="true"]');
  const pinyin = page.locator('.font-preview [lang="zh-Latn"]');
  await expect(hanzi).toHaveCSS("font-family", /Study Hei/);
  const sample = await hanzi.innerText();
  await page.evaluate(async text => {
    await document.fonts.load('16px "Study Song"', text);
    await document.fonts.ready;
  }, sample);
  const pinyinPosition = await pinyin.boundingBox();
  const pinyinColor = await pinyin.evaluate(element => getComputedStyle(element).color);

  await font.selectOption("song");
  const pausePaint = () => hanzi.evaluate(element => {
    const animations = element.getAnimations().filter(animation => animation instanceof CSSAnimation);
    const paint = animations.find(animation => animation.animationName === "circular-paint");
    const wash = animations.find(animation => animation.animationName === "font-preview-wash");
    if (!paint || !wash) return null;
    for (const animation of [paint, wash]) {
      animation.pause();
      animation.currentTime = 210;
    }
    return paint.effect?.getTiming().duration;
  });
  await expect(hanzi).toHaveAttribute("data-circular-paint", "");
  expect(await pausePaint()).toBe(420);
  await expect(hanzi).toHaveCSS("font-family", /Study Song/);
  await expect(previous).toHaveCSS("font-family", /Study Hei/);
  await expect(previous).toHaveText(sample);
  expect(await pinyin.boundingBox()).toEqual(pinyinPosition);
  await expect(pinyin).toHaveCSS("color", pinyinColor);
  expect(await pinyin.evaluate(element => element.getAnimations().length)).toBe(0);

  await font.selectOption("hei");
  await expect(hanzi).toHaveAttribute("data-circular-paint", "");
  expect(await pausePaint()).toBe(420);
  await expect(hanzi).toHaveCSS("font-family", /Study Hei/);
  await expect(previous).toHaveCount(1);
  await expect(previous).toHaveCSS("font-family", /Study Song/);
  await hanzi.evaluate(element => element.getAnimations().forEach(animation => animation.play()));
  await expect(previous).toHaveCount(0);
  expect(await pinyin.boundingBox()).toEqual(pinyinPosition);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await font.selectOption("song");
  await expect(hanzi).toHaveCSS("font-family", /Study Song/);
  await expect(previous).toHaveCount(0);
  expect(await hanzi.evaluate(element => element.getAnimations().length)).toBe(0);
});

test("each Settings save restarts the toast timeout", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#settings");
  const font = page.getByLabel("Chinese font");
  const toast = page.locator("#settings-toast");
  await expect(toast).toBeHidden();
  await font.selectOption("song");
  await expect(toast).toContainText("Chinese font set to 宋体. Saved in this browser.");
  await expect(toast).toBeVisible();
  await page.clock.runFor(2500);
  await font.selectOption("hei");
  await expect(toast).toContainText("Chinese font set to 黑体. Saved in this browser.");
  await page.clock.runFor(2200);
  await expect(toast).toBeVisible();
  await page.clock.runFor(2000);
  await expect(toast).toBeHidden();
  await page.reload();
  await expect(font).toHaveValue("hei");
});

test("a failed Settings save stays visible and can be dismissed", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#settings");
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "chinese-revision.han-font") throw new DOMException("Blocked", "SecurityError");
      setItem.call(this, key, value);
    };
  });
  const font = page.getByLabel("Chinese font");
  const toast = page.locator("#settings-toast");
  await font.selectOption("song");
  await page.clock.runFor(5000);
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("Browser storage is unavailable.");
  await expect(font).toHaveValue("song");
  await page.getByRole("button", { name: "Dismiss notification" }).press("Enter");
  await expect(toast).toBeHidden();
  await expect(font).toBeFocused();
});
