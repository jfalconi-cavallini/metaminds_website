/**
 * Grade 7 math mix.
 *
 * Source: MetaMinds Director of Curriculum, middle-math-01.
 * Original items supplied for this game. Prompts, choices, answers, and
 * explanations are stored as given.
 */

export const GRADE7_SOURCE = "MetaMinds Director of Curriculum, middle-math-01";

export const GRADE7_TEKS = [
  "7.3A",
  "7.12A",
  "7.3B",
  "7.4A",
  "7.4B",
  "7.4C",
  "7.4D",
  "7.5C",
  "7.9B",
  "7.9A",
  "7.9D",
  "7.9C",
  "7.11A",
  "7.10A",
  "7.6I",
] as const;

export type Grade7LevelId = "level1" | "level2";

export type Grade7Choice = "A" | "B" | "C" | "D";

export type Grade7Question = {
  id: string;
  grade: 7;
  teks: string;
  skill: string;
  difficulty: Grade7LevelId;
  type: "mcq" | "spr";
  question: string;
  choices: Record<Grade7Choice, string> | null;
  answer: string;
  explanation: string;
};

export type Grade7Level = {
  id: Grade7LevelId;
  label: string;
  detail: string;
  questions: readonly Grade7Question[];
};

const ITEMS: readonly Grade7Question[] = [
  {
    id: "MS7-001",
    grade: 7,
    teks: "7.3A",
    skill: "Add fractions with different signs",
    difficulty: "level1",
    type: "mcq",
    question: "What is -3/4 + 1/2?",
    choices: { A: "1/4", B: "-1/4", C: "-5/4", D: "-1/2" },
    answer: "B",
    explanation: "Write 1/2 as 2/4. Then -3/4 + 2/4 = -1/4.",
  },
  {
    id: "MS7-002",
    grade: 7,
    teks: "7.3A",
    skill: "Multiply and subtract decimals",
    difficulty: "level2",
    type: "mcq",
    question: "What is (-2.5)(-1.2) - 4?",
    choices: { A: "-7", B: "1", C: "-1", D: "7" },
    answer: "C",
    explanation: "Two negatives multiply to a positive: (-2.5)(-1.2) = 3. Then 3 - 4 = -1.",
  },
  {
    id: "MS7-003",
    grade: 7,
    teks: "7.12A",
    skill: "Compare the centers of two data sets",
    difficulty: "level1",
    type: "spr",
    question:
      "Class A quiz scores: 4, 6, 7, 7, 9. Class B quiz scores: 6, 8, 9, 9, 10. How many points greater is the median of Class B than the median of Class A?",
    choices: null,
    answer: "2",
    explanation: "The middle value of Class A is 7. The middle value of Class B is 9. 9 - 7 = 2.",
  },
  {
    id: "MS7-004",
    grade: 7,
    teks: "7.3B",
    skill: "Divide negative fractions",
    difficulty: "level2",
    type: "mcq",
    question:
      "A diver's depth changes by -3/5 meter over 3/10 of a minute at a steady pace. What is the change in depth per minute?",
    choices: { A: "2 meters", B: "-9/50 meter", C: "-2 meters", D: "-1/2 meter" },
    answer: "C",
    explanation: "Divide: (-3/5) ÷ (3/10) = (-3/5) × (10/3) = -2. The diver goes down 2 meters each minute.",
  },
  {
    id: "MS7-005",
    grade: 7,
    teks: "7.4A",
    skill: "Write a d = rt equation",
    difficulty: "level1",
    type: "mcq",
    question: "A bike rider goes 36 miles in 3 hours at a constant speed. Which equation shows the distance d after t hours?",
    choices: { A: "d = 3t", B: "d = 36t", C: "d = t + 12", D: "d = 12t" },
    answer: "D",
    explanation: "The speed is 36 ÷ 3 = 12 miles per hour, so d = 12t.",
  },
  {
    id: "MS7-006",
    grade: 7,
    teks: "7.4B",
    skill: "Find a unit price",
    difficulty: "level1",
    type: "mcq",
    question: "6 apples cost $4.80. What is the price for one apple?",
    choices: { A: "$0.80", B: "$1.25", C: "$0.75", D: "$0.60" },
    answer: "A",
    explanation: "Divide the total cost by the number of apples: 4.80 ÷ 6 = 0.80.",
  },
  {
    id: "MS7-007",
    grade: 7,
    teks: "7.4B",
    skill: "Compare unit rates to find the better buy",
    difficulty: "level2",
    type: "mcq",
    question: "A 12 ounce jar of peanut butter costs $3.00. A 20 ounce jar costs $4.40. What is the cost per ounce of the better buy?",
    choices: { A: "$0.25", B: "$0.22", C: "$0.20", D: "$0.30" },
    answer: "B",
    explanation: "Small jar: 3.00 ÷ 12 = 0.25 per ounce. Big jar: 4.40 ÷ 20 = 0.22 per ounce. The big jar costs less per ounce.",
  },
  {
    id: "MS7-008",
    grade: 7,
    teks: "7.4C",
    skill: "Find the constant of proportionality",
    difficulty: "level1",
    type: "mcq",
    question: "y is proportional to x. When x = 5, y = 15. What is the constant of proportionality k in y = kx?",
    choices: { A: "5", B: "10", C: "3", D: "1/3" },
    answer: "C",
    explanation: "k = y ÷ x = 15 ÷ 5 = 3.",
  },
  {
    id: "MS7-009",
    grade: 7,
    teks: "7.4C",
    skill: "Constant of proportionality with fractions",
    difficulty: "level2",
    type: "mcq",
    question: "A recipe uses 3/4 cup of sugar for every 1/2 cup of butter. How many cups of sugar are used per cup of butter?",
    choices: { A: "3/8", B: "2/3", C: "5/4", D: "3/2" },
    answer: "D",
    explanation: "Divide sugar by butter: (3/4) ÷ (1/2) = (3/4) × 2 = 3/2.",
  },
  {
    id: "MS7-010",
    grade: 7,
    teks: "7.4D",
    skill: "Find a percent of a number",
    difficulty: "level1",
    type: "mcq",
    question: "What is 20% of 45?",
    choices: { A: "9", B: "25", C: "4.5", D: "36" },
    answer: "A",
    explanation: "20% is 0.20. Then 0.20 × 45 = 9.",
  },
  {
    id: "MS7-011",
    grade: 7,
    teks: "7.4D",
    skill: "Discount and sales tax",
    difficulty: "level2",
    type: "mcq",
    question: "A $40 shirt is on sale for 25% off. Then 8% sales tax is added to the sale price. What is the final cost?",
    choices: { A: "$32.40", B: "$33.20", C: "$30.00", D: "$29.60" },
    answer: "A",
    explanation: "25% off $40 is $10 off, so the sale price is $30. Tax is 0.08 × 30 = $2.40. Total: 30 + 2.40 = $32.40.",
  },
  {
    id: "MS7-012",
    grade: 7,
    teks: "7.4D",
    skill: "Percent increase",
    difficulty: "level2",
    type: "spr",
    question: "The price of a game went up from $50 to $62. What is the percent increase? (Type the number only.)",
    choices: null,
    answer: "24",
    explanation: "The price went up 62 - 50 = 12 dollars. 12 ÷ 50 = 0.24, which is 24%.",
  },
  {
    id: "MS7-013",
    grade: 7,
    teks: "7.5C",
    skill: "Use a map scale",
    difficulty: "level1",
    type: "mcq",
    question: "On a map, 1 inch stands for 25 miles. Two towns are 3.5 inches apart on the map. How far apart are they really?",
    choices: { A: "28.5 miles", B: "87.5 miles", C: "75 miles", D: "100 miles" },
    answer: "B",
    explanation: "Multiply the map distance by the scale: 3.5 × 25 = 87.5 miles.",
  },
  {
    id: "MS7-014",
    grade: 7,
    teks: "7.5C",
    skill: "Find a missing side in similar shapes",
    difficulty: "level2",
    type: "mcq",
    question: "Two triangles are similar. The small one has sides 4 cm and 6 cm. The matching sides on the big one are 10 cm and x cm. What is x?",
    choices: { A: "12", B: "8", C: "15", D: "16" },
    answer: "C",
    explanation: "The big triangle is 10 ÷ 4 = 2.5 times as large. So x = 6 × 2.5 = 15.",
  },
  {
    id: "MS7-015",
    grade: 7,
    teks: "7.9B",
    skill: "Circumference of a circle",
    difficulty: "level1",
    type: "mcq",
    question: "A circle has a diameter of 10 inches. Using 3.14 for pi, what is its circumference?",
    choices: { A: "78.5 inches", B: "15.7 inches", C: "314 inches", D: "31.4 inches" },
    answer: "D",
    explanation: "Circumference is pi times the diameter: 3.14 × 10 = 31.4 inches.",
  },
  {
    id: "MS7-016",
    grade: 7,
    teks: "7.9B",
    skill: "Area of a circle",
    difficulty: "level2",
    type: "mcq",
    question: "A round rug has a radius of 6 feet. Using 3.14 for pi, what is its area?",
    choices: { A: "37.68 square feet", B: "113.04 square feet", C: "452.16 square feet", D: "18.84 square feet" },
    answer: "B",
    explanation: "Area is pi times the radius squared: 3.14 × 6 × 6 = 3.14 × 36 = 113.04 square feet.",
  },
  {
    id: "MS7-017",
    grade: 7,
    teks: "7.9A",
    skill: "Volume of a rectangular prism",
    difficulty: "level1",
    type: "mcq",
    question: "A box is 5 cm long, 4 cm wide and 3 cm tall. What is its volume?",
    choices: { A: "12 cubic cm", B: "47 cubic cm", C: "94 cubic cm", D: "60 cubic cm" },
    answer: "D",
    explanation: "Volume is length × width × height: 5 × 4 × 3 = 60 cubic cm.",
  },
  {
    id: "MS7-018",
    grade: 7,
    teks: "7.9A",
    skill: "Volume of a rectangular pyramid",
    difficulty: "level2",
    type: "mcq",
    question: "A pyramid has a square base with sides of 6 m and a height of 10 m. What is its volume?",
    choices: { A: "360 cubic m", B: "120 cubic m", C: "180 cubic m", D: "60 cubic m" },
    answer: "B",
    explanation: "Volume is one third of the base area times the height: (1/3) × 36 × 10 = 120 cubic m.",
  },
  {
    id: "MS7-019",
    grade: 7,
    teks: "7.9D",
    skill: "Total surface area of a cube",
    difficulty: "level2",
    type: "spr",
    question: "A cube has edges that are 4 inches long. What is its total surface area in square inches?",
    choices: null,
    answer: "96",
    explanation: "A cube has 6 square faces. Each face is 4 × 4 = 16 square inches. 6 × 16 = 96.",
  },
  {
    id: "MS7-020",
    grade: 7,
    teks: "7.9C",
    skill: "Area of a composite figure",
    difficulty: "level1",
    type: "mcq",
    question:
      "A shape is made of a rectangle 8 m long and 5 m tall with a triangle on top. The triangle has a base of 8 m and a height of 3 m. What is the total area?",
    choices: { A: "52 square m", B: "64 square m", C: "46 square m", D: "40 square m" },
    answer: "A",
    explanation: "Rectangle: 8 × 5 = 40. Triangle: (1/2) × 8 × 3 = 12. Add them: 40 + 12 = 52 square m.",
  },
  {
    id: "MS7-021",
    grade: 7,
    teks: "7.11A",
    skill: "Solve a two-step equation",
    difficulty: "level1",
    type: "mcq",
    question: "Solve for x: 3x + 5 = 20",
    choices: { A: "5", B: "25/3", C: "15", D: "8" },
    answer: "A",
    explanation: "Subtract 5 from both sides: 3x = 15. Divide by 3: x = 5.",
  },
  {
    id: "MS7-022",
    grade: 7,
    teks: "7.11A",
    skill: "Solve a two-step inequality",
    difficulty: "level2",
    type: "mcq",
    question: "Solve: -2x + 7 > 15",
    choices: { A: "x > -4", B: "x < 4", C: "x < -4", D: "x > -11" },
    answer: "C",
    explanation: "Subtract 7: -2x > 8. Divide by -2 and flip the sign because you divided by a negative: x < -4.",
  },
  {
    id: "MS7-023",
    grade: 7,
    teks: "7.10A",
    skill: "Write a two-step inequality",
    difficulty: "level2",
    type: "mcq",
    question: "Maya has $18. She saves $6 each week. Which inequality shows the number of weeks w until she has at least $60?",
    choices: { A: "6w + 18 ≤ 60", B: "18w + 6 ≥ 60", C: "6w - 18 ≥ 60", D: "6w + 18 ≥ 60" },
    answer: "D",
    explanation: "She starts with 18 and adds 6 each week, so she has 6w + 18. At least 60 means greater than or equal to 60.",
  },
  {
    id: "MS7-024",
    grade: 7,
    teks: "7.6I",
    skill: "Theoretical probability of a simple event",
    difficulty: "level1",
    type: "spr",
    question:
      "A bag has 3 red, 5 blue and 2 green marbles. You pick one without looking. What is the probability it is blue? (Write it as a fraction in lowest terms.)",
    choices: null,
    answer: "1/2",
    explanation: "There are 3 + 5 + 2 = 10 marbles and 5 are blue. 5/10 = 1/2.",
  },
];

