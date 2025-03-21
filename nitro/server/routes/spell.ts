import { spellChecker } from "~/utils/spellChecker";
import { SpellMessage } from "~/types";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: spell)
export default defineWebSocketHandler({
  open(peer) {
    peer.send({ user: "server", message: "open" });
  },
  message: async (peer, message) => {
    const data: SpellMessage = await message.json();
    const { userSpell, correctSpell } = data;
    peer.send({
      user: "server",
      message: spellChecker(userSpell, correctSpell),
    });
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});
