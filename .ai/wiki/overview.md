# Chinese Revision

Updated 2026-11-21

## Purpose

Chinese Revision helps a learner practise Chinese vocabulary in a browser using HSK sentence prompts and words collected from class. The current product and interaction requirements are in `specification.md` and `docs/design-spec.md`. Earlier design material is under `docs/archive/2026-11-21/`.

## How the parts fit

- The [Word Bank](learning/word-bank.md) defines the entries available to practise and lets the learner maintain a personal list. Catalogue data and tokenised practice sentences ship with the app.
- [Review and daily progress](learning/review-and-daily-progress.md) explains which entry appears next, how help affects its due date and when the learner earns a bamboo segment.
- [Browser persistence](platform/browser-persistence.md) explains how the current prompt, personal list and daily count survive a reload and how the app handles unavailable storage.

The browser UI starts in `src/main.ts`. Content and scheduling checks live under `tests/`, and browser interaction scenarios live under `tests/browser/`.
