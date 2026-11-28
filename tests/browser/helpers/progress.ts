import type { Page } from "@playwright/test";
import type { Progress } from "../../../src/review.ts";
import { progressKey } from "../../../src/storage.ts";

export function readProgress(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), progressKey);
}

export async function seedProgress(page: Page, progress: Progress) {
  // Establish the origin without starting the scheduler before the save is in place.
  await page.goto("./favicon.png");
  await page.evaluate(({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)), { key: progressKey, progress });
  await page.goto("./");
}
