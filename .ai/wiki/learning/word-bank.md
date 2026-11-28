# Word Bank

Updated 2026-11-29

## Purpose

The Word Bank lets learners browse the bundled vocabulary and collect words for [personal review](review-and-daily-progress.md). The collection picker opens on Personal. Catalogue browsing offers All HSK and individual levels, with eight entries per page. Browsing a level leaves the saved review levels unchanged. [Collection controls](../../../src/bankScreen.ts) · [Pagination](../../../src/wordList.ts)

## Catalogue identity

All HSK lists 1,000 numbered entries across 125 pages. Levels 1, 2 and 3 contain 300, 200 and 500 entries respectively. Automatic HSK review draws from the saved levels. Entries can display the same Chinese characters while retaining different readings or senses and separate histories. A sentence token such as `还#678` selects a specific entry and displays as 还. [Catalogue and sentence lookup](../../../src/vocabulary.ts)

## Pronunciation

The Word Bank detail screen resolves pronunciation from the selected HSK entry. The speaker appears for entries with a matched human recording. The listener-tested recordings cover both 还 entries and 谁. Saved catalogue entries use the same clips in Personal. [Audio preparation](../../../docs/pronunciation.md)

## Personal words

**Add word** searches the catalogue by pinyin prefix or exact Chinese headword. Saving a catalogue entry adds its existing ID to Personal, which keeps sentence practice and history shared across collections. Previously saved custom entries can still be edited and reviewed as word-only prompts. When an edit links a custom word to a catalogue entry, the app merges visits, deduplicates daily credits and carries over the appropriate schedule. Removing personal membership preserves review history. See `src/personalBank.ts`, `src/personalWords.ts` and `src/review.ts`.

The [browser save](../platform/browser-persistence.md) holds both personal membership and custom entries.
