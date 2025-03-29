import { getIsMoving } from "./stick.post";
import { EventEmitter } from "events";

// 加速度が変わるたびにフロントにsseで送信
export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);
  const eventEmitter = new EventEmitter();

  const push = (isMoving: boolean) => {
    eventStream.push(`${isMoving}`);
  };

  eventEmitter.on("stickRun", push);

  const interval = setInterval(async () => {
    // 杖の振り判定の取得
    const isMoving: boolean = await getIsMoving();
    eventEmitter.emit("stickRun", isMoving);
  }, 100);

  eventStream.onClosed(async () => {
    clearInterval(interval);
    eventEmitter.off("stickRun", push);
    await eventStream.close();
  });
});
