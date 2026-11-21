# Review and daily progress

Updated 2026-11-21

## Purpose

Review schedules the next encounter with each vocabulary entry. The bamboo display counts distinct entries completed on the learner’s local calendar day.

## Which word comes next

An existing prompt resumes first. A [personal list](word-bank.md) draws from due and unseen members, with overdue entries first. When caught up, the learner can select **Keep practising HSK** for the rest of the day. With an empty personal list, Review draws directly from the selected HSK levels, initially Level 3. The HSK pool orders due entries before unseen entries, then allows early practice of previously reviewed entries. Automatic selection excludes entries already credited today. See `src/main.ts`, `src/review.ts` and `src/vocabulary.ts`.

## What counts as help

Activating the target word in a sentence records a lookup. Hovering or focusing to preview a gloss, or looking up a different word, leaves the target’s lookup flag alone. For a custom word, selecting **Show pinyin** records a lookup. **Next** completes the encounter. Help schedules the entry for tomorrow. An unassisted due or first encounter advances through intervals of 3, 7, 14 and 30 days, while early unassisted practice preserves the existing step and due date. See `src/main.ts` and `src/review.ts`.

## Reading the bamboo

The first completion of an entry each day earns one segment, including when the learner used help. Personal and HSK practice share the count. Each stalk fills upward from its base in groups of five, two stalks per row. New rows appear above earlier rows. Shadows show the remaining segments to the next milestone. The celebrations occur at 10, 15 and 30 distinct entries. At local day rollover the daily credits and extra HSK choice reset. Review history remains in [browser storage](../platform/browser-persistence.md). See `src/progressStack.ts`, `src/style.css` and `src/review.ts`.
