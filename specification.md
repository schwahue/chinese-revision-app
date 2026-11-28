# 复习 · Chinese Revision pilot

**Current product specification · 29 November 2026.** Use this document for the behaviour of the local pilot. Update the affected rule and its acceptance scenario when a feature changes. Earlier proposals, mockups and the rationale for the daily goal are in the [design archive](docs/archive/2026-11-21/specification.md).

The [UI and UX design specification](docs/design-spec.md) explains the visual hierarchy, layout and interaction patterns shared by these flows.

## Product scope

Help a learner read one Chinese sentence, recognise a word in context and return to it over time. Daily Review chooses the next encounter. Word Bank lets the learner choose one directly. Both share local study history. Catalogue entries use the existing sentence and writing tools. Personal entries can contain just characters and pinyin.

| Available today | Scope |
| --- | --- |
| Word Bank and manual practice | All 1,000 numbered HSK 3.0 items through Level 3. Each entry has at least one practice sentence. |
| Automatic Daily Review | With an empty personal list, starts with Level 3 and honours previously saved levels. With personal entries, newly chosen prompts prioritise due and unseen personal words. |
| Progress | **Next** records an encounter. Bamboo counts distinct entries reviewed today. An explicit lookup of the target affects its next due date. |

## Personal

Word Bank opens on **Personal**. The same dropdown offers **All HSK** and each available HSK level. Search all levels by tone-marked or unmarked pinyin and choose the intended reading and sense. **Add word** adds the selected HSK catalogue ID to Personal. Previously saved custom entries keep their IDs across spelling edits. Removing membership preserves history and daily credit. Confirming a catalogue match while editing a custom word combines the two visit counts and counts each daily credit once. The most recently reviewed entry supplies the schedule, with the earlier due date used for same-day ties.

Personal shows eight words per page. **Review** beside the Personal picker starts a session across the collection and can replace a preselected HSK prompt without awarding credit for it. Ordinary reload resumes the current prompt. Catalogue matches use the normal sentence. Custom entries show the headword, **Show pinyin** and **Next**. An explicit reveal counts as a lookup. Due entries precede unseen ones. Once caught up, **Keep practising HSK** switches to the saved HSK pool for the local day. Daily rollover restores personal priority after any unfinished prompt. Daily milestones remain 10, 15 and 30 distinct entries across the two collections.

## Daily Review pool

The Word Bank filter applies only to browsing. Review resumes the saved sentence, levels, lookup flag and credits across reloads and tabs. After the HSK pool is exhausted, the HSK catalogue opens for manual practice. Returning to Review shows a completion message.

## Reading and lookup

The learner opens Review on one simplified Chinese sentence and can leave at any time. The first occurrence of the review word has a soft jade highlight and heavier type. Words are individually operable by pointer, touch and keyboard. The header pairs the panda mark with 复习 and puts the gear at the top right. The gear stays in place and keeps focus as it toggles Settings and the current study view. The browser tab uses the same panda mark. The sun/moon button appears beside the gear in Settings. Both controls paint the incoming view over the outgoing view in a circle from the activating button over 420 ms. Reduced motion switches immediately for both controls. Theme changes also switch immediately in browsers without view transitions. Review and Word Bank share a segmented control. Prefer single-word action labels where the outcome is clear.

- Hover or focus a word to see its characters, tone-marked pinyin and English together in one clickable definition centred beneath the sentence. Click the word with a mouse to open its full entry directly. Press Enter or Space on a word to move focus to its definition. Activate the definition to open word detail. On touchscreens, tap a word to select it and tap it again to close. Escape also dismisses the definition.
- **Next** credits the current review word and chooses a new sentence or a milestone. The next sentence has a short entrance transition. Its Next button accepts input immediately once the new prompt is on screen. Repeated activation of the previous prompt records one encounter.
- The complete sentence is centred on the browser viewport. A final 。 shifts the line right by one quarter of the stop’s rendered width for optical balance. Questions retain geometric centring. Short prompts fit on one line. Longer examples and enlarged text can wrap within the viewport. Definitions open below it. The Word Bank starts directly below the main navigation for both collections, including an empty personal list. Word detail and milestone content share the same viewport centre when they fit. Longer content flows below the header and can scroll.

