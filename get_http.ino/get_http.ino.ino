#include "driver/adc.h"
#include "esp_adc_cal.h"
#include <math.h>
#include <WiFi.h>

// 加速度センサーの設定
const float OFFSET_X = 1.65, OFFSET_Y = 1.65, OFFSET_Z = 1.65;
const float SENS_X = 660.0, SENS_Y = 660.0, SENS_Z = 660.0;
esp_adc_cal_characteristics_t adcChar;

float volt_x, volt_y, volt_z, accel_x, accel_y, accel_z;
float angle_x, angle_y;

// WiFi情報
const char* ssid = "SET-Wireless-AP";
const char* password = "Wlan@SyskenNet#0";
const char* host = "10.4.13.102";  // サーバーのIPアドレス
const int httpPort = 3000;
String path = "/stick";

// 傾きを計算
void conv_angle(float x, float y, float z, float* x_angle, float* y_angle) {
  *x_angle = atan2(x, sqrt(y * y + z * z)) * 180.0 / PI;
  *y_angle = atan2(y, sqrt(x * x + z * z)) * 180.0 / PI;
}

// WiFi接続
void wificonnect() {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// ESP32設定
void setup() {
  Serial.begin(115200);
  wificonnect(); // WiFi接続を追加
  
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
  adc1_config_channel_atten(ADC1_CHANNEL_3, ADC_ATTEN_DB_11);
  adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11);
  esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 1100, &adcChar);
}

void loop() {
  delay(100);

  uint32_t mvolt;
  esp_adc_cal_get_voltage(ADC_CHANNEL_0, &adcChar, &mvolt);
  volt_x = (float)mvolt / 1000.0;
  esp_adc_cal_get_voltage(ADC_CHANNEL_3, &adcChar, &mvolt);
  volt_y = (float)mvolt / 1000.0;
  esp_adc_cal_get_voltage(ADC_CHANNEL_6, &adcChar, &mvolt);
  volt_z = (float)mvolt / 1000.0;

  accel_x = (volt_x - OFFSET_X) / (SENS_X / 1000);
  accel_y = (volt_y - OFFSET_Y) / (SENS_Y / 1000);
  accel_z = (volt_z - OFFSET_Z) / (SENS_Z / 1000);

  Serial.print("X:");
  Serial.print(accel_x);
  Serial.print(" Y:");
  Serial.print(accel_y);
  Serial.print(" Z:");
  Serial.println(accel_z);

  conv_angle(accel_x, accel_y, accel_z, &angle_x, &angle_y);
  Serial.print("Angle X-Y: ");
  Serial.print(angle_x);
  Serial.print("   Y-Z: ");
  Serial.println(angle_y);

  // WiFi接続の確認
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected... Reconnecting");
    wificonnect();
  }

  // サーバーに接続
  Serial.print("Connecting to ");
  Serial.println(host);

  WiFiClient client;
  if (!client.connect(host, httpPort)) {
    Serial.println("Connection failed");
    return;
  }

  // POSTデータの作成
  String postdata = "accel_x=" + String(accel_x) + 
                    "&accel_y=" + String(accel_y) + 
                    "&accel_z=" + String(accel_z) + 
                    "&angle_x=" + String(angle_x) + 
                    "&angle_y=" + String(angle_y);

  client.print("POST " + path + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/x-www-form-urlencoded\r\n" +
               "Content-Length: " + String(postdata.length()) + "\r\n" +
               "Connection: close\r\n\r\n" +
               postdata);

  // サーバーのレスポンスを確認
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println(">>> Client Timeout !");
      client.stop();
      return;
    }
  }

  while (client.available()) {
    String line = client.readStringUntil('\r');
    Serial.print(line);
  }
  Serial.println("\nClosing connection");
}
