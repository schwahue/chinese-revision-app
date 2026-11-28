# Offline study and automatic Supabase sync

**Author** Henry · **Status** Draft · **Date** 28 November 2026

This document proposes cross-device study. The current app saves progress in the browser. The [manual backup proposal](supabase-integration.md) describes the earlier approach.

## Overview

Supabase is the primary store for a signed-in learner’s personal word bank and study progress. The app saves each change on the device first so the learner can continue studying offline. When the app can reach Supabase again, it automatically sends pending changes and retrieves changes saved by the learner’s other devices. The learner can see whether a change is saved on this device or has reached Supabase.

## The problem

Today, a learner who adds 地图 on a laptop and opens Chinese Revision on a phone finds a separate word bank and review history on each device. Requiring a network connection for every review would create a different problem. If the train loses signal between showing a word and tapping **Next**, the learner still needs the visit to count and the next prompt to open.

## Goals

1. **Study through a lost connection.** After a device has loaded the app and its study materials, the learner can reopen it offline, review available words and edit their personal word bank. With durable browser storage available, pending changes survive closing and reopening the app.
2. **Catch up automatically.** When a signed-in learner reopens or uses the app with a working connection, it sends pending changes and fetches remote changes without a backup or restore action. A temporary failure keeps the changes pending. The app reports them as synced only after Supabase confirms them.
3. **Preserve the meaning of a review.** If a phone records a visit to 地图 on Monday and uploads it on Tuesday, the visit belongs to Monday. If the laptop also recorded a separate Monday visit, both visits count and 地图 earns one Monday bamboo credit. Retrying either upload adds zero visits and zero credits.
4. **Continue on another device.** Once both devices have synced, the same learner sees the same personal words, readings, review history and due dates. Sync keeps distinct catalogue readings separate and preserves a custom word’s history through spelling corrections.
5. **Keep study accessible before connecting.** A learner can start locally and connect when they want their progress on another device. The first connection must account for existing work on both sides before it can replace or combine study data.

## Scope

The first release covers private learner data, offline access on a previously prepared device, automatic sync and visible save status. GitHub Pages continues to serve the Vite app and shared HSK materials. The device retains its display preferences, including theme and Chinese font. Learners can connect to their study data without managing a profile.

## Architecture decision

**Use direct Supabase sync.** GitHub Pages serves the Vite build and shared study materials. IndexedDB holds each learner’s device copy and pending actions. Supabase Auth identifies the learner, and Postgres stores the authoritative progress and processes uploads. The browser calls Supabase directly using the publishable project key. PowerSync was considered during review. Its queue and streaming features add a service while leaving this app responsible for scheduling, word identity and imports.

Upload individual actions so independent visits survive. Download a compact copy of the learner’s current progress when it changes. The review measured about 78 KB before compression for a sample covering the 1,004 entries in the catalogue at the time of the review. That supports trying this approach in the pilot. Custom words, receipts, a busy phone and long disconnects still need measurement. [Architecture review](archive/2026-11-28/consolidated_review_report.md) · [Current local study rules](../specification.md)

## How a change travels between devices

1. **Record the action.** When a learner taps **Next**, capture the existing prompt ID, original word ID, lookup result, completion instant and local study date. Use the prompt ID as the review ID. Other edits receive a stable action ID. In one IndexedDB transaction, check that the displayed prompt is still active, complete it, save the local progress and enqueue the action. Only then advance the screen and show **Saved on this device**. Notify sibling tabs after commit so they reload their own learner’s state. A second tab submitting the consumed prompt has no effect.
2. **Send pending actions.** While the app is running, try after each save, launch, return to the foreground and reconnection. Check periodically while visible even if the local queue is empty. On transient failure, retry with increasing delays and the same IDs. Preserve local dependency order, including creating a custom word before reviewing it. If an edit needs correction, show **Needs attention**, retain it and hold its dependent actions. Independent reviews can continue. A closed app resumes at its next launch.
3. **Accept an action in Postgres.** Derive the owner from the verified session. Serialize updates per learner. In one transaction validate the command, apply its effect, advance the account revision and save a receipt keyed by owner and action ID. Repeating the same payload returns the original result. Reusing the ID for another payload produces an error. Keep raw reviews, link events, aliases and receipts server-side for the lifetime of the pilot account. Retention must outlast the oldest retry the server will accept.
4. **Read confirmed progress.** Send the last confirmed revision, the device’s current study date and outstanding action IDs. From one consistent database view, return the revision, applicable receipts, and either the current snapshot or an unchanged indication. Refresh the date-specific credits when the requested day changes, even if the revision is identical. The snapshot includes personal list order, custom entries, aliases, selected review levels, history summaries and the requested day’s credits. A new device starts with a full snapshot.
5. **Reconcile on the device.** Atomically store the confirmed view and revision, retire actions covered by its receipts, and reapply only outstanding local actions. Match receipts even when the snapshot is unchanged. If checking outstanding IDs takes several batches, finish reconciling them against a consistent revision before displaying the result. Ignore older responses and responses from a previous sign-in. A lost acknowledgement must never cause a temporary second visit or bamboo credit. Show **Up to date** after the current check succeeds and pending work is clear.

