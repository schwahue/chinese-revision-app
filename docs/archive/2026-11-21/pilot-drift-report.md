# Pilot specification drift · 21 November 2026

This historical report covers the pilot before the full vocabulary expansion. See the [current product scope](../../../specification.md#product-scope) for the expanded bank and Daily Review behaviour.

| Area | Reconciled behaviour |
|---|---|
| Word Bank | Numbered pages, eight entries per page, filter reset and focus restoration. |
| Writing guide | One disclosure per distinct character, active-stroke colour, cached data and retry on reopen. |
| Keyboard lookup | Explicit selection focuses the matching definition. Back from detail restores it when the prompt is still current. |
| Practise | Returning to the current word retains its example and lookup flag, so an assisted encounter is due tomorrow. |
| Progress | Tabs serialize writes, reject stale prompt actions and respect clears. Valid legacy data is retained and damaged records can recover. |
| Theme | The preference is independent of progress and updates open views in place. |
| Delivery | The Pages workflow runs browser regressions on the production build before publication. |

The [audit](2026-11-21_CODE_AUDIT.md) preserves the original reproductions. The [browser regressions](../../../tests/browser/progress.spec.ts) exercise the repaired interactions.

# Pre-fix comparison · 21 November 2026

This pass compares the active pilot documents against the local source. The files in [the design archive](.) and the earlier audit record historical decisions and measurements.

## README.md

No drift detected.

## specification.md

- Cross-tab preservation has a release-boundary exception. In a local check, a tab whose vocabulary lacked 图书馆 read a valid newer save containing this word. It dropped the credit, history and unfinished prompt, then wrote the filtered record back under the shared lock. The damaged-record backup can capture the first incident, but does not restore the active record. [Restore and shared write](../../../src/storage.ts)
- The damaged-save rule promises repair and a backup. A local check using the production storage function found that an otherwise valid save with a due date of `2026-13-40` keeps that impossible date and creates no backup. The validator checks the string pattern but accepts impossible months and days. The scheduler then compares the invalid date with real due dates. [Validation](../../../src/storage.ts) · [Scheduling by due date](../../../src/review.ts)

## docs/design-spec.md

- The guide calls for language tags on Chinese and pinyin. Chinese embedded in English memory cues and character facts inherits the page’s English language. For example, the radical text for 借 renders as the single English-language string “亻 · person”. A screen reader receives no language switch for 亻. [Entry rendering](../../../src/main.ts) · [Character facts](../../../src/writingGuide.ts) · [Page language](../../../index.html)

## Resolution · 21 November 2026

The [active specification](../../../specification.md) now describes v1 migration, reset behaviour, calendar validation and sentence-based resume. The [design spec](../../design-spec.md) covers language changes inside English notes and character facts. The local production build passed all 9 unit tests and 20 Chrome browser tests, including the [recovery and rendered-language regressions](../../../tests/browser/progress.spec.ts). The cross-version check models an old tab writing its v1 payload from a second same-origin page.

# Current comparison · 21 November 2026

All five findings from the Review simplification audit are resolved. The subsequent midnight milestone finding is also resolved.

## docs/design-spec.md

- **Resolved — keyboard focus.** The guide specifies that entering Word Bank by keyboard focuses its filter. [Screen hierarchy](../../design-spec.md#screen-hierarchy) · [Chrome regression](../../../tests/browser/progress.spec.ts)
- **Resolved — word entry width.** The guide specifies full width for entries without side examples. The phone-width regression checks 阿姨. [Screen hierarchy](../../design-spec.md#screen-hierarchy) · [Word detail layout](../../../src/style.css)
- **Verified — Review word lookup.** Hovering over 这里 previews “here”; clicking the word with a mouse opens its full entry. With touch, tapping the word shows the definition, tapping it again dismisses it, and tapping the definition opens the entry. The desktop, emulated-touch and keyboard lookup regressions passed in Chrome. [Design rule](../../design-spec.md#interaction-and-motion) · [Desktop and keyboard tests](../../../tests/browser/progress.spec.ts) · [Touch test](../../../tests/browser/mobile-lookup.spec.ts)

## specification.md

- **Resolved — midnight credit.** Previously, waiting for the save lock moved both the visit and its due date forward one day. The Chrome regression presses **Next** on 借 at 23:59:59 on 21 November and releases the lock at 00:00:01 on 22 November. The saved visit is dated 21 November, due 24 November, and the new day starts with zero credits. [Acceptance rule](../../../specification.md#acceptance-checks) · [Scheduler](../../../src/review.ts) · [Browser regression](../../../tests/browser/progress.spec.ts)
- **Resolved — review levels and exhaustion.** The spec describes the Level 3 default, previously saved levels and the completion message shown when returning to an exhausted Review. [Daily Review pool](../../../specification.md#daily-review-pool) · [Browser regressions](../../../tests/browser/review-levels.spec.ts)
- **Resolved — Word Bank filters.** The browsing rules account for all five level filters and the four supporting entries, including 北京 under **All levels**. [Browsing rules](../../../specification.md#browsing) · [Catalogue](../../../src/words.json)
- **Resolved — milestone celebration after midnight.** Pressing **Next** before midnight and saving after rollover awards the press day’s threshold. The winning tab shows that date and its earned stack. Continue and reload show the current day’s progress. Two-tab Chrome regressions passed for 10, 15 and 30 words, including one visit for concurrent presses on the same prompt. [Celebration rule](../../../specification.md#progress-and-celebrations) · [Browser regressions](../../../tests/browser/progress.spec.ts)
