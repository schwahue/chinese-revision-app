import { expect, test } from "@playwright/test";

test("the word prefetches its guide, shares a pending request and retries a failed load", async ({ page }) => {
  const requests: string[] = [];
  const firstRequest = Promise.withResolvers<void>();
  await page.route("**/hanzi/*.json", async route => {
    requests.push(new URL(route.request().url()).pathname);
    if (requests.length === 1) {
      await firstRequest.promise;
      await route.abort();
    } else await route.continue();
  });

  await page.goto("/");
  await expect(page.locator(".target")).toHaveText("借");
  expect(requests).toHaveLength(0);
  await page.locator(".target").click();
  const summary = page.locator('[data-character="借"] summary');
  await expect.poll(() => requests).toEqual(["/hanzi/501f.json"]);
  await summary.click();
  await expect(page.getByText("Loading strokes…")).toBeVisible();
  expect(requests).toHaveLength(1);
  firstRequest.resolve();
  await expect(page.getByText("Couldn’t load the strokes.", { exact: false })).toBeVisible();
  await summary.click();
  await summary.click();
  await expect(page.locator(".strokes li")).toHaveCount(10);
  await page.locator("#back").click();
  await page.locator(".target").click();
  await summary.click();
  await expect(page.locator(".strokes li")).toHaveCount(10);
  expect(requests).toEqual(["/hanzi/501f.json", "/hanzi/501f.json"]);
});
