# Chinese Revision

A browser-only Chinese revision app with a personal word bank and all 1,000 HSK 3.0 vocabulary items through Level 3.

Open **Word Bank → Personal → Add word**. Search by pinyin and choose **Add** beside the HSK entry you want. Catalogue matches keep their sentence practice and history. Previously saved custom words can still be reviewed and edited.

Choose **Review** beside the Personal picker to practise due and unseen words in your list. Choose **Keep practising HSK** when caught up. Review uses the saved HSK levels when the personal list is empty. Both collections share the daily bamboo count. Words and progress are local to this browser profile. Clearing site data resets them. When durable storage or Web Locks are unavailable, the app shows a visit-only notice. Reload older app tabs after upgrading so they join the same saved session.

Open an HSK entry in Word Bank and tap the speaker beside its pinyin. The speaker appears for entries with a bundled human recording matched to the displayed reading. The two 还 entries play *hái* or *huán* according to the selected meaning. For 谁, **Play both readings** plays *shéi* then *shuí*. [Recording credits](public/vocabulary-sources.txt)

Open **Settings** with the gear to change the theme or switch Chinese text between 黑体 (default) and 宋体. The preview shows the selected typeface alongside pinyin. Both preferences are saved in this browser.

## Product documentation

| Start here | What it answers |
| --- | --- |
| [Product specification](specification.md) | What happens when I add, review or look up a word? Includes scheduling rules and acceptance scenarios. |
| [Design specification](docs/design-spec.md) | How should the screens, input controls and motion behave? |
| [Wiki index](.ai/wiki/index.md) | Where can I trace a concept to its implementation and tests? |
| [Source guide](src/README.md) | Which module owns each operation, and where does it read or write state? |
| [Word Bank recordings](docs/pronunciation.md) | Which entries have audio, where did the recordings come from, and how do I add one? |
| [Proposed offline study and sync](docs/offline-sync.md) | How would study across devices work? The current app saves progress in the browser. |
| [Archive](docs/archive/README.md) | Which proposals, mockups and findings explain earlier versions? |

Use the checked-in application and its tests to resolve discrepancies. When behaviour changes, update the relevant specification and wiki references alongside the implementation.

## Run locally

Use Node.js 24 or later. From this folder run:

```sh
npm ci
npm run dev
```

Run `npm test` for catalogue, recording, personal word, scheduling and progress-stack checks. Run `npm run build` to type-check and build the site. For browser regressions, install Chromium once with `npx playwright install chromium`, then run `npm run test:browser` against the build. The suite starts an isolated local server and browser profiles. Use `npm run preview` to try the build yourself.

To replay a celebration, append `?preview=10`, `?preview=15` or `?preview=30` to the running app URL. Select **Replay** to repeat it or **Back to review** to resume. See [Debug preview](specification.md#debug-preview).

## GitHub Pages

For a standalone repository with this folder at its root, select **GitHub Actions** in Settings → Pages and run **Publish Chinese Revision** under Actions. The manual workflow runs the unit tests, builds the site, runs the Chromium regressions and publishes `dist/`. For an existing site, serve the contents of `dist/` in its own directory. Relative asset URLs support repository subpaths.

## Vocabulary

The [official November 2025 exam syllabus](https://download.chinesetest.cn/newhsk-site/Syllabus/H_DG_1110.pdf) numbers 300 Level 1 items, 200 additional Level 2 items and 500 additional Level 3 items. These 1,000 entries form the complete [catalogue](src/words.json). The content test checks the ordered IDs, headwords and pinyin against the vocabulary table on PDF pages 80–104. Previously saved personal words outside these levels remain available as custom words.

Entries with different readings or senses have separate records. Existing word keys keep their progress. Where needed, a token such as `还#678` selects a specific entry and displays as 还. Spaces in [practice sentences](src/practice-sentences.json) mark tappable tokens. English glosses for the expanded list are adapted from [HearMandarin](https://hearmandarin.com/datasets/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See the [bundled attribution](public/vocabulary-sources.txt).

Each entry has a contextual practice sentence and a writing guide. The original entries also have curated memory cues and usage examples. Stroke outlines, stroke starts and component data come from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi). The 655-character [bundled subset](data/characters.json) ships as individual character files with its [upstream notices](public/hanzi/licenses/COPYING).
