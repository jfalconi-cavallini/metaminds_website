export type GradeChoice = "4" | "5" | "mixed";

export type SpellingWord = {
  spelling: string;
  proper: boolean;
  /** Extra spellings that count as correct, such as pinata for piñata. */
  also?: readonly string[];
  sentence: string;
};

export const GRADE_4_WORDS: readonly SpellingWord[] = [
  { spelling: "buttons", proper: false, sentence: "The coat has four buttons." },
  { spelling: "cuddle", proper: false, sentence: "The puppy likes to cuddle." },
  { spelling: "puffy", proper: false, sentence: "The clouds look puffy today." },
  { spelling: "tiptoed", proper: false, sentence: "She tiptoed past the sleeping cat." },
  { spelling: "clever", proper: false, sentence: "The clever fox found a path." },
  { spelling: "basement", proper: false, sentence: "The boxes are stored in the basement." },
  { spelling: "burlap", proper: false, sentence: "The sack is made of burlap." },
  { spelling: "wetlands", proper: false, sentence: "Ducks nest in the wetlands." },
  { spelling: "invite", proper: false, sentence: "We plan to invite the neighbors." },
  { spelling: "butterflies", proper: false, sentence: "Butterflies landed on the flowers." },
  { spelling: "kelp", proper: false, sentence: "Kelp grows in cold ocean water." },
  { spelling: "property", proper: false, sentence: "A fence marks the edge of the property." },
  { spelling: "carefully", proper: false, sentence: "He carried the glass carefully." },
  { spelling: "sniffling", proper: false, sentence: "The child kept sniffling in the cold." },
  { spelling: "beneath", proper: false, sentence: "The key is hidden beneath the mat." },
  { spelling: "tractor", proper: false, sentence: "The tractor sat in the field." },
  { spelling: "permit", proper: false, sentence: "Campers need a permit for the trail." },
  { spelling: "awning", proper: false, sentence: "Chairs were lined under the awning." },
  { spelling: "fickle", proper: false, sentence: "The spring weather felt fickle." },
  { spelling: "relief", proper: false, sentence: "A cool drink brought relief." },
  { spelling: "lunar", proper: false, sentence: "They watched the lunar eclipse." },
  { spelling: "boycotting", proper: false, sentence: "Shoppers are boycotting that store." },
  { spelling: "molten", proper: false, sentence: "Molten rock flowed from the volcano." },
  { spelling: "elite", proper: false, sentence: "The elite runners finished first." },
  { spelling: "woven", proper: false, sentence: "The basket is woven from reeds." },
  { spelling: "proclaim", proper: false, sentence: "The mayor will proclaim the winner." },
  { spelling: "thimble", proper: false, sentence: "A thimble covered her fingertip." },
  { spelling: "custody", proper: false, sentence: "The museum keeps the painting in its custody." },
  { spelling: "granola", proper: false, sentence: "He packed granola for the hike." },
  { spelling: "warrior", proper: false, sentence: "The warrior stood by the gate." },
  { spelling: "rigid", proper: false, sentence: "The metal rod is rigid." },
  { spelling: "fierce", proper: false, sentence: "A fierce wind bent the trees." },
  { spelling: "laughter", proper: false, sentence: "Laughter filled the kitchen." },
  { spelling: "salary", proper: false, sentence: "The salary is paid once a month." },
  { spelling: "disappear", proper: false, sentence: "Morning fog will disappear by noon." },
  { spelling: "hurdler", proper: false, sentence: "The hurdler cleared the last bar." },
  { spelling: "lounge", proper: false, sentence: "Visitors waited in the lounge." },
  { spelling: "jovial", proper: false, sentence: "The jovial host greeted every guest." },
  { spelling: "inferior", proper: false, sentence: "This rope is inferior to the thicker one." },
  { spelling: "December", proper: true, sentence: "December is the last month of the year." },
  { spelling: "duration", proper: false, sentence: "The duration of the trip is three hours." },
  { spelling: "dictionary", proper: false, sentence: "She checked the word in a dictionary." },
  { spelling: "business", proper: false, sentence: "The business opens at nine." },
  { spelling: "reinstate", proper: false, sentence: "The coach may reinstate the player." },
  { spelling: "examine", proper: false, sentence: "The nurse will examine the chart." },
  { spelling: "versus", proper: false, sentence: "The match today is home versus away." },
  { spelling: "lullaby", proper: false, sentence: "He hummed a lullaby at bedtime." },
  { spelling: "opposite", proper: false, sentence: "The library is on the opposite corner." },
  { spelling: "tissues", proper: false, sentence: "Please hand me the tissues." },
  { spelling: "marlin", proper: false, sentence: "A marlin leapt beside the boat." },
];

