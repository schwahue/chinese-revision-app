import { sentenceText } from "./vocabulary.ts";

export type CustomWord = { hanzi: string; pinyin: string };
export type Prompt = { id: string; word: string; looked: boolean; personal?: true } & (
  { kind?: "sentence"; example: number; sentence: string } | { kind: "word" }
);
type History = { due: string; last: string; step: number; visits: number };
export type Progress = {
  day: string;
  reviewLevels: number[];
  myWords: string[];
  custom: Record<string, CustomWord>;
  extraHSK: boolean;
  credited: string[];
  history: Record<string, History>;
  lastSentence?: string;
  prompt: Prompt | null;
};
export const milestones = [10, 15, 30];
export const reviewLevels = [1, 2, 3];
const intervals = [3, 7, 14, 30];

export function isReviewStep(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= intervals.length;
}

export function localDay(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function fresh(): Progress {
  return {
    day: localDay(),
    reviewLevels: [3],
    myWords: [], custom: {}, extraHSK: false,
    credited: [],
    history: {},
    prompt: null,
  };
}
export function rollover(s: Progress, today: string) {
  if (s.day === today) return;
  s.day = today;
  s.extraHSK = false;
  s.credited = [];
}
function firstByPriority(s: Progress, available: string[]) {
  function priority(w: string) {
    const h = s.history[w];
    if (!h) return "1";
    return h.due <= s.day ? "0" + h.due : "2" + h.last;
  }
  return available.sort((a, b) => priority(a).localeCompare(priority(b)))[0];
}
export function choose(s: Progress, words: string[]) {
  return firstByPriority(s, words.filter(word => !s.credited.includes(word)));
}

export function personalSession(s: Progress) {
  return s.myWords.length > 0 && !s.extraHSK;
}

export function eligiblePersonalWords(s: Progress) {
  const credited = new Set(s.credited);
  return s.myWords.filter(word => !credited.has(word) && (!s.history[word] || s.history[word].due <= s.day));
}

export function nextPersonal(s: Progress) {
  return firstByPriority(s, eligiblePersonalWords(s));
}

export function removePersonal(s: Progress, word: string) {
  s.myWords = s.myWords.filter(id => id !== word);
  if (s.prompt?.word === word && s.prompt.personal) s.prompt = null;
  if (!s.myWords.length) s.extraHSK = false;
}

export function newPromptId() {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

export function start(s: Progress, word: string, examples: string[] | null, personal = false) {
  if (s.prompt?.word === word) {
    if (personal) s.prompt.personal = true;
    return;
  }
  if (examples === null) {
    s.prompt = { id: newPromptId(), kind: "word", word, looked: false, personal: true };
    return;
  }
  let example = (s.history[word]?.visits ?? 0) % examples.length;
  const previous = s.prompt && s.prompt.kind !== "word" ? sentenceText(s.prompt.sentence) : s.lastSentence;
  if (previous && sentenceText(examples[example]) === previous) {
    for (let offset = 1; offset < examples.length; offset++) {
      const candidate = (example + offset) % examples.length;
      if (sentenceText(examples[candidate]) !== previous) {
        example = candidate;
        break;
      }
    }
  }
  s.prompt = {
    id: newPromptId(),
    word,
    example,
    ...(personal && { personal: true }),
    sentence: examples[example],
    looked: false,
  };
}
export function advance(s: Progress, reviewedAt = new Date(), activeDay = localDay(reviewedAt), priorCredits = s.day === localDay(reviewedAt) ? s.credited : []) {
  const reviewDay = localDay(reviewedAt);
  rollover(s, activeDay);
  if (!s.prompt) return null;
  const { word, looked } = s.prompt;
  s.lastSentence = s.prompt.kind === "word" ? undefined : sentenceText(s.prompt.sentence);
  const prev = s.history[word];
  const step = looked ? 0 : Math.min((prev?.step ?? 0) + 1, intervals.length);
  const date = new Date(reviewedAt);
  date.setDate(date.getDate() + (looked ? 1 : intervals[step - 1]));
  const early = prev && prev.due > reviewDay && !looked;
  s.history[word] = {
    due: early ? prev.due : localDay(date),
    step: early ? prev.step : step,
    last: reviewDay,
    visits: (prev?.visits ?? 0) + 1,
  };
  s.prompt = null;
  // The daily stack may already belong to the day after this visit.
  const credits = reviewDay === activeDay ? s.credited : [...priorCredits];
  if (credits.includes(word)) return null;
  credits.push(word);
  return milestones.includes(credits.length) ? { day: reviewDay, words: [...credits] } : null;
}
