import { bank, label } from "./vocabulary.ts";
import { addPersonal, catalogueMatches, linkCustom, reading, saveCustom, searchCatalogue, validCustom } from "./personalWords.ts";
import type { Progress } from "./review.ts";
import { escapeText } from "./text.ts";

type Update = (edit: (s: Progress) => void) => Promise<void>;

export function refreshSearchMembership(root: HTMLElement, myWords: readonly string[]) {
  const saved = new Set(myWords);
  root.querySelectorAll<HTMLButtonElement>("button[data-add-word]").forEach(button => {
    const id = button.dataset.addWord!;
    const added = saved.has(id);
    button.textContent = added ? "Added" : "Add";
    button.setAttribute("aria-disabled", String(added));
    button.setAttribute("aria-label", button.textContent + " " + label(id) + " " + bank[id].pinyin);
  });
}

export function wordCapture(main: HTMLElement, getState: () => Progress, update: Update,
  done: () => void, editing?: string) {
  const original = editing ? getState().custom[editing] : undefined;
  let query = "";
  function search() {
    main.innerHTML = `<section class="capture"><div class="bank-tools"><label for="query">Search by pinyin</label>
      <button class="plain" id="done">Done</button></div>
      <input type="search" id="query" autocomplete="off" spellcheck="false">
      <ul class="matches"></ul><p role="status"></p>
      <button type="button" class="plain manual" id="manual" hidden>Add custom word</button></section>`;
    const input = main.querySelector<HTMLInputElement>("#query")!;
    const results = main.querySelector<HTMLElement>(".matches")!;
    const status = main.querySelector<HTMLElement>('[role="status"]')!;
    const customButton = main.querySelector<HTMLButtonElement>("#manual")!;
    input.value = query;
    function showResults() {
      query = input.value;
      const ids = searchCatalogue(query);
      results.replaceChildren();
      customButton.hidden = !query.trim();
      customButton.textContent = ids.length ? "Add a different word" : "Add custom word";
      const message = !customButton.hidden && !ids.length ? "No HSK matches." : "";
      if (status.textContent !== message) status.textContent = message;
      for (const id of ids) {
        const row = document.createElement("li");
        row.innerHTML = matchText(id);
        const add = document.createElement("button");
        add.type = "button";
        add.className = "plain";
        add.dataset.addWord = id;
        add.onclick = async () => {
          if (add.getAttribute("aria-disabled") === "true") return;
          await update(s => addPersonal(s, id));
          refreshSearchMembership(results, getState().myWords);
          status.textContent = label(id) + " added to Personal.";
          if (input.isConnected) { input.focus(); input.select(); }
        };
        row.append(add);
        results.append(row);
      }
      refreshSearchMembership(results, getState().myWords);
    }
    input.oninput = event => { if (!(event as InputEvent).isComposing) showResults(); };
    input.addEventListener("compositionend", showResults);
    customButton.onclick = manual;
    main.querySelector<HTMLButtonElement>("#done")!.onclick = done;
    showResults();
    input.focus();
  }
  function manual() {
    main.innerHTML = `<section class="capture"><div class="bank-tools">
      <h1>${editing ? "Edit word" : "New word"}</h1><button class="plain" id="cancel">Cancel</button></div>
      <form><label for="hanzi">Chinese characters</label><input id="hanzi" lang="zh-Hans" required maxlength="100" autocomplete="off">
      <label for="pinyin">Pinyin</label><input id="pinyin" required maxlength="200" autocomplete="off" spellcheck="false">
      <button class="primary" type="submit">Save word</button></form>
      <p role="status"></p><ul class="matches"></ul></section>`;
    const form = main.querySelector("form")!;
    const hanzi = main.querySelector<HTMLInputElement>("#hanzi")!;
    const pinyin = main.querySelector<HTMLInputElement>("#pinyin")!;
    const message = main.querySelector<HTMLElement>('[role="status"]')!;
    const matches = main.querySelector<HTMLElement>(".matches")!;
    hanzi.value = original?.hanzi ?? "";
    pinyin.value = original?.pinyin ?? query.trim();
    main.querySelector<HTMLButtonElement>("#cancel")!.onclick = editing ? done : search;
    form.oninput = () => { matches.replaceChildren(); message.textContent = ""; };
    let composing = false;
    form.addEventListener("compositionstart", () => { composing = true; });
    form.addEventListener("compositionend", () => { composing = false; });
    form.onsubmit = async event => {
      event.preventDefault();
      if (composing) return;
      const entry = { hanzi: hanzi.value.trim().normalize("NFC"), pinyin: pinyin.value.trim().normalize("NFC") };
      if (!validCustom(entry)) {
        message.textContent = "Enter Chinese characters and a pinyin reading using Latin letters.";
        return;
      }
      matches.replaceChildren();
      function stillCurrent(s: Progress) {
        if (!editing) return true;
        const now = s.custom[editing];
        return s.myWords.includes(editing) && now?.hanzi === original?.hanzi && now?.pinyin === original?.pinyin;
      }
      async function save(id?: string) {
        let saved = false;
        await update(s => {
          if (!stillCurrent(s)) return;
          if (id && editing) saved = linkCustom(s, editing, id);
          else if (id) {
            addPersonal(s, id);
            saved = true;
          } else saved = saveCustom(s, entry, editing);
        });
        if (!form.isConnected) return;
        if (saved) done();
        else message.textContent = "This word already exists or was changed in another tab. Reopen it from Personal.";
      }
      const ids = catalogueMatches(entry);
      if (ids.length) {
        message.textContent = "Choose the catalogue entry you mean.";
        for (const id of ids) {
          const row = document.createElement("li");
          const button = document.createElement("button");
          button.type = "button";
          button.innerHTML = matchText(id);
          button.onclick = () => void save(id);
          row.append(button);
          matches.append(row);
        }
        const typedReading = reading(entry.pinyin);
        const hasTone = /[\u0300\u0301\u0304\u030c]/u.test(typedReading.normalize("NFD")) || /[1-5]/u.test(entry.pinyin);
        if (hasTone && !ids.some(id => reading(bank[id].pinyin) === typedReading)) {
          const row = document.createElement("li");
          const own = document.createElement("button");
          own.type = "button";
          own.className = "plain";
          own.textContent = "Save my reading: " + entry.pinyin;
          own.onclick = () => void save();
          row.append(own);
          matches.append(row);
        }
        matches.querySelector("button")?.focus();
      } else await save();
    };
    hanzi.focus();
  }
  if (editing) manual(); else search();
}

function matchText(id: string) {
  const e = bank[id];
  return `<span class="match-text"><strong lang="zh-Hans">${escapeText(label(id))}</strong>
    <span lang="zh-Latn">${escapeText(e.pinyin)}</span>
    <small>${escapeText(e.sense ? e.sense + " · " + e.meaning : e.meaning)}</small></span>`;
}