export const GRADE_5_WORDS: readonly SpellingWord[] = [
  { spelling: "Halloween", proper: true, sentence: "Halloween comes at the end of October." },
  { spelling: "compliment", proper: false, sentence: "She offered a sincere compliment." },
  { spelling: "compromise", proper: false, sentence: "The two sides reached a compromise." },
  { spelling: "incident", proper: false, sentence: "The incident happened after lunch." },
  { spelling: "Japanese", proper: true, sentence: "He is studying Japanese this year." },
  { spelling: "investment", proper: false, sentence: "The investment grew over five years." },
  { spelling: "bifocals", proper: false, sentence: "Grandfather wears bifocals for reading." },
  { spelling: "cutlery", proper: false, sentence: "Place the cutlery beside the plate." },
  { spelling: "chisel", proper: false, sentence: "The chisel shaped the block of wood." },
  { spelling: "fundraiser", proper: false, sentence: "The fundraiser is held on Saturday." },
  { spelling: "geologist", proper: false, sentence: "A geologist studies layers of rock." },
  { spelling: "bellowed", proper: false, sentence: "The captain bellowed across the deck." },
  { spelling: "organism", proper: false, sentence: "Every living organism needs water." },
  { spelling: "quail", proper: false, sentence: "A quail ran across the path." },
  { spelling: "atmosphere", proper: false, sentence: "The atmosphere surrounds the planet." },
  { spelling: "disappointment", proper: false, sentence: "Missing the train was a disappointment." },
  { spelling: "truant", proper: false, sentence: "A truant student skipped class." },
  { spelling: "pamphlet", proper: false, sentence: "The pamphlet lists the park rules." },
  { spelling: "helium", proper: false, sentence: "Helium keeps the balloon in the air." },
  { spelling: "suggested", proper: false, sentence: "The librarian suggested a new book." },
  { spelling: "chimpanzees", proper: false, sentence: "Chimpanzees live together in groups." },
  { spelling: "desperate", proper: false, sentence: "The hikers were desperate for shade." },
  { spelling: "annoyance", proper: false, sentence: "The dripping faucet was an annoyance." },
  { spelling: "interruption", proper: false, sentence: "An interruption paused the lesson." },
  { spelling: "concentrate", proper: false, sentence: "Please concentrate on the diagram." },
  { spelling: "piñata", proper: false, also: ["pinata"], sentence: "The piñata hung from a tree branch." },
  { spelling: "territory", proper: false, sentence: "Wolves defend their territory." },
  { spelling: "stragglers", proper: false, sentence: "The stragglers arrived after sunset." },
  { spelling: "albino", proper: false, sentence: "An albino rabbit has white fur." },
  { spelling: "ridiculous", proper: false, sentence: "The oversized hat looked ridiculous." },
  { spelling: "monorail", proper: false, sentence: "The monorail runs above the street." },
  { spelling: "exploratory", proper: false, sentence: "The exploratory walk mapped the creek." },
  { spelling: "indigo", proper: false, sentence: "The evening sky turned indigo." },
  { spelling: "bratwurst", proper: false, sentence: "He cooked a bratwurst on the grill." },
  { spelling: "alphabetical", proper: false, sentence: "File the cards in alphabetical order." },
  { spelling: "integrity", proper: false, sentence: "Telling the truth shows integrity." },
  { spelling: "Oregon", proper: true, sentence: "Oregon sits on the west coast." },
  { spelling: "rebuttal", proper: false, sentence: "Her rebuttal answered each point." },
  { spelling: "prejudice", proper: false, sentence: "The lesson discussed prejudice and fairness." },
  { spelling: "solidarity", proper: false, sentence: "The team showed solidarity after the loss." },
  { spelling: "calico", proper: false, sentence: "The calico cat slept in the sun." },
  { spelling: "sputnik", proper: false, sentence: "The class read about sputnik." },
  { spelling: "cartridge", proper: false, sentence: "The printer needs a new cartridge." },
  { spelling: "segregation", proper: false, sentence: "The chapter explains segregation." },
  { spelling: "tortillas", proper: false, sentence: "Warm tortillas were stacked on a plate." },
  { spelling: "civilian", proper: false, sentence: "A civilian helped direct traffic." },
  { spelling: "fertilizer", proper: false, also: ["fertiliser"], sentence: "The garden soil needs fertilizer." },
  { spelling: "apprentice", proper: false, sentence: "The apprentice learned to measure twice." },
  { spelling: "synthetic", proper: false, sentence: "The coat is made from synthetic cloth." },
  { spelling: "Caesar", proper: true, sentence: "Caesar ruled in ancient Rome." },
];

