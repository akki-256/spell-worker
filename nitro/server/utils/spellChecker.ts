import { getCorrectSpell } from "../routes/setup";
import { CorrectSpell } from "~/types";

//  呪文の判定処理
export const spellChecker = (userSpell: string): string => {
  // 正解呪文の取得
  const correctSpell: CorrectSpell = getCorrectSpell();
  //   console.log("correctSpell", correctSpell);

  const result = Object.entries(correctSpell).find(([key, value]) => {
    return userSpell.includes(value);
  });

  if (result) {
    // console.log(`戻り値：Key: ${result[0]}, Value: ${result[1]}`);
    return result[0]; // `key` を返す
  }

  return null;
};
