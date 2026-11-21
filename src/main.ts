import { refreshSearchMembership, wordCapture } from "./personalBank.ts";
import { escapeText } from "./text.ts";
import { learningText } from "./learningText.ts";
import { bank, examples, label, reviewPool, targets } from "./vocabulary.ts";
import { progressKey, progressStore, readTheme, saveTheme, themeKey } from "./storage.ts";
import { enableWritingGuides, writingGuide } from "./writingGuide.ts";
import { progressStack } from "./progressStack.ts";
import {
  advance,
  choose,
  nextPersonal,
  removePersonal,
  fresh,
  localDay,
  milestones,
  rollover,
  start,
  type Progress,
  type Prompt,
} from "./review.ts";

const preview = Number(new URLSearchParams(location.search).get("preview"));
const isPreview = milestones.includes(preview);
const el = (id: string) => document.getElementById(id)!;
const main = el("content");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const updateProgress = progressStore(
  bank, examples,
  () => {
    el("notice").hidden = false;
    el("notice").textContent = "Personal words and study progress are saved for this visit only.";
  },
);
let state = fresh();
let preference = readTheme();
type Screen = "capture" | "review" | "bank" | "detail" | "milestone";
let screen: Screen = "review",
  origin: "review" | "bank" = "review";
let collection: "my" | "hsk" = "my";
let editing: string | undefined;
let selected = -1,
  detail = "",
  level = "3",
  bankPage = 0,
  listScroll = 0;
let milestone: ReturnType<typeof advance> = null;
let returnControl = "";
async function syncProgress(edit?: (s: Progress) => void, refresh = true) {
  const updated = await updateProgress(s => {
    rollover(s, localDay());
    edit?.(s);
    if (!s.prompt) {
      const personal = s.myWords.length > 0 && !s.extraHSK;
      const word = personal ? nextPersonal(s) : choose(s, reviewPool(s.reviewLevels));
      if (word) start(s, word, s.custom[word] ? null : examples(word), personal);
    }
  });
  const previous = state;
  state = updated;
  if (previous.prompt?.id !== state.prompt?.id) selected = -1;
  if (!refresh) return;
  const bankChanged = JSON.stringify(previous.myWords) !== JSON.stringify(state.myWords) ||
    JSON.stringify(previous.custom) !== JSON.stringify(state.custom);
  if (screen === "capture" && bankChanged) refreshSearchMembership(main, state.myWords);
  if (screen === "bank" && collection === "my" && (bankChanged || previous.day !== state.day ||
      previous.credited.length !== state.credited.length)) render();
  if (screen === "detail" && bankChanged && origin === "bank" && collection === "my") {
    if (!state.myWords.includes(detail)) go("bank");
    else if (previous.custom[detail]?.hanzi !== state.custom[detail]?.hanzi ||
             previous.custom[detail]?.pinyin !== state.custom[detail]?.pinyin) render();
  }
  if (screen === "milestone" && milestone) {
    if (!state.history[milestone.words[milestone.words.length - 1]]) resumeReview();
    else if (previous.day !== state.day) render();
  }
  else if (screen === "review" && (!main.querySelector(".page") ||
      previous.prompt?.id !== state.prompt?.id || previous.credited.length !== state.credited.length || bankChanged || previous.extraHSK !== state.extraHSK))
    resumeReview(false);
}
function theme() {
  const dark = preference ? preference === "dark" : systemTheme.matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const control = el("theme");
  control.innerHTML = dark ? "☼" : "☾";
  control.ariaLabel = control.title = dark
    ? "Switch to light mode"
    : "Switch to dark mode";
}
el("theme").onclick = () => {
  const root = document.documentElement;
  preference = (preference ?? root.dataset.theme) === "dark" ? "light" : "dark";
  saveTheme(preference);
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    theme();
    return;
  }
  const button = el("theme").getBoundingClientRect();
  const x = button.left + button.width / 2;
  const y = button.top + button.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--reveal-origin", `${x}px ${y}px`);
  root.style.setProperty("--reveal-radius", `${Math.ceil(radius)}px`);
  document.startViewTransition(theme);
};
systemTheme.addEventListener("change", theme);
const action = (id: string, label: string) =>
  '<button class="primary" id="' + id + '">' + label + "</button>";
