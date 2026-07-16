# Robotics

---

## Overview

```yaml
subject: Robotics
title: Robotics: Building, Programming, and Competing
level: middle_to_high_school
grades: [5, 6, 7, 8, 9, 10, 11, 12]
estimated_hours: 20–40
prerequisites: [Scratch (for beginners), Python or Java (for advanced)]
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
```

Robotics is the most tangible STEM subject — students see their code move physical objects. It uniquely combines programming, physics, engineering design, and problem-solving. MetaMinds Robotics prepares students for:

- **FIRST Robotics** (FRC, FTC, FLL)
- **VEX Robotics**
- **School robotics competitions**
- **Arduino/hardware hacking** (see `knowledge/Arduino/README.md`)
- **General programming** (sensors, control loops, state machines)

---

## Platform Overview

| Platform | Ages | Language | Competition |
|----------|------|----------|-------------|
| LEGO Mindstorms / Spike | 8–14 | Scratch-like / Python | FLL |
| VEX IQ | 9–14 | Blocks / Python | VEX IQ |
| VEX V5 | 12–18 | Blocks / C++ | VEX EDR |
| FIRST Tech Challenge (FTC) | 12–18 | Java (Android Studio) | FTC |
| FIRST Robotics Competition (FRC) | 14–18 | Java / C++ / LabVIEW | FRC |
| Arduino | 10+ | C/C++ | Personal/science fair |
| Raspberry Pi | 12+ | Python | Personal/advanced |

MetaMinds tutors currently focus on **FTC (Java)**, **VEX (Blocks → Python)**, and **general sensor programming**.

---

## Module Structure

### Level 1: Introduction to Robotics (No prior coding)
**Target:** Ages 8–12  
**Duration:** 4–6 sessions  
**Platform:** LEGO Spike Prime or VEX IQ Blocks

#### Module 1: Building & Design
Lessons:
1. Introduction to Robotics: What Is a Robot? (difficulty: 1)
2. Motors: How They Work (difficulty: 1)
3. Sensors: Distance, Color, Touch (difficulty: 1)
4. Building Your First Bot (difficulty: 2)
5. Gears & Gear Ratios (difficulty: 2)
6. Structural Stability in Robot Design (difficulty: 2)

#### Module 2: Programming the Robot
Lessons:
1. Block-Based Programming for Robots (difficulty: 1)
2. Move Commands: Forward, Backward, Turn (difficulty: 1)
3. Sensor-Triggered Events (difficulty: 2)
4. Loops on Robots (difficulty: 2)
5. Conditionals: Responding to the Environment (difficulty: 2)
6. Variables on Robots (difficulty: 2)
7. Mini Challenge: Maze Navigation (difficulty: 3)

---

### Level 2: Intermediate Robotics
**Target:** Ages 12–16  
**Duration:** 6–8 sessions  
**Platform:** VEX V5 (Blocks/Python) or FTC (Java)  
**Prerequisites:** Level 1 or prior coding experience

#### Module 3: Robot Control Systems
Lessons:
1. Autonomous vs. Driver Control (difficulty: 2)
2. PID Control: Introduction (difficulty: 4)
3. Encoder-Based Movement (difficulty: 3)
4. Gyroscope & Turning Accurately (difficulty: 3)
5. Odometry Basics (difficulty: 4)
6. State Machines for Robot Behavior (difficulty: 4)

#### Module 4: Sensors & Perception
Lessons:
1. Distance Sensors: Ultrasonic (difficulty: 2)
2. Color Sensors & Line Following (difficulty: 3)
3. Touch / Limit Switches (difficulty: 2)
4. Camera / Vision System Basics (difficulty: 4)
5. Sensor Fusion: Using Multiple Sensors Together (difficulty: 4)

#### Module 5: Competition Strategies
Lessons:
1. Reading & Interpreting Game Manuals (difficulty: 2)
2. Scoring Optimization & Strategy (difficulty: 3)
3. Autonomous Routine Design (difficulty: 4)
4. Driver Skills Practice & Training (difficulty: 3)
5. Scouting & Alliance Strategy (difficulty: 3)
6. Robot Safety & Inspection Prep (difficulty: 2)

---

### Level 3: Advanced / Competition-Level
**Target:** Ages 15–18  
**Duration:** 8–12 sessions  
**Platform:** FTC (Java) or FRC (Java/C++)  
**Prerequisites:** Java or C++ proficiency

#### Module 6: FTC / FRC Programming
Lessons:
1. FTC/FRC SDK Architecture (difficulty: 3)
2. OpMode Structure (difficulty: 3)
3. Motor & Servo Control API (difficulty: 3)
4. Hardware Configuration & Mapping (difficulty: 3)
5. Telemetry & Debugging (difficulty: 3)
6. Road Runner Path Following Library (FTC) (difficulty: 5)
7. Vision: AprilTags / TensorFlow (difficulty: 5)
8. Multi-Subsystem Architecture (difficulty: 5)

---

## Skills Taxonomy

### Design & Build
- `robotics-design-gears-mechanisms`
- `robotics-design-structural-stability`

### Programming Basics
- `robotics-prog-block-based`
- `robotics-prog-autonomous-movement`
- `robotics-prog-sensor-triggered`
- `robotics-prog-state-machines`

### Control Systems
- `robotics-control-encoders`
- `robotics-control-gyroscope`
- `robotics-control-pid-intro`
- `robotics-control-odometry`

### Sensors
- `robotics-sensors-ultrasonic`
- `robotics-sensors-color-line`
- `robotics-sensors-camera-vision`

### Competition
- `robotics-comp-game-manual`
- `robotics-comp-autonomous-design`
- `robotics-comp-scouting`

---

## Competition Calendar

| Competition | Season | Application |
|-------------|--------|-------------|
| FIRST LEGO League (FLL) | Sept–Jan | Grades 4–8 |
| VEX IQ | Sept–Mar | Grades 4–8 |
| VEX EDR | Sept–Mar | Middle + High School |
| FIRST Tech Challenge (FTC) | Sept–Feb | High School |
| FIRST Robotics Competition (FRC) | Jan–Apr | High School |

Students interested in FRC or FTC should start tutoring in summer before the season.

---

## Common Student Struggles

1. **PID tuning** — Understanding why P, I, D values matter and how to tune them
2. **Autonomous path planning** — Getting consistent, repeatable paths on different field tiles
3. **Sensor noise** — Distance and color sensors give inconsistent readings; filtering helps
4. **Game manual interpretation** — Rules are long and technical; students miss edge cases
5. **Time management during build season** — Scoping the robot to what can be built in time
6. **Java on FTC for beginners** — The FTC SDK has steep boilerplate; abstract it early

---

## Related Files

- `knowledge/Arduino/README.md` — Hardware programming companion
- `knowledge/Python/README.md` — Python robotics (VEX, Pi)
- `knowledge/Java/README.md` — FTC programming
- `docs/MentorPipeline.md` — Robotics as a path to Junior Mentor eligibility
