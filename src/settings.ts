import { hanFontKey, readHanFont, readTheme, saveHanFont, saveTheme, themeKey, type HanFont } from "./storage.ts";
import { paintDocument, paintElement } from "./circularPaint.ts";
import { reducedMotion } from "./motion.ts";
import { learningText } from "./learningText.ts";

export function initSettings(onReturn: () => void, onLeaveStudy: () => void) {
  const el = (id: string) => document.getElementById(id)!;
  const header = el("app-header");
  const study = el("study-scene");
  const page = el("settings-page");
  const settingsButton = el("settings");
  const backButton = el("close-settings");
  const themeButton = el("theme");
  const fontControl = el("han-font") as HTMLSelectElement;
  const previewText = el("font-preview-hanzi");
  const preview = previewText.closest<HTMLElement>(".font-preview")!;
  const toast = el("settings-toast");
  const status = el("settings-status");
  const dismiss = el("dismiss-settings-toast");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  let preference = readTheme();
  let studyScroll = 0;
  let returningToStudy = false;
  let toastTimer: number | undefined;
  let saveTrigger: HTMLElement;
  let finishReveal: (() => void) | undefined;
  let finishFontPaint: (() => void) | undefined;

  function updateHeaderHeight() {
    header.parentElement!.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
  }
  new ResizeObserver(updateHeaderHeight).observe(header);
  updateHeaderHeight();

  function finishPaints() {
    finishReveal?.();
    finishFontPaint?.();
  }

  function showPage(navigation?: "gear" | "history") {
    const inSettings = location.hash === "#settings";
    if (inSettings === study.hidden) return;
    finishPaints();
    clearToast();
    if (inSettings) {
      onLeaveStudy();
      studyScroll = window.scrollY;
    }
    const outgoing = inSettings ? study : page;
    const incoming = inSettings ? page : study;
    const bounds = navigation && !reducedMotion.matches ? outgoing.getBoundingClientRect() : undefined;
    const outgoingStyle = outgoing.style.cssText;
    if (bounds) {
      // Keep the old view at its on-screen position while the new view takes over layout.
      outgoing.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
      outgoing.toggleAttribute("data-reveal-outgoing", true);
      outgoing.inert = true;
      Object.assign(outgoing.style, {
        left: "0",
        top: "0",
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      });
    }
    study.hidden = inSettings;
    page.hidden = !inSettings;
    backButton.hidden = !inSettings;
    settingsButton.setAttribute("aria-expanded", String(inSettings));
    document.title = inSettings ? "Settings · 复习" : "复习";
    updateHeaderHeight();
    if (inSettings) {
      window.scrollTo(0, 0);
      (navigation === "gear" ? settingsButton : el("settings-title")).focus({ preventScroll: true });
    } else {
      onReturn();
      window.scrollTo(0, studyScroll);
      settingsButton.focus({ preventScroll: true });
    }
    if (!bounds) return;

    // Fixed positioning starts inside the scrollbar gutters on some browsers.
    const pinned = outgoing.getBoundingClientRect();
    outgoing.style.left = `${bounds.left - pinned.left}px`;
    outgoing.style.top = `${bounds.top - pinned.top}px`;
    finishReveal = paintElement(settingsButton, incoming, () => {
      finishReveal = undefined;
      outgoing.removeAttribute("data-reveal-outgoing");
      outgoing.style.cssText = outgoingStyle;
      outgoing.inert = false;
    }, "viewport");
  }
  function closeSettings() {
    if (returningToStudy) return;
    if (history.state?.fromStudy) {
      returningToStudy = true;
      history.back();
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      showPage("history");
    }
  }
  settingsButton.onclick = () => {
    if (location.hash === "#settings") closeSettings();
    else {
      history.pushState({ fromStudy: true }, "", "#settings");
      showPage("gear");
    }
  };
  backButton.onclick = closeSettings;
  window.addEventListener("hashchange", () => {
    returningToStudy = false;
    showPage("history");
  });
  window.addEventListener("resize", finishPaints);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) finishPaints();
  });

  function clearToast() {
    toast.hidden = true;
    toast.hidePopover?.();
    window.clearTimeout(toastTimer);
    status.textContent = "";
  }
  function scheduleDismissal() {
    window.clearTimeout(toastTimer);
    if (!toast.hidden && toast.dataset.saved === "true" && document.activeElement !== dismiss) {
      toastTimer = window.setTimeout(clearToast, 4000);
    }
  }
  dismiss.onfocus = () => window.clearTimeout(toastTimer);
  dismiss.onblur = scheduleDismissal;
  dismiss.onclick = () => {
    if (document.activeElement === dismiss) saveTrigger.focus({ preventScroll: true });
    clearToast();
  };
  function reportSave(saved: boolean, trigger: HTMLElement, confirmation = "Saved in this browser.") {
    const message = saved
      ? confirmation
      : "Browser storage is unavailable. This change applies for this visit.";
    saveTrigger = trigger;
    const markup = learningText(message);
    status.innerHTML = markup;
    el("settings-toast-message").innerHTML = markup;
    toast.dataset.saved = String(saved);
    if (toast.hidden) {
      toast.hidden = false;
      toast.showPopover?.();
    }
    scheduleDismissal();
  }
  function applyFont(value: HanFont) {
    document.documentElement.dataset.hanFont = value;
    fontControl.value = value;
  }
  function paintFontPreview(value: HanFont) {
    // If a face is still loading, the previous sample is the one the learner can see.
    const displayed = previewText.hasAttribute("data-circular-paint")
      ? previewText : previewText.nextElementSibling ?? previewText;
    const previousFamily = getComputedStyle(displayed).fontFamily;
    finishFontPaint?.();
    applyFont(value);
    if (reducedMotion.matches) return;

    const { fontFamily, fontSize } = getComputedStyle(previewText);
    if (fontFamily === previousFamily) return;
    const previous = document.createElement("p");
    const sample = previewText.textContent ?? "";
    previous.textContent = sample;
    previous.lang = previewText.lang;
    previous.setAttribute("aria-hidden", "true");
    previous.style.fontFamily = previousFamily;
    previewText.after(previous);

    let cancelPaint: (() => void) | undefined;
    const finish = () => {
      previous.remove();
      finishFontPaint = undefined;
    };
    finishFontPaint = () => {
      if (cancelPaint) cancelPaint();
      else finish();
    };
    const reveal = () => {
      if (previous.isConnected) cancelPaint = paintElement(fontControl, previewText, finish, preview);
    };
    const face = `${fontSize} ${fontFamily}`;
    void document.fonts.load(face, sample).then(reveal, () => {
      if (previous.isConnected) finish();
    });
  }
  fontControl.onchange = () => {
    const value = fontControl.value === "song" ? "song" : "hei";
    const name = fontControl.selectedOptions[0]!.textContent;
    paintFontPreview(value);
    reportSave(saveHanFont(value), fontControl, `Chinese font set to ${name}. Saved in this browser.`);
  };

  function theme() {
    const dark = preference ? preference === "dark" : systemTheme.matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeButton.textContent = dark ? "☼" : "☾";
    themeButton.ariaLabel = themeButton.title = dark
      ? "Switch to light mode"
      : "Switch to dark mode";
  }
  themeButton.onclick = () => {
    finishPaints();
    const root = document.documentElement;
    preference = (preference ?? root.dataset.theme) === "dark" ? "light" : "dark";
    reportSave(saveTheme(preference), themeButton);
    paintDocument(themeButton, theme);
  };
  systemTheme.addEventListener("change", theme);

  window.addEventListener("storage", event => {
    if (event.key === null || event.key === hanFontKey) {
      finishFontPaint?.();
      applyFont(readHanFont());
    }
    if (event.key === null || event.key === themeKey) {
      preference = readTheme();
      theme();
    }
  });
  applyFont(readHanFont());
  theme();
  showPage();
}
