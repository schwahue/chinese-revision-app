import { test } from "node:test";
import assert from "node:assert/strict";
import { addPersonal, catalogueMatches, linkCustom, saveCustom, searchCatalogue, validCustom } from "../src/personalWords.ts";
import { advance, fresh, nextPersonal, removePersonal, rollover, start } from "../src/review.ts";
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

test("custom edits, removal and re-add keep identity, credits and due date", () => {
  const s = fresh();
  const entry = { hanzi: "咖啡因", pinyin: "kāfēiyīn" };
  assert.ok(saveCustom(s, entry));
  const id = s.myWords[0];
  assert.ok(saveCustom(s, entry));
  addPersonal(s, id);
  assert.deepEqual(s.myWords, [id]);
  start(s, nextPersonal(s)!, null, true);
  advance(s);
  assert.ok(saveCustom(s, { ...entry, pinyin: "kā fēi yīn" }, id));
  removePersonal(s, id);
  assert.ok(saveCustom(s, entry));
  assert.deepEqual(s.myWords, [id]);
  assert.equal(s.history[id].visits, 1);
  assert.equal(nextPersonal(s), undefined);
  s.extraHSK = true;
  rollover(s, s.history[id].due);
  assert.equal(s.extraHSK, false);
  assert.equal(nextPersonal(s), id);
  start(s, id, null, true);
  removePersonal(s, id);
  assert.equal(s.prompt, null);
});

test("linking a custom word merges credits, visits and schedule exactly once", () => {
  const s = fresh();
  saveCustom(s, { hanzi: "学习", pinyin: "xuéxiā" });
  const [from] = s.myWords, to = "学习";
  s.myWords.push(to);
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