export const GRADE7_LEVELS: readonly Grade7Level[] = [
  {
    id: "level1",
    label: "Level 1",
    detail: "Core",
    questions: ITEMS.filter((item) => item.difficulty === "level1"),
  },
  {
    id: "level2",
    label: "Level 2",
    detail: "Challenge",
    questions: ITEMS.filter((item) => item.difficulty === "level2"),
  },
];

export function grade7LevelById(id: Grade7LevelId): Grade7Level {
  const level = GRADE7_LEVELS.find((entry) => entry.id === id);
  if (!level) throw new Error(`Unknown grade 7 level: ${id}`);
  return level;
}

export function grade7ChoiceText(question: Grade7Question, letter: string): string {
  if (!question.choices) return letter;
  const key = letter.trim().toUpperCase() as Grade7Choice;
  return question.choices[key] ?? letter;
}

/** Shown after a try. Multiple choice includes the choice text. */
export function grade7AnswerLabel(question: Grade7Question): string {
  if (question.type === "mcq" && question.choices) {
    return `${question.answer}. ${grade7ChoiceText(question, question.answer)}`;
  }
  return question.answer;
}

function numericValue(raw: string): number | null {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, "").replace(/%$/, "");
  if (!cleaned) return null;
  const fraction = /^(-?\d+)\/(-?\d+)$/.exec(cleaned);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function isCorrectGrade7Answer(input: string, question: Grade7Question): boolean {
  if (question.type === "mcq") {
    return input.trim().toUpperCase() === question.answer.trim().toUpperCase();
  }
  const given = numericValue(input);
  const expected = numericValue(question.answer);
  if (given === null || expected === null) return false;
  return Math.abs(given - expected) < 1e-9;
}
