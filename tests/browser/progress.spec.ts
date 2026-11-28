import { expect, test, type Page } from "@playwright/test";
import { readProgress } from "./helpers/progress.ts";

import bank from "../../src/words.json" with { type: "json" };
import { progressKey as key } from "../../src/storage.ts";

const legacyKey = "chinese-revision.v1";

async function toggleTheme(page: Page) {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#theme").click();
  await page.getByRole("button", { name: "Back to study" }).click();
}

test("two tabs advancing the same displayed prompt credit it once", async ({ page, context }) => {
  await page.goto("/");
  const second = await context.newPage();
  await second.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  await expect(second.locator(".target")).toHaveText("借");
  await holdWriter(page);
  await Promise.all([page, second].map(tab => tab.locator("#next").dispatchEvent("click")));
  await toggleTheme(second);
  await page.evaluate(() => window.dispatchEvent(new Event("release-lock")));
  await expect(page.locator(".target")).toHaveText("复习");
  await expect(second.locator(".target")).toHaveText("复习");
  const saved = await readProgress(page);
  expect(saved.credited).toEqual(["借"]);
  expect(saved.history["借"].visits).toBe(1);
});

async function holdWriter(page: Page) {
  await page.evaluate(async k => {
    const release = new Promise<void>(resolve => window.addEventListener("release-lock", () => resolve(), { once: true }));
    await new Promise<void>(ready => {
      void navigator.locks.request(k, () => { ready(); return release; });
    });
  }, key);
}

test("a Next pressed before midnight keeps its date when the writer lock opens tomorrow", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 21, 23, 59, 59));
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  await holdWriter(page);
  await page.locator("#next").click();
  await page.clock.setFixedTime(new Date(2026, 10, 22, 0, 0, 1));
  await page.evaluate(() => window.dispatchEvent(new Event("release-lock")));
  await expect(page.locator(".target")).toHaveText("复习");
  const saved = await readProgress(page);
  expect(saved.history["借"]).toMatchObject({ last: "2026-11-21", due: "2026-11-24", visits: 1 });
  expect(saved.day).toBe("2026-11-22");
  expect(saved.credited).toEqual([]);
  await page.locator("#next").click();
  await expect.poll(async () => (await readProgress(page)).credited).toEqual(["复习"]);
});

for (const tier of [10, 15, 30]) {
  test(`the ${tier}-word milestone survives a save across midnight in two tabs`, async ({ page, context }) => {
    const before = new Date(2026, 10, 21, 23, 59, 59);
    const after = new Date(2026, 10, 22, 0, 0, 1);
    await page.clock.setFixedTime(before);
    await page.goto("/favicon.png");
    const credits = Object.keys(bank).filter(w => w !== "借" && bank[w].level === 1).slice(0, tier - 1);
    await page.evaluate(({ k, credits }) => {
      const day = "2026-11-21";
      const history = Object.fromEntries(credits.map(w => [w, { last: day, due: "2026-11-24", visits: 1, step: 1 }]));
      localStorage.setItem(k, JSON.stringify({ day, credited: credits, history, prompt: null }));
    }, { k: key, credits });
    await page.goto("/");
    const other = await context.newPage();
    await other.goto("/");
    for (const tab of [page, other]) await expect(tab.locator(".target")).toHaveText("借");
    await holdWriter(page);
    await page.locator("#next").click();
    await other.locator("#next").click();
    await page.clock.setFixedTime(after);
    await page.evaluate(() => window.dispatchEvent(new Event("release-lock")));

    await expect(page.locator(".victory h1")).toBeFocused();
    await expect(page.locator(".progress-stack")).toHaveAccessibleName(`${tier} words reviewed on 2026-11-21`);
    await expect(page.locator(".victory time")).toHaveText("2026-11-21");
    await expect(page.locator(".word-slice")).toHaveCount(tier);
    await expect(other.locator(".target")).toHaveText("复习");
    await page.locator("#continue").click();
    await expect(page.locator(".progress-stack")).toHaveAccessibleName(/0 words reviewed today/);
    await page.reload();
    await expect(page.locator(".target")).toHaveText("复习");
    const state = await readProgress(page);
    expect(state.history["借"]).toMatchObject({ last: "2026-11-21", due: "2026-11-24", visits: 1 });
    expect(state.credited).toEqual([]);
  });
}

