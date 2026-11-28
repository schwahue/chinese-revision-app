import { reducedMotion } from "./motion.ts";

export function createWordHighlight() {
  const element = document.createElement("span");
  element.className = "word-highlight";
  element.ariaHidden = "true";

  function move(to: HTMLElement | null) {
    if (element.parentElement === to) return;
    // Measure the displayed position before cancelling an interrupted glide.
    const from = to && element.isConnected && !reducedMotion.matches
      ? element.getBoundingClientRect() : undefined;
    element.getAnimations().forEach(animation => animation.cancel());
    if (to) to.append(element);
    else element.remove();
    if (from) return { from, end: element.getBoundingClientRect() };
  }
  return { element, move };
}
