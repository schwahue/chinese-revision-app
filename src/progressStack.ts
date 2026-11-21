import { escapeText } from "./text.ts";
import { milestones } from "./review.ts";

export function progressStack(words: readonly string[], celebrating = false, when = "today") {
  const count = words.length;
  const goal = celebrating ? count : milestones.find(target => target > count);
  const remaining = (goal ?? count) - count;
  const label = `${count} ${count === 1 ? "word" : "words"} reviewed ${when}`;
  const groups: string[] = [];
  const total = count + remaining;
  for (let start = 0; start < total; start += 5) {
    const end = Math.min(start + 5, total);
    const earned = words.slice(start, end).map((word, i) => `<span class="word-slice" title="${escapeText(word)}"${start + i === count - 1 ? " data-latest" : ""}></span>`);
    const shadows = '<span class="shadow-slice"></span>'.repeat(end - start - earned.length);
    groups.push(`<div class="slice-group">${earned.join("")}${shadows}</div>`);
  }
  const summary = remaining ? `${label}, ${remaining} to ${goal}` : label;
  return `<div class="progress-stack${celebrating ? " celebrating" : ""}" data-count="${count}" role="img" aria-label="${summary}">${groups.join("")}</div>`;
}
