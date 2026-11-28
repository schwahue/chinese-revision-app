import { refreshSearchMembership, wordCapture } from "./personalBank.ts";
import { renderWordList } from "./wordList.ts";
import { bank, label } from "./vocabulary.ts";
import type { Progress } from "./review.ts";

type BankActions = {
  getState: () => Progress;
  update: (edit: (s: Progress) => void) => Promise<void>;
  showList: () => void;
  toggleCapture: () => void;
  done: () => void;
  review: () => void;
  openWord: (word: string, control: string) => void;
};

export function createBankScreen(main: HTMLElement, actions: BankActions) {
  const el = (id: string) => main.querySelector<HTMLElement>("#" + id)!;
  let collection: "my" | "hsk" = "my";
  let level = "3";
  let bankPage = 0;

  function render(capturing: boolean, editing?: string, direction?: number) {
    const state = actions.getState();
    if (!main.querySelector("#collection-entries")) {
      const levels = [...new Set(Object.values(bank).map((e) => e.level))]
        .filter(Boolean)
        .sort();
      const options = levels
        .map((l) => '<option value="' + l + '">HSK ' + l + "</option>")
        .join("");
      main.innerHTML = '<section class="bank-body"><h1 class="sr">Word Bank</h1><div class="bank-tools collection-header">' +
        '<select id="collection" aria-label="Word collection"><option value="my">Personal</option>' +
        '<option value="all">All HSK</option>' + options + '</select>' +
        '<div class="collection-actions"><button class="plain" id="mine-review" aria-label="Review personal words">Review</button>' +
        '<button class="plain" id="add-word" aria-controls="collection-entries">Add word</button></div></div>' +
        '<div id="collection-entries"></div></section>';
      const picker = el("collection") as HTMLSelectElement;
      picker.onchange = () => {
        collection = picker.value === "my" ? "my" : "hsk";
        if (collection === "hsk") level = picker.value;
        bankPage = 0;
        actions.showList();
      };
      el("mine-review").onclick = actions.review;
      el("add-word").onclick = actions.toggleCapture;
    }
    (el("collection") as HTMLSelectElement).value = collection === "my" ? "my" : level;
    el("mine-review").hidden = capturing || collection !== "my" || !state.myWords.length;
    main.querySelector<HTMLElement>(".collection-actions")!.hidden = collection !== "my";
    el("add-word").setAttribute("aria-expanded", String(capturing));
    if (capturing) {
      wordCapture(el("collection-entries"), actions.getState, actions.update, actions.done, editing);
    } else {
      const words = collection === "my" ? state.myWords :
        Object.keys(bank).filter(w => level === "all" || bank[w].level === Number(level));
      const entries = el("collection-entries");
      bankPage = renderWordList(entries, {
        words,
        page: bankPage,
        direction: direction ?? (entries.querySelector(".list") ? undefined : 0),
        readWord: id => state.custom[id] ?? { hanzi: label(id), pinyin: bank[id].pinyin, sense: bank[id].sense },
        openWord: actions.openWord,
        changePage: next => {
          const direction = Math.sign(next - bankPage);
          bankPage = next;
          render(false, undefined, direction);
        },
      });
      if (document.activeElement === document.body) el("collection").focus();
    }
  }

  return {
    render,
    get personal() { return collection === "my"; },
    selectPersonal() { collection = "my"; bankPage = 0; },
    selectHSK() { collection = "hsk"; },
    refreshMembership() { refreshSearchMembership(main, actions.getState().myWords); },
  };
}
