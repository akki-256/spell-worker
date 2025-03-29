import { getIsMoving } from './stick.post';
import { eventEmitter } from '~/utils/sendStick';

// 加速度が変わるたびにフロントにsseで送信
export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);

  console.log('stickRun start');

  // const push = (isMoving: boolean) => {
  //   console.log('stickRun push', isMoving);
  //   eventStream.push(JSON.stringify(isMoving));
  // };

  // eventEmitter.on('stickRun', push);
  console.log('stickRun push', 'eventEmitter.on');

  eventEmitter.on('stickRun', async ({ isMoving }) => {
    console.log('stickRun push', isMoving);
    await eventStream.push(JSON.stringify(isMoving));
  });

  // const interval = setInterval(async () => {
  //   // 杖の振り判定の取得
  //   const isMoving: boolean = await getIsMoving();
  //   eventEmitter.emit('stickRun', isMoving);
  //   console.log('stickRun', isMoving);
  // }, 100);

  eventStream.onClosed(async () => {
    // eventEmitter.off('stickRun', push);
    await eventStream.close();
  });
  return eventStream.send();
});
