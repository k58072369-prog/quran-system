import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, genId, now, type Student, type Teacher, type Circle, type Session, type SessionRecord, type Invoice, type Expense, type Notification } from "./db";

export type { Student, Teacher, Circle, Session, SessionRecord, Invoice, Expense, Notification };

interface StoreContextType {
  refresh: () => void;
}
const StoreContext = createContext<StoreContextType>({ refresh: () => {} });
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  return <StoreContext.Provider value={{ refresh }}>{children}</StoreContext.Provider>;
}
export function useStore() { return useContext(StoreContext); }

// ─── HELPERS ───────────────────────────────────────────────────────────────
async function resolveTeacherName(teacher_id?: string): Promise<string | undefined> {
  if (!teacher_id || teacher_id === "none") return undefined;
  const t = await db.teachers.get(teacher_id);
  return t?.full_name;
}
async function resolveCircleName(circle_id?: string): Promise<string | undefined> {
  if (!circle_id || circle_id === "none") return undefined;
  const c = await db.circles.get(circle_id);
  return c?.name;
}

// ─── STUDENTS ──────────────────────────────────────────────────────────────
export function useStudents(search?: string) {
  const students = useLiveQuery(async () => {
    let all = await db.students.orderBy("created_at").toArray();
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(s => s.full_name.toLowerCase().includes(q));
    }
    return all;
  }, [search]);
  return { students: students ?? [], loading: students === undefined };
}

export async function addStudent(data: Omit<Student, "id" | "created_at" | "updated_at">) {
  const id = genId();
  const ts = now();
  const teacher_name = await resolveTeacherName(data.teacher_id);
  const circle_name = await resolveCircleName(data.circle_id);
  await db.students.add({ ...data, id, teacher_name, circle_name, created_at: ts, updated_at: ts });
  // auto-generate invoice if payment_amount > 0 and not exempt
  if (!data.is_exempt && data.payment_amount && data.payment_amount > 0) {
    await _generateMonthlyInvoice(id, data.full_name, data.payment_amount);
  }
  return id;
}

export async function updateStudent(id: string, data: Partial<Omit<Student, "id" | "created_at">>) {
  if (data.teacher_id !== undefined) {
    data.teacher_name = await resolveTeacherName(data.teacher_id);
  }
  if (data.circle_id !== undefined) {
    data.circle_name = await resolveCircleName(data.circle_id);
  }
  await db.students.update(id, { ...data, updated_at: now() });
}

export async function deleteStudent(id: string) {
  await db.students.delete(id);
  await db.invoices.where("student_id").equals(id).delete();
}

// ─── TEACHERS ─────────────────────────────────────────────────────────────
export function useTeachers() {
  const teachers = useLiveQuery(async () => {
    const all = await db.teachers.orderBy("created_at").toArray();
    return Promise.all(all.map(async t => {
      const circles = await db.circles.where("teacher_id").equals(t.id).count();
      const students = await db.students.where("teacher_id").equals(t.id).count();
      return { ...t, circle_count: circles, student_count: students };
    }));
  }, []);
  return { teachers: teachers ?? [], loading: teachers === undefined };
}

export async function addTeacher(data: Omit<Teacher, "id" | "created_at" | "updated_at" | "circle_count" | "student_count">) {
  const id = genId();
  const ts = now();
  await db.teachers.add({ ...data, id, created_at: ts, updated_at: ts });
  return id;
}

export async function updateTeacher(id: string, data: Partial<Omit<Teacher, "id" | "created_at" | "circle_count" | "student_count">>) {
  await db.teachers.update(id, { ...data, updated_at: now() });
  // Update teacher_name on related students and circles
  if (data.full_name) {
    await db.students.where("teacher_id").equals(id).modify({ teacher_name: data.full_name, updated_at: now() });
    await db.circles.where("teacher_id").equals(id).modify({ teacher_name: data.full_name, updated_at: now() });
  }
}

export async function deleteTeacher(id: string) {
  await db.teachers.delete(id);
}

// ─── CIRCLES ───────────────────────────────────────────────────────────────
export function useCircles() {
  const circles = useLiveQuery(async () => {
    const all = await db.circles.orderBy("created_at").toArray();
    return Promise.all(all.map(async c => {
      const count = await db.students.where("circle_id").equals(c.id).count();
      return { ...c, student_count: count };
    }));
  }, []);
  return { circles: circles ?? [], loading: circles === undefined };
}

