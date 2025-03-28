import { SensorData } from "~/types";

let latestIsMoving: boolean = false; // 最新の加速度データを保存
let previousSensorData: SensorData | null = null; // 直前の加速度データを保存

//  REST API: ESP32の加速度取得 (/stick)
export default defineEventHandler(async (event) => {
  const sensorData: SensorData = await readBody(event);

  if (previousSensorData) {
    latestIsMoving = stickRunChecker(sensorData,previousSensorData);
  } else {
    latestIsMoving = false;
  }

  // console.log(sensorData);
  // console.log("isMoving", latestIsMoving, sensorData.accel_x ,sensorData.accel_y, sensorData.accel_z, sensorData.angle_x, sensorData.angle_y);

  previousSensorData = sensorData;

  return {
    success: true,
    isMoving: latestIsMoving,
  };
});

// WebSocket から取得できるようにする
export const getIsMoving = () => latestIsMoving;
