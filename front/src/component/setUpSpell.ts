import allSpell from '../allSpell.json'

// ランダムにシャッフルする関数
const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const setUpSpell = (numberOfSpell: number) => {
    if (Object.keys(allSpell).length < numberOfSpell) {
        alert(`取得する呪文の数がすべての呪文のパターンを超過しています\n
                すべての呪文のパターン${Object.keys(allSpell).length} 
                取得する呪文のパターン${numberOfSpell}`)
    }
    // 辞書を配列に変換
    const entries = Object.entries(allSpell);
    // シャッフルして先頭から引数分だけ取得
    const shuffledEntries = shuffle(entries).slice(0, numberOfSpell);
    //objectに変換、このときキーはvoid1,void2....に設定
    const result: Record<string, { kata: string; kana: string }> = {};
    shuffledEntries.forEach((spell, index) => {
        const key = `void${index + 1}`
        result[key] = spell[1]
    })
    return result
};

export default setUpSpell