export async function addCircle(data: Omit<Circle, "id" | "created_at" | "updated_at" | "student_count">) {
  const id = genId();
  const ts = now();
  const teacher_name = await resolveTeacherName(data.teacher_id);
  await db.circles.add({ ...data, id, teacher_name, created_at: ts, updated_at: ts });
  return id;
}

export async function updateCircle(id: string, data: Partial<Omit<Circle, "id" | "created_at" | "student_count">>) {
  if (data.teacher_id !== undefined) {
    data.teacher_name = await resolveTeacherName(data.teacher_id);
  }
  await db.circles.update(id, { ...data, updated_at: now() });
}

export async function deleteCircle(id: string) {
  await db.circles.delete(id);
}

// ─── SESSIONS ──────────────────────────────────────────────────────────────
export function useSessions(circleId?: string) {
  const sessions = useLiveQuery(async () => {
    let all = await db.sessions.orderBy("created_at").toArray();
    if (circleId && circleId !== "all") {
      all = all.filter(s => s.circle_id === circleId);
    }
    return all;
  }, [circleId]);
  return { sessions: sessions ?? [], loading: sessions === undefined };
}

export async function addSession(data: {
  circle_id: string;
  date: string;
  day?: string;
  time?: string;
  status: string;
}): Promise<string> {
  const id = genId();
  const ts = now();
  const circle = await db.circles.get(data.circle_id);
  const teacher_name = circle?.teacher_name;
  const teacher_id = circle?.teacher_id;
  const circle_name = circle?.name;
  const studentCount = await db.students.where("circle_id").equals(data.circle_id).count();
  await db.sessions.add({
    ...data,
    id,
    circle_name,
    teacher_id,
    teacher_name,
    student_count: studentCount,
    present_count: 0,
    created_at: ts,
  });
  return id;
}

export async function getSession(id: string) {
  return db.sessions.get(id);
}

export async function saveSessionRecords(sessionId: string, records: Omit<SessionRecord, "id" | "created_at">[]) {
  const ts = now();
  const toAdd: SessionRecord[] = records.map(r => ({ ...r, id: genId(), created_at: ts }));
  await db.session_records.bulkAdd(toAdd);
  const presentCount = records.filter(r => r.is_present).length;
  await db.sessions.update(sessionId, { present_count: presentCount, student_count: records.length });

  // Update student memorization data
  for (const r of records) {
    if (r.is_present && (r.memorization_amount || r.revision_amount)) {
      const updates: Partial<Student> = { updated_at: ts };
      if (r.memorization_amount) updates.current_memorization = r.memorization_amount;
      if (r.revision_amount) updates.current_revision = r.revision_amount;
      if (r.performance_label) updates.level = r.performance_label;
      await db.students.update(r.student_id, updates);
    }
    // Generate absence notification
    if (!r.is_present) {
      await addNotification({
        title: "غياب طالب",
        message: `الطالب ${r.student_name} غائب عن حصة اليوم`,
        type: "غياب",
        priority: "مهم",
        student_name: r.student_name,
        student_id: r.student_id,
        is_read: false,
      });
    }
  }
}

export function useSessionRecords(sessionId: string | null) {
  const records = useLiveQuery(async () => {
    if (!sessionId) return [];
    return db.session_records.where("session_id").equals(sessionId).toArray();
  }, [sessionId]);
  return { records: records ?? [], loading: records === undefined };
}

// ─── FINANCE ───────────────────────────────────────────────────────────────
export function useInvoices(search?: string) {
  const invoices = useLiveQuery(async () => {
    let all = await db.invoices.orderBy("created_at").toArray();
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(inv => inv.student_name?.toLowerCase().includes(q));
    }
    return all;
  }, [search]);
  return { invoices: invoices ?? [], loading: invoices === undefined };
}

export async function addInvoice(data: Omit<Invoice, "id" | "created_at" | "updated_at">) {
  const id = genId();
  const ts = now();
  await db.invoices.add({ ...data, id, created_at: ts, updated_at: ts });
  return id;
}

export async function updateInvoice(id: string, data: Partial<Omit<Invoice, "id" | "created_at">>) {
  await db.invoices.update(id, { ...data, updated_at: now() });
}

export function useExpenses() {
  const expenses = useLiveQuery(() => db.expenses.orderBy("date").reverse().toArray(), []);
  return { expenses: expenses ?? [], loading: expenses === undefined };
}

export async function addExpense(data: Omit<Expense, "id" | "created_at">) {
  const id = genId();
  await db.expenses.add({ ...data, id, created_at: now() });
  return id;
}

export async function deleteExpense(id: string) {
  await db.expenses.delete(id);
}

