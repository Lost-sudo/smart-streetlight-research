#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

// ======================================================
// WIFI & SERVER CONFIG
// ======================================================

const char* ssid = "FTTH";
const char* password = "ParaonWifi19701976";

const char* serverUrl =
  "http://192.168.1.36:8000/streetlight_log/telemetry";

const char* deviceId = "SL-001";

// ======================================================
// PIN CONFIGURATION
// ======================================================

#define LDR_PIN        32
#define CURRENT_PIN    34
#define VOLTAGE_PIN    35

#define RELAY1_CTRL    25
#define RELAY2_CTRL    26

#define MOSFET_PIN     14

int buttons[8] = {4, 16, 17, 18, 19, 21, 22, 23};

// ======================================================
// SYSTEM STATE
// ======================================================

bool lastButtonState[8];
int currentMode = 0;

// WARNING: Order MUST match server FAULT_TYPE_MAP exactly!
//   model: {0:NORMAL, 1:VOLT_FLUCT, 2:OVERCURRENT, 3:SENSOR_DEG,
//           4:LAMP_DEG, 5:SYSTEM_FAILURE, 6:INTERMITTENT}
//   Index 7 (COMMUNICATION_FAULT) is IoT-only — telemetry is skipped.
const char* faultNames[8] = {
  "NORMAL",
  "VOLTAGE_FLUCTUATION",
  "OVERCURRENT",
  "SENSOR_DEGRADATION",
  "LAMP_DEGRADATION",
  "SYSTEM_FAILURE",
  "INTERMITTENT_FAULT",
  "COMMUNICATION_FAULT"
};

// ======================================================
// MODE-SPECIFIC BASE VALUES  (from training data stats)
// ======================================================
//
// Training data per-mode stats (streetlight_dataset_augmented_V14):
//                        V (mean)  I (mean)  P (mean)   P/(V·I)
//   Mode 0  NORMAL:       11.13V    0.35A     4.06W     1.006
//   Mode 1  VOLT_FLUCT:   11.65V    0.33A     3.88W     1.040
//   Mode 2  OVERCURRENT:  11.16V    0.79A     4.18W     0.473 ← !!
//   Mode 3  SENSOR_DEG:   11.95V    0.16A     1.95W     1.005
//   Mode 4  LAMP_DEG:      8.96V    0.96A     3.63W     0.475 ← !!
//   Mode 5  SYSTEM_FAIL:   0.00V    0.00A     0.00W      —
//   Mode 6  INTERMITTENT: 11.92V    0.26A     3.00W     1.000
//
// IMPORTANT: Modes 2 (OVERCURRENT) and 4 (LAMP_DEGRADATION) have
// power factor ~0.47 in the training data.  The IoT must compute
// power = V × I × powerFactor to match the model's expected
// distribution.  Without this, the model sees out-of-range power
// values and misclassifies (e.g., OVCURRENT reported as NORMAL).

struct ModeParams {
  float baseVoltage;        // centre voltage (V)
  float voltageNoise;       // ± random noise added (V)
  float baseCurrent;        // centre current (A)  — OVCURRENT must be > 0.80A to
                            //   clearly separate from NORMAL (max in training = 0.80A)
  float currentNoise;       // ± random noise (A)
  float powerFactor;        // P = V × I × powerFactor  (matches training data)
  float ldrCenter;          // centre LDR reading
  float ldrNoise;           // ± LDR noise
  float currentDropProb;    // probability current → 0
  float voltageDrift;       // per-reading drift for fluctuation modes
};

const ModeParams MODE_PARAMS[8] = {
  // mode 0: NORMAL
  { 11.2, 0.15,  0.35, 0.04,  1.00,  350, 30,   0.0,  0.0 },
  // mode 1: VOLTAGE_FLUCTUATION — high voltage swing, low current
  { 11.6, 3.50,  0.33, 0.06,  1.00,  230, 20,   0.0,  1.5 },
  // mode 2: OVERCURRENT — current > 0.80A to beat NORMAL max, power factor 0.473
  { 11.2, 0.15,  1.20, 0.20,  0.47,  240, 25,   0.0,  0.0 },
  // mode 3: SENSOR_DEGRADATION — consistently LOW current, erratic LDR
  { 11.9, 0.30,  0.16, 0.05,  1.00,  190, 120,  0.0,  0.0 },
  // mode 4: LAMP_DEGRADATION — low voltage, high current, power factor 0.475
  { 8.9,  0.30,  1.20, 0.15,  0.48,  210, 15,   0.0,  0.0 },
  // mode 5: SYSTEM_FAILURE — everything near zero
  { 0.0,  0.01,  0.0,  0.002, 1.00,  145, 20,   0.0,  0.0 },
  // mode 6: INTERMITTENT_FAULT — current often zero, voltage normal
  { 11.9, 0.30,  0.40, 0.08,  1.00,  180, 25,   0.35, 0.0 },
  // mode 7: COMMUNICATION_FAULT — data not sent (telemetry skipped)
  { 11.2, 0.15,  0.35, 0.04,  1.00,  350, 30,   0.0,  0.0 },
};

