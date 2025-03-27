import { spellChecker } from "~/utils/spellChecker";
import { getIsMoving } from "./stick.post";
import { CorrectSpell } from "~/types";
import { getCorrectSpell } from "./setup";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: /spell)
export default defineWebSocketHandler({
  open(peer) {
    peer.send({ user: "server", message: "open" });
  },
  message: async (peer, message) => {
    const userSpell: string = await message.json();
    const correctSpell: CorrectSpell = getCorrectSpell();
    const isMoving: boolean = getIsMoving();

    const magicSuccess = isMoving
      ? spellChecker(userSpell, correctSpell.jsontype)
      : null;

    peer.send({
      user: "server",
      message: { magicSuccess: magicSuccess, isMoving: isMoving },
    });
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});