test("remote settings and progress preserve an open entry and its writing guide", async ({ page, context }) => {
  await page.goto("/");
  const second = await context.newPage();
  await second.goto("/");
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  await page.locator('[data-word="地图"]').click();
  await page.locator('[data-character="图"] summary').click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await toggleTheme(second);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", theme!);
  await second.locator("#next").click();
  await expect(second.locator(".target")).toHaveText("复习");
  await expect(page.locator('[data-character="图"][open] .strokes')).toBeVisible();
});

for (const method of ["clear", "removeItem"] as const) {
  test(method + " cannot be undone by an older tab", async ({ page, context }) => {
    await page.goto("/");
    await page.locator("#next").click();
    await expect(page.locator(".target")).toHaveText("复习");
    const second = await context.newPage();
    await second.goto("/");
    await second.evaluate(({ method, key }) => {
      if (method === "clear") localStorage.clear();
      else localStorage.removeItem(key);
    }, { method, key });
    await toggleTheme(page);
    await expect(page.locator(".target")).toHaveText("借");
    await page.reload();
    await expect(page.locator(".target")).toHaveText("借");
    expect((await readProgress(page)).history).toEqual({});
  });
}

test("a damaged save is backed up and later reviews survive reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  await page.evaluate(k => localStorage.setItem(k, "{"), key);
  await page.reload();
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  await page.reload();
  await expect(page.locator(".target")).toHaveText("复习");
  expect(await page.evaluate(k => localStorage.getItem(k + ".damaged"), key)).toBe("{");
});

test("hover previews 这里 and a mouse click opens its entry without marking 方便 as looked up", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k)!);
    Object.assign(s.prompt, { word: "方便", sentence: "在 这里 买 东西 很 方便 。" });
    localStorage.setItem(k, JSON.stringify(s));
  }, key);
  await page.reload();
  const word = page.getByRole("button", { name: "这里", exact: true });
  await word.hover();
  await expect(page.locator("#entry .meaning")).toHaveText("here");
  await word.click();
  await expect(page.locator(".headword h1")).toHaveText("这里");
  await page.locator("#back").click();
  await expect(page.locator("#entry")).toBeFocused();
  expect((await readProgress(page)).prompt).toMatchObject({ word: "方便", looked: false });
});

test("keyboard lookup and Practise keep the chosen word and its next-day interval", async ({ page }) => {
  await page.goto("/");
  await page.locator(".target").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#entry")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".headword h1")).toHaveText("借");
  await page.locator("#back").click();
  await expect(page.locator("#entry")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.locator("#practise").click();
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const h = (await readProgress(page)).history["借"];
  const tomorrow = new Date(h.last + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  expect(h.due).toBe(tomorrow.toISOString().slice(0, 10));
  expect(h.step).toBe(0);
});

test("a legacy prompt retains its lookup, history, credits and theme", async ({ page }) => {
  await page.goto("/");
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const before = await readProgress(page);
  await page.evaluate(k => {
    const legacy = JSON.parse(localStorage.getItem(k)!);
    localStorage.clear();
    delete legacy.prompt.sentence;
    delete legacy.prompt.id;
    legacy.prompt.looked = true;
    legacy.theme = "dark";
    localStorage.setItem("chinese-revision.v1", JSON.stringify(legacy));
  }, key);
  await page.reload();
  await expect(page.locator(".target")).toHaveText("复习");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const after = await readProgress(page);
  expect(after.credited).toEqual(before.credited);
  expect(after.history).toEqual(before.history);
  expect(after.prompt).toMatchObject({ word: "复习", looked: true, example: before.prompt.example, sentence: before.prompt.sentence });
  expect(after.prompt.id).toBeTruthy();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".target")).toHaveText("复习");
  expect((await readProgress(page)).prompt.id).toBe(after.prompt.id);
});

test("an invalid history entry leaves the rest of the saved review usable", async ({ page }) => {
  await page.goto("/");
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const before = await readProgress(page);
  await page.evaluate(k => {
    const state = JSON.parse(localStorage.getItem(k)!);
    state.history["复习"] = { visits: -1 };
    localStorage.setItem(k, JSON.stringify(state));
  }, key);
  await page.reload();
  await expect(page.locator(".target")).toHaveText("复习");
  expect(await readProgress(page)).toEqual(before);
});

