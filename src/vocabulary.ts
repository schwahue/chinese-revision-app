import words from "./words.json" with { type: "json" };
import contexts from "./practice-sentences.json" with { type: "json" };

type Entry = {
  level: number;
  syllabusId: number;
  hanzi?: string;
  pinyin: string;
  meaning: string;
  sense?: string;
  tip?: string;
  usage?: string[];
  measure?: string[];
  examples?: string[];
};

export const bank: Record<string, Entry> = words;
export const targets = Object.keys(bank).filter(word => bank[word].examples);
export function reviewPool(levels: number[]) {
  return Object.keys(bank).filter(word => levels.includes(bank[word].level));
}
export function label(token: string) {
  return bank[token]?.hanzi ?? token;
}

export function sentenceText(line: string) {
  return line.split(" ").map(label).join("");
}

// Index exact tokens once. Older authored contexts come first to preserve rotation.
const byWord = new Map<string, string[]>();
for (const line of [...targets.flatMap(word => bank[word].examples!), ...contexts]) {
  for (const token of new Set(line.split(" "))) {
    if (!Object.hasOwn(bank, token)) continue;
    const lines = byWord.get(token);
    if (lines) lines.push(line);
    else byWord.set(token, [line]);
  }
}
export function examples(word: string) {
  return bank[word].examples ?? byWord.get(word)!;
}