## Study rules across devices

| When this happens | Result |
| --- | --- |
| Two devices complete different prompts for 地图 on Monday | Two visits and one Monday bamboo credit. Tuesday’s upload keeps Monday’s study date. Repeated delivery of one prompt adds nothing. |
| Completed reviews arrive out of order | Recompute the affected word from its validated starting history and recorded reviews in study-date order, then completion instant, then stable ID for ties. Preserve the existing lookup reset and early unaided repeat rules. An upload timestamp never determines the study date. |
| A custom word is linked to an explicitly chosen catalogue reading | Record the source, target and link as a dated action. Reconstruct each source’s history separately through the link boundary. At the link, sum visits, keep the schedule with the latest review date (earlier due date on a tie, existing catalogue schedule if both dates tie), and collapse duplicate credits. Apply later reviews to the destination. Retain the source alias and original review IDs. A delayed pre-link review triggers recalculation across the boundary, even after both clients have seen the link. Order reviews and links by the recorded study date and instant; apply known dependencies first, then stable IDs for remaining ties. A client that has observed a link attaches that dependency to subsequent actions. [Existing link rule](../src/personalWords.ts) · [Scheduler](../src/review.ts) |
| Both devices independently add the same custom word | Match exact Hanzi and the app’s existing tone-sensitive normalized reading. Keep a single canonical custom entry, using the first accepted creation and retaining the other ID as an alias. Combine genuine reviews in study order and deduplicate credits. A toneless search match alone cannot merge entries. Distinct catalogue senses retain their own IDs. |
| One device edits a word while the other removes it | Membership and word content are separate. The word stays removed and its corrected text and history are retained for re-addition. A stale membership action cannot silently undo a removal. An explicit re-add based on the newer membership revision restores the word. |
| Two devices edit a word or its catalogue target differently | Merge independent field edits. If both changed the same field or chose different targets from the same starting version, keep the accepted value and the pending alternative. Show both; the learner can keep the current value or apply theirs against the latest version as a new action referencing the conflict. Never transfer one review to two targets. |
| Two devices add different words or change selected HSK levels | Append new members in server acceptance order, with stable action ID as the tie-breaker within a batch. Preserve existing relative order; a link keeps the first occupied position. Treat the selected level set as one setting. The last server-accepted explicit level change wins. Each device adopts the confirmed order and levels. |

An unfinished prompt, its lookup state, the last sentence, theme and Chinese font preference remain device-specific. A completed review carries the lookup result. The local **Keep practising HSK** choice survives reload and expires at the next local-day rollover. HSK refers to the Chinese proficiency exam levels used to organize the catalogue.

## First sign-in, migration and shared devices