test("blocked storage allows practice for this visit", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };
  });
  await page.goto("/");
  await expect(page.locator("#notice")).toBeVisible();
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  await expect(page.locator(".progress-stack")).toHaveAccessibleName(/1 word reviewed/);
});

test("Practise on a different word starts an unaided prompt", async ({ page }) => {
  await page.goto("/");
  await page.locator(".target").click();
  await page.locator("#back").click();
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  await page.locator('[data-word="地图"]').click();
  await page.locator("#practise").click();
  await expect(page.locator(".target")).toHaveText("地图");
  expect((await readProgress(page)).prompt.looked).toBe(false);
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("借");
  expect((await readProgress(page)).history["地图"].step).toBe(1);
});

test("a theme toggle and Next from a stale screen preserve the newer review", async ({ page, context }) => {
  await page.goto("/");
  const stale = await context.newPage();
  // Register before startup so the app keeps displaying the earlier prompt.
  await stale.addInitScript(() => window.addEventListener("storage", event => event.stopImmediatePropagation(), true));
  await stale.goto("/");
  await expect(stale.locator(".target")).toHaveText("借");
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const before = await readProgress(page);
  await expect.poll(() => readProgress(stale)).toEqual(before);
  await toggleTheme(stale);
  expect(await readProgress(page)).toEqual(before);
  await expect(stale.locator(".target")).toHaveText("借");
  await stale.locator("#next").click();
  await expect(stale.locator(".target")).toHaveText("复习");
  expect(await readProgress(page)).toEqual(before);
});

test("a stale Next after clear cannot credit a new copy of the same word", async ({ page, context }) => {
  await page.addInitScript(() => window.addEventListener("storage", event => event.stopImmediatePropagation(), true));
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  const first = await readProgress(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator(".target")).toHaveText("借");
  await other.evaluate(() => localStorage.clear());
  // The old UI is still visible, but the reset must be readable in this tab.
  await expect.poll(() => readProgress(page)).toBeNull();
  await page.locator("#next").click();
  await expect.poll(async () => {
    const saved = await readProgress(other);
    return Boolean(saved?.prompt?.id && saved.prompt.id !== first.prompt.id);
  }).toBe(true);
  await expect(page.locator(".target")).toHaveText("借");
  const restored = await readProgress(page);
  expect(restored.prompt.id).toBeTruthy();
  expect(restored.history).toEqual({});
  expect(restored.credited).toEqual([]);
});

test("legacy writes cannot erase a new word or resurrect a reset session", async ({ page, context }) => {
  // A same-origin static page stands in for a still-open build that only writes v1.
  const old = await context.newPage();
  await old.goto("/favicon.png");
  await page.goto("/");
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const legacy = await readProgress(page);
  delete legacy.prompt.sentence;
  // Open the newly added word through the same review flow as a learner.
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  const library = page.locator('[data-word="图书馆"]');
  for (let number = 2; !(await library.count()); number++) {
    await page.getByRole("button", { name: "Page " + number, exact: true }).click();
  }
  await library.click();
  await page.locator("#practise").click();
  await expect(page.locator(".target")).toHaveText("图书馆");
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const earned = await readProgress(page);
  expect(earned.credited).toContain("图书馆");
  expect(earned.history["图书馆"].visits).toBe(1);
  await old.evaluate(({ legacyKey, legacy }) => {
    legacy.prompt.looked = true;
    localStorage.setItem(legacyKey, JSON.stringify(legacy));
  }, { legacyKey, legacy });
  await page.reload();
  await expect(page.locator(".target")).toHaveText("复习");
  expect(await readProgress(page)).toEqual(earned);
  await old.evaluate(k => localStorage.removeItem(k), key);
  await expect(page.locator(".target")).toHaveText("借");
  expect((await readProgress(page)).credited).toEqual([]);
});

test("impossible dates are backed up and valid leap-day history survives", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  const raw = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k)!);
    for (const [word, due] of Object.entries({ 借: "2026-99-99", 地图: "2026-02-30", 书: "2024-02-29" })) {
      s.history[word] = { due, last: "2024-02-26", step: 1, visits: 1 };
    }
    const raw = JSON.stringify(s);
    localStorage.setItem(k, raw);
    return raw;
  }, key);
  await page.reload();
  await expect(page.locator(".target")).toHaveText("借");
  const { history } = await readProgress(page);
  expect(Object.keys(history)).toEqual(["书"]);
  expect(history["书"].due).toBe("2024-02-29");
  expect(await page.evaluate(k => localStorage.getItem(k + ".damaged"), key)).toBe(raw);
  await page.locator("#next").click();
  await expect(page.locator(".target")).toHaveText("复习");
  const saved = await readProgress(page);
  const due = new Date(saved.day + "T00:00:00Z");
  due.setUTCDate(due.getUTCDate() + 3);
  expect(saved.history["借"].due).toBe(due.toISOString().slice(0, 10));
});

