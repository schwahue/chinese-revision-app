import { createWordHighlight } from "./wordHighlight.ts";
import { bank, label, sentenceText } from "./vocabulary.ts";
import { progressStack } from "./progressStack.ts";
import type { CustomWord, Prompt } from "./review.ts";

type ReviewOptions = {
  prompt: Prompt | null;
  custom?: CustomWord;
  creditedWords: string[];
  personal: boolean;
  selected: number;
  onLookup: (prompt: Prompt) => void;
  onOpenWord: (word: string, index: number) => void;
  onNext: (prompt: Prompt) => Promise<void>;
  onExtra: () => void;
};

export type ReviewView = { align: () => void; dispose: () => void };

export function renderReview(main: HTMLElement, options: ReviewOptions): ReviewView | undefined {
  const { prompt, custom, creditedWords } = options;
  if (!prompt) {
    main.innerHTML = options.personal
      ? '<section class="page"><h1 class="review-empty" tabindex="-1">You’ve reviewed your personal words.</h1><button class="primary" id="extra">Keep practising HSK</button></section>'
      : '<section class="page"><p class="review-empty" tabindex="-1">You’ve reviewed every word in these levels today.</p></section>';
    const extra = main.querySelector<HTMLButtonElement>("#extra");
    if (extra) extra.onclick = options.onExtra;
    return;
  }
  const secondary = prompt.kind === "word"
    ? '<div class="custom-reading"><button class="plain" id="reveal" aria-expanded="false" aria-controls="pronunciation">Show pinyin</button><span id="pronunciation" lang="zh-Latn" hidden></span></div>'
    : '<div id="gloss" class="gloss" aria-live="polite"></div>';
  main.innerHTML = `<section class="page">
    <div class="reader"><div class="reading-area">
      <div class="prompt-row">
        <h1 class="sentence" tabindex="-1" lang="zh-Hans"></h1>
        <aside class="progress-sidebar" aria-label="Daily progress">${progressStack(creditedWords)}</aside>
      </div>
      ${secondary}
    </div></div>
    <button class="primary" id="next">Next</button>
  </section>`;
  const next = main.querySelector<HTMLButtonElement>("#next")!;
  next.onclick = () => {
    if (next.disabled) return;
    next.disabled = true;
    void options.onNext(prompt);
  };
  const heading = main.querySelector<HTMLHeadingElement>("h1")!;
  if (prompt.kind !== "word") return bindSentence(main, heading, prompt, options);

  heading.classList.add("custom-head");
  heading.textContent = custom!.hanzi;
  const pronunciation = main.querySelector<HTMLElement>("#pronunciation")!;
  pronunciation.textContent = custom!.pinyin;
  const reveal = main.querySelector<HTMLButtonElement>("#reveal")!;
  reveal.onclick = () => {
    const show = pronunciation.hidden;
    pronunciation.hidden = !show;
    reveal.setAttribute("aria-expanded", String(show));
    reveal.textContent = show ? "Hide pinyin" : "Show pinyin";
    if (show) options.onLookup(prompt);
  };
}

