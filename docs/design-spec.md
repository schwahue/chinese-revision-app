# Chinese Revision · UI and UX design specification

The learner’s primary task is to read a Chinese sentence, look up a word if needed and decide when to advance. Give Chinese the strongest visual weight. Put pronunciation, meaning and optional study tools close to the text they explain. Use this guide for design decisions and the [product specification](../specification.md) for behaviour and acceptance scenarios.

## Screen hierarchy

| Screen | What the learner sees first | What supports the task |
| --- | --- | --- |
| Review | One sentence, with the review word highlighted in soft jade and heavier type | A small jade pointer on the centred dictionary row tracks the selected word. Bamboo in the left sidebar shows progress. **Next** sits below the reading area. |
| Word Bank | A collection picker above the Personal list or the selected HSK words. Keyboard entry focuses the filter. | Align Chinese at the leading edge and muted pinyin at the trailing edge. When spelling and reading coincide, show a short English sense alongside the pinyin. A chevron opens the entry. On page changes, the incoming list fades in with a small directional slide. The filter and pager stay in place. |
| Word entry | The headword, its pinyin and meaning | Give the headword, pinyin and meaning the full row when there are no side examples. Otherwise, align the examples beside the headword. Follow with a memory cue or contextual example, character disclosures and **Practise**. Back returns to the originating word or definition while its prompt is current. |
| Milestone | The count and Chinese cheer on a common centre line | Pinyin and English follow. Each tier earns a larger celebration. A celebration shown after midnight labels the earned stack with its date. **Continue** resumes the current day. Replay belongs in the debug preview. |

## Personal vocabulary

Word Bank opens on **Personal**. The collection dropdown lists **Personal**, **All HSK**, then each available HSK level. Open a three-row scroll list from the top edge of the picker, below the main navigation. Center the selected level between its neighbors when possible. Scrolling browses and selecting commits. Browsers with an operating-system picker retain that interaction. Keep the closed picker 1.25rem below the navigation. On collection and level changes, word rows fade up in sequence. On page changes they enter from the direction of travel. Respect reduced motion for both. Center **Add word** underneath on Personal. Open the search form inline with a short fade and focus the search field. Skip the fade for reduced motion. Search results show characters, pinyin and the available meaning, with **Add** or **Added** beside each result. Keep the empty search clear. After typing, offer an outlined **Add custom word** button for a search without matches, or **Add a different word** below matching entries. Use visible input labels, preserve the pinyin query in the manual form, and announce saves.

On a populated Personal list, **Review personal words** appears above **Add word** and starts review across the whole collection. Personal and HSK both show eight words per page. Catalogue matches keep their normal sentence. A custom prompt shows one headword with **Show pinyin** below it in a reserved area and **Next** in its usual position. When personal work is done, show **Keep practising HSK**. Retain the existing bamboo milestones and themes.

## Layout and type

- Centre the whole Review sentence on the viewport. The highlighted word can land on either side of centre. Opening a definition or filling a bamboo segment should leave the sentence in place. Switching between a short and long gloss keeps the row width and text columns steady. A terminal 。 receives a small optical correction.
- Keep the shell at most 700 px wide, with responsive side padding. The navigation is at most 24 rem wide, the Word Bank 28 rem and the entry 35 rem. Centre each column and left-align its reading content. Allow long entries to scroll in normal page flow.
- Use the system sans-serif stack and preserve pinyin tone marks. In word detail, the headword is 3–4 rem, example phrases 1.4–1.7 rem and pinyin 0.94 rem. Section labels such as **Usage** and **Memory cue** use muted, semibold 0.83 rem text. Use `zh-Hans` for Chinese characters and `zh-Latn` for pinyin. Apply these tags inside English memory cues and character facts too. In “亻 · person”, only 亻 switches to Chinese.
- Group characters, pronunciation and translation tightly. Leave more space before a new learning task. On narrow three-column entries, put the headword on its own row and the two examples underneath. Stroke sequences wrap in groups of five.

## Colour and surfaces

Use the semantic variables in the [stylesheet](../src/style.css). Light and dark themes use the same roles.

| Tokens | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` / `--ink` | `#faf9f5` / `#202822` | `#171d1b` / `#f0f3ed` | Page and primary text |
| `--muted` / `--line` | `#536059` / `#cbd2ca` | `#b1bcb6` / `#3b4942` | Pinyin, labels and dividers |
| `--soft` | `#e9ece5` | `#27312c` | Supporting surfaces, including the memory cue |
| `--jade` / `--tint` | `#116b53` / `#d6ece2` | `#8edabb` / `#284a3c` | Learning focus, active stroke and selection background |
| `--btn` | `#126749` | `#185f49` | Primary action and selected navigation, with white text |
| `--blue` / `--amber` | `#284fb0` / `#874710` | `#a5c8ff` / `#efbc78` | Usage and measure-word examples, each with a visible label |

The panda and 复习 share a small wood-coloured sign. Keep that treatment in the header. Filled pills distinguish the primary action and selected destination. A softly rounded panel groups the memory cue or contextual example. Fine, straight dividers separate lists and expandable rows. Give a disclosure a visible focus outline and a rotating chevron.

## Interaction and motion

- Hover previews a word’s definition. A mouse click on the word opens its full entry. On touchscreens, tap the word to toggle the definition and tap the definition to open the entry. The definition belongs to the same hover area as the sentence. Enter or Space moves focus from the word to its definition. Escape dismisses it. Back restores the learner’s place, or the current sentence if another tab has already advanced.
- Use one moving highlight for a set of related targets. Review allows a small distance-based rebound. The Word Bank moves vertically with a smaller overshoot. Rapid movement should pick up from the visible position. Respect reduced motion with immediate placement, direct theme switching and static milestone decoration.

Keep the bamboo beside the prompt. Stalks fill from the base, then form a new row above the previous pair. Hide the scrollbar and bring new growth into view within the sidebar so the sentence stays still. Leaves appear at the third and fifth segments. Reduced motion shows the earned segment immediately.

Keep sentence review to one sentence, its definition and **Next**. Put the vocabulary filter in Word Bank.

## Character disclosures

Place the character rows in one softly edged rounded box below the memory cue or contextual example. Keep characters on the left and disclosure chevrons on the right. Fade the ends of the dividers and hover fill into the surrounding surface. Give the group the accessible name **Structure & stroke order**. Opening a row reveals the character’s radical, structure and numbered strokes. Mark the new stroke in jade and its start with a dot. If loading fails, explain how to retry.

**Acceptance scenario.** Open 给 → activating its single row reveals the radical, structure and nine strokes. Open 复习 → both rows share one rounded box → selecting 习 folds 复 and opens 习.

## Reviewing future changes

Update this guide when a shared pattern changes. Keep exact timings and scheduling rules in the product specification. Check a one-character entry such as 给 and a multi-character entry such as 复习, with pointer and keyboard, at phone and desktop widths. Check both themes, reduced motion and enough content to scroll.