function go(view: Screen, focus = true) {
  screen = view;
  selected = -1;
  render(focus);
}
function resumeReview(focus = true) {
  if (state.prompt || personalSession()) go("review", focus);
  else {
    collection = "hsk";
    go("bank", focus);
  }
}
el("review").onclick = () => {
  if ((screen === "bank" || screen === "capture") && collection === "my" && personalSession()) {
    void reviewMyWords();
  } else go("review");
};
async function reviewMyWords() {
  await syncProgress(s => {
    s.extraHSK = false;
    const word = s.prompt?.word;
    if (word && s.myWords.includes(word) && !s.credited.includes(word) &&
        (!s.history[word] || s.history[word].due <= s.day)) s.prompt!.personal = true;
    else s.prompt = null;
  }, false);
  go("review");
}
el("bank").onclick = () => { collection = "my"; bankPage = 0; go("bank"); };
function personalSession() { return state.myWords.length > 0 && !state.extraHSK; }
function displayWord(word: string) { return state.custom[word]?.hanzi ?? label(word); }
function capture(word?: string) {
  editing = word;
  go("capture");
}
function openDetail(w: string, from: "bank" | "review", control: string) {
  origin = from;
  returnControl = control;
  if (from === "bank") listScroll = window.scrollY;
  detail = w;
  screen = "detail";
  render(true);
}
function render(focus = false) {
  const previousCount = main.querySelector<HTMLElement>(".progress-stack")?.dataset.count;
  el("page-tools").replaceChildren();
  document.onkeydown = null;
  window.onresize = null;
  const bankActive =
    screen === "bank" || screen === "capture" || (screen === "detail" && origin === "bank");
  for (const id of ["review", "bank"]) {
    if ((id === "bank") === bankActive)
      el(id).setAttribute("aria-current", "page");
    else el(id).removeAttribute("aria-current");
  }
  document
    .querySelector("nav")!
    .toggleAttribute("hidden", screen === "detail" || screen === "milestone");
  if (screen === "review") {
    if (state.prompt?.kind === "word") customReading(state.prompt);
    else if (state.prompt) reading(state.prompt);
    else if (personalSession()) {
      main.innerHTML = '<section class="page"><h1 class="review-empty" tabindex="-1">You’ve reviewed your personal words.</h1>' +
        action("extra", "Keep practising HSK") + '</section>';
      el("extra").onclick = async () => {
        await syncProgress(s => { if (!nextPersonal(s)) s.extraHSK = true; }, false);
        resumeReview();
      };
    }
    else main.innerHTML = '<section class="page"><p class="review-empty" tabindex="-1">You’ve reviewed every word in these levels today.</p></section>';
  }
  if (screen === "bank" || screen === "capture") list();
  if (screen === "detail") wordDetail();
  if (screen === "milestone") celebrate();
  const stack = main.querySelector<HTMLElement>(".progress-stack");
  if (stack) {
    // Wrapped rows grow upward, so the newest row is at the negative scroll limit.
    stack.scrollTop = -stack.scrollHeight;
    if (previousCount !== undefined && Number(stack.dataset.count) > Number(previousCount))
      stack.classList.add("growing");
  }
  if (focus) {
    window.scrollTo(0, 0);
    if (screen !== "capture") main.querySelector<HTMLElement>('[tabindex="-1"], #collection')?.focus();
  }
}
function customReading(p: Prompt) {
  const word = state.custom[p.word];
  main.innerHTML = '<section class="page"><div class="reader"><div class="reading-area"><div class="prompt-row">' +
    '<h1 class="sentence custom-head" tabindex="-1" lang="zh-Hans"></h1><aside class="progress-sidebar" aria-label="Daily progress">' +
    progressStack(state.credited.map(displayWord)) + '</aside></div><div class="custom-reading">' +
    '<button class="plain" id="reveal" aria-expanded="false" aria-controls="pronunciation">Show pinyin</button>' +
    '<span id="pronunciation" lang="zh-Latn" hidden></span></div></div></div>' + action("next", "Next") + '</section>';
  main.querySelector("h1")!.textContent = word.hanzi;
  el("pronunciation").textContent = word.pinyin;
  el("reveal").onclick = () => {
    const show = el("pronunciation").hidden;
    el("pronunciation").hidden = !show;
    el("reveal").setAttribute("aria-expanded", String(show));
    el("reveal").textContent = show ? "Hide pinyin" : "Show pinyin";
    if (show) void syncProgress(s => { if (s.prompt?.id === p.id) s.prompt.looked = true; });
  };
  bindNext(p);
}
function reading(p: Exclude<Prompt, { kind: "word" }>) {
  const tokens = p.sentence.split(" ");
  const targetIndex = tokens.indexOf(p.word);
  const sentence = tokens
    .map((w, i) =>
      Object.hasOwn(bank, w)
        ? '<button id="token-' +
          i +
          '" data-index="' +
          i +
          '" aria-controls="gloss" aria-expanded="false" class="' +
          (i === targetIndex ? "target" : "") +
          '">' +
          label(w) +
          "</button>"
        : w,
    )
    .join("");
  main.innerHTML =
    '<section class="page">' +
    '<div class="reader"><div class="reading-area"><div class="prompt-row"><h1 class="sentence" tabindex="-1" lang="zh-Hans" style="--characters:' + tokens.map(label).join("").length + '">' +
    sentence +
    '</h1><aside class="progress-sidebar" aria-label="Daily progress">' +
    progressStack(state.credited.map(displayWord)) +
    '</aside></div><div id="gloss" class="gloss" aria-live="polite"></div></div></div>' +
    action("next", "Next") +
    "</section>";
  const reader = main.querySelector<HTMLElement>(".reader")!;
  const area = reader.querySelector<HTMLElement>(".reading-area")!;
  const buttons = reader.querySelectorAll<HTMLButtonElement>("[data-index]");
  const target = reader.querySelector<HTMLButtonElement>(".target")!;
  const highlight = document.createElement("span");
  highlight.className = "word-highlight";
  highlight.setAttribute("aria-hidden", "true");
  target.append(highlight);
  function moveHighlight(to: HTMLElement, returning: boolean) {
    if (highlight.parentElement === to) return;
    // Start from the visible position even if the previous spring is still moving.
    const from = highlight.getBoundingClientRect();
    highlight.getAnimations().forEach(animation => animation.cancel());
    to.append(highlight);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const end = highlight.getBoundingClientRect();
    const dx = from.x - end.x;
    const dy = from.y - end.y;
    if (Math.abs(dy) > end.height / 2) {
      // A diagonal sweep across a wrapped sentence obscures unrelated words.
      highlight.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 130, easing: "ease-out" });
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
    highlight.animate(frames, { duration: returning ? duration + 80 : duration });
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
  const heading = reader.querySelector<HTMLElement>(".sentence")!;
  function alignLookupCue() {
    if (displayed < 0) return;
    const word = el("token-" + displayed).getBoundingClientRect();
    const offset = word.left + word.width / 2 - box.getBoundingClientRect().left;
    entry.style.setProperty("--word-centre", offset + "px");
  }
  function alignReading() {
    const ending = heading.lastChild;
    if (ending?.textContent === "。") {
      const range = document.createRange();
      range.selectNodeContents(ending);
      // Use the rendered stop width, which varies with the font and viewport.
      heading.style.translate = range.getBoundingClientRect().width / 4 + "px";
    }
    alignLookupCue();
  }
  alignReading();
  window.onresize = alignReading;
  entry.onpointerdown = () => { pressed = displayed; };
  entry.onpointercancel = () => { pressed = -1; };
  entry.onclick = event => {
    if (displayed < 0 || (event.detail > 0 && pressed !== displayed)) return;
    openWord(displayed);
  };
  function openWord(index: number) {
    selected = index;
    recordLookup(index);
    openDetail(tokens[index], "review", "entry");
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
    if (tokens[index] === p.word && !state.prompt?.looked)
      void syncProgress(s => {
        if (s.prompt?.id === p.id) s.prompt.looked = true;
      });
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
    if (screen === "review" && !area.contains(event.relatedTarget as Node | null) && !area.matches(":hover")) {
      selected = -1;
      showGloss(-1);
    }
  });
  document.onkeydown = event => {
    if (event.key === "Escape" && displayed >= 0) {
      if (document.activeElement === entry)
        el("token-" + displayed).focus();
      selected = -1;
      showGloss(-1);
    }
  };
  bindNext(p);
}
function bindNext(p: Prompt) {
  const next = el("next") as HTMLButtonElement;
  next.onclick = async () => {
    if (next.disabled) return;
    const pressedAt = new Date();
    next.disabled = true;
    const creditsAtPress = state.day === localDay(pressedAt) ? state.credited : [];
    let reached: ReturnType<typeof advance> = null;
    await syncProgress(s => {
      if (s.prompt?.id === p.id) reached = advance(s, pressedAt, s.day, creditsAtPress);
    }, false);
    if (screen === "review") {
      milestone = reached;
      if (reached) go("milestone");
      else resumeReview();
      main.querySelector(".reader")?.classList.add("arriving");
    }
  };
}
function list(pageDirection = 0) {
  if (!main.querySelector("#collection-entries")) {
    const levels = [...new Set(Object.values(bank).map((e) => e.level))]
      .filter(Boolean)
      .sort();
    const options = levels
      .map((l) => '<option value="' + l + '">HSK ' + l + "</option>")
      .join("");
    main.innerHTML = '<section class="bank-body"><h1 class="sr">Word Bank</h1><div class="bank-tools collection-header">' +
      '<select id="collection" aria-label="Word collection"><option value="my">Personal</option>' +
      '<option value="all">All HSK</option>' + options + '</select></div>' +
      action("mine-review", "Review personal words") +
      '<button class="primary" id="add-word" aria-controls="collection-entries">Add word</button>' +
      '<div id="collection-entries"></div></section>';
    const picker = el("collection") as HTMLSelectElement;
    picker.onchange = () => {
      collection = picker.value === "my" ? "my" : "hsk";
      if (collection === "hsk") level = picker.value;
      bankPage = 0;
      go("bank", false);
      animateWordRows();
    };
    el("mine-review").onclick = reviewMyWords;
    el("add-word").onclick = () => screen === "capture" ? go("bank", false) : capture();
  }
  (el("collection") as HTMLSelectElement).value = collection === "my" ? "my" : level;
  el("mine-review").hidden = screen === "capture" || collection !== "my" || !state.myWords.length;
  el("add-word").hidden = collection !== "my";
  el("add-word").setAttribute("aria-expanded", String(screen === "capture"));
  if (screen === "capture") {
    wordCapture(el("collection-entries"), () => state, edit => syncProgress(edit, false), () => {
      go("bank", false);
      el("add-word").focus();
    }, editing);
  } else {
    const words = collection === "my" ? state.myWords :
      Object.keys(bank).filter(w => level === "all" || bank[w].level === Number(level));
    wordList(words, pageDirection);
  }
}
function animateWordRows(direction = 0) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const offset = direction ? `translateX(${direction * 8}px)` : "translateY(6px)";
  main.querySelectorAll(".list > li:nth-child(-n+8)").forEach((row, index) => {
    row.animate([
      { opacity: .25, transform: offset },
      { opacity: 1, transform: "none" },
    ], { duration: 180, delay: index * 16, easing: "ease-out", fill: "backwards" });
  });
}
function wordList(words: string[], pageDirection: number) {
  const pageSize = 8;
  const pageCount = Math.ceil(words.length / pageSize);
  bankPage = Math.min(bankPage, Math.max(0, pageCount - 1));
  if (!pageCount) {
    el("collection-entries").innerHTML = '<p class="bank-empty">Add your first class word.</p>';
    return;
  }
  // Keep the endpoints and slide three interior buttons around the current page.
  const middle = Math.max(3, Math.min(bankPage + 1, pageCount - 2));
  const numbers = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, i) => i + 1)
    : [1, middle - 1, middle, middle + 1, pageCount];
  const pages = numbers.map((number, position) => {
    const index = number - 1;
    const gap = position > 0 && number - numbers[position - 1] > 1
      ? '<span aria-hidden="true">…</span>' : "";
    const current = index === bankPage ? ' aria-current="page"' : "";
    return `${gap}<button data-page="${index}" aria-label="Page ${number}"${current}>${number}</button>`;
  });
  const pager = pageCount > 1
    ? `<div class="bank-pager" role="navigation" aria-label="Word Bank pages">${pages.join("")}</div>`
    : "";
  const rows = words.slice(bankPage * pageSize, (bankPage + 1) * pageSize)
    .map(w => {
      const pinyin = state.custom[w]?.pinyin ?? bank[w].pinyin;
      const sense = bank[w]?.sense;
      return `<li><button data-word="${escapeText(w)}" id="entry-${escapeText(w)}">
        <span lang="zh-Hans">${escapeText(displayWord(w))}</span>
        <span class="bank-pinyin" lang="zh-Latn">${escapeText(pinyin)}${sense ? `<span lang="en"> · ${escapeText(sense)}</span>` : ""}</span>
        <span aria-hidden="true">›</span></button></li>`;
    }).join("");
  const listClass = collection === "my" ? "list personal-list" : "list";
  el("collection-entries").innerHTML = `<ul class="${listClass}">${rows}</ul>${pager}`;
  main.querySelectorAll<HTMLButtonElement>("[data-page]").forEach(button => {
    button.onclick = () => {
      const previous = bankPage;
      bankPage = Number(button.dataset.page);
      if (bankPage !== previous) list(Math.sign(bankPage - previous));
      else main.querySelector<HTMLButtonElement>("[data-word]")?.focus();
    };
  });
  const rowsList = main.querySelector<HTMLUListElement>(".list")!;
  if (pageDirection) animateWordRows(pageDirection);
  const highlight = document.createElement("span");
  highlight.className = "word-highlight";
  highlight.ariaHidden = "true";
  function highlightRow(row: HTMLButtonElement | null) {
    if (highlight.parentElement === row) return;
    const glide = row && highlight.isConnected && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = glide ? highlight.getBoundingClientRect().top : 0;
    highlight.getAnimations().forEach(animation => animation.cancel());
    if (!row) {
      highlight.remove();
      return;
    }
    row.append(highlight);
    if (!glide) return;
    const delta = from - highlight.getBoundingClientRect().top;
    const overshoot = -Math.sign(delta) * Math.min(2, Math.abs(delta) * .025);
    highlight.animate([
      { transform: `translateY(${delta}px)`, easing: "cubic-bezier(.2,.65,.3,1)" },
      { transform: `translateY(${overshoot}px)`, offset: .78, easing: "ease-out" },
      { transform: "none" },
    ], { duration: 185 });
  }
  rowsList.querySelectorAll<HTMLButtonElement>("[data-word]").forEach(btn => {
    btn.onpointerenter = event => { if (event.pointerType !== "touch") highlightRow(btn); };
    btn.onfocus = () => { if (btn.matches(":focus-visible")) highlightRow(btn); };
    btn.onclick = () => openDetail(btn.dataset.word!, "bank", btn.id);
  });
  rowsList.onpointerleave = () => highlightRow(rowsList.querySelector("button:focus-visible"));
  rowsList.addEventListener("focusout", event => {
    if (!rowsList.contains(event.relatedTarget as Node | null))
      highlightRow(matchMedia("(hover: hover)").matches ? rowsList.querySelector("button:hover") : null);
  });
  if (pageDirection) rowsList.querySelector("button")?.focus();
  else if (document.activeElement === document.body) el("collection").focus();
}
function wordDetail() {
  const custom = state.custom[detail];
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
  el("page-tools").innerHTML = '<button class="back" id="back">‹ ' +
    (origin === "bank" ? "Word Bank" : "Review") + "</button>";
  if (custom) {
    main.innerHTML = '<article class="page word-page"><div class="entry-body"><section class="role headword">' +
      '<h1 lang="zh-Hans" tabindex="-1">' + escapeText(custom.hanzi) + '</h1><em lang="zh-Latn">' +
      escapeText(custom.pinyin) + '</em></section><button class="plain" id="edit-custom">Edit word</button></div>' +
      action("practise", "Practise") + '</article>';
    el("edit-custom").onclick = () => capture(detail);
  } else main.innerHTML =
    '<article class="page word-page"><div class="entry-body"><div class="roles"><section class="role headword"><h1 lang="zh-Hans" tabindex="-1">' +
    label(detail) +
    '</h1><em class="reading-pinyin" lang="zh-Latn">' + e.pinyin + "</em><p>" +
    e.meaning +
    "</p></section>" +
    (e.usage ? group("Usage", e.usage, "usage") : "") +
    (e.measure ? group("Measure word", e.measure, "measure") : "") +
    '</div><section class="learning"><div class="memory-cue">' +
    (e.tip ? '<h2>Memory cue</h2><p>' + learningText(e.tip) + '</p>'
      : '<h2>In context</h2><p lang="zh-Hans">' + examples(detail)[0].split(" ").map(label).join("") + '</p>') +
    '</div>' + writingGuide(label(detail)) +
    "</section></div>" +
    action("practise", "Practise") +
    "</article>";
  if (!custom) enableWritingGuides(main);
  if (origin === "bank" && collection === "my") {
    const remove = document.createElement("button");
    remove.className = "plain";
    remove.textContent = "Remove from Personal";
    main.querySelector(".entry-body")!.append(remove);
    remove.onclick = async () => {
      const word = detail;
      await syncProgress(s => removePersonal(s, word), false);
      go("bank");
    };
  }
  el("back").onclick = () => {
    screen = origin === "review" && !state.prompt ? "bank" : origin;
    render();
    if (origin === "bank") window.scrollTo(0, listScroll);
    (document.getElementById(returnControl) ?? main.querySelector<HTMLElement>(".sentence"))?.focus();
  };
  el("practise").onclick = async () => {
    const word = detail;
    await syncProgress(s => {
      if (custom && !s.myWords.includes(word)) return;
      start(s, word, custom ? null : examples(word), origin === "bank" && collection === "my");
    });
    if (screen === "detail" && detail === word) go("review");
  };
}
function burst(origin: string, count: number) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i + 0.25) * 360 / count;
    const reach = [1, 0.74, 0.88][i % 3];
    return `<i style="--angle:${angle}deg;--reach:${reach}"></i>`;
  }).join("");
  return `<span class="confetti ${origin}" aria-hidden="true">${pieces}</span>`;
}
function celebration(words: readonly string[], day = state.day) {
  const tier = words.length;
  const when = day === state.day ? "today" : "on " + day;
  const [chinese, pinyin, english] = tier === 10
    ? ["真棒！", "Zhēn bàng!", "Great job!"]
    : tier === 15
      ? ["太厉害了！", "Tài lìhai le!", "That’s impressive!"]
      : ["你做到了！", "Nǐ zuòdào le!", "You did it!"];
  const nextTier = milestones[milestones.indexOf(tier) + 1];
  const sideBursts = tier >= 15 ? burst("left", 10) + burst("right", 12) : "";
  const centreBurst = tier === 15 ? "" : burst("centre", tier === 10 ? 12 : 20);
  return `<div class="victory tier-${tier}">
    <div class="prompt-row"><div class="number">
      <span class="digits">${tier}</span>${centreBurst}${sideBursts}
    </div><aside class="progress-sidebar" aria-label="Daily progress">${progressStack(words, true, when)}</aside></div>
    <h1 tabindex="-1" lang="zh-Hans"><span class="sr" lang="en">${tier} words ${when}. </span>${chinese}</h1>
    <p class="cheer-reading"><span lang="zh-Latn">${pinyin}</span> <span>${english}</span></p>
    ${day !== state.day ? `<p class="milestone-note">Earned on <time datetime="${day}">${day}</time></p>` : nextTier ? `<p class="milestone-note">${tier === 10 ? "Daily goal met! · " : ""}${nextTier - tier} words to ${nextTier}</p>` : ""}
    </div>`;
}

