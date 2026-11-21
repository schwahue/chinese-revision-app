# Chinese Revision · UI and UX specification

> Archived design · 21 November 2026. For current behaviour, see the [living pilot specification](../../../specification.md).

Design draft · 21 November 2026

Open the app and read one Chinese sentence. Tap a word for help, or go straight to **Next**. The app chooses what to offer on later visits. The learner can leave at any point.

Screen designs: [Reading](reading.png) · [Word Bank](bank.png) · [Word detail](detail.png) · [Daily celebration](celebration.png)

## Reading

Open on a short sentence in simplified Chinese. Give the target word a soft highlight and heavier weight. In 我想借一本书。, tapping 借 opens a compact gloss immediately below the sentence with **jiè · to borrow**. Pinyin and meaning appear together in one tap. Tap another word to replace the gloss; tap the selected word again to close it. Keep the full sentence visible. The gloss opens the full word entry through its linked headword.

**Next** is the sole primary action. It saves the encounter, closes the gloss and advances to the next sentence or the daily celebration. There is no automatic advance. While the learner is reading, looking up words, switching themes or away from the app, the current sentence stays put.

## Daily goal and optional milestones

Ten distinct words fulfil the daily goal across any number of visits. Fifteen and thirty are optional milestones. Count a target once on **Next**, including practice opened from the Word Bank. Looking up a word, revisiting an already credited target and refreshing leave the total alone. Count words encountered, without implying mastery.

Place the stack in the left sidebar, vertically centred on the target word during reading and on the milestone number during celebrations. Each distinct word reviewed today fills one slice. Slices form stacks of five in two columns, filling from the bottom up. Shorter, pale slices show how many words remain to the next milestone. Celebrate with a full stack before adding the next set of pale slices on Continue. After 30, show earned slices only, within a bounded height.

| Distinct targets today | Learner-facing behaviour |
|---|---|
| 0–9 | Show one slice per word, starting with ten pale slices. |
| 10 | A single burst accompanies “真棒！” (Great job!) and “Daily goal met!” If 15 is reachable, add “5 words to 15” as secondary text. |
| 11–14 | Add slices above the first ten. |
| 15 | Two staggered bursts accompany “太厉害了！” (That’s impressive!). If 30 is reachable, add “15 words to 30”. |
| 16–29 | Keep adding one slice per word. |
| 30 | A gold ripple and three bursts accompany “你做到了！” (You did it!). End the countdown here. |
| 31 onward | Further words add individual slices silently. |

Use **Continue** on each celebration. It opens the next available reading prompt or, when the available targets are exhausted, the Word Bank. Apply the same destination rule on later visits. Each milestone has one brief, silent celebration per local day. Show pinyin and English beneath the Chinese cheer. With reduced motion, show static decoration. Move focus to the celebration heading. Keep Continue immediately available.

Store the local date, distinct IDs and milestones already shown with the prompt and scheduling update. Refresh and duplicate advances must never replay a celebration. At local midnight, reset daily credit and celebrations. Check the date on focus and before advancing; use the day Next was tapped. Keep spacing history, theme and the unfinished prompt.

Prefer due and unseen targets. To keep the next reachable milestone available, then use the least recently read targets still uncounted today. An early repeat without a target lookup preserves the existing spacing step and due date; a target lookup makes the target eligible tomorrow. After 30, continue offering available uncounted targets or allow manual practice. If the pack cannot support a milestone, suppress its countdown. The pilot must support the full sequence on a single local day with at least 31 distinct HSK 3.0 Level 3 practice targets. Supporting dictionary entries alone do not qualify.

### Why 10, 15 and 30

