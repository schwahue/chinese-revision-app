import { characterAssetPath } from "./characterAssetPath.ts";
import { learningText } from "./learningText.ts";
type Character = {
  radical: string;
  structure: string;
  strokes: [string, number, number][];
};

const guides = new Map<string, Promise<Character>>();
function characterData(c: string) {
  const cached = guides.get(c);
  if (cached) return cached;

  const request = fetch("./" + characterAssetPath(c)).then(async response => {
    if (!response.ok) throw Error("Character data unavailable");
    return await response.json() as Character;
  }).catch(error => {
    guides.delete(c);
    throw error;
  });
  guides.set(c, request);
  return request;
}

function steps(character: string, data: Character) {
  // Reuse each published outline in every successive writing step.
  const prefix = "stroke-" + character;
  const paths = data.strokes.map(([d], i) => `<path id="${prefix}-${i}" d="${d}"/>`).join("");
  const panels = data.strokes.map(([, x, y], i) => {
    const marks = data.strokes.slice(0, i + 1).map((_, j) =>
      `<use href="#${prefix}-${j}" fill="var(--${j === i ? "jade" : "muted"})"/>`).join("");
    return `<li><svg aria-hidden="true" viewBox="0 0 1024 1024"><g transform="translate(0 900) scale(1 -1)"><use href="#${prefix}" fill="var(--soft)"/>${marks}<circle cx="${x}" cy="${y}" r="24" fill="var(--bg)" stroke="var(--jade)" stroke-width="12"/></g></svg><small>${i + 1}</small></li>`;
  });
  return `<dl class="character-facts"><div><dt>Radical</dt><dd>${learningText(data.radical)}</dd></div><div><dt>Structure</dt><dd>${learningText(data.structure)}</dd></div></dl>
    <p class="stroke-caption">${data.strokes.length} ${data.strokes.length === 1 ? "stroke" : "strokes"} · Begin at each dot.</p>
    <svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><g id="${prefix}">${paths}</g></defs></svg>
    <ol class="strokes" aria-label="Stroke order for ${character}">${panels.join("")}</ol>`;
}

export function writingGuide(word: string) {
  const letters = [...new Set(word)];
  const rows = letters.map(c =>
    `<details name="guide-character" data-character="${c}"><summary lang="zh-Hans">${c}</summary></details>`
  ).join("");
  return `<div class="writing-guide" role="group" aria-label="Structure &amp; stroke order">${rows}</div>`;
}

export function enableWritingGuides(root: HTMLElement) {
  root.querySelectorAll<HTMLDetailsElement>("details[data-character]").forEach(panel => {
    const body = document.createElement("div");
    panel.append(body);
    const c = panel.dataset.character!;
    // Give the request a head start while the learner reads the word.
    void characterData(c).catch(() => { /* Opening the panel retries a failed prefetch. */ });
    panel.ontoggle = async () => {
      if (!panel.open) return;
      body.textContent = "Loading strokes…";
      try {
        body.innerHTML = steps(c, await characterData(c));
        panel.ontoggle = null;
      } catch {
        body.textContent = "Couldn’t load the strokes. Close and reopen to retry.";
      }
    };
  });
}