### Highlight and hover behaviour

| Interaction | Expected behaviour |
|---|---|
| Move along one line | Measure travel between the visible highlight centre and the destination word centre. Settle in 160–250 ms with a single overshoot of 2% of that distance, capped at 5 px. A new movement starts at the current visible position. |
| Return to the review word on the same line | When the definition closes, glide past the review word by 4.5% of the distance (up to 7 px), rebound by 22% of that overshoot, then settle. This return takes 240–330 ms. |
| Move to a different line | Fade the highlight in over 130 ms. With reduced motion enabled, place it immediately for either kind of move. |
| Read the definition | Keep the dictionary row on the same centre line as words change. Stack the character and pinyin on the left, wrap the meaning in the next column and place the entry chevron on the right. The gap above the row remains traversable by pointer. |
| Connect the definition to its word | A small upward pointer on the row’s top rule follows the selected word’s centre, stopping at either end of the rule. Reduced motion places it immediately. |
| Leave or dismiss | Allow 450 ms to re-enter, then return the highlight to the keyboard-focused word or the review word. Escape dismisses the definition. Use one even jade border for the active word. |

## Vocabulary and Word Bank

The bank includes all 1,000 numbered items through Level 3 in the November 2025 HSK 3.0 exam syllabus. Separate entries represent distinct syllabus senses or pronunciations of the same characters. Each can be practised and credited independently. Both practice modes use the same sentence index. The original 44 Level 3 targets retain their two authored examples and rotation. Token boundaries in the data make whole words selectable while the screen displays natural Chinese spacing. Other catalogue entries use sentences in which their exact token occurs. [Vocabulary data](src/words.json)

### Browsing

Changing numbered pages brings the new rows in from the right when moving forward or the left when moving back, with an 8 px slide and fade over 180 ms, staggered by 16 ms per row. Reduced motion switches immediately. A short final page reserves the usual list height so the pager stays in place.

- The bank uses a centred column with the Chinese word first and its pinyin in smaller, muted type. Entries that share both a spelling and a pronunciation include a short English sense beside the pinyin. Hover a row or reach it by keyboard → the rounded row uses the Review sentence’s jade highlight. Moving to another row glides the same highlight vertically in 185 ms with one overshoot capped at 2 px. Rapid movements continue from its visible position. First entry and reduced motion highlight immediately. Keyboard focus adds an outline, and pressing adds an inset border.
- The collection dropdown opens on Personal and includes HSK 1, HSK 2, HSK 3 and All HSK. Supporting browsers show a rounded menu with the selected level in jade. The filters show 300 Level 1 items, 200 Level 2 items and 500 Level 3 items. **All HSK** shows all 1,000 entries.
- Pages contain up to eight words in bank order. When there are two to five pages, every page has a button below the list. Longer lists show five numbered buttons: the first page, three pages around the current position, and the last page. Ellipses mark skipped ranges. The current page is marked visually and with `aria-current`. Selecting a page focuses its first word. Changing levels starts at page one and returns focus to the filter.
- Back from an entry restores the originating bank page, scroll position and word button, or the definition in Review if the original prompt is still current. When another tab has advanced, Back returns to the current Review sentence. The level and bank page are kept for the current visit. **Practise** resumes the unfinished prompt for the same word, including its example and lookup flag. Choosing a different word starts an unaided prompt for that entry. [Word Bank and entry](src/main.ts)

### Word entry and writing

- An HSK entry with a matched human recording has a speaker beside its headword pinyin in Word Bank. It plays *hái* for entry 67, *huán* for entry 678, and *shéi* followed by *shuí* after a 400 ms pause for entry 181. Catalogue entries saved to Personal open the same recordings. A tap starts or replays the clip, and leaving the entry stops it. Listening has no effect on the review schedule.

