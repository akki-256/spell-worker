//  呪文の判定処理
export const spellChecker = (
  userSpell: string,
  correctSpell: string
): boolean => {
  return userSpell.includes(correctSpell);
};
