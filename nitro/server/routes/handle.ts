import { getIsMoving } from "./stick.post";

// WebSocket: 呪文と音声テキストの取得と魔法判定の返却 (ws: /spell)
export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);

  const interval = setInterval(async () => {
    // 杖の振り判定の取得
    const isMoving: boolean = await getIsMoving();
    await eventStream.push(`${isMoving}`);
  }, 100);

  eventStream.onClosed(async () => {
    clearInterval(interval);
    await eventStream.close();
  });

  return eventStream.send();
});
