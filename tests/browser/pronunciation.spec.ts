import { expect, test } from "@playwright/test";
import { fresh } from "../../src/review.ts";
import { bank } from "../../src/vocabulary.ts";
import sources from "../../public/pronunciation-sources.json" with { type: "json" };
import { readProgress, seedProgress } from "./helpers/progress.ts";

test("Personal plays the selected reading including whole words and homographs", async ({ page }) => {
  const saved = fresh();
  saved.myWords = ["还", "还#678", "谁", "学习", "打电话", "超市", "custom-legacy-test", "高铁"];
  saved.custom["custom-legacy-test"] = { hanzi: "学习", pinyin: "xuéxí" };
  await seedProgress(page, saved);
  await page.locator("#bank").click();
  const beforeListening = await readProgress(page);
  for (const [key, name, clip] of [
    ["还", "Play pronunciation for 还, hái", "sample-b"],
    ["还#678", "Play pronunciation for 还, huán", "sample-a"],
    ["谁", "Play both readings", "both-readings"],
    ["学习", "Play pronunciation for 学习, xuéxí", "249-xuéxí.mp3"],
    ["打电话", "Play pronunciation for 打电话, dǎ diànhuà", "24-dǎ diànhuà.mp3"],
    ["超市", "Play pronunciation for 超市, chāoshì", "19-chāoshì.mp3"],
  ]) {
    await page.locator(`[data-word="${key}"]`).click();
    const audio = page.locator("audio");
    expect(await audio.evaluate(el => el.currentSrc)).toBe("");
    await page.getByRole("button", { name, exact: true }).press("Enter");
    await expect.poll(() => audio.evaluate(el => el.played.length)).toBe(1);
    expect(await audio.evaluate(el => decodeURI(el.currentSrc))).toContain(clip);
    await page.locator("#back").click();
  }
  await page.locator('[data-word="custom-legacy-test"]').click();
  await expect(page.locator(".play-word")).toHaveCount(0);
  await page.locator("#back").click();
  await page.locator('[data-word="高铁"]').click();
  await expect(page.getByRole("heading", { name: "高铁", exact: true })).toBeVisible();
  await expect(page.locator(".play-word")).toHaveCount(0);
  expect(await readProgress(page)).toEqual(beforeListening);
});

test("every HSK detail shows its pinyin and offers only its available recording", async ({ page }) => {
  await page.goto("./");
  await page.locator("#bank").click();
  await page.getByLabel("Word collection").selectOption("all");
  const observed = await page.evaluate(() => {
    const readings: Record<string, { pinyin: string | null; speaker: boolean }> = {};
    for (let pageNumber = 0; ; pageNumber++) {
      const keys = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-word]"), item => item.dataset.word!);
      for (const key of keys) {
        document.getElementById("entry-" + key)!.click();
        const headword = document.querySelector(".headword")!;
        readings[key] = {
          pinyin: headword.querySelector(".reading-pinyin")!.textContent,
          speaker: !!headword.querySelector(".play-word"),
        };
        document.getElementById("back")!.click();
      }
      const next = document.querySelector<HTMLButtonElement>(`[data-page="${pageNumber + 1}"]`);
      if (!next) return readings;
      next.click();
    }
  });
  const pilot = new Set(["67-hái", "678-huán", "181-shéi/shuí"]);
  const expected = Object.fromEntries(Object.entries(bank).map(([key, entry]) => {
    const recording = `${entry.syllabusId}-${entry.pinyin}`;
    return [key, { pinyin: entry.pinyin, speaker: pilot.has(recording) || Object.hasOwn(sources, recording) }];
  }));
  expect(observed).toEqual(expected);
});

test("the browser can decode every bundled catalogue MP3", async ({ page }) => {
  test.setTimeout(180_000);
  const files = Object.keys(sources).map(key => `pronunciation/${encodeURIComponent(key)}.mp3`);
  await page.goto("./");
  const failures = await page.evaluate(async files => {
    const decoder = typeof OfflineAudioContext === "function" ? new OfflineAudioContext(1, 1, 24000) : null;
    const failures: string[] = [];
    async function check(file: string) {
      try {
        let duration: number;
        if (decoder) {
          const response = await fetch(file);
          if (!response.ok) throw new Error(String(response.status));
          const clip = await decoder.decodeAudioData(await response.arrayBuffer());
          const samples = clip.getChannelData(0);
          const power = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
          if (!(power > .00002)) throw new Error(`Silent recording: power ${power}`);
          duration = clip.duration;
        } else {
          // Some WebKit builds expose only the media-element decoder.
          const audio = new Audio();
          try {
            await new Promise<void>((resolve, reject) => {
              audio.onloadeddata = () => resolve();
              audio.onerror = () => reject(new Error(audio.error?.message || "Media decoder rejected the recording"));
              audio.src = file;
              audio.load();
            });
            duration = audio.duration;
          } finally {
            audio.removeAttribute("src");
            audio.load();
          }
        }
        if (!(duration >= .15 && duration <= 10)) throw new Error(`Unexpected duration: ${duration}s`);
      } catch (error) {
        failures.push(file + " " + String(error));
      }
    }
    const batchSize = decoder ? 8 : 2;
    for (let i = 0; i < files.length; i += batchSize)
      await Promise.all(files.slice(i, i + batchSize).map(check));
    return failures;
  }, files);
  expect(failures).toEqual([]);
});

test("a failed clip can be retried and opening Settings stops playback", async ({ page }) => {
  const saved = fresh();
  saved.myWords = ["学习"];
  await seedProgress(page, saved);
  await page.locator("#bank").click();
  await page.locator('[data-word="学习"]').click();
  const play = page.getByRole("button", { name: "Play pronunciation for 学习, xuéxí" });
  const audio = page.locator("audio");
  // Exercise an actual failed media request, including browsers using a native media loader.
  await page.evaluate(() => {
    const base = document.createElement("base");
    base.href = "./missing-audio-test/";
    document.head.prepend(base);
  });
  await play.click();
  await expect(page.getByText("Pronunciation unavailable", { exact: false })).toBeVisible();
  await page.locator("base").evaluate(base => base.remove());
  await play.click();
  await expect.poll(() => audio.evaluate(el => el.paused)).toBe(false);
  await page.locator("#settings").click();
  expect(await audio.evaluate(el => el.paused)).toBe(true);
});

test.describe("touch playback", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tap the speaker in the HSK catalogue and replay both readings", async ({ page }) => {
    await page.goto("./");
    await page.locator("#bank").tap();
    await page.getByLabel("Word collection").selectOption("1");
    const level = Object.keys(bank).filter(key => bank[key].level === 1);
    const targetPage = Math.floor(level.indexOf("谁") / 8) + 1;
    for (let n = 2; n <= targetPage; n++)
      await page.getByRole("button", { name: "Page " + n, exact: true }).tap();
    await page.locator('[data-word="谁"]').tap();
    const play = page.getByRole("button", { name: "Play both readings" });
    const audio = page.locator("audio");
    await play.tap();
    await expect.poll(() => audio.evaluate(el => el.ended)).toBe(true);
    expect(await audio.evaluate(el => el.duration)).toBeCloseTo(1.7);
    await play.tap();
    await expect.poll(() => audio.evaluate(el => !el.paused && el.currentTime < 1)).toBe(true);
    const playing = await audio.elementHandle();
    await page.locator("#back").tap();
    expect(await playing!.evaluate(el => (el as HTMLAudioElement).paused)).toBe(true);
  });
});