function showPreview() {
  const link = el("milestones") as HTMLAnchorElement;
  link.textContent = "Back to review";
  link.href = location.pathname;
  link.hidden = false;
  document.querySelector("nav")!.hidden = true;
  const choices = milestones.map(tier =>
    `<a href="?preview=${tier}" ${tier === preview ? 'aria-current="page"' : ""}>${tier}</a>`
  ).join("");
  el("page-tools").innerHTML = `<div class="preview-picker"><span>Milestone preview</span><div role="group" aria-label="Word count">${choices}</div></div>`;
  main.innerHTML = `<section class="page">
    ${celebration(targets.slice(0, preview))}
    <button id="replay" class="primary">Replay</button></section>`;
  el("replay").onclick = () => {
    const victory = main.querySelector(".victory")!;
    victory.replaceWith(victory.cloneNode(true));
  };
}

function celebrate() {
  if (!milestone) return;
  main.innerHTML = `<section class="page">${celebration(milestone.words.map(displayWord), milestone.day)}${action("continue", "Continue")}</section>`;
  el("continue").onclick = () => resumeReview();
}
function checkDay() {
  if (state.day !== localDay()) void syncProgress();
}
function midnight() {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  setTimeout(
    () => {
      checkDay();
      midnight();
    },
    next.getTime() - Date.now() + 50,
  );
}
window.addEventListener("storage", (e) => {
  if (e.key === null || e.key === themeKey) {
    preference = readTheme();
    theme();
  }
  if (!isPreview && (e.key === null || e.key === progressKey)) void syncProgress();
});
theme();
if (isPreview) {
  showPreview();
} else {
  void syncProgress();
  window.addEventListener("focus", checkDay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDay();
  });
  midnight();
}
