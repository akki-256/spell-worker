import { SensorData } from '~/types';
import { eventEmitter } from '~/utils/sendStick';

let latestIsMoving: boolean = false; // 最新の加速度データを保存
let previousSensorData: SensorData | null = null; // 直前の加速度データを保存
let previousIsMoving: boolean = false; //直前のtrue falseを保存

//  REST API: ESP32の加速度取得 (/stick)
export default defineEventHandler(async (event) => {
  const sensorData: SensorData = await readBody(event);

  if (previousSensorData) {
    latestIsMoving = stickRunChecker(sensorData, previousSensorData);

    // const x = sensorData.accel_x - previousSensorData.accel_x;
    // const y = sensorData.accel_y - previousSensorData.accel_y;
    // const z = sensorData.accel_z - previousSensorData.accel_z;
    // console.log(
    //   'isMoving',
    //   latestIsMoving,
    //   sensorData.accel_x,
    //   sensorData.accel_y,
    //   sensorData.accel_z,
    //   sensorData.angle_x,
    //   sensorData.angle_y,
    //   Math.abs(x).toPrecision(3),
    //   Math.abs(y).toPrecision(3),
    //   Math.abs(z).toPrecision(3),
    // );
  } else {
    latestIsMoving = false;
  }

  previousSensorData = sensorData;
  if (latestIsMoving !== previousIsMoving) {
    eventEmitter.emit('stickRun', { isMoving: latestIsMoving });
  }
  previousIsMoving = latestIsMoving;

  return {
    success: true,
    isMoving: latestIsMoving,
  };
});

// WebSocket から取得できるようにする
export const getIsMoving = () => latestIsMoving;
