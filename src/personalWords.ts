import { bank, examples, label } from "./vocabulary.ts";
import { start, type CustomWord, type Progress } from "./review.ts";

export function reading(text: string) {
  const syllables = text.toLowerCase().normalize("NFC").replaceAll("u:", "ü").replaceAll("v", "ü");
  const marked = syllables.replace(/([a-zü]+)([1-5])/gu, (_, syllable: string, tone: string) => {
    const vowels = [...syllable.matchAll(/[aeiouü]/gu)];
    if (!vowels.length || tone === "5") return syllable;
    const index = syllable.search(/[ae]/u) >= 0 ? syllable.search(/[ae]/u)
      : syllable.includes("ou") ? syllable.indexOf("ou") : vowels[vowels.length - 1].index!;
    const mark = ["", "\u0304", "\u0301", "\u030c", "\u0300"][Number(tone)];
    return (syllable.slice(0, index + 1) + mark + syllable.slice(index + 1)).normalize("NFC");
  });
  return marked.replace(/[\s'’·-]/gu, "");
}
function searchKey(text: string) {
  return reading(text).normalize("NFD").replace(/[\u0300\u0301\u0304\u030c]/gu, "").normalize("NFC");
}
const catalogue = Object.keys(bank).map(id => ({ id, search: searchKey(bank[id].pinyin) }));

export function searchCatalogue(query: string) {
  const key = searchKey(query);
  if (!key) return [];
  return catalogue.filter(row => row.search.startsWith(key) || label(row.id) === query.trim())
    .sort((a, b) => Number(b.search === key) - Number(a.search === key)).map(row => row.id);
}
export function catalogueMatches(entry: CustomWord) {
  return searchCatalogue(entry.pinyin).filter(id =>
    label(id) === entry.hanzi && searchKey(bank[id].pinyin) === searchKey(entry.pinyin));
}

export function validCustom(value: unknown): value is CustomWord {
  if (!value || typeof value !== "object" || !("hanzi" in value) || !("pinyin" in value)) return false;
  return typeof value.hanzi === "string" && /^[\p{Script=Han}〇·]+$/u.test(value.hanzi) &&
    /\p{Script=Han}/u.test(value.hanzi) && value.hanzi.length <= 100 &&
    typeof value.pinyin === "string" && value.pinyin.length <= 200 &&
    /^[\p{Script=Latin}\p{M}1-5: '’·-]+$/u.test(value.pinyin) && /\p{Script=Latin}/u.test(value.pinyin);
}

export function addPersonal(s: Progress, id: string) {
  if (!s.myWords.includes(id)) s.myWords.push(id);
}

export function linkCustom(s: Progress, from: string, to: string) {
  if (!s.custom[from] || !s.myWords.includes(from)) return false;
  const replace = (ids: string[]) => [...new Set(ids.map(id => id === from ? to : id))];
  s.myWords = replace(s.myWords);
  s.credited = replace(s.credited);
  const custom = s.history[from];
  const existing = s.history[to];
  if (custom && existing) {
    // On a same-day tie, keep the earlier review due date.
    const schedule = custom.last > existing.last || (custom.last === existing.last && custom.due < existing.due)
      ? custom : existing;
    s.history[to] = { ...schedule, visits: custom.visits + existing.visits };
  } else if (custom) s.history[to] = custom;
  delete s.history[from];
  delete s.custom[from];
  if (s.prompt?.word === from) {
    const looked = s.prompt.looked;
    s.prompt = null;
    if (!s.credited.includes(to)) {
      start(s, to, examples(to), true);
      s.prompt!.looked = looked;
    }
  }
  return true;
}

export function saveCustom(s: Progress, entry: CustomWord, editing: string) {
  if (!validCustom(entry) || !Object.hasOwn(s.custom, editing) || !s.myWords.includes(editing)) return false;
  const existing = Object.keys(s.custom).some(id => id !== editing &&
    s.custom[id].hanzi === entry.hanzi && reading(s.custom[id].pinyin) === reading(entry.pinyin));
  if (existing) return false;
  s.custom[editing] = entry;
  return true;
}