export function useFinanceSummary() {
  const summary = useLiveQuery(async () => {
    const invoices = await db.invoices.toArray();
    const expenses = await db.expenses.toArray();
    const revenue = invoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0);
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const paid = invoices.filter(i => i.status === "مدفوع").length;
    const unpaid = invoices.filter(i => i.status === "غير مدفوع" || i.status === "متأخر").length;
    const exempt = invoices.filter(i => i.status === "معفي").length;
    return { revenue, expenses: expTotal, profit: revenue - expTotal, paid_invoices: paid, unpaid_invoices: unpaid, exempt_invoices: exempt };
  }, []);
  return { summary, loading: summary === undefined };
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
export function useNotifications() {
  const notifications = useLiveQuery(() => db.notifications.orderBy("created_at").reverse().toArray(), []);
  return { notifications: notifications ?? [], loading: notifications === undefined };
}

export async function addNotification(data: Omit<Notification, "id" | "created_at">) {
  await db.notifications.add({ ...data, id: genId(), created_at: now() });
}

export async function markNotificationRead(id: string) {
  await db.notifications.update(id, { is_read: true });
}

export async function markAllNotificationsRead() {
  await db.notifications.toCollection().modify({ is_read: true });
}

// ─── LEADERBOARD ───────────────────────────────────────────────────────────
export function useLeaderboard() {
  const leaderboard = useLiveQuery(async () => {
    const students = await db.students.toArray();
    const sessionRecords = await db.session_records.toArray();

    return students.map(s => {
      const myRecords = sessionRecords.filter(r => r.student_id === s.id);
      const totalSessions = myRecords.length;
      const presentSessions = myRecords.filter(r => r.is_present).length;
      const attendance_score = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
      const avgGrade = myRecords.filter(r => r.grade != null).reduce((s, r) => s + (r.grade ?? 0), 0) / (myRecords.filter(r => r.grade != null).length || 1);
      const memorization_score = Math.min(100, Math.round(avgGrade));
      const points = presentSessions * 10 + Math.round(memorization_score * 0.5) + (s.rating ?? 0) * 5;

      return {
        student_id: s.id,
        student_name: s.full_name,
        circle_name: s.circle_name,
        points,
        attendance_score,
        memorization_score,
        is_student_of_month: false,
      };
    }).sort((a, b) => b.points - a.points).slice(0, 25);
  }, []);
  return { leaderboard: leaderboard ?? [], loading: leaderboard === undefined };
}

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────
export function useDashboardStats() {
  const stats = useLiveQuery(async () => {
    const [students, teachers, circles, sessions, invoices, expenses, notifications] = await Promise.all([
      db.students.count(),
      db.teachers.count(),
      db.circles.where("status").equals("نشطة").count(),
      db.sessions.count(),
      db.invoices.toArray(),
      db.expenses.toArray(),
      db.notifications.orderBy("created_at").reverse().limit(5).toArray(),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = await db.sessions.where("date").equals(today).toArray();
    let present_today = 0, absent_today = 0;
    for (const s of todaySessions) {
      present_today += s.present_count ?? 0;
      absent_today += (s.student_count ?? 0) - (s.present_count ?? 0);
    }

    const total_revenue = invoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0);
    const total_expenses = expenses.reduce((s, e) => s + e.amount, 0);

    return {
      total_students: students,
      total_teachers: teachers,
      total_circles: circles,
      total_sessions: sessions,
      present_today,
      absent_today,
      total_revenue,
      total_expenses,
      profit: total_revenue - total_expenses,
      recent_notifications: notifications,
    };
  }, []);
  return { stats, loading: stats === undefined };
}

// ─── INVOICE AUTO-GENERATION ───────────────────────────────────────────────
async function _generateMonthlyInvoice(student_id: string, student_name: string, amount: number) {
  const month = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const existing = await db.invoices.where("student_id").equals(student_id).filter(i => i.month === month).count();
  if (existing === 0) {
    await addInvoice({ student_id, student_name, month, amount, status: "غير مدفوع" });
  }
}

export async function generateMonthlyInvoices() {
  const students = await db.students.filter(s => !s.is_exempt && !!s.payment_amount && (s.payment_amount ?? 0) > 0).toArray();
  const month = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  for (const s of students) {
    const existing = await db.invoices.where("student_id").equals(s.id).filter(i => i.month === month).count();
    if (existing === 0) {
      await addInvoice({ student_id: s.id, student_name: s.full_name, month, amount: s.payment_amount!, status: "غير مدفوع" });
    }
  }
}
