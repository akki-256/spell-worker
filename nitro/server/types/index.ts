export interface CorrectSpell {
  [key: string]: string;
}

export type UserSpell = {
  userSpell: string;
};

export type ConvertedUserSpell = {
  message: string;
};

export type SensorData = {
  accel_x: number;
  accel_y: number;
  accel_z: number;
  angle_x: number;
  angle_y: number;
};
