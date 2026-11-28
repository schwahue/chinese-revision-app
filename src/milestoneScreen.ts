import { progressStack } from "./progressStack.ts";
import { milestones } from "./review.ts";
import { targets } from "./vocabulary.ts";

function burst(origin: string, count: number) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i + 0.25) * 360 / count;
    const reach = [1, 0.74, 0.88][i % 3];
    return `<i style="--angle:${angle}deg;--reach:${reach}"></i>`;
  }).join("");
  return `<span class="confetti ${origin}" aria-hidden="true">${pieces}</span>`;
}
function celebration(words: readonly string[], day: string, today: string) {
  const tier = words.length;
  const when = day === today ? "today" : "on " + day;
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
    ${day !== today ? `<p class="milestone-note">Earned on <time datetime="${day}">${day}</time></p>` : nextTier ? `<p class="milestone-note">${tier === 10 ? "Daily goal met! · " : ""}${nextTier - tier} words to ${nextTier}</p>` : ""}
    </div>`;
}

export function renderMilestonePreview(main: HTMLElement, tools: HTMLElement, preview: number, today: string) {
  const link = document.getElementById("milestones")! as HTMLAnchorElement;
  link.textContent = "Back to review";
  link.href = location.pathname;
  link.hidden = false;
  document.querySelector("nav")!.hidden = true;
  const choices = milestones.map(tier =>
    `<a href="?preview=${tier}" ${tier === preview ? 'aria-current="page"' : ""}>${tier}</a>`
  ).join("");
  tools.innerHTML = `<div class="preview-picker"><span>Milestone preview</span><div role="group" aria-label="Word count">${choices}</div></div>`;
  main.innerHTML = `<section class="page">
    ${celebration(targets.slice(0, preview), today, today)}
    <button id="replay" class="primary">Replay</button></section>`;
  main.querySelector<HTMLButtonElement>("#replay")!.onclick = () => {
    const victory = main.querySelector(".victory")!;
    victory.replaceWith(victory.cloneNode(true));
  };
}

export function renderMilestone(main: HTMLElement, words: string[], day: string, today: string, onContinue: () => void) {
  main.innerHTML = `<section class="page">${celebration(words, day, today)}<button class="primary" id="continue">Continue</button></section>`;
  main.querySelector<HTMLButtonElement>("#continue")!.onclick = onContinue;
}
