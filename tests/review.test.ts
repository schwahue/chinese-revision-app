import test from "node:test";
import { createHash } from "node:crypto";
import contexts from "../src/practice-sentences.json" with { type: "json" };
import { examples, label, reviewPool, targets } from "../src/vocabulary.ts";
import assert from "node:assert/strict";
import words from "../src/words.json" with { type: "json" };
import {
  advance,
  choose,
  fresh,
  localDay,
  rollover,
  start,
} from "../src/review.ts";

const day = (n: number) => new Date(2026, 10, n, 12);

test("each review level contributes only its numbered items to the scheduler", () => {
  const s = fresh();
  assert.deepEqual(s.reviewLevels, [3]);
  const all = reviewPool([1, 2, 3]);
  assert.equal(all.length, 1000);
  assert.deepEqual(new Set(all), new Set(Object.keys(words).filter(w => words[w].syllabusId)));
  for (const [level, count] of [[1, 300], [2, 200], [3, 500]]) {
    const pool = reviewPool([level]);
    assert.equal(pool.length, count);
    assert.ok(pool.every(w => words[w].level === level));
  }
  const pool = reviewPool([1, 2]);
  assert.equal(pool.length, 500);
  s.credited = pool.slice(1);
  assert.equal(choose(s, pool), pool[0]);
  s.credited.push(pool[0]);
  assert.equal(choose(s, pool), undefined);
  assert.equal(words[choose(s, all)].level, 3);
});

test("the Word Bank matches all 1,000 numbered HSK 3.0 items through Level 3", () => {
  const official = Object.entries(words).filter(([, e]) => "syllabusId" in e)
    .sort((a, b) => a[1].syllabusId - b[1].syllabusId);
  assert.equal(official.length, 1000);
  const rows = official.map(([key, e], index) => {
    assert.equal(e.syllabusId, index + 1);
    assert.equal(e.level, index < 300 ? 1 : index < 500 ? 2 : 3);
    assert.ok(e.meaning.trim());
    return [e.syllabusId, label(key), e.pinyin].join("|");
  });
  // Fingerprint of the numbered headwords and pinyin on physical PDF pages 80–104.
  assert.equal(createHash("sha256").update(rows.join("\n")).digest("hex"),
    "c2ea2a39716b93b49dce823a5223800de50b3249ad074e859481ed150d435b69");
});

test("every entry has contextual practice and every Chinese token opens the correct entry", () => {
  const lines = [...targets.flatMap(w => words[w].examples), ...contexts];
  assert.equal(new Set(lines).size, lines.length);
  for (const line of lines) {
    for (const token of line.split(" ")) {
      if (/\p{Script=Han}/u.test(token)) assert.ok(Object.hasOwn(words, token), line);
      else assert.match(token, /^\p{P}+$/u);
    }
  }
  for (const [key, entry] of Object.entries(words)) {
    const available = examples(key);
    assert.ok(available?.length && available.every(line => line.split(" ").includes(key)), key);
    for (const phrase of [entry.usage, entry.measure].filter(Boolean)) {
      assert.equal(phrase.length, 3, key);
      assert.ok(phrase.every(part => typeof part === "string" && part.trim()), key);
    }
  }
});