- The headword is largest and jade. Usage and optional measure-word phrases sit beside it in blue and amber. Chinese, pinyin and English use aligned rows. Narrow three-part entries put the headword above the examples.
- The supporting panel displays a curated memory cue when available, or an **In context** example containing the exact vocabulary item. Below that panel, one rounded box contains a row per distinct character in word order. Select a row once to see its radical, structure and stroke sequence. Opening a different character folds the previous one. **Practise** sits below the group.
- Each row has a right-hand chevron that rotates down when open. The box blends into the page at its edges in both themes. Dividers fade at their ends. Keyboard focus outlines the character row in muted ink. In supporting browsers the panel takes 200 ms to expand or fold. Reduced motion switches immediately.
- Each numbered frame shows the full character faintly, earlier strokes in muted ink and the new stroke in jade. A dot marks its start. Frames wrap after five strokes.
- Opening a catalogue entry starts one request per distinct character. Expanding a row shares the pending request, and subsequent entries reuse a character’s loaded data in the same page session. If loading fails while the row is open, closing and reopening it retries. [Writing guide](src/writingGuide.ts) · [Browser check](tests/browser/writing-guide.spec.ts)

## Daily credit and scheduling

| Event | Effect |
|---|---|
| Hover or focus a word | Display its definition. The scheduling flag stays as it was. |
| Explicitly select the current target or open its linked definition | Remember the target lookup on the unfinished prompt, even if the definition closes. Selecting or opening a surrounding word applies only to its display. |
| Next after a target lookup | Set the next due date to tomorrow and restart the interval sequence. |
| Next after an unaided encounter | Advance through 3, 7, 14 and 30 local calendar days, capped at 30. An early unaided repeat preserves its step and due date. |
| Next on a word already credited today | Update its visit history under the same scheduling rules. It earns one daily slice in total. |
| Choose an automatic HSK prompt | Exclude words credited today. Choose the earliest due target, then an unseen target, then the least recently visited remaining target. Rotate examples by visit count, skipping the previous sentence when a different example is available for the new target. Once automatic targets run out, open Word Bank. |

The local date when the learner presses **Next** determines the visit date, scheduling interval and daily milestone. The day change clears the daily word list and preserves history, theme and the unfinished prompt. Daily credit measures distinct words encountered. Personal words can also contribute. [Scheduling implementation](src/review.ts)

## Progress and celebrations

The left sidebar aligns with the main word or celebration number. On browsers without word anchoring it centres on the prompt row. Each credited word fills one jade bamboo segment. Five segments form a stalk, filling from the bottom in two columns. Each stalk has a continuous silhouette with fine seams between words. Pale shadow segments show the distance to the next threshold. At four words, the first stalk has one pale tip. At five, all five segments are jade and the neighbouring stalk is still pale. At 25, five groups are filled and one is pale. After 30, further words add earned slices within the bounded stack. At the default text size, the sidebar scrolls internally once the slices exceed its 132 px height limit. New rows grow upward. The stack hides its scrollbar and scrolls to the newest row on render. The third and fifth earned segments carry leaves. A newly earned segment grows from its base unless reduced motion is enabled. All 1,000 catalogue words are eligible for automatic review when all three levels are selected. [Stack implementation](src/progressStack.ts)

| Distinct words today | Celebration |
|---|---|
| 10 · daily goal | 真棒！ · Zhēn bàng! · Great job! One burst, “Daily goal met!” and the distance to 15. |
| 15 · optional | 太厉害了！ · Tài lìhai le! · That’s impressive! Two staggered bursts and the distance to 30. |
| 30 · optional | 你做到了！ · Nǐ zuòdào le! · You did it! A gold ripple and three bursts finish the sequence. |