test("a reordered sentence keeps the encounter and a removed sentence restarts it", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  const { prompt } = await readProgress(page);
  const sentence = "你 想 借 哪 本 书 ？";
  async function resume(text: string) {
    await page.evaluate(({ key, text }) => {
      const s = JSON.parse(localStorage.getItem(key)!);
      Object.assign(s.prompt, { sentence: text, example: 0, looked: true });
      localStorage.setItem(key, JSON.stringify(s));
    }, { key, text });
    await page.reload();
    await expect(page.locator(".target")).toHaveText("借");
    return readProgress(page);
  }
  const reordered = await resume(sentence);
  expect(reordered.prompt).toEqual({ ...prompt, sentence, example: 1, looked: true });
  await expect(page.locator(".sentence")).toHaveText(sentence.replaceAll(" ", ""));
  const replaced = await resume("我 想 借 书 。");
  expect(replaced.prompt).toMatchObject({ word: "借", sentence: prompt.sentence, looked: false });
  expect(replaced.prompt.id).not.toBe(prompt.id);
  expect(replaced.history).toEqual({});
  expect(replaced.credited).toEqual([]);
});

test("memory cues and character facts preserve language changes inside English prose", async ({ page }) => {
  await page.goto("/");
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  await page.locator('[data-word="借"]').click();
  await expect(page.locator('.memory-cue [lang="zh-Hans"]').first()).toHaveText("我想借书");
  await page.locator('[data-character="借"] summary').click();
  await expect(page.locator('.character-facts dd [lang="zh-Hans"]')).toHaveText(["亻", "亻", "昔"]);
  await expect(page.locator(".character-facts dd").first()).toHaveText("亻 · person");
});

test("the expanded bank migrates v2 and practises the return sense of 还", async ({ page, context }) => {
  await page.goto("/favicon.png");
  await page.evaluate(() => {
    const today = new Date();
    const day = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("chinese-revision.v2", JSON.stringify({
      day, credited: ["借"], history: { 借: { last: day, due: day, visits: 2, step: 1 } },
      prompt: { word: "地图", sentence: "我 看 地图 。", id: "old", example: 0, looked: false },
    }));
  });
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("地图");
  expect((await readProgress(page)).history["借"].visits).toBe(2);
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("3");
  const word = "还#678";
  const keys = Object.keys(bank).filter(k => bank[k].level === 3);
  const number = Math.floor(keys.indexOf(word) / 8) + 1;
  for (let n = 2; n <= number; n++) await page.getByRole("button", { name: "Page " + n, exact: true }).click();
  await page.locator('[data-word="还#678"]').click();
  await expect(page.locator(".headword h1")).toHaveText("还");
  await expect(page.locator(".headword .reading-pinyin")).toHaveText("huán");
  await page.locator('[data-character="还"] summary').click();
  await expect(page.locator(".strokes")).toBeVisible();
  await page.locator("#practise").click();
  await expect(page.locator(".target")).toHaveText("还");
  await page.reload();
  await page.locator(".target").click();
  await expect(page.locator(".headword p")).toHaveText("to return; to give back");
  await page.locator("#back").click();
  await page.locator("#next").click();
  await expect.poll(async () => (await readProgress(page)).credited).toEqual(["借", word]);
  const earned = await readProgress(page);
  const oldTab = await context.newPage();
  await oldTab.goto("/favicon.png");
  await oldTab.evaluate(() => localStorage.setItem("chinese-revision.v2", "{}"));
  await page.reload();
  await expect(page.locator(".target")).toBeVisible();
  expect(await readProgress(page)).toEqual(earned);
});

test("an earlier v2 reset takes precedence over a leftover v1 save", async ({ page }) => {
  await page.goto("/favicon.png");
  await page.evaluate(() => {
    localStorage.setItem("chinese-revision.v2.migrated", "1");
    localStorage.setItem("chinese-revision.v1", JSON.stringify({
      day: "2026-01-01", credited: [], prompt: null,
      history: { 借: { last: "2026-01-01", due: "2026-01-04", visits: 1, step: 1 } },
    }));
  });
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  expect((await readProgress(page)).history).toEqual({});
});

