# Browser persistence

Updated 2026-11-21

## Purpose

The app keeps the [personal list](../learning/word-bank.md), selected review levels, active prompt, [daily credits and scheduling history](../learning/review-and-daily-progress.md) in the browser profile for this site. Clearing its site data resets that progress.

## Updates and recovery

`src/storage.ts` serialises progress edits across tabs with a Web Lock named after the local storage key, `chinese-revision.v5`. Each edit reads and validates the latest save before writing. `src/main.ts` reacts to storage events, and completing a prompt checks its ID so a stale tab cannot complete its replacement. The theme uses a separate key, `chinese-revision.theme`.

On first use, the store can import an earlier v1–v4 save. A migration marker prevents reimport after a later reset. The reader recovers valid fields and, under the lock, attempts to preserve the first damaged input in a separate local backup. If locking or durable storage is unavailable, the app warns the learner and keeps changes in memory for that visit. See `src/storage.ts` and `src/main.ts`.