A newly credited word triggers a celebration when the count first reaches a threshold. The celebration shows the earned stack, focuses the cheer heading and offers **Continue** immediately. If midnight passes, the celebration shows the date earned and that day’s bamboo stack. Continue opens the prepared prompt with the current day’s progress, or Word Bank if the pool is exhausted. Refresh resumes study. Reduced motion shows static decoration.

### Debug preview

Append `?preview=10`, `?preview=15` or `?preview=30` to the app URL. The ordinary study header hides the preview link. The preview uses sample words and the live celebration renderer. Switch tiers, select **Replay**, or use **Back to review**. Previewing and replaying do not credit words, prepare prompts or change due dates. [Screen and preview logic](src/main.ts) · [Visual and motion rules](src/style.css)

## Storage and delivery

Vite builds a static TypeScript app with relative asset paths for GitHub Pages and a 64 × 64 PNG tab icon. Progress is local to the browser profile and origin.

- The active save is `chinese-revision.v5`. It includes personal membership, custom reading records and the daily HSK continuation choice. The selected review levels share the writer lock and save record with the unfinished prompt, credits and history. On first use, the app looks for the most recent save from v4, v3, v2 or v1. A migration marker for a reset version stops the search. Once migrated, v5 resets start fresh. Reload older tabs to continue the shared session.
- Older saves can refer to 份, 支, 篇 and 北京. The app restores these as custom words wherever membership, history or daily credit refers to them. An active Personal prompt for one of them resumes as a word-only prompt with its original lookup state. [Migration check](tests/browser/catalogue-migration.spec.ts)
- Each unfinished sentence prompt stores its ID, word, tokenised sentence, example index and lookup flag. On reload, the definition closes. If examples have moved, match the saved sentence and retain its ID and lookup. If the sentence has been removed or retokenised, start a new encounter for the same word using its normal rotation. Prior visits and credits carry forward. Word-only prompts store the custom ID and lookup flag. Older saves containing only an index use the current sentence at that position on first import.
- Tabs use a shared Web Lock to read the latest record, apply an action and prepare the next prompt in one update. Next and target lookups apply only to the prompt the learner saw. Two tabs advancing the same prompt produce one visit and one credit. Clearing site data or removing the progress key starts fresh on the next synchronization.
- Theme follows the device until the learner chooses an override. The preference uses its own key, `chinese-revision.theme`. Existing saves carry their previous theme forward. A remote theme change updates the open screen in place. An open entry and its expanded guide also survive another tab advancing.
- **Settings → Chinese font** switches Hanzi between 黑体 and 宋体 and saves the choice in `chinese-revision.han-font`. Other tabs apply the change. If storage is unavailable, the selected face applies for the visit and a dismissible notice explains why.
- A damaged record retains recoverable fields. Dates must exist on the calendar. A history entry with an invalid last-review or due date is discarded so the word can be scheduled again. The first damaged source record is backed up at `chinese-revision.v5.damaged` before repair. When the browser denies storage or cross-tab locking, the learner can still practise in memory for the visit and sees a notice. [Storage implementation](src/storage.ts)

## Acceptance checks

