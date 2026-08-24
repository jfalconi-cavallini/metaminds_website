# Arduino & Physical Computing

---

## Overview

```yaml
subject: Arduino
title: Arduino: Physical Computing and Electronics
level: middle_to_high_school
grades: [6, 7, 8, 9, 10, 11, 12]
estimated_hours: 15–25
prerequisites: [Basic programming (Scratch or Python helpful)]
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
```

Arduino sits at the intersection of electronics, programming, and physical making. Students write C/C++ code that controls real hardware: LEDs, sensors, motors, displays. It is the best way to make programming feel real and tangible to students who think "I just want to build things."

Arduino is used in:
- Science fair projects
- Robotics (as a controller)
- Home automation projects
- Art installations
- Engineering courses

---

## Hardware Students Need

| Item | Cost | Required? |
|------|------|---------|
| Arduino Uno (or Nano) | ~$20–25 | Yes |
| USB Cable | ~$5 | Yes |
| Breadboard | ~$5 | Yes |
| Jumper Wires | ~$8 | Yes |
| LED Kit | ~$5 | Yes |
| Resistor Kit (220Ω, 10kΩ) | ~$8 | Yes |
| Starter Kit (all above) | ~$35 | Recommended |
| DHT11 Sensor | ~$5 | Module 4+ |
| Ultrasonic (HC-SR04) | ~$5 | Module 4+ |
| Servo Motor | ~$8 | Module 5+ |
| LCD Display | ~$8 | Module 5+ |

Recommended: Arduino Starter Kit (~$50) or Elegoo Starter Kit (~$35) for everything at once.

---

## Module Structure

### Module 1: Introduction to Arduino
**Duration:** 1–2 sessions

Lessons:
1. What Is Arduino? (difficulty: 1)
2. Arduino Uno Overview: Pins, Power, USB (difficulty: 1)
3. Setting Up the Arduino IDE (difficulty: 1)
4. Uploading Your First Sketch: Blink (difficulty: 1)
5. Understanding setup() and loop() (difficulty: 1)
6. Breadboard Basics (difficulty: 1)
7. How to Read a Wiring Diagram (difficulty: 2)

---

### Module 2: Digital Outputs
**Duration:** 1–2 sessions

Lessons:
1. Digital Pins: HIGH vs. LOW (difficulty: 1)
2. LED Circuit: Resistors & Wiring (difficulty: 2)
3. Controlling Multiple LEDs (difficulty: 2)
4. Timing with delay() (difficulty: 1)
5. Binary Counter with LEDs (difficulty: 3)
6. Traffic Light Project (difficulty: 2)

---

### Module 3: Digital Inputs
**Duration:** 1–2 sessions

Lessons:
1. Push Button Circuit (difficulty: 2)
2. Reading Digital Inputs: digitalRead() (difficulty: 2)
3. Debouncing Buttons (difficulty: 3)
4. Toggle Switch with an LED (difficulty: 2)
5. Button-Controlled Patterns (difficulty: 3)

---

### Module 4: Analog I/O
**Duration:** 1–2 sessions

Lessons:
1. Analog vs. Digital Signals (difficulty: 2)
2. Potentiometer: Reading Analog Input (difficulty: 2)
3. analogRead() and the ADC (difficulty: 2)
4. Mapping Values: map() Function (difficulty: 2)
5. PWM: analogWrite() for Dimming LEDs (difficulty: 3)
6. LED Brightness Control with Potentiometer (difficulty: 2)

---

### Module 5: Sensors
**Duration:** 2–3 sessions

Lessons:
1. Temperature & Humidity: DHT11 Sensor (difficulty: 3)
2. Ultrasonic Distance Sensor: HC-SR04 (difficulty: 3)
3. Photoresistor: Light Sensor (difficulty: 2)
4. Piezo Buzzer: Generating Tones (difficulty: 2)
5. Passive Infrared (PIR) Motion Sensor (difficulty: 3)
6. Sensor Data Logging to Serial Monitor (difficulty: 3)

---

### Module 6: Motors & Actuators
**Duration:** 2–3 sessions

Lessons:
1. Servo Motor: Controlling Angle (difficulty: 3)
2. DC Motor with L298N Motor Driver (difficulty: 4)
3. Stepper Motor Basics (difficulty: 4)
4. Controlling Motor Speed with PWM (difficulty: 3)
5. Direction Control: H-Bridge Circuit (difficulty: 4)

---

### Module 7: Displays & Communication
**Duration:** 1–2 sessions

Lessons:
1. 7-Segment Display (difficulty: 3)
2. LCD Display with I2C Library (difficulty: 3)
3. Displaying Sensor Data on LCD (difficulty: 3)
4. Serial Communication: Arduino to Computer (difficulty: 3)
5. Bluetooth Module (HC-05) Basics (difficulty: 4)

---

### Module 8: Projects
**Duration:** 2–4 sessions (project-based)

Projects:
1. Digital Thermometer (difficulty: 3)
2. Motion-Activated Alarm (difficulty: 3)
3. Automatic Plant Watering System (difficulty: 4)
4. Parking Sensor (buzzer + distance) (difficulty: 3)
5. Mini Piano (buttons + buzzer) (difficulty: 3)
6. Science Fair Project: Custom sensor system (difficulty: 4)

---

## Skills Taxonomy

### Fundamentals
- `arduino-fundamentals-setup-loop`
- `arduino-fundamentals-breadboard`
- `arduino-fundamentals-wiring-diagram`

### Digital
- `arduino-digital-output-led`
- `arduino-digital-input-button`
- `arduino-digital-debounce`

### Analog
- `arduino-analog-read-potentiometer`
- `arduino-analog-map-function`
- `arduino-analog-pwm-analogwrite`

### Sensors
- `arduino-sensors-dht11-temp-humidity`
- `arduino-sensors-ultrasonic`
- `arduino-sensors-photoresistor`
- `arduino-sensors-pir-motion`

### Actuators
- `arduino-actuators-servo`
- `arduino-actuators-dc-motor`
- `arduino-actuators-buzzer`

### Displays
- `arduino-display-lcd-i2c`
- `arduino-display-serial-monitor`

---

## C++ / Arduino Language Notes

Arduino uses a subset of C/C++. Key differences from Python:

| Feature | Python | Arduino/C++ |
|---------|--------|------------|
| Typing | Dynamic | Static (must declare type) |
| Variables | `x = 5` | `int x = 5;` |
| Loops | `for i in range(10)` | `for (int i = 0; i < 10; i++)` |
| Print | `print(x)` | `Serial.println(x);` |
| Functions | `def blink():` | `void blink() {}` |
| Delay | `time.sleep(1)` | `delay(1000);` (milliseconds) |

Students from Python need 1–2 sessions to adjust to the C++ syntax before focusing on hardware.

---

## Common Student Struggles

1. **Wiring errors** — The most common bugs are physical, not code; teach "check the wiring first"
2. **Forgetting semicolons** — Python students always forget; the compiler error is clear
3. **Floating pins** — Digital pins without pull-up/pull-down resistors read noise, not signal
4. **Serial Monitor baud rate mismatch** — Characters show as garbage if baud rates don't match
5. **Loop blocking** — Using `delay()` inside the loop prevents reading inputs during the delay
6. **Power limits** — Students try to drive motors directly from Arduino pins; teach current limits

---

## Related Files

- `knowledge/Robotics/README.md` — Robotics uses Arduino concepts
- `knowledge/Python/README.md` — Python is the next step for advanced hardware (Raspberry Pi)
- `docs/CurriculumSystem.md` — How this integrates with the platform
