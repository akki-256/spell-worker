import { SensorData } from "~/types";

//  杖の振り判定処理
export const stickRunChecker = (sensorData: SensorData): boolean => {
  return sensorData.accel_x < -0.02 ? true : false; // 仮の判定
};
