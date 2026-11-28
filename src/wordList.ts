import { reducedMotion } from "./motion.ts";
import { createWordHighlight } from "./wordHighlight.ts";
import { escapeText } from "./text.ts";

type WordListOptions = {
  words: readonly string[];
  page: number;
  direction?: number;
  readWord: (id: string) => { hanzi: string; pinyin: string; sense?: string };
  openWord: (id: string, control: string) => void;
  changePage: (page: number) => void;
};

function animateRows(rows: NodeListOf<HTMLElement>, direction: number) {
  if (reducedMotion.matches) return;
  const offset = direction ? `translateX(${direction * 8}px)` : "translateY(6px)";
  rows.forEach((row, index) => {
    row.animate([
      { opacity: .25, transform: offset },
      { opacity: 1, transform: "none" },
    ], { duration: 180, delay: index * 16, easing: "ease-out", fill: "backwards" });
  });
}

function bindRows(rowsList: HTMLUListElement, openWord: WordListOptions["openWord"]) {
  const highlight = createWordHighlight();
  function highlightRow(row: HTMLButtonElement | null) {
    const movement = highlight.move(row);
    if (!movement) return;
    const delta = movement.from.top - movement.end.top;
    const overshoot = -Math.sign(delta) * Math.min(2, Math.abs(delta) * .025);
    highlight.element.animate([
      { transform: `translateY(${delta}px)`, easing: "cubic-bezier(.2,.65,.3,1)" },
      { transform: `translateY(${overshoot}px)`, offset: .78, easing: "ease-out" },
      { transform: "none" },
    ], { duration: 185 });
  }
  rowsList.querySelectorAll<HTMLButtonElement>("[data-word]").forEach(btn => {
    btn.onpointerenter = event => { if (event.pointerType !== "touch") highlightRow(btn); };
    btn.onfocus = () => { if (btn.matches(":focus-visible")) highlightRow(btn); };
    btn.onclick = () => openWord(btn.dataset.word!, btn.id);
  });
  rowsList.onpointerleave = () => highlightRow(rowsList.querySelector("button:focus-visible"));
  rowsList.addEventListener("focusout", event => {
    if (!rowsList.contains(event.relatedTarget as Node | null))
      highlightRow(matchMedia("(hover: hover)").matches ? rowsList.querySelector("button:hover") : null);
  });
}

export function renderWordList(container: HTMLElement, options: WordListOptions) {
  const { words, direction, readWord, openWord, changePage } = options;
  const pageSize = 8;
  const pageCount = Math.ceil(words.length / pageSize);
  if (!pageCount) {
    container.innerHTML = '<p class="bank-empty">Add your first class word.</p>';
    if (direction !== undefined) animateRows(container.querySelectorAll(".bank-empty"), direction);
    return 0;
  }
  const page = Math.min(options.page, pageCount - 1);
  // Keep the endpoints and slide three interior buttons around the current page.
  const middle = Math.max(3, Math.min(page + 1, pageCount - 2));
  const numbers = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, i) => i + 1)
    : [1, middle - 1, middle, middle + 1, pageCount];
  const pages = numbers.map((number, position) => {
    const index = number - 1;
    const gap = position > 0 && number - numbers[position - 1] > 1
      ? '<span aria-hidden="true">…</span>' : "";
    const current = index === page ? ' aria-current="page"' : "";
    return `${gap}<button data-page="${index}" aria-label="Page ${number}"${current}>${number}</button>`;
  });
  const pager = pageCount > 1
    ? `<div class="bank-pager" role="navigation" aria-label="Word Bank pages">${pages.join("")}</div>`
    : "";
  const rows = words.slice(page * pageSize, (page + 1) * pageSize).map(id => {
    const { hanzi, pinyin, sense } = readWord(id);
    const key = escapeText(id);
    return `<li><button data-word="${key}" id="entry-${key}">
      <span lang="zh-Hans">${escapeText(hanzi)}</span>
      <span class="bank-pinyin" lang="zh-Latn">${escapeText(pinyin)}${sense ? `<span lang="en"> · ${escapeText(sense)}</span>` : ""}</span>
      <span aria-hidden="true">›</span></button></li>`;
  }).join("");
  container.innerHTML = `<ul class="list">${rows}</ul>${pager}`;
  const list = container.querySelector("ul")!;
  list.style.setProperty("--page-size", String(pageSize));
  bindRows(list, openWord);
  container.querySelectorAll<HTMLButtonElement>("[data-page]").forEach(button => {
    button.onclick = () => {
      const next = Number(button.dataset.page);
      if (page !== next) changePage(next);
      else list.querySelector("button")?.focus();
    };
  });
  if (direction !== undefined) animateRows(list.querySelectorAll("li"), direction);
  if (direction) list.querySelector("button")?.focus();
  return page;
}
