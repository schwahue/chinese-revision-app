# Word Bank recordings

The speaker plays a human recording on tap. The HSK and Personal collections look up the same recording by syllabus ID and the pinyin displayed on the detail page. Each distinct reading of 得 has its own recording. The two entries for 还 and the two readings of 谁 use the listener-approved WAVs. 谁 plays *shéi*, pauses for 400 ms, then plays *shuí*.

A recording is loaded when the learner presses the speaker. Leaving the detail page stops playback. Entries awaiting a recording have no speaker. The app serves the audio from its own files and needs no device voice or external pronunciation service.

The catalogue has audio for **930 of 1,000 entries**. The source index covers 927 MP3s. Three entries use the WAVs from the [listening trial](archive/2026-11-28/concepts_brief.md#listening-trial). You can also [compare the three readings of 得](listening-trial/human-de-readings.mp3). A failed playback offers a retry beside the pinyin. Listening leaves the learner’s progress unchanged.

## Recording sources

The [source index](../public/pronunciation-sources.json) maps each MP3 to its original recording. The [credits](../public/vocabulary-sources.txt) identify the speakers, collections, licences and conversions. The three trial WAVs are credited separately.

- Shtooka identifies the word in its FLAC tags and the reading in its tags or tone-number filename. Natural tone changes are preserved, including *ní hǎo* when speaking 你好. The conversion to MP3 preserves the original pacing and recording tags. 打电话 uses Congcong’s standalone take.
- The AISHELL-3 MP3s indexed under `audio/aishell3/` contain complete utterances. For a word taken from a longer recording, the index links to the original WAV with its start and end times. Each excerpt follows the speaker’s transcript and timing annotations at the original speed. The listener preferred a standalone take for 打电话.
- Additional recordings come from Wikimedia Commons and Chen Wang’s tone-labelled Audio-cmn syllables. The syllable recordings are used for individual one-syllable readings.
- The neutral-tone 子 uses the Taiwanese Ministry of Digital Affairs recording marked `zi5` in the CNS11643 collection.

## Adding a recording

Check both the headword and its reading against the source. For a word with multiple syllables, use a recording of someone saying the whole word. Save the MP3 in `public/pronunciation/` as `<syllabusId>-<pinyin>.mp3`, add the same key and the original source to the index, and credit the speaker and licence. If the displayed reading changes, the old key stops matching.

Run the pronunciation unit test to check the index against the files and catalogue. The pronunciation browser tests exercise the Word Bank speaker and decode every indexed MP3. Listening is still needed to judge pacing, clarity and accent.
