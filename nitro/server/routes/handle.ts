import { getIsMoving } from "./stick.post";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: /spell)
export default defineWebSocketHandler({
    open(peer) {
        peer.send({ user: "server", message: "open" });
    },
    message: async (peer) => {
        try {
            // 杖の振り判定の取得
            const isMoving: boolean = getIsMoving();

            peer.send({
                user: "server",
                message: { isMoving: isMoving },
            });
        } catch (error) {
            peer.send({ user: "server", message: `Error: ${error.message}` });
        }
    },
    close(peer) {
        peer.send({ user: "server", message: "close" });
    },
});
