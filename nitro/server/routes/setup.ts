import { CorrectSpell } from "~/types";

let correctSpell: CorrectSpell;

// WebSocket: 呪文の取得 (ws: /spell)
export default defineWebSocketHandler({
  open(peer) {
    peer.send({ user: "server", message: "open" });
  },
  message: async (peer, message) => {
    correctSpell = await message.json();

    peer.send({
      user: "server",
      message: correctSpell,
    });
  },
  close(peer) {
    peer.send({ user: "server", message: "close" });
  },
});

export const getCorrectSpell = () => correctSpell;