test("every pilot target has a syllabus entry, two tokenised examples and complete word lookups", () => {
  assert.ok(targets.length >= 31);
  for (const w of targets) {
    const e = words[w];
    assert.equal(e.level, 3);
    assert.ok(e.syllabusId);
    assert.equal(new Set(e.examples).size, 2);
    for (const line of e.examples) {
      const tokens = line.split(" ");
      assert.ok(tokens.includes(w));
      for (const t of tokens.filter((t) => /\p{Script=Han}/u.test(t))) {
        assert.ok(words[t]?.pinyin && words[t].meaning && words[t].usage, t);
      }
    }
  }
});
test("10, 15, 30 only once, extra words count and the new day preserves history", () => {
  const s = fresh();
  rollover(s, localDay(day(1)));
  const celebrated = [];
  for (let i = 0; i < targets.length; i++) {
    const w = choose(s, targets);
    assert.ok(w);
    start(s, w, words[w].examples);
    const m = advance(s, day(1));
    if (m) celebrated.push(m.words.length);
    assert.equal(advance(s, day(1)), null);
  }
  assert.deepEqual(celebrated, [10, 15, 30]);
  assert.equal(choose(s, targets), undefined);
  start(s, targets[0], words[targets[0]].examples);
  advance(s, day(1));
  assert.equal(s.credited.length, targets.length);
  start(s, targets[0], words[targets[0]].examples);
  rollover(s, localDay(day(2)));
  assert.equal(s.credited.length, 0);
  assert.equal(s.prompt.word, targets[0]);
  assert.ok(s.history[targets[0]]);
});
test("lookup, early rereading, due-day spacing and local midnight", () => {
  const s = fresh();
  const read = (d: number, looked: boolean) => {
    start(s, "借", words["借"].examples);
    s.prompt.looked = looked;
    advance(s, day(d));
    return s.history["借"].due;
  };
  assert.equal(read(1, false), "2026-11-04");
  assert.equal(read(2, false), "2026-11-04");
  assert.equal(read(4, false), "2026-11-11");
  assert.equal(read(11, false), "2026-11-25");
  assert.equal(read(25, false), "2026-12-25");
  assert.equal(read(26, true), "2026-11-27");
  assert.equal(read(27, false), "2026-11-30");
  start(s, "书", words["借"].examples);
  advance(s, day(28));
  assert.deepEqual(s.credited, ["书"]);
});

test("a delayed visit keeps the new day's credits and compares due dates on the press day", () => {
  const s = fresh();
  rollover(s, localDay(day(2)));
  s.credited.push("书");
  s.history["借"] = { last: localDay(day(1)), due: s.day, step: 1, visits: 1 };
  start(s, "借", examples("借"));
  assert.equal(advance(s, day(1), s.day), null);
  assert.deepEqual(s.history["借"], { last: localDay(day(1)), due: localDay(day(2)), step: 1, visits: 2 });
  assert.deepEqual(s.credited, ["书"]);
  assert.equal(s.day, localDay(day(2)));
});

test("every entry has complete writing steps and curated entries keep their recall cues", async () => {
  const { default: { characters } } = await import("../public/hanzi/characters.json", { with: { type: "json" } });
  for (const [word, entry] of Object.entries(words)) {
    if (entry.usage) assert.ok(entry.tip.trim(), word);
    for (const c of label(word)) {
      const guide = characters[c];
      assert.ok(guide?.radical && guide.structure && guide.strokes.length, c);
      for (const [outline, x, y] of guide.strokes) {
        assert.match(outline, /^M[\d .-]/);
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
      }
    }
  }
  assert.equal(characters.借.strokes.length, 10);
});

test("mixed learning copy keeps the original text and marks Han and pinyin runs", async () => {
  const { learningText } = await import("../src/learningText.ts");
  assert.equal(learningText("Say 做 (zuò) & read."),
    'Say <span lang="zh-Hans">做</span> (<span lang="zh-Latn">zuò</span>) &amp; read.');
});

test("sentence rotation skips the previous displayed text when another example exists", () => {
  const s = fresh();
  start(s, "地图", ["这 张 地图 很 有用 。"]);
  advance(s);
  start(s, "有用", ["这 张 地图 很 有用 。", "这 张 地图 很 有用 。", "它 很 有用 。"]);
  assert.equal(s.prompt?.kind !== "word" && s.prompt?.sentence, "它 很 有用 。");
  advance(s);
  start(s, "它", ["它 很 有用 。"]);
  assert.equal(s.prompt?.kind !== "word" && s.prompt?.sentence, "它 很 有用 。");
});
