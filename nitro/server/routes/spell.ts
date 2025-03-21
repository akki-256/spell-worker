import { spellChecker } from "~/utils/spellChecker";
import { getIsMoving } from "./stick.post";
import { SpellMessage } from "~/types";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: /spell)
export default defineWebSocketHandler({
  open(peer) {
    peer.send({ user: "server", message: "open" });
  },
  message: async (peer, message) => {
    const spell: SpellMessage = await message.json();

    const isMoving = getIsMoving();
    const isSpellMatched = spellChecker(spell.userSpell, spell.correctSpell);
    const isMagicSuccess = isMoving && isSpellMatched;

    peer.send({
      user: "server",
      message: isMagicSuccess,
    });
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});
