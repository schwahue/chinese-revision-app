# Chinese Revision · HSK Level 3 reading pilot

> Archived design · 21 November 2026. For current behaviour, see the [living pilot specification](../../../specification.md).

**Author** Henry · **Status** Draft for review · **Date** 21 November 2026

## Overview

Open the app, read a short sentence, and tap any word to see its pinyin and meaning together. **Next** advances when the learner is ready. The app remembers where they stopped and chooses when to revisit a word. The pilot runs entirely in the browser on GitHub Pages.

| Screen | What the learner sees and does |
|---|---|
| [Reading](reading.png) | One sentence, one highlighted target, an optional inline definition and **Next**. The next reachable milestone appears in quiet text. |
| [Word Bank](bank.png) | Browse the preset bank starting at Level 3. Open a word without changing its review schedule. |
| [Word detail](detail.png) | Read the word, a natural usage phrase and, where applicable, a measure-word phrase on one line. Labels accompany the jade, blue and amber colours. **Practise** opens a sentence using that word. |
| [Milestones](celebration.png) | Ten distinct words meet the daily goal. Fifteen and thirty are optional celebrations. **Continue** returns to reading while another target is available. |

Use the [abstract 复习 mark](../../../logo.png) beside the title. A moon or sun button switches themes. The [accompanying UI and UX draft](specification.md) defines keyboard behaviour, large-text layout, reduced-motion confetti and the automatic spacing rules.

## The problem

Recognising a Chinese word in isolation and reading it in an unfamiliar sentence are different tasks. The learner wants to practise the second and look up the first without losing their place. Asking for a confidence rating or a review date after each sentence interrupts that task. Automatic spacing leaves the learner one routine decision: when to move on.

## Goals

- **Prepare a usable pilot bank.** Include at least 31 distinct practice targets verified against the HSK 3.0 Level 3 vocabulary syllabus, with two checked sentences per target (at least 62 target–sentence examples). Supporting lookup entries are additional. Each target has a natural usage phrase and each countable noun has a suitable measure-word example.
- **Support short visits.** A learner can stop after any sentence or lookup. Returning in the same browser restores the unfinished sentence. Only advancing credits the target; reading the same target twice in a day earns one daily credit.
- **Make every milestone reachable in one local day.** Across any number of visits, the 10th, 15th and 30th distinct targets each trigger one celebration. With reduced motion, decoration stays static. A left sidebar stack aligned with the target word fills one slice per distinct word. Pale slices extend to the next milestone and stop at 30.
- **Preserve the next day's learning.** At local midnight the daily count and celebrations reset. The unfinished sentence, spacing history and theme persist.
- **Test reading as well as counting.** On a later visit, offer a different example of a previously encountered word. In the pilot, observe whether the learner recognises it in context and whether stopping at ten feels complete.

**Acceptance walkthrough.** Begin with 31 eligible targets. Advance 10 distinct words → daily goal met. Continue for 5 more → milestone 15. Continue for 15 more → milestone 30. Select **Continue** → the 31st word is available. Advance it and refresh → 31 distinct words remain credited and the app does not replay confetti.

## Non-goals

Exam grading, pronunciation scoring, a complete HSK course and cross-device accounts fall outside the pilot. Opening a definition is a scheduling signal. A word count records exposure; vocabulary mastery requires separate evidence.
