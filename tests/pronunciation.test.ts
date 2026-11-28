import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import sources from "../public/pronunciation-sources.json" with { type: "json" };
import { bank } from "../src/vocabulary.ts";

test("every published pronunciation has a source and matches a current catalogue reading", () => {
  const files = readdirSync(new URL("../public/pronunciation/", import.meta.url)).sort();
  assert.deepEqual(files, Object.keys(sources).map(key => key + ".mp3").sort());
  const catalogue = new Set(Object.values(bank).map(e => `${e.syllabusId}-${e.pinyin}`));
  for (const [key, source] of Object.entries(sources)) {
    assert.ok(catalogue.has(key), key);
    if (source.startsWith("https://huggingface.co/")) {
      const url = new URL(source);
      assert.match(url.pathname, /^\/datasets\/shenyunhang\/AISHELL-3\/resolve\/[0-9a-f]{40}\/train\/wav\/SSB\d+\/SSB\d+\.wav$/);
      assert.match(url.hash, /^#t=\d+(?:\.\d+)?,\d+(?:\.\d+)?$/);
      const [start, end] = url.hash.slice(3).split(",").map(Number);
      assert.ok(end > start, key);
    } else if (key === "990-zi") {
      assert.equal(source, "https://www.cns11643.gov.tw/opendata/Voice.zip#female.zip/F_zi5.wav");
    } else {
      assert.match(source, /^(audio\/shtooka_.*\.flac|audio\/aishell3\/.*\.mp3|64k\/syllabs\/cmn-.*\.mp3|https:\/\/commons\.wikimedia\.org\/wiki\/File:.*)$/);
    }
  }
  for (const reading of ["333-de", "583-dé", "587-děi", "249-xuéxí"])
    assert.ok(Object.hasOwn(sources, reading), reading);
  assert.equal(sources["24-dǎ diànhuà"], "audio/shtooka_balm_congcong/da3dian4hua4_打电话.flac");
});