// ======================================================
// SENSOR CONFIG
// ======================================================

const int DARK_THRESHOLD = 1500;

const float VOLTAGE_SCALE = 5.0;

float Vzero = 0;

// ======================================================
// VOLTAGE DRIFT STATE (voltage fluctuation mode)
// ======================================================

float driftedVoltage = 11.2;

// ======================================================
// TELEMETRY CONFIG
// ======================================================

const unsigned long TELEMETRY_INTERVAL = 5000;
unsigned long lastTelemetryTime = 0;

// ======================================================
// SERIAL MONITOR CONFIG
// ======================================================

const unsigned long SERIAL_INTERVAL = 1000;
unsigned long lastSerialTime = 0;

// ======================================================
// INTERMITTENT FAULT STATE
// ======================================================

bool intermittentState = false;
unsigned long lastSwitchTime = 0;
unsigned long switchInterval = 2000;

// ======================================================
// RELAY STATE
// ======================================================

bool relay2State = true;
unsigned long relay2LastToggle = 0;

// ======================================================
// PWM CONFIG
// ======================================================

const int PWM_FREQ = 5000;
const int PWM_RESOLUTION = 8;

// ======================================================
// WIFI CONNECTION
// ======================================================

void connectWiFi() {

  Serial.println();
  Serial.print("Connecting to WiFi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 30) {

    delay(500);
    Serial.print(".");
    retry++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi Connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

  } else {

    Serial.println("WiFi Connection Failed");
  }
}

// ======================================================
// WIFI AUTO RECONNECT
// ======================================================

void ensureWiFiConnection() {

  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("WiFi Lost. Reconnecting...");

  WiFi.disconnect();
  WiFi.reconnect();

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 10) {

    delay(300);
    Serial.print(".");
    retry++;
  }

  Serial.println();
}

// ======================================================
// TIME SYNC
// ======================================================

void syncTime() {

  configTime(8 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Syncing time");

  time_t now = time(nullptr);

  int retry = 0;

  while (now < 100000 && retry < 20) {

    delay(500);
    Serial.print(".");

    now = time(nullptr);
    retry++;
  }

  Serial.println();

  if (now > 100000) {

    Serial.println("Time synchronized");

  } else {

    Serial.println("NTP sync failed");
  }
}

// ======================================================
// ISO TIMESTAMP
// ======================================================

String getTimestamp() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00Z";
  }

  char buffer[30];

  strftime(
    buffer,
    sizeof(buffer),
    "%Y-%m-%dT%H:%M:%SZ",
    &timeinfo
  );

  return String(buffer);
}

// ======================================================
// MODE-AWARE SENSOR READINGS
// ======================================================

float getModeVoltage() {

  const ModeParams& p = MODE_PARAMS[currentMode];

  if (currentMode == 1) {
    // Voltage fluctuation: accumulate drift for realistic rolling std
    driftedVoltage += random(-30, 30) / 100.0 * p.voltageDrift;
    // Keep within plausible bounds
    driftedVoltage = constrain(driftedVoltage, 8.0, 15.0);
    return driftedVoltage + random(-100, 100) / 100.0 * p.voltageNoise;
  }

  if (currentMode == 5) {
    // SYSTEM_FAILURE: near zero
    return random(0, 5) / 1000.0;
  }

  float v = p.baseVoltage + random(-100, 100) / 100.0 * p.voltageNoise;
  return max(v, 0.0f);
}

float getModeCurrent() {

  const ModeParams& p = MODE_PARAMS[currentMode];

  if (currentMode == 5) {
    // SYSTEM_FAILURE: near zero
    return random(0, 10) / 1000.0;
  }

  // Some modes have a probability of current dropping to zero
  if (p.currentDropProb > 0 && random(0, 1000) / 1000.0 < p.currentDropProb) {
    return 0.0;
  }

  float c = p.baseCurrent + random(-100, 100) / 100.0 * p.currentNoise;
  return max(c, 0.0f);
}

// ======================================================
// SEND TELEMETRY
// ======================================================

