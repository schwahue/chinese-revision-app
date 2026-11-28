export function characterAssetPath(character: string) {
  return "hanzi/" + character.codePointAt(0)!.toString(16) + ".json";
}
