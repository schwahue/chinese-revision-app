// Learning notes mix English prose, Han characters and tone-marked pinyin.
export function learningText(text: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return escaped.replace(/\p{Script=Han}+|[a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][\p{Script=Latin}]*/giu, run => {
    const lang = /\p{Script=Han}/u.test(run) ? "zh-Hans" : "zh-Latn";
    return `<span lang="${lang}">${run}</span>`;
  });
}
