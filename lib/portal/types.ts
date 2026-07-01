export type SessionStatus = "upcoming" | "completed" | "cancelled";
export type SessionType  = "online" | "in-person";

export interface Student {
  id: number;
  name: string;
  email: string;
  grade: string;
  subjects: string[];
  assignedTutorId: number | null;
  archived: boolean;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
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
}
