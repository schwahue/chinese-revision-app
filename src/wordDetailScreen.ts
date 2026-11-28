import { bank, examples, label, sentenceText } from "./vocabulary.ts";
import { learningText } from "./learningText.ts";
import { escapeText } from "./text.ts";
import { enableWritingGuides, writingGuide } from "./writingGuide.ts";
import type { CustomWord } from "./review.ts";

declare const __PRONUNCIATION_KEYS__: string[];
const recordedReadings = new Set(__PRONUNCIATION_KEYS__);

const trialRecordings = new Map<string, URL>([
  ["67-hái", new URL("../docs/listening-trial/sample-b.wav", import.meta.url)],
  ["678-huán", new URL("../docs/listening-trial/sample-a.wav", import.meta.url)],
  ["181-shéi/shuí", new URL("../docs/listening-trial/both-readings.wav", import.meta.url)],
]);

type DetailOptions = {
  word: string;
  custom?: CustomWord;
  origin: "bank" | "review";
  personal: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onBack: () => void;
  onPractise: () => void;
};

export function renderWordDetail(main: HTMLElement, tools: HTMLElement, options: DetailOptions) {
  const { word: detail, custom, origin } = options;
  const e = bank[detail];
  function group(label: string, phrase: string[], css: string) {
    return (
      '<section class="role ' +
      css +
      '"><div><small>' +
      label +
      '</small><h2 lang="zh-Hans">' +
      phrase[0] +
      '</h2></div><em class="reading-pinyin" lang="zh-Latn">' + phrase[2] + "</em><p>" +
      phrase[1] +
      "</p></section>"
    );
  }
  tools.innerHTML = '<button class="back" id="back">‹ ' +
    (origin === "bank" ? "Word Bank" : "Review") + "</button>";
  const headword = custom ? escapeText(custom.hanzi) : label(detail);
  const title = `<h1 lang="zh-Hans" tabindex="-1">${headword}</h1>`;
  const clipKey = !custom && origin === "bank" ? `${e.syllabusId}-${e.pinyin}` : "";
  const recording = trialRecordings.get(clipKey)?.href ??
    (recordedReadings.has(clipKey) ? `./pronunciation/${encodeURIComponent(clipKey)}.mp3` : undefined);
  let content: string;
  if (custom) {
    content = `<section class="role headword">${title}<em lang="zh-Latn">${escapeText(custom.pinyin)}</em></section>
      <button class="plain" id="edit-custom">Edit word</button>`;
  } else {
    let reading = `<em class="reading-pinyin" lang="zh-Latn">${e.pinyin}</em>`;
    if (recording) {
      const both = e.syllabusId === 181;
      const name = both ? "Play both readings" : `Play pronunciation for ${headword}, ${e.pinyin}`;
      reading = `<div class="word-pronunciation">${reading}
        <button type="button" class="play-word" aria-label="${name}" title="${name}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
            <path d="M3 9h4l5-4v14l-5-4H3z M16 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14"/>
          </svg>${both ? "Play both readings" : ""}
        </button>
        <audio preload="none"></audio><span role="status"></span></div>`;
    }
    const cue = e.tip
      ? `<h2>Memory cue</h2><p>${learningText(e.tip)}</p>`
      : `<h2>In context</h2><p lang="zh-Hans">${sentenceText(examples(detail)[0])}</p>`;
    content = `<div class="roles">
      <section class="role headword">${title}${reading}<p>${e.meaning}</p></section>
      ${e.usage ? group("Usage", e.usage, "usage") : ""}
      ${e.measure ? group("Measure word", e.measure, "measure") : ""}
    </div><section class="learning"><div class="memory-cue">${cue}</div>${writingGuide(headword)}</section>`;
  }
  main.innerHTML = `<article class="page word-page"><div class="entry-body">${content}</div>
    <button class="primary" id="practise">Practise</button></article>`;
  if (custom) main.querySelector<HTMLButtonElement>("#edit-custom")!.onclick = options.onEdit;
  else enableWritingGuides(main);
  if (recording) {
    const audio = main.querySelector("audio")!;
    const status = main.querySelector<HTMLElement>(".word-pronunciation [role=status]")!;
    function unavailable() {
      status.textContent = "Pronunciation unavailable. Tap the speaker to retry.";
    }
    audio.onerror = unavailable;
    main.querySelector<HTMLButtonElement>(".play-word")!.onclick = async () => {
      status.textContent = "";
      try {
        if (!audio.src || audio.error) audio.src = recording;
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) unavailable();
      }
    };
  }
  if (options.personal) {
    const remove = document.createElement("button");
    remove.className = "plain";
    remove.textContent = "Remove from Personal";
    main.querySelector(".entry-body")!.append(remove);
    remove.onclick = options.onRemove;
  }
  tools.querySelector<HTMLButtonElement>("#back")!.onclick = options.onBack;
  main.querySelector<HTMLButtonElement>("#practise")!.onclick = options.onPractise;
}
