# Chinese Revision code audit · 21 November 2026 · follow-up

What this repo does: Chinese Revision serves Chinese reading prompts, definitions and character writing guides. One learner can use several tabs on the same origin. This review assumes the local expanded catalogue of 112 entries, 44 automatic targets and 88 authored sentences. The [earlier audit](2026-11-21_CODE_AUDIT.md) records the previous baseline and fixes.

## Resolution · 21 November 2026

Findings 1–3 are fixed in the local production build. Progress now has a separate v2 key with a one-time legacy import, history dates must be real calendar days, and pending encounters resume by their stored sentence. The [storage regressions](../../../tests/browser/progress.spec.ts) cover writes from the legacy key, reset, leap days and reordered or removed examples. Embedded Chinese and pinyin also have language tags. Local verification passed 9 unit and 20 Chrome browser tests.

## Original findings

### Must fix

1. **An older open tab can erase progress on newly added words.** [Restore](../../../src/storage.ts#L39) · [Writeback](../../../src/storage.ts#L89)
   - **What this is:** Tabs share one save key. An open tab keeps the word list from the build it loaded.
   - **Problem:** A focused check ran the real store with two catalogues and a shared storage backend. The newer catalogue saved a credit, history and pending prompt for a word absent from the older catalogue. One old-tab sync removed all three from the primary save. The lock prevents simultaneous writes but allows this sequential overwrite.
   - **Fix:** Before publishing the expanded catalogue, move the new build to a distinct save key with a one-time migration from the existing save. Keep clear/reset behaviour covered so an old record cannot resurrect deleted progress. A mixed-version regression should exercise old-tab sync after a new word earns credit.
   - **If we skip it:** Learners who leave an older tab open across the release can lose newly earned progress. A recovery backup can contain some data but the app does not automatically merge it back.

### Should fix

2. **A damaged due date can survive a successful review.** [Date validation](../../../src/storage.ts#L28) · [Scheduling](../../../src/review.ts#L62)
   - **What this is:** The save reader accepts any date-shaped string. The scheduler compares that string with today to decide whether a review is early.
   - **Problem:** In an isolated Chrome profile, a saved due date of `2026-99-99` for 借 survived reload without triggering recovery. Practising 借 unaided raised its visit count but preserved the impossible date.
   - **Fix:** Validate actual calendar dates during restoration. Route an invalid history entry through the existing damaged-record handling. Test an impossible month, February 30 and a valid leap day.
   - **If we skip it:** An affected word can stay out of the due queue even after the learner practises it.

3. **A content update can attach a pending lookup to a different sentence.** [Example resolution](../../../src/main.ts#L27) · [Saved prompt validation](../../../src/storage.ts#L54)
   - **What this is:** The saved prompt identifies its example by position. For supporting words, that position belongs to a list assembled from all authored sentences mentioning the word.
   - **Problem:** A focused restore check inserted a new sentence for 我 before a saved second example. Restore kept the prompt ID and its lookup flag but showed a different sentence. This demonstrates the failure mode when examples change order, rather than a count of affected learners.
   - **Fix:** Store the selected tokenised sentence alongside its index when creating new prompts. Resolve that sentence on restore. If it was removed, start a fresh prompt for the word with a fresh ID and lookup flag. Preserve index-based reads for legacy records.
   - **If we skip it:** Resuming after a curriculum edit can display a sentence the learner never saw while retaining the earlier encounter's lookup decision.

## Closed during this vocabulary update

4. **Different target words supplied the same practice sentence.** [Vocabulary](../../../src/words.json) · [Content test](../../../tests/review.test.ts#L16)
   - **What this is:** Supporting words borrow sentences from target entries.
   - **Problem:** Before the expansion, 短 and 课文 both supplied `这 篇 课文 很 短 。`. Supporting words in that sentence therefore rotated through duplicate material.
   - **Fix:** The edited bank has 88 distinct target sentences. A corpus-wide uniqueness assertion now checks this on every test run.
   - **If we skip it:** Per-target checks alone allow the same sentence to occupy several practice slots.

5. **Content tests could pass with an unpractisable Word Bank entry.** [Content test](../../../tests/review.test.ts#L16) · [Prompt creation](../../../src/review.ts#L45)
   - **What this is:** Every word in the bank has a Practise action. A supporting word needs at least one authored sentence containing its exact token.
   - **Problem:** The previous tests checked that words in sentences had entries. They missed the opposite case. Removing the last occurrence of a supporting word would pass those checks, then leave Practise with zero examples.
   - **Fix:** The new test checks reachability of every bank word. All 112 entries occur in the practice corpus.
   - **If we skip it:** A content edit could leave the review screen trying to split an undefined sentence.

6. **An incomplete phrase could leave a blank or undefined learning field.** [Word detail](../../../src/main.ts#L425) · [HSK 3 content checks](../../../tests/review.test.ts#L16)
   - **What this is:** Usage and measure-word examples each carry Chinese, English and pinyin.
   - **Problem:** The previous checks accepted a nonempty array such as `["借书"]`. The entry renderer indexes all three positions and would display “undefined” for the two absent fields.
   - **Fix:** The HSK 3 content check now requires exactly three nonempty strings in each supplied phrase.
   - **If we skip it:** JSON can remain valid while an entry visibly loses its pronunciation or translation.

## Organisation and performance

Keep scheduling, storage recovery, the bamboo stack and the writing guide in their existing modules. The ownership issue exposed by findings 1 and 3 is the relationship between persisted progress and the catalogue. A change to that relationship belongs at the save and example-resolution boundaries. Splitting every screen into a class would leave those bugs intact.

The bank renders eight rows per page. A local Node 26 check over 10,000 calls averaged approximately 0.006 ms to choose among 44 targets with populated histories and 0.021 ms to find sentences containing 我 in the 88-sentence corpus. These are algorithm timings on one machine. They exclude browser rendering and network time. Keep the straightforward scans at this size. The separately fetched writing dataset is reused across character expansions.

**Verdict at audit time:** Protect new vocabulary progress from older tabs before publishing. Keep the content checks that prevent duplicate and missing practice material.

**Not checked:** Hosted deployment, old and new releases coexisting in production, Safari, assistive technology, field performance and third-party package internals. The two-version and reordering checks exercised the actual store with controlled input. The due-date check used local Chrome. The eight local content, scheduler and stack tests passed.
