import { SensorData } from "~/types";

//  杖の振り判定処理
export const stickRunChecker = (
  sensorData: SensorData,
  previousSensorData: SensorData
): boolean => {
  // 直前と現在の加速度の差分と0.5以上違いがあればtrueを返す
  const delta =
    Math.abs(sensorData.accel_x - previousSensorData.accel_x) +
    Math.abs(sensorData.accel_y - previousSensorData.accel_y) +
    Math.abs(sensorData.accel_z - previousSensorData.accel_z);

  return delta > 0.8; // 仮の判定
};
