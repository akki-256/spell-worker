//  呪文の判定処理
export const spellChecker = (
  userSpell: string,
  correctSpell: Record<string, string>
): string => {
  const entries = Object.entries(correctSpell);
  entries.forEach((element) => {
    if (userSpell.includes(element[1])) {
      return element[0];
    }
  });
  return null;
};