Ten is the daily goal the learner chose. Five additional words give someone who already wants to continue a nearby stopping point. The fifteen-word gap after that spaces out interruptions, and thirty ends the sequence. In reward-program field studies people increased their effort as a goal approached. This motivates trying a small remaining-word cue. The studies examined persistence in other settings; the specific thresholds and their effect on vocabulary retention remain pilot hypotheses. [Kivetz, Urminsky & Zheng, 2006](https://doi.org/10.1509/jmkr.43.1.39)

A countdown can also make stopping at ten feel unfinished. Give “Daily goal met” priority over the next number. During the pilot, ask whether stopping at ten felt satisfying and check whether learners recognise the words on a later day. More taps alone cannot answer either question.

## Automatic repetition

For the pilot, use exposure and lookup as modest signals for choosing the next example. They describe what happened during reading; they do not establish whether a learner knows a word.

| On selecting Next | Internal scheduling rule |
|---|---|
| The learner opened the target word's gloss at least once | Offer this target again from tomorrow, even if the gloss was later closed. Restart its spacing sequence. |
| The learner read on without opening the target gloss | On successive such encounters, offer it again after 3, 7, 14 and then 30 local calendar days. Keep 30 days as the upper interval. |
| The learner looked up a supporting word only | Apply the ordinary spacing rule to the target. The supporting word's own schedule stays intact. |

These are trial intervals. Dates, timers, grades and scheduling controls stay off the learner-facing screens. Select eligible targets oldest first, then introduce unseen Level 3 words. Rotate each word's two examples. Apply the daily selection rule above before returning to the Word Bank. The learner may open any entry at any time.

Store the unfinished prompt and its target-lookup flag until Next is selected. Returning after an interruption restores the sentence with the gloss closed. A lookup alone never commits a schedule change. Persist advancement once per prompt so refreshing cannot count the same exposure twice.

## Word Bank

Start at HSK Level 3. Allow browsing included earlier levels and All levels. Each row shows the written word and a detail chevron. An empty level offers **Show all levels**. Lay out the main word, usage phrase and measure-word phrase in a single aligned row, each with a short role label and gloss. Keep consistent role colours across themes and retain the labels for readers who cannot distinguish the colours. At high zoom or when text would clip, allow the groups to wrap in the same reading order. Omit the measure-word group when it does not apply. Opening an entry displays pinyin, English meaning and a natural usage phrase. For countable nouns include a measure-word phrase. For example, 书 has 看书 (“read a book”) and 一本书 (“one book”). Return to the same bank position or the original reading prompt. **Practise** opens an example for that target. Its Next action joins the normal reading flow. Browsing entries alone leaves scheduling untouched.

## Visual and interaction handoff

The header displays 复习 as plain text. The abstract mark serves as the favicon. In word detail, use jade for the main word, blue for usage, and amber or umber for measure words.

**Future copy rule.** Prefer a single action word when the screen makes its meaning clear, as in **Next**, **Continue** and **Practise**. Use a longer label when shortening it would hide the outcome.

Use a single reading column with native system typography. Make the sentence the largest element. Use a warm neutral canvas, soft charcoal in dark mode, and one jade accent. Keep Review and Word Bank together in a compact navigation control. Give the inline definition a quieter type size and keep Next in a consistent position below the reading area. At large text sizes let the sentence and gloss wrap and allow normal scrolling.

Keep the moon/sun button in the header. Default to the device theme and persist a manual override. The button's accessible name and tooltip identify its action, “Switch to dark mode” or “Switch to light mode”. Changing themes preserves the sentence, gloss and focus.

Make whole words keyboard-operable, give each a visible focus ring and expose its expanded state. Associate the active word with its gloss and announce the definition when opened. Mark Chinese text with the appropriate language. After advancing, focus the new sentence; when returning from detail, restore the opening control. Preserve visible focus in both themes. Avoid motion that pulls attention away from the text.

## Content and delivery

The client-side GitHub Pages app uses Vite, TypeScript, HTML/CSS and bundled JSON. The pilot requires at least 31 distinct, syllabus-checked HSK 3.0 Level 3 targets, two checked sentences per target and entries for supporting words. Use stable word and example IDs. Preserve Chinese word boundaries for lookup and natural spacing for display.

Keep spacing state, dates, theme and the unfinished prompt in versioned app-specific localStorage. Each browser retains its own history. If saving fails, keep practice available in memory and say “Progress is saved for this visit only.” If content fails to load, offer **Try again**.

## Acceptance scenarios

| Action | Expected behaviour |
|---|---|
| Read four words, leave, then advance six different targets later that day | The tenth distinct target opens the celebration once. |
| Reopen the app after ten, or practise a credited word again | The count stays at ten and the burst stays dismissed. |
| Reach 15 and 30, refresh, then advance a 31st distinct target | Each threshold celebrates once. The stack shows 31 slices after the extra word. |
| Start a sentence before midnight and tap Next after midnight | Credit it to the new local day; retain the prior learning history. |
| Reach ten with reduced motion enabled | Show the same success message and action with static decoration. |
| Tap 借 in 我想借一本书。 | The gloss reads jiè · to borrow. The learner stays on the sentence. |
| Close that gloss, leave, return and select Next | Resume the same example, then schedule 借 for the following day exactly once. |
| Open only 书 while 借 is the target, then advance | 借 follows its ordinary spacing sequence. 书 keeps its existing date. |
| Browse an entry or close the tab without advancing | The unfinished prompt survives and its next review date stays intact. |
| Switch themes with a gloss open | The icon and colours change; reading position and gloss survive. |
| Advance past the last eligible target by keyboard | Focus reaches Word Bank. Manual reading remains available. |

The mockups are static design references. Test whether learners discover tap-to-define and whether the suggested repeat frequency feels comfortable during the pilot.