Use an email code to associate devices with the same Supabase user. A learner can study locally before signing in. Public email-code delivery requires a configured SMTP sender; the default sender can serve project-team pilot addresses. Include only the project URL and publishable key in the Vite build. Restrict sync functions to authenticated callers and enforce owner isolation on tables and functions. [Email delivery](https://supabase.com/docs/guides/auth/auth-smtp) · [Database access rules](https://supabase.com/docs/guides/database/postgres/row-level-security)

- **First import.** Validate and migrate the existing local save once. Store a recoverable original, a stable import ID and a boundary between imported totals and subsequently recorded actions. v5 contains per-word totals and one day’s credits. Import those totals as starting history. Preserve local device preferences and its resumable prompt. An empty browser downloads the cloud copy. A populated device can atomically seed an empty account. If two devices attempt the first import simultaneously, only one wins; the other receives the occupied-account flow.
- **Both copies have progress.** Preview local and cloud word counts, overlapping entries, visits and due dates. Offer **Use cloud progress** or **Combine progress** and let the learner defer either choice. Combining unions distinct memberships and dated credits and imports unique histories. For an overlapping legacy history, show both totals and schedules and ask which to retain as the starting history. When a baseline changes, replay identifiable later events against it; preserve their original IDs and count each once. Keep conflicting identity or catalogue-link choices explicit. Never sum uncertain overlaps. Apply a confirmed plan atomically against the cloud revision shown in the preview; refresh the comparison if that revision changes. Keep the prior local copy recoverable.
- **Account boundaries.** Keep guest storage and each account’s cache, outbox and receipts separate. Tag in-flight requests with the active session generation. On expiry, preserve pending work, allow local practice on the active device and show **Sign in to sync**. Resume transfer only under the original identity. Explicit sign-out hides that account’s cache from guests and other users. If work is pending, let the learner cancel, reconnect to finish, or explicitly discard that device’s pending work before erasing its copy. One person’s action must never be uploaded under another account.

## Offline readiness and upgrades

A service worker scoped to the GitHub Pages repository path caches a complete version of the Vite shell, its assets and the individual character JSON files used by the writing guides. Announce **Ready offline** after that version can serve navigation and a local study transaction succeeds. Keep the working version if an update is interrupted. Cache only public static resources in the service worker. A first-ever visit needs a connection. If durable storage is unavailable, explain visit-only practice; do not claim a pending action was saved.

Version the sync format and catalogue. If a build cannot understand an incoming record, pause applying the snapshot, retain the previous confirmed revision and pending actions, and prompt for a compatible app update. Keep older uploads readable during rollout. If an upgrade is required to send a command, preserve its original ID and payload until it can be migrated safely. Deploy compatible database migrations before publishing the static build. [Pages workflow](../.github/workflows/pages.yml)

## Acceptance and release checks

| Exercise | Passing result |
| --- | --- |
| Two browser profiles review the same word offline. Close one, reconnect in reverse order, drop an accepted upload response, and cross midnight. | Both show two visits, the same due date and one credit on the original day. Pending counts clear. The UI never shows a third visit. |
| Review the custom entry unaided on Monday 23 November, its catalogue entry on Tuesday 24 November, then link. Deliver Monday’s review last. | Both delivery orders yield two visits due Friday 27 November, preserving the current link behavior. |
| Independently add and review identical Hanzi and reading on two devices, then repeat with different readings. | The duplicate converges to one entry with both visits and one same-day credit. The different readings remain distinct. |
| Press **Next** in two tabs on one prompt. Race a word edit with removal and submit competing field edits. | One visit for the prompt; sibling tabs refresh. Removal preserves history. Each unresolved alternative stays available until settled. |
| Race two first imports, retry after a lost response, switch accounts during transfer, and try accessing another learner’s data. | Exactly one initial seed. Overlap goes through the comparison. Stale responses cannot write into the new account and cross-account access is denied. |
| Install the built app under its actual Pages subpath, disconnect, close and reopen, then open a previously unseen writing guide. Interrupt an update and separately deny storage. | Prepared study and strokes work offline; the previous complete build survives the failed update. Storage denial produces the visit-only message. |
| Send a newer catalogue ID to an old cached build. Reopen a long-offline device with pending work. | The old build keeps its confirmed copy and pending work. After a compatible update each action is accepted once. |
| Benchmark a busy phone with a large custom list, prolonged offline use and late reviews of a frequently studied word. | Record snapshot bytes, transfer and replay time, queue-drain time and receipt growth. Set the supported pilot workload from these measurements before public rollout. |

The implementation should run the existing Node and Playwright suites plus the two-device cases against an isolated Supabase instance. Cover guest-only mode, row-level access, storage migration, local-day rollover and service-worker updates on the production subpath. These are release criteria for the proposed feature.
