import { validCustom } from "./personalWords.ts";
import { fresh, isReviewStep, newPromptId, reviewLevels, start, type Progress } from "./review.ts";

export const progressKey = "chinese-revision.v5";
const migratedKey = progressKey + ".migrated";
export const themeKey = "chinese-revision.theme";
export const hanFontKey = "chinese-revision.han-font";
export type HanFont = "hei" | "song";
type Theme = "dark" | "light";
const isTheme = (value: unknown): value is Theme => value === "dark" || value === "light";

function previousSave() {
  for (const key of ["chinese-revision.v4", "chinese-revision.v3", "chinese-revision.v2"]) {
    const previous = localStorage.getItem(key);
    if (previous !== null || localStorage.getItem(key + ".migrated") !== null) return previous;
  }
  return localStorage.getItem("chinese-revision.v1");
}

export function readTheme(): Theme | null {
  try {
    const value = localStorage.getItem(themeKey);
    if (isTheme(value)) return value;
    if (localStorage.getItem(migratedKey) !== null) return null;
    const legacy = JSON.parse(previousSave() ?? "null")?.theme;
    return isTheme(legacy) ? legacy : null;
  } catch {
    return null;
  }
}
export function readHanFont(): HanFont {
  try {
    return localStorage.getItem(hanFontKey) === "song" ? "song" : "hei";
  } catch {
    return "hei";
  }
}

function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function saveTheme(value: Theme) {
  return savePreference(themeKey, value);
}

export function saveHanFont(value: HanFont) {
  return savePreference(hanFontKey, value);
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(value + "T00:00:00Z");
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

// Old saves can reference these former catalogue entries in Personal, history or a prompt.
const retiredReadings = new Map([["份", "fèn"], ["支", "zhī"], ["篇", "piān"], ["北京", "Běijīng"]]);

function restore(raw: string, bank: object, examples: (word: string) => string[]) {
  const state = fresh();
  let data: unknown;
  try { data = JSON.parse(raw); } catch { /* Recover as an empty record. */ }
  if (!record(data)) return { state, damaged: true };
  let damaged = false;
  if (data.reviewLevels !== undefined) {
    const saved = data.reviewLevels;
    const valid = Array.isArray(saved) ? reviewLevels.filter(level => saved.includes(level)) : [];
    if (valid.length) state.reviewLevels = valid;
    damaged = !Array.isArray(saved) || !valid.length || valid.length !== saved.length;
  }
  if (data.custom !== undefined) {
    if (record(data.custom)) {
      for (const [id, entry] of Object.entries(data.custom)) {
        if (/^custom-[a-z0-9-]+$/i.test(id) && validCustom(entry)) {
          state.custom[id] = { hanzi: entry.hanzi, pinyin: entry.pinyin };
        } else damaged = true;
      }
    } else damaged = true;
  }
  function wordId(value: unknown) {
    if (typeof value !== "string") return;
    if (Object.hasOwn(bank, value) || Object.hasOwn(state.custom, value)) return value;
    const pinyin = retiredReadings.get(value);
    if (pinyin) {
      const id = "custom-legacy-" + [...value].map(c => c.codePointAt(0)!.toString(16)).join("-");
      state.custom[id] ??= { hanzi: value, pinyin };
      return id;
    }
  }
  const wordList = (values: unknown[]) =>
    [...new Set(values.map(wordId).filter((id): id is string => id !== undefined))];
  if (Array.isArray(data.myWords)) {
    state.myWords = wordList(data.myWords);
    damaged ||= state.myWords.length !== data.myWords.length;
  } else if (data.myWords !== undefined) damaged = true;
  state.extraHSK = state.myWords.length > 0 && data.extraHSK === true;
  if (date(data.day)) state.day = data.day;
  else damaged = true;
  if (Array.isArray(data.credited) && date(data.day)) {
    state.credited = wordList(data.credited);
    damaged ||= state.credited.length !== data.credited.length;
  } else damaged = true;
  if (record(data.history)) {
    for (const [storedWord, h] of Object.entries(data.history)) {
      const word = wordId(storedWord);
      if (word && record(h) && date(h.last) && date(h.due) &&
          integer(h.visits) && isReviewStep(h.step)) {
        state.history[word] = { due: h.due, step: h.step, last: h.last, visits: h.visits };
      } else damaged = true;
    }
  } else damaged = true;
  if (typeof data.lastSentence === "string") state.lastSentence = data.lastSentence;
  const p = data.prompt;
  const word = record(p) ? wordId(p.word) : undefined;
  if (record(p) && word && typeof p.looked === "boolean") {
    if (Object.hasOwn(state.custom, word)) {
      const retired = word !== p.word;
      if ((p.kind === "word" || retired) && state.myWords.includes(word)) {
        state.prompt = { kind: "word", id: typeof p.id === "string" && p.id ? p.id : newPromptId(),
          word, looked: p.looked, personal: true };
      } else if (!retired) damaged = true;
      return { state, damaged, legacyTheme: data.theme };
    }
    const lines = examples(word);
    const index = p.sentence === undefined && integer(p.example)
      ? p.example : lines.findIndex(line => line === p.sentence);
    if (index >= 0 && index < lines.length) {
      state.prompt = { id: typeof p.id === "string" && p.id ? p.id : newPromptId(),
        word, example: index, sentence: lines[index], looked: p.looked };
    } else if (typeof p.sentence === "string" && lines.length) {
      start(state, word, lines);
    } else damaged = true;
    if (state.prompt && p.personal === true) {
      if (state.myWords.includes(word)) state.prompt.personal = true;
      else state.prompt = null;
    }
  } else if (p !== null) damaged = true;
  return { state, damaged, legacyTheme: data.theme };
}

export function progressStore(bank: object, examples: (word: string) => string[], warn: () => void) {
  let memory = fresh();
  let visitOnly = false;
  function fallback() {
    visitOnly = true;
    warn();
  }

  function update(edit: (s: Progress) => void, locked: boolean) {
    let current: string | null = null;
    let firstUse = false;
    if (!visitOnly) {
      try {
        current = localStorage.getItem(progressKey);
        firstUse = localStorage.getItem(migratedKey) === null;
        const raw = current ?? (firstUse ? previousSave() : null);
        if (raw === null) memory = fresh();
        else {
          const { state, damaged, legacyTheme } = restore(raw, bank, examples);
          memory = state;
          if (locked && damaged && localStorage.getItem(progressKey + ".damaged") === null)
            localStorage.setItem(progressKey + ".damaged", raw);
          if (locked && isTheme(legacyTheme) && localStorage.getItem(themeKey) === null)
            localStorage.setItem(themeKey, legacyTheme);
        }
      } catch { fallback(); }
      if (!locked && !visitOnly) fallback();
    }
    if (visitOnly) memory = structuredClone(memory);
    edit(memory);
    if (!visitOnly) {
      const next = JSON.stringify(memory);
      try {
        if (next !== current) localStorage.setItem(progressKey, next);
        // A later reset must not import the old tabâ€™s save a second time.
        if (firstUse) localStorage.setItem(migratedKey, "1");
      } catch { fallback(); }
    }
    return memory;
  }

  return async (edit: (s: Progress) => void) => {
    if (visitOnly) return update(edit, false);
    let entered = false;
    try {
      const locks = navigator.locks;
      if (locks) return await locks.request(progressKey, () => {
        entered = true;
        return update(edit, true);
      });
    } catch (error) {
      if (entered) throw error;
    }
    return update(edit, false);
  };
}
