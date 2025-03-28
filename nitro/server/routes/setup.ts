import { CorrectSpell } from "~/types";

let correctSpell: CorrectSpell;

// WebSocket: 呪文の取得 (ws: /spell)
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

      correctSpell = await message.json();
      //   console.log("correctSpell", correctSpell);

      peer.send({
        user: "server",
        message: correctSpell,
      });
    } catch (error) {
      peer.send({ user: "server", message: `Error: ${error.message}` });
    }
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});

export const getCorrectSpell = () => correctSpell;
