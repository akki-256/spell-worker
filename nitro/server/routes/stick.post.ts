import { SensorData } from "~/types";

let latestIsMoving: boolean = false; // 最新の加速度データを保存

//  REST API: ESP32の加速度取得 (/stick)
export default defineEventHandler(async (event) => {
  const sensorData: SensorData = await readBody(event);

  latestIsMoving = stickRunChecker(sensorData);

  //   console.log(sensorData);
  //   console.log("isMoving", latestIsMoving, sensorData.accel_x);

  return {
    success: true,
    isMoving: latestIsMoving,
  };
});

// WebSocket から取得できるようにする
export const getIsMoving = () => latestIsMoving;
