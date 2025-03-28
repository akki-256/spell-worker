import { SensorData } from "~/types";

//  杖の振り判定処理
export const stickRunChecker = (sensorData: SensorData,previousSensorData): boolean => {
  
  // console.log(previousSensorData.accel_x,sensorData.accel_x);
  let check = false;

  // 直前と現在の加速度の差分と0.2以上違いがあればtrueを返す
  if (Math.abs(0.2) < sensorData.accel_x - previousSensorData.accel_x || Math.abs(0.2) < sensorData.accel_y - previousSensorData.accel_y || Math.abs(0.2) < sensorData.accel_z - previousSensorData.accel_z){
    check = true;
  } else {
    check = false;
  }
  return check; // 仮の判定
};
