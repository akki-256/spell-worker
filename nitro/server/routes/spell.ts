import { spellChecker } from "~/utils/spellChecker";
import { getIsMoving } from "./stick.post";
import { ConvertedUserSpell, CorrectSpell } from "~/types";
import { sendPost } from "~/utils/sendPost";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: /spell)
export default defineWebSocketHandler({
  open(peer) {
    peer.send({ user: "server", message: "open" });
  },
  message: async (peer, message) => {
    try {
      // メッセージが空でないかチェック
      if (!message) {
        peer.send({ user: "server", message: "Error: empty message received" });
        return;
      }
      // 音声テキストの取得
      const userSpell: string = await message.data.toString();

      // 音声テキストのカタカナ変換
      const convertedUserSpell: ConvertedUserSpell = await sendPost(
        "/process",
        userSpell
      );
      //   console.log("userSpell", convertedUserSpell.message);

      // 杖の振り判定の取得
      const isMoving: boolean = getIsMoving();
      //   console.log("isMoving", isMoving);

      // 魔法の判定
      const magicSuccess = isMoving
        ? spellChecker(convertedUserSpell.message)
        : null;
      //   console.log("magicSuccess", magicSuccess);

      const sendData = {
        user: "server",
        message: { magicSuccess: magicSuccess, isMoving: isMoving },
      }
      peer.send(JSON.stringify(sendData));

    } catch (error) {
      peer.send({ user: "server", message: `Error: ${error.message}` });
    }
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});
