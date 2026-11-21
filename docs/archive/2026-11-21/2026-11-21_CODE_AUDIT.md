# Chinese Revision code audit · 21 November 2026

**Status: all ten findings addressed in the local build.** The original findings and pre-fix measurements follow the resolution table.

| Findings | Resolution | Evidence |
|---|---|---|
| 1–3, 6, 8 | One storage module serializes progress writes against the latest prompt. A separate theme key preserves open entries. Clears invalidate old prompt IDs. Damaged saves can recover and existing valid saves migrate. | [Storage](../../../src/storage.ts) · [Two-tab and recovery tests](../../../tests/browser/progress.spec.ts) |
| 4–5 | Keyboard selection focuses the chosen definition. Returning from its entry restores focus. Same-word Practise preserves the pending lookup and next-day interval. | [Screen handlers](../../../src/main.ts) · [Scheduler](../../../src/review.ts) · [Browser tests](../../../tests/browser/progress.spec.ts) |
| 7 | The Pages workflow runs the browser suite against the production build before publication. | [Workflow](../../../.github/workflows/pages.yml) |
| 9 | The 64 × 64 PNG favicon is 3,441 bytes, a reduction of 499,151 bytes per uncached request. | [Built icon source](../../../public/favicon.png) |
| 10 | Milestone copy uses the next threshold in the shared list. The last tier omits the remaining-count note. | [Celebration renderer](../../../src/main.ts) |

Local verification passed the production build, seven unit tests and twelve browser regressions. The Chrome suite passed twice, including simultaneous Next actions and intentionally delayed storage notifications. Hosted Pages publication was outside this verification.

## Original audit

What this repo does: 复习 is a static Chinese reading app. It serves 32 automatic review targets and a 100-entry Word Bank, with progress stored in the learner’s browser. This audit assumes one learner per browser profile, sometimes using two tabs, and up to 100 distinct credits in a day.

## Must fix

1. **A stale tab can erase a completed review.** [Save](../../../src/main.ts) · [Storage listener](../../../src/main.ts)
   - **What this is:** Each view holds a copy of progress. Changing the theme writes that whole copy too.
   - **Problem:** In two same-origin views, Next changed the credits from 借 to 借 and 复习. A theme write from the older view immediately removed 复习. This was a forced overlap, so it establishes the defect, not its frequency.
   - **Fix:** Store the theme independently. Serialize progress mutations across tabs, read the latest progress inside that operation, and verify the displayed prompt before crediting it. Test two concurrent Next actions as well as Next plus a theme change.
   - **If we skip it:** A learner can lose credit, review history and their place in a sentence.

2. **A cleared history can come back.** [Storage listener](../../../src/main.ts)
   - **What this is:** The listener responds to changes to the app’s named storage key.
   - **Problem:** Clear local storage in tab B, then toggle the theme in tab A → previously cleared history reappears. A whole-storage clear sends an event with a null key, which the listener ignores.
   - **Fix:** Handle both whole-storage clears and removal of the app key. Invalidate the in-memory copy before it can be saved again. Include a two-tab clear-and-reload regression check with the fix for finding 1.
   - **If we skip it:** The app can undo the learner’s decision to erase progress.

3. **A damaged save can prevent every later visit from saving.** [Loader](../../../src/main.ts)
   - **What this is:** The loader handles both unreadable storage and invalid saved data.
   - **Problem:** Put malformed JSON in the app’s key, open Review, advance, then reload → 借 starts again. The app reports memory-only mode and leaves the invalid record in place, even when storage is writable.
   - **Fix:** Distinguish a storage access error from a decoding error. Recover valid fields where possible and preserve the bad record separately before replacing it with a valid save. Test a second reload.
   - **If we skip it:** Affected learners repeatedly lose the progress made during each visit.

4. **Keyboard selection can open the wrong word.** [Reading handlers](../../../src/main.ts)
   - **What this is:** Sentence tokens share one definition button after the sentence.
   - **Problem:** Focus 借, press Enter, tab to the definition and press Enter → the entry for 书 opens. Each token crossed by Tab replaces the shared definition.
   - **Fix:** When the learner explicitly selects a token with the keyboard, move focus to its definition. Test a middle token, opening the entry, and returning to the original definition.
   - **If we skip it:** Learners using a keyboard cannot reliably look up their selected word.

5. **Practise forgets a lookup on the current word.** [Practise](../../../src/main.ts) · [Scheduling](../../../src/review.ts)
   - **What this is:** Looking up a target should bring its next review forward to tomorrow.
   - **Problem:** On 21 November, open the definition of 借, choose Practise, then Next → the same prompt’s lookup flag resets, and the word is due on 24 November instead of 22 November.
   - **Fix:** Reuse the pending prompt when practising the same word. Only initialize a fresh prompt when switching words or starting without one. Test this through the entry screen.
   - **If we skip it:** The app treats an assisted encounter as independent reading.

