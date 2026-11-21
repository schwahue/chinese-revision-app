# Design drift review · 21 November 2026

Comparison of the earlier drafts with the local pilot at the time of review. See the [current pilot specification](../../../specification.md) for subsequent changes.

## README.md

- The original test description covers content and scheduling only. The suite also tests earned and shadow slices, grouping and counts beyond 30. [Stack tests](../../../tests/progressStack.test.ts)
- The original overview omits the hidden preview URLs and the distinction between previewing a definition and recording a lookup. [Screen logic](../../../src/main.ts)

## concepts_brief.md

- The ten-word trial became 32 automatic targets and 64 authored examples. The app uses fixed tokenised examples and visit-based rotation. It does not select supporting words according to previous familiarity. [Bank](../../../src/words.json) · [Selection](../../../src/main.ts)
- Independent pronunciation and meaning reveals, learner-chosen retries, pronunciation self-assessment and separate recall records for words and phrases were superseded by one combined gloss and an automatic per-word schedule. The stored key is the Chinese word, with one lookup flag per prompt. [Review state](../../../src/review.ts)
- There is no per-session cap on new words or two-session trial flow. Daily credit and optional celebrations govern progress. [Daily selection](../../../src/review.ts)

## design_draft.md

- The overview and linked early designs present a header logo and a reading countdown. The current header is text-only with the mark as favicon. Reading uses a grouped sidebar with shadow slices. Numeric distance appears on the 10- and 15-word celebrations. [Shell](../../../index.html) · [Stack](../../../src/progressStack.ts)
- The draft treats opening a definition as a scheduling signal. Hover and focus show the definition without recording a lookup. Activating the target or opening its linked entry records the flag. [Reading handlers](../../../src/main.ts)
- The screen summary omits the travelling highlight, focus border, bilingual tier-specific effects and hidden replay mode. The grid of word-detail groups can also wrap. [Screens](../../../src/main.ts) · [Styles](../../../src/style.css)
- The draft describes the pilot as running on GitHub Pages. The workspace establishes a static build and manual publication workflow. Live publication was not verified. [Workflow](../../../.github/workflows/pages.yml)

## specification.md

- The archived reading and scheduling rules equate an opened gloss with a target lookup. The implemented flag distinguishes passive preview from explicit selection or entry activation. The entire gloss opens detail. The original interaction handoff also omits hover dismissal, the interruptible spring, the cross-line fade and the single active border. [Reading handlers](../../../src/main.ts) · [Styles](../../../src/style.css)
- The archived delivery model calls for stable example IDs and saved milestones already shown. Prompts use an example array index, and celebrations derive from newly credited word counts. Reordering examples can change the sentence restored for a saved index. [State and advancement](../../../src/review.ts)
- The archived content and progress wording does not make clear that automatic targets are a subset of the bank and manually practising a supporting entry can earn a daily slice. [Word Bank and Practise](../../../src/main.ts) · [Advance](../../../src/review.ts)
- “Show all levels” is specified as an empty-state action. The implementation builds the picker from populated levels and has no separate empty-state button. [Word Bank](../../../src/main.ts)
- The smaller-pack fallback is incomplete. Celebration countdown text checks target availability, but the sidebar chooses its next shadow threshold solely from the milestone list. The bundled 32-target pilot reaches all thresholds. [Stack](../../../src/progressStack.ts)
- The design omits the debug-only milestone routes, tier switching, sample stack, Replay and Back to review. Header visibility and the wrapped-line alignment fallback are implementation details absent from the handoff. [Shell](../../../index.html) · [Preview](../../../src/main.ts) · [Layout](../../../src/style.css)
- The document specifies a load-failure retry. The delivered shell displays a plain retry link during startup, without a distinct runtime error screen. [Startup markup](../../../index.html)
- Cross-tab storage updates and invalid saved-state handling are present in the implementation but absent from the archived persistence description. [Storage handlers](../../../src/main.ts)
