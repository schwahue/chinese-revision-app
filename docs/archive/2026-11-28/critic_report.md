# Review of offline sync rules and release scope

| ID | Reviewer | Finding and action |
| --- | --- | --- |
| D1 | Design | Preserve link boundaries when folding reviews into the schedule. Test late arrivals before and after a link. Blindly replaying under the destination ID changes existing behavior. |
| D2 | Design | Make first import atomic. Two devices may both observe an empty cloud account. The second device needs a recoverable choice if its aggregate history overlaps. |
| D3 | Design | Resolve independently created IDs for the same custom reading and preserve its two genuine visits. |
| D4, T1 | Design, structure | Specify a representative busy learner, measure reconnect time, bound replay work and define how an old device recovers. Expiring receipts without a recovery rule can double-count old retries. |
| D5 | Design | An old build can drop a new catalogue ID during validation. Preserve unfamiliar remote records or hold the last confirmed revision until the app can read them. |
| T2 | Structure | Collect open product and architecture choices in one place, including the first connection of two occupied stores. Local links and document structure checked. |
| S1 | Style | The local HSK continuation choice survives a reload and expires at daily rollover. The phrase “current session” gives the wrong lifetime. |
| S2 | Style | Distinguish being signed in from having network access. Mark the proposed cloud behavior as a design. |
| S3 | Style | Give each acceptance case an observable result, especially crossing midnight, opening uncached guides, removal during review and switching accounts. |
