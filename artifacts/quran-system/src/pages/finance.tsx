import { useState } from "react";
import {
  useGetFinanceSummary, useListInvoices, useListExpenses,
  useCreateInvoice, useCreateExpense,
  getListInvoicesQueryKey, getListExpensesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function AddInvoiceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [month, setMonth] = useState("");
  const [amountOverride, setAmountOverride] = useState("");

  const createInvoice = useCreateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: { month: string; amount_override?: number } = { month };
    if (amountOverride) data.amount_override = Number(amountOverride);
    createInvoice.mutate(
      { data },
      {
        onSuccess: (result) => {
          toast({ title: "تم إنشاء الفواتير بنجاح", description: `تم إنشاء ${(result as any[]).length} فاتورة` });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          setMonth(""); setAmountOverride("");
          onOpenChange(false);
        },
        onError: () => toast({ title: "خطأ في إنشاء الفواتير", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء فواتير شهرية</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">سيتم إنشاء فاتورة لكل الطلاب للشهر المحدد.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">الشهر</label>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">المبلغ الموحد (اختياري)</label>
            <Input
              type="number"
              value={amountOverride}
              onChange={e => setAmountOverride(e.target.value)}
              placeholder="إذا تُركت فارغة سيُستخدم مبلغ كل طالب"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "جارٍ الإنشاء..." : "إنشاء الفواتير"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const createExpense = useCreateExpense();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(
      { data: { category, description, amount: Number(amount), date } },
      {
        onSuccess: () => {
          toast({ title: "تم إضافة المصروف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          setCategory(""); setDescription(""); setAmount("");
          onOpenChange(false);
        },
        onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
      }
    );
  };

  const CATEGORIES = ["رواتب", "صيانة", "قرطاسية", "كهرباء", "إيجار", "أخرى"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مصروف جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">الفئة</label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">الوصف</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف المصروف" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">المبلغ</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">التاريخ</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? "جارٍ الإضافة..." : "إضافة المصروف"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Finance() {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useGetFinanceSummary();
  const { data: invoices, isLoading: invoicesLoading } = useListInvoices();
  const { data: expenses, isLoading: expensesLoading } = useListExpenses();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المالية</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setExpenseModalOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة مصروف
          </Button>
          <Button className="gap-2" onClick={() => setInvoiceModalOpen(true)}>
            <Plus className="h-4 w-4" />
            فواتير شهرية
          </Button>
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{Number(summary.revenue).toLocaleString()} ج.م</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.paid_invoices ?? 0} فاتورة مدفوعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{Number(summary.expenses).toLocaleString()} ج.م</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.unpaid_invoices ?? 0} فاتورة غير مدفوعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${Number(summary.profit) >= 0 ? "text-primary" : "text-red-600"}`}>
                {Number(summary.profit).toLocaleString()} ج.م
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الفواتير الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? <Skeleton className="h-40" /> : (
              <div className="space-y-3">
                {invoices?.slice(0, 8).map(inv => (
                  <div key={inv.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{inv.student_name}</div>
                      <div className="text-xs text-muted-foreground">{inv.month}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === "مدفوع" || inv.status === "paid" ? "bg-green-100 text-green-800" :
                        inv.status === "معفى" || inv.status === "معفي" || inv.status === "exempt" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {inv.status === "paid" ? "مدفوع" : inv.status === "unpaid" ? "غير مدفوع" : inv.status === "exempt" ? "معفى" : inv.status}
                      </span>
                      <span className="font-bold text-sm">{Number(inv.amount).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                ))}
                {!invoices?.length && <p className="text-center text-muted-foreground text-sm py-4">لا توجد فواتير</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المصروفات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? <Skeleton className="h-40" /> : (
              <div className="space-y-3">
                {expenses?.slice(0, 8).map(exp => (
                  <div key={exp.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{exp.category}</div>
                      <div className="text-xs text-muted-foreground">{exp.description} — {exp.date}</div>
                    </div>
                    <span className="font-bold text-sm text-red-600">{Number(exp.amount).toLocaleString()} ج.م</span>
                  </div>
                ))}
                {!expenses?.length && <p className="text-center text-muted-foreground text-sm py-4">لا توجد مصروفات</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddInvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
}
