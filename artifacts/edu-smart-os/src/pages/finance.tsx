import { useState } from "react";
import { useFinanceSummary, useInvoices, useExpenses, updateInvoice, deleteExpense } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Wallet, TrendingUp, TrendingDown, FileText, Receipt, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import type { Invoice } from "@/lib/store";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("summary");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const { summary, loading: isLoadingSummary } = useFinanceSummary();
  const { invoices, loading: isLoadingInvoices } = useInvoices(invoiceSearch);
  const { expenses, loading: isLoadingExpenses } = useExpenses();

  const filteredInvoices = invoices;

  const markPaid = async (invoice: Invoice) => {
    try {
      await updateInvoice(invoice.id, { status: "مدفوع" });
      toast({ title: "تم تحديث حالة الدفع" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      try {
        await deleteExpense(id);
        toast({ title: "تم حذف المصروف" });
      } catch {
        toast({ title: "حدث خطأ", variant: "destructive" });
      }
    }
  };

  const invoiceStatusColor = (status: string) =>
    status === "مدفوع" ? "text-green-600 border-green-600 bg-green-50" :
    status === "غير مدفوع" ? "text-destructive border-destructive bg-destructive/5" :
    status === "معفي" ? "text-blue-600 border-blue-400 bg-blue-50" :
    "text-amber-600 border-amber-400 bg-amber-50";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الشؤون المالية</h1>
          <p className="text-muted-foreground mt-1">الإيرادات والمصروفات والاشتراكات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setExpenseOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مصروف
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 p-1">
          <TabsTrigger value="summary">الملخص المالي</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          {isLoadingSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-gold-500/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-primary">إجمالي الإيرادات</CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{summary.revenue?.toLocaleString()} ج.م</div>
                  <p className="text-xs text-muted-foreground mt-1">{summary.paid_invoices ?? 0} فاتورة مدفوعة</p>
                </CardContent>
              </Card>
              <Card className="border-gold-500/20 bg-destructive/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-destructive">إجمالي المصروفات</CardTitle>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{summary.expenses?.toLocaleString()} ج.م</div>
                  <p className="text-xs text-muted-foreground mt-1">{summary.unpaid_invoices ?? 0} فاتورة غير مدفوعة</p>
                </CardContent>
              </Card>
              <Card className={`border-gold-500/20 ${(summary.profit ?? 0) >= 0 ? "bg-accent/10" : "bg-destructive/5"}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={`text-sm font-medium ${(summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive"}`}>صافي الربح</CardTitle>
                  <Wallet className={`h-5 w-5 ${(summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${(summary.profit ?? 0) >= 0 ? "text-accent" : "text-destructive"}`}>
                    {(summary.profit ?? 0) >= 0 ? "+" : ""}{summary.profit?.toLocaleString()} ج.م
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{summary.exempt_invoices ?? 0} طالب معفي</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-gold-500/20">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <FileText className="h-5 w-5 text-primary" />
                  سجل الفواتير
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث باسم الطالب..."
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !filteredInvoices.length ? (
                <div className="text-center py-12 text-muted-foreground">لا توجد فواتير مسجلة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">#</th>
                        <th className="px-4 py-3">الطالب</th>
                        <th className="px-4 py-3">الشهر</th>
                        <th className="px-4 py-3">المبلغ</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv, idx) => (
                        <tr key={inv.id} className="border-b border-muted/60 hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold">{inv.student_name}</td>
                          <td className="px-4 py-3">{inv.month}</td>
                          <td className="px-4 py-3 font-bold text-primary">{inv.amount} ج.م</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${invoiceStatusColor(inv.status ?? "")}`}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex gap-1 justify-end">
                              {inv.status === "غير مدفوع" && (
                                <Button
                                  variant="outline" size="sm"
                                  className="text-green-600 border-green-300 hover:bg-green-50 h-7 text-xs"
                                  onClick={() => markPaid(inv)}
                                >
                                  تحصيل
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10 h-7 text-xs"
                                onClick={() => setSelectedInvoice(inv)}
                              >
                                تعديل
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card className="border-gold-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <Receipt className="h-5 w-5 text-destructive" />
                  سجل المصروفات
                </CardTitle>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setExpenseOpen(true)}>
                  <Plus className="h-4 w-4 ml-1" />
                  مصروف جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !expenses.length ? (
                <div className="text-center py-12 text-muted-foreground">لا توجد مصروفات مسجلة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">التاريخ</th>
                        <th className="px-4 py-3">التصنيف</th>
                        <th className="px-4 py-3">الوصف</th>
                        <th className="px-4 py-3">المبلغ</th>
                        <th className="px-4 py-3 rounded-tl-lg text-left">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} className="border-b border-muted/60 hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                            {new Date(exp.date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs">{exp.category}</Badge>
                          </td>
                          <td className="px-4 py-3">{exp.description || "—"}</td>
                          <td className="px-4 py-3 font-bold text-destructive">{exp.amount} ج.م</td>
                          <td className="px-4 py-3 text-left">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteExpense(exp.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <InvoiceModal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoice={selectedInvoice} />
    </div>
  );
}
