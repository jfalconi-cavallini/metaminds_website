export type SessionStatus = "upcoming" | "completed" | "cancelled";
export type SessionType  = "online" | "in-person";

export interface Student {
  id: number;
  name: string;
  email: string;
  grade: string;
  subjects: string[];
  programs: string[];           // named programs: "SAT Prep", "AP Calculus AB", etc.
  assignedTutorId: number | null;
  archived: boolean;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
  allowInPerson?: boolean;
  school?: string;
  graduationYear?: string;
  status?: "active" | "inactive" | "paused";
  successPlan?: string;
  successPlanUrl?: string;
  weeklyStudyGoalMinutes?: number;
}

export interface Tutor {
  id: number;
  name: string;
  email: string;
  subjects: string[];
  assignedStudentIds: number[];
  bookingLeadHours: number;   // min hours in advance a student can book (24 or 48)
  archived: boolean;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  zoomLink?: string;
}

export interface Session {
  id: number;
  studentId: number;
  tutorId: number;
  subject: string;
  date: string;           // ISO: "2026-06-24"
  time: string;           // "4:00 PM"
  durationHours: number;
  status: SessionStatus;
  sessionType: SessionType;
  zoomLink?: string;
  notes?: string;
}

export interface SessionNote {
  id: number;
  sessionId: number | null;
  tutorId: number;
  studentId: number;
  topic: string;
  notes: string;
  createdAt: string;
  kamiLink?: string;
  noteDate?: string;        // ISO date "2026-07-22"
  attachmentUrl?: string;
  attachmentFilename?: string;
}

export interface Homework {
  id: number;
  studentId: number;
  tutorId: number;
  task: string;
  assignedDate: string;   // ISO
  dueDate: string | null; // ISO
  status: "pending" | "submitted" | "completed";
  createdAt: string;
  submissionUrl?: string;
  submissionFilename?: string;
  submittedAt?: string;
  grade?: string;
  feedback?: string;
  feedbackAt?: string;
  attachmentUrl?: string;
  attachmentFilename?: string;
  kamiLink?: string;
  estimatedMinutes?:   number;
  assignmentType?:     string;
  instructions?:       string;
  studentTimeMinutes?: number;
  studentNote?:        string;
  difficultyRating?:   "easy" | "appropriate" | "difficult";
}

export interface StudyLog {
  id: number;
  studentId: number;
  logDate: string;     // ISO date "2026-07-22"
  minutes: number;
  category: string;    // "homework" | "reading" | etc.
  note?: string;
  homeworkId?: number;
  createdAt: string;
}

export interface HoursBalance {
  studentId: number;
  totalPurchased: number;
  totalUsed: number;
  remaining: number;
  expiresAt: string;      // ISO: "2026-08-01"
}

export interface PurchaseOption {
  id: string;
  label: string;          // "4 Hours"
  hours: number;
  price: number;          // dollars
  priceLabel: string;     // "$260"
}

export interface PurchaseRequest {
  id: number;
  studentId: number;
  packageLabel: string;   // "4 Hours"
  hours: number;
  price: number;          // dollars
  status: "pending" | "fulfilled" | "dismissed";
  createdAt: string;      // ISO timestamp
}

export interface TutorAvailability {
  id: number;
  tutorId: number;
  dayOfWeek: number;      // 0=Sun … 6=Sat
  startTime: string;      // "3:00 PM"
  endTime: string;        // "7:00 PM"
}

export interface BlockedDate {
  id: number;
  tutorId: number;
  blockedDate: string;    // ISO "2026-06-25"
  reason?: string;
}

export interface ParentUpdate {
  id: number;
  tutorId: number;
  studentId: number;
  message: string;
  createdAt: string;      // ISO timestamp
  sessionIds: number[];   // sessions this update covers
}

export interface BlockedSlot {
  id: number;
  tutorId: number;
  slotDate: string;   // ISO date "2026-07-04"
  slotTime: string;   // "4:00 PM"
}

// ── CMS ───────────────────────────────────────────────────────────

export type CourseStatus  = "draft" | "active" | "archived";
export type LessonStatus  = "draft" | "in_review" | "active" | "archived";
export type PlanStatus    = "draft" | "active" | "completed" | "archived";
export type PlanLessonStatus = "pending" | "in_progress" | "completed" | "skipped";
export type ResourceType  =
  | "lesson_deck" | "guided_practice" | "tutor_guide"
  | "homework_l1" | "homework_l2" | "homework_l3"
  | "answer_key"  | "mastery_check"
  | "slides" | "worksheet" | "homework_pdf" | "video" | "kami_link" | "external";

