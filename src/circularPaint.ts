import { reducedMotion } from "./motion.ts";

function setPaintCircle(trigger: HTMLElement, target: HTMLElement, origin?: DOMRect, coverage?: DOMRect) {
  const button = trigger.getBoundingClientRect();
  const x = button.left + button.width / 2;
  const y = button.top + button.height / 2;
  const width = Math.max(x - (coverage?.left ?? 0), (coverage?.right ?? innerWidth) - x);
  const height = Math.max(y - (coverage?.top ?? 0), (coverage?.bottom ?? innerHeight) - y);
  const radius = Math.ceil(Math.hypot(width, height));
  target.style.setProperty("--reveal-origin", `${x - (origin?.left ?? 0)}px ${y - (origin?.top ?? 0)}px`);
  target.style.setProperty("--reveal-radius", `${radius}px`);
}

export function paintElement(trigger: HTMLElement, target: HTMLElement, onFinish: () => void, coverage: HTMLElement | "viewport" = target) {
  const bounds = target.getBoundingClientRect();
  const extent = coverage === "viewport" ? undefined : coverage.getBoundingClientRect();
  setPaintCircle(trigger, target, bounds, extent);
  target.setAttribute("data-circular-paint", "");
  const animation = target.getAnimations().find(
    animation => animation instanceof CSSAnimation && animation.animationName === "circular-paint",
  );

  function finish() {
    target.removeAttribute("data-circular-paint");
    target.style.removeProperty("--reveal-origin");
    target.style.removeProperty("--reveal-radius");
    onFinish();
  }
  if (!animation) {
    finish();
    return;
  }
  animation.onfinish = finish;
  return () => {
    animation.onfinish = null;
    finish();
  };
}

export function paintDocument(trigger: HTMLElement, update: () => void) {
  if (!document.startViewTransition || reducedMotion.matches) {
    update();
    return;
  }
  setPaintCircle(trigger, document.documentElement);
  document.startViewTransition(update);
}