void sendTelemetry(
  float voltage,
  float current,
  float power,
  int lightIntensity,
  int pwm
) {

  ensureWiFiConnection();

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("Skipping telemetry: WiFi unavailable");
    return;
  }

  HTTPClient http;

  http.begin(serverUrl);

  http.setTimeout(1000);

  http.addHeader("Content-Type", "application/json");

  String json = "{";

  json += "\"device_id\":\"" + String(deviceId) + "\",";
  json += "\"voltage\":" + String(voltage, 2) + ",";
  json += "\"current\":" + String(current, 3) + ",";
  json += "\"power_consumption\":" + String(power, 2) + ",";
  json += "\"light_intensity\":" + String(lightIntensity) + ",";
  json += "\"pwm\":" + String(pwm) + ",";
  json += "\"timestamp\":\"" + getTimestamp() + "\"";

  json += "}";

  int responseCode = http.POST(json);

  Serial.println();
  Serial.println("========== TELEMETRY ==========");

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);

  if (responseCode > 0) {

    String response = http.getString();

    Serial.print("Server Response: ");
    Serial.println(response);

  } else {

    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(responseCode));
  }

  Serial.print("Payload: ");
  Serial.println(json);

  Serial.println("================================");

  http.end();
}

// ======================================================
// CURRENT SENSOR CALIBRATION
// ======================================================

float calibrateOffset() {

  long sum = 0;

  for (int i = 0; i < 300; i++) {

    sum += analogRead(CURRENT_PIN);
  }

  return sum / 300.0;
}

// ======================================================
// CURRENT SENSOR (raw ADC)
// ======================================================

float getRawCurrent() {

  long sum = 0;

  for (int i = 0; i < 20; i++) {

    sum += analogRead(CURRENT_PIN);
  }

  float raw = sum / 20.0;

  float diff = raw - Vzero;

  float voltage = (diff / 4095.0) * 3.3;

  return voltage / 0.185;
}

// ======================================================
// VOLTAGE SENSOR (raw ADC → scaled to model range)
// ======================================================

float getRawVoltage() {

  long sum = 0;

  for (int i = 0; i < 10; i++) {

    sum += analogRead(VOLTAGE_PIN);
  }

  float raw = sum / 10.0;

  float voltage = (raw / 4095.0) * 3.3;

  return voltage * VOLTAGE_SCALE;
}

// ======================================================
// PWM ENGINE
// ======================================================

int applyPWM(bool night) {

  // SYSTEM_FAILURE (mode 5) — everything off
  if (currentMode == 5) {

    ledcWrite(MOSFET_PIN, 0);
    return 0;
  }

  if (!night) {

    ledcWrite(MOSFET_PIN, 0);
    return 0;
  }

  int pwmValue = 0;

  switch (currentMode) {

    case 0:
    case 7:
      pwmValue = 255;
      break;

    case 1:
      pwmValue = random(120, 255);
      break;

    case 2:
      pwmValue = (millis() % 2000 < 300)
                 ? 0
                 : 220;
      break;

    case 3:
      pwmValue = (random(0, 100) < 40)
                 ? 0
                 : random(180, 255);
      break;

    case 4:
      pwmValue = (random(0, 100) < 50)
                 ? 0
                 : random(20, 180);
      break;

    case 6:
      pwmValue = intermittentState
                 ? random(180, 255)
                 : 0;
      break;

    default:
      pwmValue = 200;
      break;
  }

  pwmValue = constrain(pwmValue, 0, 255);

  ledcWrite(MOSFET_PIN, pwmValue);

  return pwmValue;
}

// ======================================================
// RELAY ENGINE
// ======================================================

void updateRelay2(bool night) {

  // SYSTEM_FAILURE (mode 5) — everything off
  if (currentMode == 5) {

    digitalWrite(RELAY2_CTRL, LOW);
    return;
  }

  if (currentMode <= 2 || currentMode == 7) {

    digitalWrite(RELAY2_CTRL, night ? HIGH : LOW);
    return;
  }

  if (currentMode == 3) {

    if (random(0, 100) < 25) {

      digitalWrite(RELAY2_CTRL, LOW);

    } else {

      digitalWrite(RELAY2_CTRL, night ? HIGH : LOW);
    }

    return;
  }

  if (currentMode == 4) {

    if (millis() - relay2LastToggle > random(300, 1200)) {

      relay2State = !relay2State;
      relay2LastToggle = millis();
    }

    digitalWrite(RELAY2_CTRL, relay2State);

    return;
  }

  if (currentMode == 6) {

    if (millis() - lastSwitchTime > switchInterval) {

      intermittentState = !intermittentState;

      lastSwitchTime = millis();

      switchInterval = random(1000, 5000);
    }

    digitalWrite(
      RELAY2_CTRL,
      intermittentState ? HIGH : LOW
    );

    return;
  }
}

