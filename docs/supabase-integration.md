# Supabase integration for Chinese Revision

Research proposal, 28 November 2026. Keep GitHub Pages for the app and add optional private backup and restore through Supabase Auth and Postgres. A learner could save their word bank on a laptop and restore it on a phone. Automatic merging across active devices would be a separate release.

This proposal explores manual backup. The [offline study draft](offline-sync.md) develops the automatic sync approach. The released app stores study progress locally in the browser.

## What goes where

| Location | Data and responsibility |
| --- | --- |
| GitHub Pages | Serve the Vite build, HSK catalogue, practice sentences, stroke data and source credits. These ship together and are shared by every learner. |
| Browser | Continue to save reviews locally. Keep the current prompt, theme and Chinese font preference specific to each device. Ordinary study should still work when Supabase is unavailable. |
| Supabase | Store the learner's ordered personal word list, custom entries, review levels, scheduling history, and dated daily credits in a private backup. Auth supplies its owner's stable ID. |

## Backup and restore

1. Offer **Back up my progress** from Word Bank. A learner enters an email address and types the one-time code into the app. Use Supabase's email OTP flow and configure the email template to include `{{ .Token }}`. The same email on a second device recovers the same identity, with no profile editor or callback page. Configure custom SMTP before inviting public users because the default sender is limited to project team addresses. [Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
2. Start with one Postgres table, `study_backups`. Give each user one row keyed by their Auth UUID, with a payload format version, a server-controlled revision, a server timestamp and a JSONB payload. Build the payload from the validated local save after the existing v1–v5 migration logic runs. Preserve exact catalogue keys and custom IDs when copying membership, history and credits. Two entries with the same written characters can have different readings and schedules. [Local persistence](../src/storage.ts) · [Review model](../src/review.ts)
3. Insert the first backup only if one does not already exist. For replacements, atomically check the revision the learner last saw and advance it with the write. A stale device should offer to inspect the newer backup. Show the backup date, personal-word count and destination's existing progress before a restore. Validate the payload and preserve a recoverable local copy before applying it. Loading yesterday's backup should run the usual local-day rollover.
4. Give the learner controls to disconnect the device and delete their cloud backup. Bind cached cloud data to the authenticated owner so another person signing in on a shared device cannot inherit or upload it. Existing browser saves are origin-specific. Learners with progress on localhost must back it up from that origin or explicitly transfer it before restoring on Pages. [Browser storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Build and deployment

The [Pages workflow](../.github/workflows/pages.yml) already installs Node 24, runs unit tests, builds with Vite, runs Chromium tests and deploys `dist/` on manual dispatch. Keep the relative Vite base for the repository subpath. Add `@supabase/supabase-js` when implementing backup and load the client when a learner opens the cloud controls. With no cloud configuration, ship the existing local experience.

Supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the production build from GitHub Actions variables. Changing them requires rebuilding and publishing. Every browser can read these values. Keep database passwords, SMTP credentials and privileged Supabase keys outside the Vite build. Keep SQL migrations under version control and apply the compatible schema and policies before publishing the client. [Vite environment variables](https://vite.dev/guide/env-and-mode) · [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

Grant the authenticated role only the operations the feature uses. Enable row-level security and require the authenticated UUID to match the owner for reads, inserts, updates and deletes, including the resulting owner on update. Use the browser's authenticated session with the publishable key. [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

The Free plan is suitable for a small pilot. Supabase currently lists a 500 MB database per project and pausing after one week of inactivity. A paused project should delay only backup and restore. Budget separately for production mail delivery and revisit the plan if cloud availability becomes a product requirement. [Supabase pricing](https://supabase.com/pricing)

## Release checks and future sync

Use the current local-only unit and Playwright suites as the baseline. Against an isolated Supabase instance, test first backup, restore on a fresh device, restore into an occupied browser, retries after a lost response, stale revisions, two different signed-in users, signed-out access and cloud unavailability. Exercise the built app under the GitHub Pages project subpath. Test with production-independent credentials and data.

If learners need to study on two devices between backups, introduce an owner-scoped queue of changes and stable operation IDs. Apply each review once on the server even after retries. Track review visits separately from the unique credit for a learner, word and local study date. Two reviews of the same word on the same day can contribute two visits and one bamboo credit. Define how concurrent edits, removals and custom-to-catalogue links combine before enabling automatic sync. The current Web Lock coordinates tabs on one origin and cannot coordinate phones and laptops. [Review rules](../src/review.ts) · [Personal words](../src/personalWords.ts)
