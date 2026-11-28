# Architecture review of offline sync

| ID | Finding | Evidence |
| --- | --- | --- |
| Z1 | Preserve separate review histories up to an explicit link. Flattening all events onto the destination ID changes the due date. | [Link](../../../src/personalWords.ts#L44), [advance](../../../src/review.ts#L99) |
| Z2 | Two disconnected devices can create different IDs for identical custom characters and normalized pinyin. Define convergence and credit before merging them. | [Custom word identity](../../../src/personalWords.ts#L70) |
| Z3 | Compare incremental downloads with reading a compact, versioned per-learner snapshot after changes. Retain individual uploads and server receipts. Measure the snapshot before adding pagination or another service. | [Proposed architecture](../../offline-sync.md#architecture-decision) |
| Z4 | IndexedDB writes need a way to tell another open tab to refresh. The existing handler listens for localStorage changes. | [Current listener](../../../src/main.ts#L672), [two-tab tests](../../../tests/browser/progress.spec.ts) |
| Z5 | Reuse the persisted prompt ID for completed reviews, scoped to a learner. Different devices completing different prompts get distinct IDs. | [Prompt generation](../../../src/review.ts#L65) |
