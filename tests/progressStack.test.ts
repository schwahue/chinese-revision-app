import assert from "node:assert/strict";
import test from "node:test";
import { progressStack } from "../src/progressStack.ts";

test("the stack renders one slice per credited word, including beyond thirty", () => {
  for (const count of [0, 1, 10, 15, 30, 31]) {
    const words = Array.from({ length: count }, (_, i) => String(i + 1));
    const stack = progressStack(words);
    const slices = Array.from(stack.matchAll(/class="word-slice" title="([^"]+)"/g), match => match[1]);
    assert.deepEqual(slices, words);
  }
});

test("shadow slices reach only the next milestone and pause during celebrations", () => {
  for (const [count, remaining] of [[0, 10], [9, 1], [10, 5], [14, 1], [15, 15], [23, 7], [29, 1], [30, 0], [31, 0]]) {
    const words = Array(count).fill("字");
    assert.equal(progressStack(words).match(/class="shadow-slice"/g)?.length ?? 0, remaining);
    if ([10, 15, 30].includes(count)) assert.doesNotMatch(progressStack(words, true), /shadow-slice/);
  }
});

test("25 of 30 shows five earned groups and one shadow group", () => {
  const stack = progressStack(Array(25).fill("字"));
  const groups = Array.from(stack.matchAll(/<div class="slice-group">(.*?)<\/div>/g), match => match[1]);
  assert.equal(groups.length, 6);
  for (const group of groups.slice(0, 5)) assert.equal(group.match(/class="word-slice"/g)?.length, 5);
  assert.equal(groups[5].match(/class="shadow-slice"/g)?.length, 5);
});
