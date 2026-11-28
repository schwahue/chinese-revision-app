# Offline sync architecture review

**28 November 2026 · Design review of the [offline study draft](../../offline-sync.md).**

## Recommendation

Use **GitHub Pages, Vite and Supabase** for the first release. GitHub Pages can serve the existing static build. Supabase Auth identifies the learner, and Postgres can store and apply their study changes. Two browser features cover local needs: IndexedDB can commit a study action and its pending upload together, and a service worker can make the prepared app reopen offline. Neither requires another hosted service. Keep the public vocabulary, examples and writing guides in the Vite build. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) · [Service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) · [Supabase functions](https://supabase.com/docs/guides/database/functions)

The original comparison overestimated the complexity of direct downloads. PowerSync can supply a persistent queue and stream server changes into a browser database. It also adds an SDK, a sync service and user-specific replication configuration. The app would still own upload validation, review identity, scheduling, handling conflicting edits and migrating old saves. Its strongest case would be measured difficulty maintaining the direct approach or a need to stream much larger data sets. Neither has been demonstrated for this app. [PowerSync integration](https://supabase.com/partners/catalog/powersync)

## Smallest protocol worth testing

1. **Save a change once on the device.** Keep a queue for each signed-in learner. Complete the current prompt and queue its review in one IndexedDB transaction. Use the existing persisted prompt ID as its review identifier. Notify other open tabs after committing so stale screens refresh. Keep the original study date, source word ID and lookup result.
2. **Upload actions and acknowledge specific IDs.** An authenticated Postgres function verifies ownership, accepts a new command once, applies it and advances the learner's revision in one transaction. Repeated commands with the same payload receive the same result. Enforce owner isolation on every callable function and table. Use only a publishable key in the Pages client. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) · [Postgres function privileges](https://supabase.com/docs/guides/database/functions) · [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
3. **Download current progress when its revision changes.** A read returns an unchanged indication or a consistent pair of revision and current study state. Return personal membership, custom words and aliases, scheduling summaries, applicable daily credits and settings. Keep individual historical reviews and deduplication records server-side for late uploads. Commit the confirmed view and its revision together locally, then reapply pending local edits. Keep writes as individual actions so two devices' contributions survive. This avoids a paginated change feed for the pilot. On active use, check again after uploads, when the app regains focus or connectivity, and periodically while visible. Automatic catch-up can resume on the next launch.

**Size check.** I generated a local sample using the real catalogue IDs, selected HSK levels, 30 daily credits, all sampled words in the personal list and one history summary per word. For 100 words it was 7,950 bytes of JSON. For all 1,004 entries it was 77,962 bytes (8,845 bytes with local gzip). These are illustrative measurements. They exclude custom entries, aliases, protocol overhead, receipts and the historical event log. Benchmark a larger custom list on a phone, including response time, before committing to a payload or latency limit. Loading a complete history on each review would defeat this design.

## Decisions needed before implementation

| Priority | Finding | Expected behavior or decision |
| --- | --- | --- |
| High | Review replay can change an existing due date. | Preserve the source word and the point where a custom entry was linked. Include both arrival orders in a test. Two offline visits must retain the existing visit, credit and scheduling rules. |
| High | Two occupied browser saves can contain overlapping visits that v5 cannot identify. | Atomically claim an empty account once. If another device already populated it, show what can be compared, preserve the original copies and obtain a choice for overlapping legacy history. Never infer separate visits from two aggregate counts. |
| High | Identical custom entries can acquire two IDs offline. | Specify how equal characters and normalized readings converge. Preserve distinct readings and catalogue senses. Recognize aliases on late uploads and grant one daily credit per canonical word. Separately decide the outcome of concurrent edits to a single field. |
| High | Cached data and uploads can belong to a previous account. | Partition by owner, including pending uploads. Require the original identity after session expiry. Test switching accounts during an upload and during a download. Define how to keep local-only study available without exposing another learner's work. |
| High | New catalogue IDs and old browser builds can coexist. | The current restore validator drops unknown IDs. Preserve them across sync or pause at the last confirmed revision until compatible software is available. Keep pending changes during upgrades. |
| Medium | Browser storage and app-shell readiness are separate. | Verify a complete cached build, its referenced chunks, and the separately loaded 1,256,365-byte stroke file before advertising offline restart. Test storage denial, a failed cache installation and opening a previously unseen guide offline. |
| Medium | “Connected” and “current session” leave recovery behavior unclear. | Distinguish signed in, reachable, pending and confirmed. The local “Keep practising HSK” choice survives reload and expires on daily rollover. Define acceptance outcomes for each state. |
| Medium | History replay and long-offline retries can grow without bound. | Measure a busy learner and a long disconnect. Define receipt retention and safe re-entry before purging anything a device can still retry. Keep a same-account route for a rejected edit without blocking unrelated reviews. |

**Lost acknowledgements need one additional safeguard.** If a downloaded snapshot already includes an upload whose response was lost, reapplying that pending review would briefly double the learner's count. Return the receipts for this device's outstanding IDs at the same revision as the snapshot, or recover the receipts before rebasing pending edits. Also define a stable order for simultaneous word additions and an explicit rule for concurrent changes to selected HSK levels. The order can affect which word is studied next.

## A dependency to budget for

Supabase's default email sender only delivers to project-team addresses. A private team pilot can test the email-code flow with those addresses. Opening email-code sign-in to other learners requires configuring SMTP, using an existing mail service if available. This is an authentication delivery dependency in either sync design. [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp)

## What was verified

- Ran all three existing Node unit-test files. All 16 tests passed. These cover current local behavior.
- Reproduced a schedule mismatch using the repository's actual functions. A custom word reviewed on Monday 23 November and its catalogue entry on Tuesday 24 November were both first, unaided visits. Linking the entries produced two visits due **Friday 27 November**. Replaying both under the catalogue ID produced two visits due **Thursday 26 November**. The upload transport cannot resolve this difference. [Link rule](../../../src/personalWords.ts#L44) · [Scheduler](../../../src/review.ts#L99)
- Inspected the v5 migration and storage fallback, two-tab handling, build workflow and Playwright setup. The current browser tests use Chromium at the origin root. A release test needs the production subpath and an actual offline close and reopen. Browser and cloud tests were not run. No server or cloud project was started.

The decisive release exercise is two devices studying the same word offline, uploading in reverse order, losing a successful upload response, and reopening on a later day. Both devices should end with two visits, one credit on the original day, the same due date and an empty pending queue. Add the link, concurrent import, old-client and shared-device cases above before shipping.

## Review coverage

| Findings | Resolution in this review |
| --- | --- |
| [Initial architecture review](zoom_out_report.md), Z1–Z5 | Link semantics, duplicate custom IDs, conditional snapshot downloads, tab notifications and reuse of the prompt ID. |
| [Comprehension review](comprehension_report.md), three findings | Overlapping imports, account versus network status, and HSK setting lifetime. |
| [Design, structure and style review](critic_report.md), D1–D5, T1–T2, S1–S3 | Offline merge rules, simultaneous imports, old clients, retention, decision visibility and acceptance criteria. |
| [Final architecture review](intermediate_zoom_out_report.md) | Reassessment following the independent reviews. |

The reviewed draft contains goals, architecture alternatives and acceptance scenarios. A detailed implementation section has yet to be drafted, so implementation readiness cannot be certified from this version.
