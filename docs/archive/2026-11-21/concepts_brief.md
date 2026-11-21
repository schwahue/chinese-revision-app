# Chinese reading revision

> Archived design · 21 November 2026. For current behaviour, see the [living pilot specification](../../../specification.md).

Historical brainstorming notes. The [contemporary UI and UX draft](specification.md) defines tap-to-define, automatic spacing and open-ended reading.

## What the learner does

Open the app and read a short sentence in simplified Chinese. Each sentence introduces or revisits one target word. Choose surrounding words the learner has already practised wherever possible, so it is clear what caused difficulty.

Tap any unfamiliar word. Reveal its pinyin and meaning independently. Read a common phrase that shows how the word is used. For a countable noun, include a natural measure-word phrase. For a verb, a common verb–object pairing is more useful.

For example, a review of the earlier word **书** might begin with **这本书很好看。** Its card gives **shū**, “book,” **看书** (“read a book”), and **一本书** (“one book”). On a later day, try **你想看哪本书？** with the hints hidden again.

## Word bank and daily review

Use the vocabulary section of the [official HSK 3.0 exam syllabus](https://download.chinesetest.cn/newhsk-site/Syllabus/H_DG_1110.pdf) for level assignments. Start new words at Level 3. Allow browsing and revision of earlier levels without an entry test. Write and check the teaching phrases and sentences separately.

Begin each session with due reviews, then introduce a few new words. Let the learner mark what needs another attempt, such as pronunciation, meaning, or a particular phrase. Opening a hint may simply reflect curiosity. Let the learner decide whether to practise that item again.

## Progress the learner can understand

Show what the learner has recalled unaided: the word alone, a familiar phrase, or the word in a fresh sentence on a later day. Keep these observations independent. A learner may understand a sentence from context while still wanting help pronouncing one character. Use self-assessment for pronunciation in the first version.

## Client-side app on GitHub Pages

Build the app with Vite, TypeScript, HTML and CSS. Publish the static build to GitHub Pages with the asset base set to the site's deployment path. Bundle the preset word bank and teaching sentences as JSON. Run word lookup, hint display and review scheduling in the browser.

Save progress by stable word ID and practice type in an app-specific localStorage key. Each browser keeps its own history. Clearing the site's browser data erases that history.

## First trial

Prepare ten Level 3 target words across several word types, each with a natural phrase and two different sentences. Try them across two short sessions. A useful check is whether a learner who requests help with one phrase gets another attempt at that phrase while keeping credit for the word they already recognise.
