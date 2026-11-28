import { createBankScreen } from "./bankScreen.ts";
import { renderWordDetail } from "./wordDetailScreen.ts";
import { renderMilestone, renderMilestonePreview } from "./milestoneScreen.ts";
import { renderReview, type ReviewView } from "./reviewScreen.ts";
import { bank, examples, label, reviewPool } from "./vocabulary.ts";
import { progressKey, progressStore } from "./storage.ts";
import { initSettings } from "./settings.ts";
import {
  advance,
  choose,
  nextPersonal,
  eligiblePersonalWords,
  personalSession,
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
const studyScene = el("study-scene");
let reviewView: ReviewView | undefined;
window.addEventListener("resize", () => reviewView?.align());
document.fonts.addEventListener("loadingdone", () => reviewView?.align());
const updateProgress = progressStore(
  bank, examples,
  () => {
    el("notice").hidden = false;
    el("notice").textContent = "Personal words and study progress are saved for this visit only.";
  },
);
let state = fresh();
type Screen = "capture" | "review" | "bank" | "detail" | "milestone";
let screen: Screen = "review",
  origin: "review" | "bank" = "review";
let editing: string | undefined;
let selected = -1,
  detail = "",
  listScroll = 0;
let milestone: ReturnType<typeof advance> = null;
let returnControl = "";

const bankScreen = createBankScreen(main, {
  getState: () => state,
  update: edit => syncProgress(edit, false),
  showList() { screen = "bank"; bankScreen.render(false, undefined, 0); },
  toggleCapture() { if (screen === "capture") go("bank", false); else capture(); },
  done() { go("bank", false); el("add-word").focus(); },
  review: reviewMyWords,
  openWord: (word, control) => openDetail(word, "bank", control),
});

async function syncProgress(edit?: (s: Progress) => void, refresh = true) {
  const updated = await updateProgress(s => {
    rollover(s, localDay());
    edit?.(s);
    if (!s.prompt) {
      const personal = personalSession(s);
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
  if (screen === "capture" && bankChanged) bankScreen.refreshMembership();
  if (screen === "bank" && bankScreen.personal && (bankChanged || previous.day !== state.day ||
      previous.credited.length !== state.credited.length)) render();
  if (screen === "detail" && bankChanged && origin === "bank" && bankScreen.personal) {
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
function go(view: Screen, focus = true) {
  screen = view;
  selected = -1;
  render(focus);
}
function resumeReview(focus = true) {
  if (state.prompt || personalSession(state)) go("review", focus);
  else {
    bankScreen.selectHSK();
    go("bank", focus);
  }
}
el("review").onclick = () => {
  if ((screen === "bank" || screen === "capture") && bankScreen.personal && personalSession(state)) {
    void reviewMyWords();
  } else go("review");
};
async function reviewMyWords() {
  await syncProgress(s => {
    s.extraHSK = false;
    if (s.prompt && eligiblePersonalWords(s).includes(s.prompt.word)) s.prompt.personal = true;
    else s.prompt = null;
  }, false);
  go("review");
}
el("bank").onclick = () => { bankScreen.selectPersonal(); go("bank"); };
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
  stopPronunciation();
  const previousCount = main.querySelector<HTMLElement>(".progress-stack")?.dataset.count;
  el("page-tools").replaceChildren();
  reviewView?.dispose();
  reviewView = undefined;
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
    reviewView = renderReview(main, {
      prompt: state.prompt,
      custom: state.prompt ? state.custom[state.prompt.word] : undefined,
      creditedWords: state.credited.map(displayWord),
      personal: personalSession(state),
      selected,
      onLookup(prompt) {
        if (!state.prompt?.looked)
          void syncProgress(s => { if (s.prompt?.id === prompt.id) s.prompt.looked = true; });
      },
      onOpenWord(word, index) { selected = index; openDetail(word, "review", "entry"); },
      onNext: completePrompt,
      async onExtra() {
        await syncProgress(s => { if (!nextPersonal(s)) s.extraHSK = true; }, false);
        resumeReview();
      },
    });
  }
  if (screen === "bank" || screen === "capture") bankScreen.render(screen === "capture", editing);
  if (screen === "detail") showDetail();
  if (screen === "milestone" && milestone)
    renderMilestone(main, milestone.words.map(displayWord), milestone.day, state.day, () => resumeReview());
  const stack = main.querySelector<HTMLElement>(".progress-stack");
  if (stack) {
    // Wrapped rows grow upward, so the newest row is at the negative scroll limit.
    stack.scrollTop = -stack.scrollHeight;
    if (previousCount !== undefined && Number(stack.dataset.count) > Number(previousCount))
      stack.classList.add("growing");
  }
  if (focus && !studyScene.hidden) {
    window.scrollTo(0, 0);
    if (screen !== "capture") main.querySelector<HTMLElement>('[tabindex="-1"], #collection')?.focus();
  }
}

async function completePrompt(p: Prompt) {
  const pressedAt = new Date();
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
}

function showDetail() {
  const word = detail;
  const custom = state.custom[word];
  const personal = origin === "bank" && bankScreen.personal;
  renderWordDetail(main, el("page-tools"), {
    word, custom, personal, origin,
    onEdit: () => capture(word),
    async onRemove() {
      await syncProgress(s => removePersonal(s, word), false);
      go("bank");
    },
    onBack() {
      screen = origin === "review" && !state.prompt ? "bank" : origin;
      render();
      if (origin === "bank") window.scrollTo(0, listScroll);
      (document.getElementById(returnControl) ?? main.querySelector<HTMLElement>(".sentence"))?.focus();
    },
    async onPractise() {
      await syncProgress(s => {
        if (custom && !s.myWords.includes(word)) return;
        start(s, word, custom ? null : examples(word), personal);
      });
      if (screen === "detail" && detail === word) go("review");
    },
  });
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
  if (!isPreview && (e.key === null || e.key === progressKey)) void syncProgress();
});
function stopPronunciation() {
  main.querySelector<HTMLAudioElement>(".word-pronunciation audio")?.pause();
}
initSettings(() => reviewView?.align(), stopPronunciation);
if (isPreview) {
  renderMilestonePreview(main, el("page-tools"), preview, state.day);
} else {
  void syncProgress();
  window.addEventListener("focus", checkDay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDay();
  });
  midnight();
}
