# Word Bank

Updated 2026-11-21

## Purpose

The Word Bank lets learners browse the bundled vocabulary and collect words for [personal review](review-and-daily-progress.md). The collection picker opens on Personal. Catalogue browsing offers All HSK and individual levels, with eight entries per page. Browsing a level leaves the saved review levels unchanged. See `src/main.ts`.

## Catalogue identity

The bundled bank contains 1,000 numbered HSK entries and four supporting entries. All HSK lists the entire bank. Automatic HSK review selects entries with a syllabus ID in the learner’s selected levels. Two entries can display the same Chinese characters while retaining different readings or senses and separate histories. Authored sentences identify words by exact token, including disambiguators such as `还#678`; learners see the headword 还. See `src/words.json`, `src/practice-sentences.json` and `src/vocabulary.ts`.

## Personal words

**Add word** searches the catalogue by pinyin prefix or exact Chinese headword. Saving a catalogue entry adds its existing ID to Personal, which keeps sentence practice and history shared across collections. A learner can also save a custom headword and pinyin reading for a word-only prompt. When an edit links a custom word to a catalogue entry, the app merges visits, deduplicates daily credits and carries over the appropriate schedule. Removing personal membership preserves review history. See `src/personalBank.ts`, `src/personalWords.ts` and `src/review.ts`.

The [browser save](../platform/browser-persistence.md) holds both personal membership and custom entries.