test("denied access to Web Locks still permits review for this visit", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", {
    get() { throw new DOMException("Access denied", "SecurityError"); },
  }));
  await page.goto("/");
  await expect(page.locator("#notice")).toBeVisible();
  await page.locator("#next").click();
  await expect(page.locator(".progress-stack")).toHaveAccessibleName(/1 word reviewed/);
  expect(await readProgress(page)).toBeNull();
});

test("Word Bank keyboard entry reaches its filter and a lone headword uses the available width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  await page.locator("#bank").press("Enter");
  await page.getByLabel("Word collection").press("h");
  await expect(page.locator("#collection")).toBeFocused();
  await page.locator("#collection").selectOption("3");
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-word]").first()).toBeFocused();
  const words = Object.keys(bank).filter(w => bank[w].level === 3);
  const number = Math.floor(words.indexOf("阿姨") / 8) + 1;
  for (let n = 2; n <= number; n++) await page.getByRole("button", { name: "Page " + n, exact: true }).click();
  await page.locator('[data-word="阿姨"]').click();
  const roles = await page.locator(".roles").boundingBox();
  expect((await page.locator(".headword").boundingBox())!.width).toBeCloseTo(roles!.width, 0);
});

test("quick Next clicks advance the newly displayed word and ignore another click while saving", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  await holdWriter(page);
  const next = page.locator("#next");
  await next.dispatchEvent("click", { detail: 1 });
  await expect(next).toBeDisabled();
  await next.dispatchEvent("click", { detail: 2 });
  await page.evaluate(() => window.dispatchEvent(new Event("release-lock")));
  await expect(page.locator(".target")).toHaveText("复习");
  await next.dispatchEvent("click", { detail: 3 });
  await expect(page.locator(".target")).toHaveText("地图");
  const saved = await readProgress(page);
  expect(saved.credited).toEqual(["借", "复习"]);
  expect(saved.history["借"].visits).toBe(1);
  expect(saved.history["复习"].visits).toBe(1);
});

for (const width of [320, 573, 1024]) {
  test(`bamboo follows new credits within its own scroll area at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 768 });
    await page.emulateMedia({ reducedMotion: width === 320 ? "reduce" : "no-preference" });
    await page.goto("/");
    await expect(page.locator(".target")).toBeVisible();
    const s = await readProgress(page);
    const count = width === 573 ? 50 : 46;
    s.credited = Object.keys(bank).filter(id => id !== s.prompt.word).slice(0, count);
    await page.evaluate(({ key, s }) => localStorage.setItem(key, JSON.stringify(s)), { key, s });
    await page.reload();
    const stack = page.locator(".progress-stack");
    await expect(stack).toHaveAttribute("data-count", String(count));
    await expect(stack.locator("[data-latest]")).toBeInViewport({ ratio: .99 });
    await expect(stack).toHaveCSS("scrollbar-width", "none");
    expect(await stack.evaluate(el => el.scrollTop)).toBeLessThan(0);
    await stack.evaluate(el => { el.scrollTop = 0; });
    const pageY = await page.evaluate(() => scrollY);
    await page.locator("#next").click();
    await expect(stack).toHaveAttribute("data-count", String(count + 1));
    await expect(stack.locator("[data-latest]")).toBeInViewport({ ratio: .99 });
    const newest = stack.locator("[data-latest]");
    const previous = stack.locator(".word-slice").nth(count - 1);
    expect((await newest.boundingBox())!.y).toBeLessThan((await previous.boundingBox())!.y);
    expect(await stack.locator("[data-latest]").evaluate(el => getComputedStyle(el).animationName))
      .toBe(width === 320 ? "none" : "bamboo-grow");
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
  });
}

test("restoration accepts the last scheduling step and drops an out-of-range step", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".target")).toBeVisible();
  const progress = await readProgress(page);
  const visit = { last: progress.day, due: progress.day, step: 4, visits: 4 };
  progress.history = { 书: visit, 我: { ...visit, step: 5 } };
  await page.evaluate(({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)), { key, progress });
  await page.reload();
  await expect(page.locator(".target")).toBeVisible();
  expect((await readProgress(page)).history).toEqual({ 书: visit });
});
