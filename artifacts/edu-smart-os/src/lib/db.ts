import Dexie, { type Table } from "dexie";

export interface Student {
  id: string;
  full_name: string;
  age?: number;
  birth_date?: string;
  grade: string;
  address?: string;
  governorate?: string;
  guardian_phone: string;
  secondary_phone?: string;
  email?: string;
  teacher_id?: string;
  teacher_name?: string;
  circle_id?: string;
  circle_name?: string;
  payment_status: string;
  payment_amount?: number;
  is_exempt: boolean;
  current_memorization?: string;
  current_revision?: string;
  level?: string;
  rating?: number;
  points?: number;
  notes?: string;
  enrollment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  age?: number;
  phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  salary?: number;
  hire_date?: string;
  experience?: string;
  notes?: string;
  circle_count?: number;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  days?: string;
  time?: string;
  status: string;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  circle_id: string;
  circle_name?: string;
  teacher_id?: string;
  teacher_name?: string;
  date: string;
  day?: string;
  time?: string;
  status: string;
  present_count?: number;
  student_count?: number;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  is_present: boolean;
  memorization_amount?: string;
  revision_amount?: string;
  next_memorization?: string;
  next_revision?: string;
  grade?: number;
  performance_label?: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  student_id: string;
  student_name: string;
  month: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  is_read: boolean;
  student_name?: string;
  student_id?: string;
  created_at: string;
}

class FurqanDB extends Dexie {
  students!: Table<Student>;
  teachers!: Table<Teacher>;
  circles!: Table<Circle>;
  sessions!: Table<Session>;
  session_records!: Table<SessionRecord>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  notifications!: Table<Notification>;

  constructor() {
    super("furqan_db");
    this.version(1).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, created_at",
      teachers: "id, full_name, phone, created_at",
      circles: "id, name, teacher_id, status, created_at",
      sessions: "id, circle_id, date, status, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, created_at",
      expenses: "id, category, date, created_at",
      notifications: "id, type, is_read, created_at",
    });
  }
}

export const db = new FurqanDB();

export function genId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