- In **Personal → Add word**, search for *huan* and add 还 (*huán*). Its catalogue entry appears in Personal. Search for *kāfēiyīn* and the app shows **No HSK matches.** Previously saved custom words still open for editing and review.
- At desktop and phone widths, compare 我在复习课文。 and 周末你想去哪儿？ → the statement’s midpoint is a quarter of its final stop’s width to the right of centre and the question’s midpoint is at centre. Looking up a word keeps both positions stable. A short filtered bank starts below the navigation. Word detail and milestone previews use the viewport centre when they fit. Paging through All HSK reaches the final entry.
- Move between neighbouring words, then jump farther along the same line → the longer move settles later and overshoots farther, up to the caps above. With reduced motion, both moves are immediate.
- Hover another word on the same line and leave the reading area → after the grace period the highlight crosses the review word, makes one smaller rebound and rests on it.
- Move slowly from 我 through the gap to its pinyin and English → the same definition stays open and can be activated.
- Quickly hover 我, then 借, and click its definition → 借 opens. If the preview changes between pointer press and release, the reader stays open.
- In HSK 3, choose page 63 → four entries. Open one and return → page 63 is selected and its row regains focus. Select All HSK → page 1 of 125. Page 125 contains eight entries.
- Open 复习 → select 复 directly, then 习. Only 习 stays open. With reduced motion the switch is immediate. A repeated-character entry such as 爸爸 shows one 爸 row.
- Open 借, expand its guide while the character request is pending, then fail that request → the row offers a retry. Close and reopen → the ten strokes load. Revisit 借 → its guide reuses the successful response.
- Open Settings, choose 宋体, then return to Review → Hanzi uses the selected face and pinyin stays in Andika. Reopen Settings after reload → 宋体 is still selected. [Font checks](tests/browser/fonts.spec.ts)
- Add 还 (*huán*) to Personal and play it from its entry → the recording matches the selected reading and the progress record stays the same. A failed clip offers a retry, and opening Settings stops playback. [Playback checks](tests/browser/pronunciation.spec.ts)
- Open 借 → the word and usage appear together above the memory cue, with Practise directly below the guide. Focus the 借 row and press Enter → the radical, structure and ten numbered strokes appear together beneath the disclosure.
- Open 礼物 → choose 礼 directly beneath the memory cue to see its strokes. Choose 物 to fold 礼 and show the strokes for 物.
- Open 借 in Word Bank and expand its character guide → the memory cue, person radical 亻, left–right parts 亻 and 昔, and ten numbered strokes are available.
- Hover 借 in 我想借一本书。 and advance on a first encounter → three days. Explicitly select 借 before advancing on a first encounter → tomorrow.
- At 573 px viewport width, advance from 50 to 51 distinct words → the next row appears above the previous row, the newest segment is visible, the sidebar scrollbar is hidden and the page stays at the same scroll position.
- Advance nine distinct words, leave, then advance a tenth on the same day → one daily-goal cheer. Practise a credited word again → the slice count holds.
- Press **Next** before midnight → credit belongs to that day, even if the save finishes after midnight. If that press earns the 10th, 15th or 30th distinct word, the tab that credits it shows the dated celebration once. Continue or reload → resume the new day.
- Open the 30-word debug preview during an unfinished review, replay and return → the same prompt, credits and due dates are available.
- Reach 30 with reduced motion → the bilingual cheer and Continue are available with static decoration. Advance a 31st distinct word → one additional slice.

- In two tabs displaying 借, activate Next in both → one visit, one credit and the same next prompt. Toggle theme or press Next from a stale screen → saved history stays current.
- Clear site storage or remove the progress key in another tab → the new session starts at 借 with empty history. A pending Next for the old copy of 借 earns zero credits.
- Load a damaged save, advance and reload → the next prompt resumes and the damaged source is available for recovery. Load an existing valid save → credit, schedule, example, lookup and theme carry forward.
- Credit 图书馆, let an old tab write its prior-version key, then reload → the v5 credit, history and current prompt survive. Remove v5 → the next session starts fresh.
- Restore histories with February 30 and February 29 of a leap year → the invalid history is backed up with the original record and the valid leap-day history survives. Review the affected word unaided → its new due date is three days ahead.
- Move a saved example within the catalogue → the same sentence and lookup resume. Remove the sentence → the same word opens a new unaided encounter.
- Focus 借 in the middle of a sentence, press Enter twice → its entry opens. Back → focus returns to its definition. Open it again, choose Practise and advance → 借 is due tomorrow. Practise a different entry → its new prompt starts unaided.

Content, scheduler and stack checks run with `npm test`. Run `npm run build` then `npm run test:browser` for the automated storage, keyboard and Practise scenarios. [Browser regressions](tests/browser/progress.spec.ts) [Content and scheduler tests](tests/review.test.ts) · [Stack tests](tests/progressStack.test.ts)