export interface Course {
  id: number;
  subject: string;
  title: string;
  description?: string;
  gradeLevels: string[];
  estimatedHours?: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: number;
  courseId: number;
  parentId?: number;        // null = top-level section; set = category under a section
  title: string;
  description?: string;
  position: number;
  estimatedWeeks?: number;
  createdAt: string;
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  difficulty: number;           // 1–5
  estimatedMinutes: number;
  hwMinutes?: number;           // estimated homework time (separate from class time)
  tags: string[];               // searchable topic tags
  learningObjectives: string[];
  commonMistakes?: string;
  tutorNotes?: string;
  desmosUsage?: string;         // recommended Desmos tools / activity links
  prerequisites?: string;       // prerequisite knowledge (free text)
  followUp?: string;            // recommended follow-up lessons (free text)
  aiNotes?: string;
  status: LessonStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonResource {
  id: number;
  lessonId: number;
  type: ResourceType;
  label: string;
  url?: string;
  storagePath?: string;
  position: number;
  createdAt: string;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  subject: string;
  moduleId?: number;
  difficulty: number;
  prerequisites: string[];
  createdAt: string;
}

// ── Plan skill baseline types ─────────────────────────────────────────────────

export interface SkillEntry {
  score?: number;      // 0–6; undefined = Not Assessed
  note?: string;
  assessedAt?: string; // ISO date
}

export interface CategoryBaseline extends SkillEntry {
  subskills: Record<string, SkillEntry>; // subskill label → entry
}

/** categoryId (as string) → baseline entry */
export type SkillBaseline = Record<string, CategoryBaseline>;

export interface PlanSectionScores {
  rw?: number;        // SAT Reading & Writing
  math?: number;      // SAT Math (or ACT)
  english?: number;   // ACT English
  reading?: number;   // ACT Reading
  science?: number;   // ACT Science
  composite?: number; // ACT Composite
}

export interface ConsultationNotes {
  strengths?: string;
  weaknesses?: string;
  scheduleConstraints?: string;
  studentCommitment?: string;
  tutorRecommendation?: string;
  firstMilestone?: string;
}

// ── Student plan ──────────────────────────────────────────────────────────────

export interface StudentPlan {
  id: number;
  studentId: number;
  tutorId: number;
  courseId: number;
  title: string;
  startingScore?: number;   // baseline captured at plan creation — never updated
  currentScore?: number;    // updated from practice-test results over time
  targetScore?: number;
  targetDate?: string;      // ISO date
  status: PlanStatus;
  notes?: string;
  sectionBars?: Record<string, number>; // legacy 0–4 bars (migration 033)
  sectionScores?: PlanSectionScores;    // section-level starting scores
  skillBaseline?: SkillBaseline;        // category/subskill 0–6 baseline
  consultationNotes?: ConsultationNotes;
  sessionsPerWeek?: number;
  studyMinutesPerWeek?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPlanLesson {
  id: number;
  planId: number;
  lessonId: number;
  position: number;
  status: PlanLessonStatus;
  scheduledDate?: string;   // ISO date
  completedAt?: string;     // ISO timestamp
  tutorNotes?: string;
  createdAt: string;
}

export interface SkillMastery {
  studentId: number;
  skillId: number;
  masteryPct: number;       // 0–100
  lastAssessed?: string;    // ISO timestamp
}

// ── CMS COMPOSITE TYPES ───────────────────────────────────────────────────────

/** Lesson with all its resource slots and tagged skills — used for lesson detail panels. */
export interface LessonPackage extends Lesson {
  resources: LessonResource[];
  skills: Skill[];
}

/** Lesson with resources — used inside catalog tree nodes. */
export interface CatalogLesson extends Lesson {
  resources: LessonResource[];
}

/** Category (sub-module) with its lessons. */
export interface CatalogCategory extends Module {
  lessons: CatalogLesson[];
}

/** Section (top-level module) with its categories. */
export interface CatalogSection extends Module {
  categories: CatalogCategory[];
}

/** Full course catalog tree — used for sidebar navigation and library browsing. */
export interface CourseCatalogFull extends Course {
  sections: CatalogSection[];
}

/** A student plan lesson enriched with lesson data + resources — used in the student learning plan view. */
export interface StudentPlanLessonFull extends StudentPlanLesson {
  lesson: Lesson;
  resources: LessonResource[];
}

/** A student plan enriched with its lessons — used in the student portal learning plan view. */
export interface StudentPlanFull extends StudentPlan {
  lessons: StudentPlanLessonFull[];
}

// ── SKILL NODES ───────────────────────────────────────────────────────────────
// Skill nodes are first-class database entities representing learnable concepts.
// They exist independently of lessons, sessions, or homework.

export interface SkillNode {
  id:           number;
  slug:         string;         // stable external key: "sat-math-algebra-linear-equations"
  course:       string;         // "SAT" | "ACT" | "AP Calculus AB"
  category:     string;         // "Math" | "Reading & Writing"
  parentId:     number | null;  // null = top-level domain node
  title:        string;
  description?: string;
  displayOrder: number;
  createdAt:    string;
  updatedAt:    string;
}

export type StudentSkillStatus =
  | "not_assessed"
  | "needs_work"
  | "developing"
  | "proficient"
  | "strong";

export interface StudentSkill {
  id:            number;
  studentId:     number;
  skillId:       number;
  masteryScore:  number;               // 0–6 (0 = not yet scored within status)
  status:        StudentSkillStatus;
  tutorNotes?:   string;
  lastAssessed?: string;               // ISO date "2026-07-23"
  createdAt:     string;
  updatedAt:     string;
}