// ======================================================
// BUTTON HANDLER
// ======================================================

void checkButtons() {

  for (int i = 0; i < 8; i++) {

    bool state = digitalRead(buttons[i]);

    if (lastButtonState[i] == HIGH && state == LOW) {

      currentMode = i;
      // Reset voltage drift on mode change
      driftedVoltage = MODE_PARAMS[currentMode].baseVoltage;

      Serial.print("MODE CHANGED TO: ");
      Serial.println(faultNames[currentMode]);
    }

    lastButtonState[i] = state;
  }
}

// ======================================================
// SETUP
// ======================================================

void setup() {

  Serial.begin(115200);

  randomSeed(analogRead(33));

  pinMode(LDR_PIN, INPUT);
  pinMode(CURRENT_PIN, INPUT);
  pinMode(VOLTAGE_PIN, INPUT);

  pinMode(RELAY1_CTRL, OUTPUT);
  pinMode(RELAY2_CTRL, OUTPUT);

  digitalWrite(RELAY1_CTRL, LOW);
  digitalWrite(RELAY2_CTRL, LOW);

  ledcAttach(MOSFET_PIN, PWM_FREQ, PWM_RESOLUTION);

  for (int i = 0; i < 8; i++) {

    pinMode(buttons[i], INPUT_PULLUP);
    lastButtonState[i] = HIGH;
  }

  connectWiFi();

  syncTime();

  Serial.println("Calibrating current sensor...");

  delay(1000);

  Vzero = calibrateOffset();

  Serial.print("Current Offset: ");
  Serial.println(Vzero);

  // Initialise drift voltage
  driftedVoltage = MODE_PARAMS[0].baseVoltage;

  Serial.println("System Ready");
}

// ======================================================
// MAIN LOOP
// ======================================================

void loop() {

  checkButtons();

  const ModeParams& p = MODE_PARAMS[currentMode];

  // ======================================================
  // LDR READING
  // ======================================================

  int ldrValue = analogRead(LDR_PIN);
  ldrValue = constrain(ldrValue, 0, 4095);

  bool isNight = (ldrValue < DARK_THRESHOLD);

  // ======================================================
  // RELAY CONTROL
  // ======================================================

  // SYSTEM_FAILURE (mode 5) — everything off
  if (currentMode == 5) {

    digitalWrite(RELAY1_CTRL, LOW);

  } else {

    digitalWrite(
      RELAY1_CTRL,
      isNight ? HIGH : LOW
    );
  }

  updateRelay2(isNight);

  // ======================================================
  // MODE-SPECIFIC SENSOR READINGS
  // ======================================================

  float voltage = getModeVoltage();
  float finalCurrent = getModeCurrent();

  // ======================================================
  // POWER COMPUTATION  (apply per-mode power factor)
  //
  // Training data for OVCURRENT (mode 2) and LAMP_DEG (mode 4)
  // has power ≈ V × I × 0.47.  All other modes use unity factor.
  // Without this factor, the model sees out-of-distribution power
  // and misclassifies the fault.
  // ======================================================

  float power = voltage * fabs(finalCurrent) * p.powerFactor;

  // ======================================================
  // PWM
  // ======================================================

  int pwmValue = applyPWM(isNight);

  // ======================================================
  // TELEMETRY (every 5 seconds)
  // ======================================================

  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {

    // COMMUNICATION_FAULT (mode 7): skip sending
    if (currentMode != 7) {

      sendTelemetry(
        voltage,
        finalCurrent,
        power,
        ldrValue,
        pwmValue
      );

    } else {

      Serial.println(
        "Mode 7 (COMMUNICATION_FAULT): "
        "Telemetry skipped"
      );
    }

    lastTelemetryTime = millis();
  }

  // ======================================================
  // SERIAL OUTPUT (every 1 second)
  // ======================================================

  if (millis() - lastSerialTime >= SERIAL_INTERVAL) {

    lastSerialTime = millis();

    Serial.print("LDR: ");
    Serial.print(ldrValue);

    Serial.print(" | Voltage: ");
    Serial.print(voltage, 2);

    Serial.print(" | Current: ");
    Serial.print(finalCurrent, 3);

    Serial.print(" | Power: ");
    Serial.print(power, 4);

    Serial.print(" | PWM: ");
    Serial.print(pwmValue);

    Serial.print(" | Mode: ");
    Serial.println(faultNames[currentMode]);
  }
}