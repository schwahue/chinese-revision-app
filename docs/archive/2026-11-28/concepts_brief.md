# Hear the selected HSK word

**Author** Henry
**Date** 2026-11-28

## Overview

A learner who sees 还 in the Word Bank can use its meaning and pinyin to tell which entry they opened. The speaker beside that pinyin should let them hear the same distinction. Open “still, also” and tap to hear *hái*. Open “to give back” and tap to hear *huán*. Saving either entry to Personal should preserve its pronunciation.

## Analysis

The catalogue already supplies the identity that playback needs. Its 1,000 records have 1,000 distinct syllabus IDs. Both Word Bank collections pass the selected record’s key to the same detail screen. Looking up audio by the character shown on screen would lose information that the app already has. Six headwords have multiple readings across separate entries: 还, 只, 长, 地, 得 and 过. [Catalogue](../../../src/words.json) · [Word labels](../../../src/vocabulary.ts) · [Word Bank detail](../../../src/main.ts)

| What the learner opens | Selected catalogue record | What the speaker should play |
| --- | --- | --- |
| HSK 1 · 还 · still, also | `还`, ID 67 | *hái* |
| HSK 3 · 还 · to give back | `还#678`, ID 678 | *huán* |
| Personal · saved 还 · to give back | The same ID 678 | The same *huán* |
| HSK 1 · 谁 · who | `谁`, ID 181, shown as *shéi/shuí* | Play *shéi*, pause briefly, then play *shuí*. Label the control “Play both readings”. |

**The open feasibility question is the audio source.** A browser test can prove that tapping the second 还 requests ID 678, even if its file contains a recording of *hái*. A Mandarin speaker needs to listen to the samples against the catalogue. The existing Personal test already selects *huán* and checks the saved key. It can serve as the starting point for a playback check. [Existing selection test](../../../tests/browser/personal-words.spec.ts)

## Goals vs. Non-Goals

- **Included.** Learner-initiated Mandarin audio for the headword on the HSK detail page reached from either Word Bank collection. One keyboard-operable speaker button sits beside the pinyin. Give it a name such as “Play pronunciation for 还, huán.” For 谁, place “Play both readings” beside the control so its behavior is apparent before the tap.
- **Outside this concept.** Previously saved custom words, including migrated custom entries. The list, Review, practice sentences, usage examples and measure-word rows have no new playback requirement. Membership, review scheduling and credit keep their existing behavior. [Custom-word handling](../../../src/main.ts) · [Migration cases](../../../tests/browser/catalogue-migration.spec.ts)

## Alternatives Weighed

| Option | Assessment |
| --- | --- |
| Play a verified recording for each selected entry | Preferred delivery approach to pilot. A clip can be checked once and reused from HSK and Personal. The cost is sourcing, clearing and reviewing coverage for the catalogue. Fetch the selected clip on demand using the site’s relative asset paths. [Deployment](../../../README.md#github-pages) |
| Generate clips in advance from explicit readings | A candidate source for those same static files. For example, Google documents Mandarin synthesis with tone-number pinyin. Generation still needs a pronunciation check, review of redistribution terms and a way to regenerate a clip when the catalogue changes. [Mandarin phoneme input](https://docs.cloud.google.com/text-to-speech/docs/phonemes) |
| Synthesize on the learner’s device or through a service when tapped | Could reduce the recordings the project distributes. A glyph-only request gives the synthesizer identical input for both 还 entries. Consider live synthesis only if it can select the intended reading and pass listening checks on supported devices. A remote service also makes each uncached playback depend on its availability. |

## Key Decisions & Staging

1. **Keep selection tied to the exact record.** Use the existing key to find the HSK entry, then its syllabus ID to select the sound. Personal already stores that key. The shared detail screen knows whether the learner came from the Word Bank and handles custom words separately. Playback needs no change to saved progress.
2. **Listen to the three pilot entries.** Start with IDs 67 and 678 and have a listener identify each reading by ear before revealing the labels. For 谁, compare the agreed sequence with the printed pinyin and judge the pause. If this trial succeeds, test a multi-syllable word before choosing a source for the remaining catalogue.
3. **Check the learner’s path.** From both HSK details, activate the speaker by touch and keyboard. Save *huán* to Personal, reload, and check that it plays the same approved clip. Open a previously saved custom entry and check that it offers its existing actions. On a missing or unplayable clip, show “Pronunciation unavailable” beside the pinyin and allow another attempt. Repeated taps and moving to another entry should leave only the current sound audible.
4. **Release entries with verified human audio.** Show the speaker when the recording matches the entry’s ID and printed reading. Leave other entries silent for this release. Check bundled clips under the production site’s repository subpath, and recheck the affected audio whenever a reading changes. [Catalogue content checks](../../../tests/pronunciation.test.ts) · [Production build](../../../package.json)

## Listening trial

Listen to [sample A](../../../docs/listening-trial/sample-a.wav) and [sample B](../../../docs/listening-trial/sample-b.wav). Decide which is *hái* and which is *huán*. Then play [谁 · both readings](../../../docs/listening-trial/both-readings.wav) and judge whether the pause feels natural. The trial inserts 400 ms of silence between the readings. The combined clip lasts 1.70 seconds.

<details>
<summary>Reveal the two 还 readings after listening</summary>

Sample A is *huán*, “to give back” (ID 678). Sample B is *hái*, “still, also” (ID 67).

</details>

Chen Wang (王琛) recorded the four Mandarin syllables. The original recording credits name Wang Chen, Hugo Lopez and Nicolas Vion, © 2013. The trial uses the Audio-cmn 64k recordings, trims room tone, applies short edge fades and exports mono WAV files. The 谁 sample joins two recordings. These adaptations use the same CC BY-SA 3.0 license as the source files. [Source recordings and credits](https://github.com/hugolpz/audio-cmn/tree/master/64k/syllabs) · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

File checks confirmed the playback order and silence duration. In the listening trial, the listener identified A as *huán* and B as *hái* and found the 400 ms pause between *shéi* and *shuí* about right. The listener initially found a synthesized 学习 sample natural, then rejected the broader voice trial as too fast and unnatural. The app now uses human recordings, including Yue Tan’s whole-word take of 学习. [Audio preparation](../../../docs/pronunciation.md)

## Reviewer Status

| Reviewer | Status | Contribution |
| --- | --- | --- |
| Design | Completed | Source availability, coverage and the cost of checking 1,000 entries |
| Codebase details | Completed | Exact-key selection and how to distinguish playback failure from a wrong reading |
| Zoom out | Completed | Compare a small listening sample before committing to a catalogue-wide source |
| Comprehension | Completed | Accessible button placement, audible acceptance criteria and retry feedback |
| Implementation readiness | Completed | Saved Personal and migrated custom entries, relative deployment paths and rollback |
| Structural | Completed | One shared control and repeatable coverage checks as the catalogue changes |
