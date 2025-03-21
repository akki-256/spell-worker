#include <WiFi.h>

const char SSID[] = "SET-Wireless-AP-11ac";
const char PASSWD[] = "Wlan@SyskenNet#0";
const char server[] = "www.example.com";
const char pagepath[] = "/test.html";
const int port = 80;
const int LED_PIN = 32;

WiFiClient client;

void setup() {
  // put your setup code here, to run once:
    pinMode( LED_PIN, OUTPUT );
    Serial.begin(115200);
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(SSID);
    WiFi.begin(SSID, PASSWD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("");
    Serial.println("WiFi connected.");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

}

void loop() {
  // put your main code here, to run repeatedly:
  digitalWrite( LED_PIN, 1);
  if ( client.connect( server, port )) {
    client.print("GET ");
    client.print(pagepath);
    client.print(" HTTP/1.1\r\n");
    client.print("Host: ");
    client.print(server);
    client.print("\r\nConnection: close");
    client.print("\r\n\r\n");
  } else {
    client.print( "Failed to connect to server.");
  }

  while( client.connected() || client.available() ) {
    if( client.available() ) {
      char c = client.read();
      Serial.write( c );
    }
  }
  client.stop();

  delay( 100000 );
}
