import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, invoicesTable, expensesTable, studentsTable } from "@workspace/db";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  UpdateInvoiceParams,
  ListInvoicesQueryParams,
  GetFinanceSummaryQueryParams,
  CreateExpenseBody,
} from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

function formatInvoice(i: Record<string, unknown>) {
  return {
    ...toSnakeCase(i),
    amount: Number(i.amount),
  };
}

function formatExpense(e: Record<string, unknown>) {
  return {
    ...toSnakeCase(e),
    amount: Number(e.amount),
  };
}

router.get("/invoices", async (req, res): Promise<void> => {
  const query = ListInvoicesQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.month) conditions.push(eq(invoicesTable.month, query.data.month));
  if (query.success && query.data.status) conditions.push(eq(invoicesTable.status, query.data.status));

  const invoices = await db
    .select({
      id: invoicesTable.id,
      studentId: invoicesTable.studentId,
      studentName: studentsTable.fullName,
      month: invoicesTable.month,
      amount: invoicesTable.amount,
      status: invoicesTable.status,
      isExempt: invoicesTable.isExempt,
      paidAt: invoicesTable.paidAt,
      createdAt: invoicesTable.createdAt,
    })
    .from(invoicesTable)
    .leftJoin(studentsTable, eq(invoicesTable.studentId, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoicesTable.month, studentsTable.fullName);

  res.json(invoices.map(i => formatInvoice(i as any)));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { month, amount_override } = parsed.data as any;
  const students = await db.select().from(studentsTable);

  const values = students.map(s => ({
    studentId: s.id,
    month,
    amount: amount_override?.toString() ?? s.paymentAmount ?? "0",
    status: s.isExempt ? "معفي" : "غير مدفوع",
    isExempt: s.isExempt,
  }));

  if (values.length === 0) {
    res.status(201).json([]);
    return;
  }

  const invoices = await db.insert(invoicesTable).values(values).returning();
  res.status(201).json(invoices.map(i => formatInvoice(i as any)));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.status !== undefined) updates.status = d.status;
  if (d.amount !== undefined) updates.amount = d.amount?.toString();
  if (d.is_exempt !== undefined) updates.isExempt = d.is_exempt;
  if (d.paid_at !== undefined) updates.paidAt = d.paid_at ? new Date(d.paid_at) : null;
  if (d.status === "مدفوع" && d.paid_at === undefined) updates.paidAt = new Date();

  const [invoice] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, params.data.id)).returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(formatInvoice(invoice as any));
});

router.get("/expenses", async (_req, res): Promise<void> => {
  const expenses = await db.select().from(expensesTable).orderBy(expensesTable.date);
  res.json(expenses.map(e => formatExpense(e as any)));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [expense] = await db.insert(expensesTable).values({
    category: d.category,
    description: d.description,
    amount: d.amount?.toString(),
    date: d.date,
  }).returning();

  res.status(201).json(formatExpense(expense as any));
});

router.get("/finance/summary", async (req, res): Promise<void> => {
  const query = GetFinanceSummaryQueryParams.safeParse(req.query);
  const month = (query.success && query.data.month) ? query.data.month : null;

  const invoiceConditions = month ? [eq(invoicesTable.month, month)] : [];
  const invoices = await db.select().from(invoicesTable).where(invoiceConditions.length > 0 ? and(...invoiceConditions) : undefined);
  const expenses = await db.select().from(expensesTable);

  const revenue = invoices.filter(i => i.status === "مدفوع").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const profit = revenue - totalExpenses;

  const paidInvoices = invoices.filter(i => i.status === "مدفوع").length;
  const unpaidInvoices = invoices.filter(i => i.status === "غير مدفوع").length;
  const exemptInvoices = invoices.filter(i => i.status === "معفي").length;

  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
  invoices.forEach(i => {
    if (!monthlyData[i.month]) monthlyData[i.month] = { revenue: 0, expenses: 0 };
    if (i.status === "مدفوع") monthlyData[i.month].revenue += Number(i.amount);
  });

  const monthlyBreakdown = Object.entries(monthlyData).map(([m, data]) => ({
    month: m,
    revenue: data.revenue,
    expenses: data.expenses,
  }));

  res.json({
    month,
    revenue,
    expenses: totalExpenses,
    profit,
    paid_invoices: paidInvoices,
    unpaid_invoices: unpaidInvoices,
    exempt_invoices: exemptInvoices,
    monthly_breakdown: monthlyBreakdown,
  });
});

export default router;
