# Chinese revision browser client

## Overview

The browser entry point assembles daily review, personal word capture, catalogue browsing and milestone screens. The scheduler works with word IDs. The vocabulary and presentation modules resolve those IDs into the Hanzi, pinyin and sentences a learner sees.

## Interface

| Module | Contract |
| --- | --- |
| [main.ts](./main.ts) | Initializes the document. `syncProgress` applies an edit, chooses the next prompt when needed and refreshes the active screen. |
| [reviewScreen.ts](./reviewScreen.ts) | Shares the review frame and Next control between sentence and custom-word prompts. Returns alignment and cleanup hooks for sentence lookup. |
| [bankScreen.ts](./bankScreen.ts) | Owns the current collection, filter, page and capture controls. Delegates rendering to the list or capture form. |
| [wordDetailScreen.ts](./wordDetailScreen.ts), [milestoneScreen.ts](./milestoneScreen.ts) | Render word details and celebrations respectively. Earned milestones and preview use the same celebration markup. |
| [settings.ts](./settings.ts), [circularPaint.ts](./circularPaint.ts) | Manage settings navigation and preferences, and paint theme, scene and font transitions. |
| [wordHighlight.ts](./wordHighlight.ts), [motion.ts](./motion.ts) | Move the shared highlight from its displayed position and expose the live reduced-motion preference. Each screen owns its interaction and animation frames. |
| [characterAssetPath.ts](./characterAssetPath.ts) | Supplies the relative character JSON path to both Vite and the writing guide. |
| [style.css](./style.css) | Imports foundations, shell, shared components, feature styles and visibility utilities from [styles](./styles/). |
| [wordList.ts](./wordList.ts) | Renders Personal and HSK collections with the same word rows, page controls, focus handling and motion. |
| [vocabulary.ts](./vocabulary.ts) | Exposes `bank`, `targets`, `reviewPool`, `label`, `sentenceText` and `examples`. Uses [words.json](./words.json) for entries and [practice-sentences.json](./practice-sentences.json) for additional tokenized contexts. |
| [review.ts](./review.ts) | Defines `Progress`, `Prompt` and `CustomWord`. `fresh` initializes progress. `choose` and `nextPersonal` select a word. `start`, `advance`, `rollover` and `removePersonal` mutate the supplied state. |
| [personalWords.ts](./personalWords.ts) | `searchCatalogue` and `catalogueMatches` locate entries. `addPersonal`, `saveCustom` and `linkCustom` manage membership and custom entries. [personalBank.ts](./personalBank.ts) provides the capture form through `wordCapture` and updates its results through `refreshSearchMembership`. |
| [storage.ts](./storage.ts) | `progressStore(bank, examples, warn)` returns an asynchronous update function that accepts an edit callback and returns the resulting progress. `readTheme` / `saveTheme` and `readHanFont` / `saveHanFont` handle appearance preferences. |
| [progressStack.ts](./progressStack.ts), [writingGuide.ts](./writingGuide.ts) | `progressStack` renders daily credit and milestone markup. `writingGuide` creates expandable character panels, and `enableWritingGuides` attaches their load handlers. |
| [learningText.ts](./learningText.ts), [text.ts](./text.ts) | `learningText` escapes text and marks Hanzi and tone-marked pinyin with language tags. `escapeText` escapes text for HTML interpolation. |

## Invariants

- `reviewPool` includes catalogue entries with a syllabus ID at a selected level. `fresh` selects level 3. When personal words exist and extra HSK practice is off, `syncProgress` selects only new or due personal words.
- `advance` awards at most one credit per word per local day. A target lookup sets the next review to tomorrow. Unassisted reviews follow intervals of 3, 7, 14 and 30 days. An early unassisted review retains its existing due date and step. Milestones occur at 10, 15 and 30 distinct words.
- `linkCustom` replaces the custom ID in membership and daily credit, deduplicates both, and combines the visit counts when both IDs have history. `completePrompt` checks the prompt ID before advancing, so a stale click cannot complete a newer prompt.

## Side Effects

- `progressStore` serializes persistent edits with a Web Lock and writes to browser local storage under `chinese-revision.v5`. It can migrate older saves and preserve the first damaged payload. If locking or storage fails, it calls `warn` and continues in memory for the visit. `saveTheme` writes to `chinese-revision.theme`.
- [main.ts](./main.ts) updates the DOM, listens for storage, focus and visibility changes, and schedules a local midnight check. Opening a catalogue entry starts a request for each distinct character in that word. The guide reuses these requests when its panels open. Closing and reopening a panel retries a failed request.
- [wordDetailScreen.ts](./wordDetailScreen.ts) selects audio for a catalogue entry opened from Word Bank by its syllabus ID and displayed pinyin. Playback starts on activation. [Vite](../vite.config.ts) supplies the available MP3 keys from the source index and emits a JSON file per character from the licensed stroke dataset.

## Verification

From the project root, run `npm test` for the catalogue, recordings, scheduler, personal words and progress stack. Run `npm run build` to type-check and bundle the app before running `npm run test:browser` against that build.

Target word looked up, then completed → its next review is due tomorrow and it earns one credit for that day.