const PROPER_SPELLINGS = ["December", "Halloween", "Japanese", "Oregon", "Caesar"] as const;

export function wordsForGrade(choice: GradeChoice): SpellingWord[] {
  if (choice === "4") return [...GRADE_4_WORDS];
  if (choice === "5") return [...GRADE_5_WORDS];
  return [...GRADE_4_WORDS, ...GRADE_5_WORDS];
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

export function buildRound(choice: GradeChoice, random: () => number = Math.random): SpellingWord[] {
  return shuffle(wordsForGrade(choice), random);
}

function acceptedForms(word: SpellingWord): string[] {
  return [word.spelling, ...(word.also ?? [])].map((form) => form.normalize("NFC"));
}

export function isCorrectSpelling(input: string, word: SpellingWord): boolean {
  const typed = input.trim().normalize("NFC");
  if (!typed) return false;
  const accepted = acceptedForms(word);
  if (word.proper) return accepted.some((form) => form === typed);
  const folded = typed.toLocaleLowerCase("en-US");
  return accepted.some((form) => form.toLocaleLowerCase("en-US") === folded);
}

function isWordChar(char: string): boolean {
  return char !== "" && /[\p{L}\p{M}\p{N}]/u.test(char);
}

export function findWholeWord(sentence: string, spelling: string): { start: number; end: number } | null {
  const source = sentence.normalize("NFC");
  const target = spelling.normalize("NFC").toLocaleLowerCase("en-US");
  const haystack = source.toLocaleLowerCase("en-US");
  if (haystack.length !== source.length || target.length === 0) return null;
  let from = 0;
  while (from <= haystack.length - target.length) {
    const start = haystack.indexOf(target, from);
    if (start === -1) return null;
    const end = start + target.length;
    const before = start === 0 ? "" : haystack[start - 1];
    const after = end >= haystack.length ? "" : haystack[end];
    if (!isWordChar(before) && !isWordChar(after)) return { start, end };
    from = start + 1;
  }
  return null;
}

export function blankExample(sentence: string, spelling: string): string {
  const match = findWholeWord(sentence, spelling);
  if (!match) return sentence.normalize("NFC");
  const source = sentence.normalize("NFC");
  return `${source.slice(0, match.start)}______${source.slice(match.end)}`;
}

/** Move the current word (index 0) later in the queue so it is not asked next. */
export function requeueCurrent<T>(queue: readonly T[], roll: number = Math.random()): T[] {
  if (queue.length === 0) return [];
  const current = queue[0];
  const rest = queue.slice(1);
  if (rest.length === 0) return [current];
  const clamped = Math.min(Math.max(roll, 0), 0.999999);
  const insertAt = 1 + Math.floor(clamped * rest.length);
  return [...rest.slice(0, insertAt), current, ...rest.slice(insertAt)];
}

export function isProperSpelling(spelling: string): boolean {
  return (PROPER_SPELLINGS as readonly string[]).includes(spelling);
}