function bindSentence(main: HTMLElement, heading: HTMLElement, p: Exclude<Prompt, { kind: "word" }>, options: ReviewOptions): ReviewView {
  let selected = options.selected;
  const el = (id: string) => main.querySelector<HTMLElement>("#" + id)!;
  const tokens = p.sentence.split(" ");
  const targetIndex = tokens.indexOf(p.word);
  heading.innerHTML = tokens.map((word, index) => {
    if (!Object.hasOwn(bank, word)) return word;
    const targetClass = index === targetIndex ? "target" : "";
    return `<button id="token-${index}" data-index="${index}" aria-controls="gloss" aria-expanded="false" class="${targetClass}">${label(word)}</button>`;
  }).join("");
  heading.style.setProperty("--characters", String(sentenceText(p.sentence).length));
  const reader = main.querySelector<HTMLElement>(".reader")!;
  const area = reader.querySelector<HTMLElement>(".reading-area")!;
  const buttons = reader.querySelectorAll<HTMLButtonElement>("[data-index]");
  const target = reader.querySelector<HTMLButtonElement>(".target")!;
  const highlight = createWordHighlight();
  highlight.move(target);
  function moveHighlight(to: HTMLElement, returning: boolean) {
    const movement = highlight.move(to);
    if (!movement) return;
    const { from, end } = movement;
    const dx = from.x - end.x;
    const dy = from.y - end.y;
    if (Math.abs(dy) > end.height / 2) {
      // A diagonal sweep across a wrapped sentence obscures unrelated words.
      highlight.element.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 130, easing: "ease-out" });
      return;
    }
    const centreDelta = end.x + end.width / 2 - (from.x + from.width / 2);
    const distance = Math.abs(centreDelta);
    const travelPast = returning ? Math.min(7, distance * 0.045) : Math.min(5, distance * 0.02);
    const overshoot = Math.sign(centreDelta) * travelPast;
    const duration = 160 + Math.min(90, distance * 0.35);
    const frames: Keyframe[] = [
      { transform: `translate(${dx}px, ${dy}px) scale(${from.width / end.width}, ${from.height / end.height})`, easing: "cubic-bezier(.2,.65,.3,1)" },
      { transform: `translateX(${overshoot}px)`, offset: returning ? 0.60 : 0.76, easing: "ease-in-out" },
    ];
    if (returning) frames.push({ transform: `translateX(${-overshoot * 0.22}px)`, offset: 0.84, easing: "ease-in-out" });
    frames.push({ transform: "none" });
    highlight.element.animate(frames, { duration: returning ? duration + 80 : duration });
  }
  const box = el("gloss");
  const entry = document.createElement("button");
  entry.id = "entry";
  const character = document.createElement("strong");
  character.lang = "zh-Hans";
  const pinyin = document.createElement("span");
  pinyin.className = "pinyin";
  pinyin.lang = "zh-Latn";
  const meaning = document.createElement("span");
  meaning.className = "meaning";
  entry.append(character, pinyin, meaning);
  let displayed = -1;
  let pressed = -1;
  function alignLookupCue() {
    if (displayed < 0) return;
    const word = el("token-" + displayed).getBoundingClientRect();
    const offset = word.left + word.width / 2 - box.getBoundingClientRect().left;
    entry.style.setProperty("--word-centre", offset + "px");
  }
  function align() {
    if (main.closest("[hidden]")) return;
    const ending = heading.lastChild;
    if (ending?.textContent === "。") {
      const range = document.createRange();
      range.selectNodeContents(ending);
      // Use the rendered stop width, which varies with the font and viewport.
      heading.style.translate = range.getBoundingClientRect().width / 4 + "px";
    }
    alignLookupCue();
  }
  align();
  entry.onpointerdown = () => { pressed = displayed; };
  entry.onpointercancel = () => { pressed = -1; };
  entry.onclick = event => {
    if (displayed < 0 || (event.detail > 0 && pressed !== displayed)) return;
    openWord(displayed);
  };
  function openWord(index: number) {
    selected = index;
    recordLookup(index);
    options.onOpenWord(tokens[index], index);
  }
  let leaveTimer: number | undefined;
  function releaseHover(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => {
      if (!reader.isConnected || box.contains(document.activeElement)) return;
      const focused = reader.querySelector<HTMLButtonElement>("[data-index]:focus-visible");
      selected = -1;
      showGloss(focused ? Number(focused.dataset.index) : -1);
    }, 450);
  }
  function recordLookup(index: number) {
    if (tokens[index] === p.word) options.onLookup(p);
  }
  function showGloss(index: number) {
    window.clearTimeout(leaveTimer);
    if (index === displayed) return;
    pressed = -1;
    displayed = index;
    buttons.forEach(btn => btn.setAttribute("aria-expanded", String(Number(btn.dataset.index) === index)));
    moveHighlight(index < 0 ? target : el("token-" + index), index < 0);
    const w = tokens[index];
    if (!w) {
      box.replaceChildren();
      return;
    }
    const e = bank[w];
    character.textContent = label(w);
    pinyin.textContent = e.pinyin;
    meaning.textContent = e.meaning;
    alignLookupCue();
    if (!entry.isConnected) box.append(entry);
  }
  showGloss(selected);
  buttons.forEach(btn => {
    const index = Number(btn.dataset.index);
    let mousePress = false;
    btn.onpointerdown = event => { mousePress = event.pointerType === "mouse"; };
    btn.onpointerenter = event => {
      if (event.pointerType !== "touch") showGloss(index);
    };
    btn.onfocus = () => showGloss(index);
    btn.onclick = event => {
      if (event.detail > 0 && mousePress) {
        openWord(index);
        return;
      }
      selected = event.detail > 0 && selected === index ? -1 : index;
      if (selected !== -1) recordLookup(index);
      showGloss(selected);
      if (event.detail === 0) entry.focus();
    };
  });
  area.onpointerenter = () => window.clearTimeout(leaveTimer);
  area.onpointerleave = releaseHover;
  area.addEventListener("focusout", event => {
    if (reader.isConnected && !area.contains(event.relatedTarget as Node | null) && !area.matches(":hover")) {
      selected = -1;
      showGloss(-1);
    }
  });
  function onKeyDown(event: KeyboardEvent) {
    if (!main.closest("[hidden]") && event.key === "Escape" && displayed >= 0) {
      if (document.activeElement === entry)
        el("token-" + displayed).focus();
      selected = -1;
      showGloss(-1);
    }
  }
  document.addEventListener("keydown", onKeyDown);
  return {
    align,
    dispose() {
      window.clearTimeout(leaveTimer);
      document.removeEventListener("keydown", onKeyDown);
    },
  };
}