6. **Another tab’s theme change closes an open entry.** [Storage listener](../../../src/main.ts)
   - **What this is:** The same event handler reloads progress, applies a theme and changes screens.
   - **Problem:** Open 地图 in tab A and change theme in tab B → tab A jumps to Review.
   - **Fix:** Apply a theme-only change in place. Refresh the current prompt only when the incoming progress actually invalidates it. Verify an expanded character guide survives a remote theme change.
   - **If we skip it:** Learners can lose their place while reading an entry or following stroke order.

## Should fix

7. **Browser interactions are outside the committed test suite.** [Tests](../../../tests) · [Pages workflow](../../../.github/workflows/pages.yml)
   - **What this is:** The seven tests check bundled content, the scheduler and progress-stack markup. The publishing workflow runs those tests and builds the site.
   - **Problem:** All seven passed on the same build that reproduced findings 1–6. For example, the scheduler test sets the lookup flag directly, bypassing the Practise handler that clears it.
   - **Fix:** Keep the fast unit tests. Add a browser regression file covering the failures above, using isolated storage and two same-origin views for conflicting writes. Run it before publishing.
   - **If we skip it:** A future green build can ship the same defects again.

8. **Storage and navigation share too much responsibility.** [Prepare](../../../src/main.ts) · [Storage listener](../../../src/main.ts) · [Scheduler](../../../src/review.ts)
   - **What this is:** Prompt preparation and the storage listener both roll over the date and choose a prompt. The listener also decides which screen the learner sees.
   - **Problem:** A preference change enters the same path as an invalidated prompt. The duplicate preparation paths already behave differently when the learner is viewing an entry.
   - **Fix:** As part of findings 1 and 6, give shared progress loading, validation and writes one owner. Reuse one prompt-preparation routine and leave screen selection in the UI. Keep the scheduler pure. The evidence supports this specific split; the length of the entry file alone does not justify moving every screen.
   - **If we skip it:** Each change to resume, refresh or date rollover has two paths to reconcile.

## Nice to have

9. **The tab icon costs ten times as many bytes as the JavaScript and CSS combined.** [Favicon reference](../../../index.html)
   - **What this is:** The browser uses the 1,254-pixel source PNG as its tab icon.
   - **Problem:** The production icon is 502,592 bytes. The built JavaScript and CSS total 50,228 bytes before compression.
   - **Fix:** Reference a 64-pixel PNG for the icon. A temporary resize of the existing artwork measured 3,441 bytes, saving 499,151 bytes per uncached icon fetch.
   - **If we skip it:** First-time visitors who fetch the icon pay for an image much larger than its display size. The measurement is file size; network latency was not benchmarked.

10. **A milestone fallback cannot be reached.** [Remaining count](../../../src/main.ts) · [Only caller](../../../src/main.ts)
    - **What this is:** The helper calculates the next milestone and includes a message for having no next milestone.
    - **Problem:** The only caller runs below tier 30, at 10 or 15. Both have a successor in the shared milestone list and the pilot requires at least 31 targets. At 30 the caller omits the note entirely.
    - **Fix:** Remove the target-count filter and unreachable fallback. Derive the next threshold from the shared milestone list for the two displayed tiers. Keep the existing milestone wording.
    - **If we skip it:** A future copy edit to the fallback will appear to work in source and never show up in the app.

## Verification and scope

Read the active specs, build and deploy configuration, dependency manifest and lockfile, application entry points, scheduler, persistence, screen handlers, writing guide, styles, stack and both test files. Inspected the data shape and counted all bank entries and character records. Archived designs are historical evidence, outside the active product contract.

The local TypeScript check, Vite production build and all seven tests passed. Isolated Chrome sessions exercised the six defects, pagination, writing-guide request failure and recovery, all three celebration previews and the stack at 100 credits. Replaying a preview preserved the saved study record. The 100-slice stack occupied a 132-pixel viewport with 290 pixels of scrollable content.

The dataset has 32 scheduling candidates, eight rendered bank entries per page and at most 15 strokes in a character. The 227,699-byte writing dataset loads on demand and is reused after a successful request. The app has no runtime package dependencies. These bounds support keeping the existing scheduler and static architecture; list virtualization, an index service and a UI framework have no demonstrated benefit at this load.

The HTML renderers use bundled vocabulary and handwriting data. The current audit assumes those assets ship with the app. Importing learner-supplied content would change that trust boundary.

**Verdict:** Fix persistence first, then the keyboard and scheduling paths. Ship the smaller icon independently. Make the storage boundary clearer as part of the correctness fixes.

**Lean:** −1 line, −0 dependencies possible from the unreachable fallback alone. The storage split is a correctness improvement and carries no line-saving estimate.

**Not checked:** Live GitHub Pages publication, hosted performance on slow devices, Safari or Firefox, dependency advisories, and linguistic accuracy of each entry. Local verification used Node 26.6.0; the publishing workflow targets Node 24.
