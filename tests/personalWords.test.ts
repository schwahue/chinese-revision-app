import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogueMatches, linkCustom, saveCustom, searchCatalogue, validCustom } from "../src/personalWords.ts";
import { advance, eligiblePersonalWords, fresh, nextPersonal, removePersonal, rollover, start } from "../src/review.ts";
import { bank } from "../src/vocabulary.ts";

test("pinyin search spans levels, tones and spacing while catalogue senses stay distinct", () => {
  assert.ok(searchCatalogue("XUÉ XÍ").includes("学习"));
  assert.ok(searchCatalogue("xue2xi2").includes("学习"));
  assert.ok(searchCatalogue("xuexi").includes("学习"));
  assert.ok(!searchCatalogue("lu").includes("绿茶"));
  assert.ok(searchCatalogue("lü").includes("绿茶"));
  for (const id of Object.keys(bank).filter(id => bank[id].hanzi === "还" || id === "还")) {
    assert.ok(catalogueMatches({ hanzi: "还", pinyin: bank[id].pinyin }).includes(id));
  }
  assert.ok(!validCustom({ hanzi: "<b>", pinyin: "kā" }));
});

test("only existing personal custom words can be edited, preserving their schedule", () => {
  const s = fresh();
  const entry = { hanzi: "咖啡因", pinyin: "kāfēiyīn" };
  const id = "custom-caffeine";
  s.myWords = [id];
  assert.equal(saveCustom(s, entry, id), false);
  s.custom[id] = entry;
  start(s, nextPersonal(s)!, null, true);
  advance(s);
  assert.ok(saveCustom(s, { ...entry, pinyin: "kā fēi yīn" }, id));
  assert.equal(s.history[id].visits, 1);
  assert.equal(nextPersonal(s), undefined);
  s.extraHSK = true;
  rollover(s, s.history[id].due);
  assert.equal(s.extraHSK, false);
  assert.equal(nextPersonal(s), id);
  start(s, id, null, true);
  removePersonal(s, id);
  assert.equal(s.prompt, null);
  assert.equal(saveCustom(s, entry, id), false);
  assert.deepEqual(s.myWords, []);
});

test("linking a custom word merges credits, visits and schedule exactly once", () => {
  const s = fresh();
  const from = "custom-study", to = "学习";
  s.custom[from] = { hanzi: "学习", pinyin: "xuéxiā" };
  s.myWords = [from, to];
  s.credited = [from, "我", to];
  s.history[from] = { visits: 3, last: s.day, due: "2030-01-01", step: 2 };
  s.history[to] = { visits: 2, last: s.day, due: "2030-01-02", step: 3 };
  start(s, from, null, true);
  assert.ok(linkCustom(s, from, to));
  assert.deepEqual(s.myWords, [to]);
  assert.deepEqual(s.credited, [to, "我"]);
  assert.deepEqual(s.history, { [to]: { visits: 5, last: s.day, due: "2030-01-01", step: 2 } });
  assert.equal(s.prompt, null);
  assert.deepEqual(s.custom, {});
  assert.equal(linkCustom(s, from, to), false);
  assert.equal(nextPersonal(s), undefined);
});

test("personal review includes only new or due members without today's credit", () => {
  const s = fresh();
  s.day = "2026-11-28";
  s.myWords = ["我", "书", "借", "学习"];
  s.credited = ["学习"];
  const visit = { last: "2026-11-25", due: s.day, step: 1, visits: 1 };
  s.history = { 书: visit, 借: { ...visit, due: "2026-11-29" }, 北京: visit };
  assert.deepEqual(eligiblePersonalWords(s), ["我", "书"]);
  assert.equal(nextPersonal(s), "书");
});
