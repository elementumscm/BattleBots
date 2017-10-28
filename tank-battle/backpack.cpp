#include <Wire.h>

#define DEBUG_MODE 0

// Address Pins
#define PIN_LEFT1 A6
#define PIN_LEFT2 A3
#define PIN_BACK A0
#define PIN_RIGHT1 A1
#define PIN_RIGHT2 A2

#define PIN_LASER1 7
#define PIN_LASER2 8
#define PIN_HIT 6

// I2C Defaults
#define I2C_DEFAULT_ADDRESS 0x0A
#define I2C_ACK_ADDRESS 0x0B
#define I2C_BUFFER_SIZE 5

byte buffer[I2C_BUFFER_SIZE];
bool shoot = false;
bool acknowledge = false;

bool isTriggeredLeft1;
bool isTriggeredLeft2;
bool isTriggeredRight1;
bool isTriggeredRight2;
bool isTriggeredBack;
bool isHit;

int left1counter;
int left2counter;
int right1counter;
int right2counter;
int backCounter;
int acknowledgeCounter;
int battery;

int LEFT1;
int SLEFT1;
int LEFT2;
int SLEFT2;
int RIGHT1;
int SRIGHT1;
int RIGHT2;
int SRIGHT2;
int BACK;
int SBACK;
int PLEFT1 = 1024;
int PLEFT2 = 1024;
int PRIGHT1 = 1024;
int PRIGHT2 = 1024;
int PBACK = 1024;

void processSensor(bool &isTriggered, int &value, int &shootValue, int &previousValue, int &counter) {
  if(!isTriggered && (value > previousValue + 100)) {
    counter = 10;
    isTriggered = true;
    shootValue = value;
  }

  if(isTriggered && counter == 0){
    isTriggered = false;
    if(shootValue - value > 50 && !acknowledge){
      isHit = true;
    }
  }

  previousValue = value;
}

void decrementCounter(int &counter) {
  if (counter > 0) {
    counter--;
  }
}

void setup() {
  shoot = false;
  pinMode(PIN_LASER1, OUTPUT);
  pinMode(PIN_LASER2, OUTPUT);
  pinMode(PIN_HIT, OUTPUT);
  Wire.begin (I2C_DEFAULT_ADDRESS);
  Wire.onReceive(receiveEvent);
}

void loop() {
  LEFT1 = analogRead(PIN_LEFT1);
  LEFT2 = analogRead(PIN_LEFT2);
  RIGHT1 = analogRead(PIN_RIGHT1);
  RIGHT2 = analogRead(PIN_RIGHT2);
  BACK = analogRead(PIN_BACK);

  processSensor(isTriggeredLeft1, LEFT1, SLEFT1, PLEFT1, left1counter);
  processSensor(isTriggeredLeft2, LEFT2, SLEFT2, PLEFT2, left2counter);
  processSensor(isTriggeredRight1, RIGHT1, SRIGHT1, PRIGHT1, right1counter);
  processSensor(isTriggeredRight2, RIGHT2, SRIGHT2, PRIGHT2, right2counter);
  processSensor(isTriggeredBack, BACK, SBACK, PBACK, backCounter);

  if(shoot){
    battery = 8;
    shoot = false;
    digitalWrite(PIN_LASER1, HIGH);   // turn the LASER on (HIGH is the voltage level)
    digitalWrite(PIN_LASER2, HIGH);   // turn the LASER on (HIGH is the voltage level)
  }

  if(isHit){
    digitalWrite(PIN_HIT, HIGH);
  }

  delay(50);
  
  if (battery == 0) {
    digitalWrite(PIN_LASER1, LOW);    // turn the LASER off by making the voltage LOW
    digitalWrite(PIN_LASER2, LOW);    // turn the LASER off by making the voltage LOW
  }

  if (acknowledgeCounter == 0) {
    acknowledge = false;
  }

  if (acknowledgeCounter > 0) {
    isHit = false;
    digitalWrite(PIN_HIT, LOW);
  }

  decrementCounter(battery);
  decrementCounter(left1counter);
  decrementCounter(left2counter);
  decrementCounter(right1counter);
  decrementCounter(right2counter);
  decrementCounter(backCounter);
  decrementCounter(acknowledgeCounter);
}

// called by interrupt service routine when incoming data arrives
void receiveEvent (int numBytes)
{
  if(numBytes >= 2) {
    if(Wire.read()==1){
      shoot = true;
    }
    if(Wire.read()==1){
      acknowledge = true;
      acknowledgeCounter = 10;      
    }
  }
  while(Wire.available()){
    Wire.read();
  }   
}