import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addExpense } from "@/lib/store";

const CATEGORIES = [
  "مرتبات", "إيجار", "كهرباء", "مياه", "صيانة",
  "مستلزمات", "تسويق", "مواصلات", "أخرى",
];

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExpenseModal({ open, onClose }: ExpenseModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!open) setForm({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
  }, [open]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.category) { toast({ title: "التصنيف مطلوب", variant: "destructive" }); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast({ title: "المبلغ مطلوب ويجب أن يكون أكبر من صفر", variant: "destructive" }); return; }
    if (!form.date) { toast({ title: "التاريخ مطلوب", variant: "destructive" }); return; }

    setIsPending(true);
    try {
      await addExpense({
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        date: form.date,
      });
      toast({ title: "تم إضافة المصروف بنجاح" });
      onClose();
    } catch {
      toast({ title: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">إضافة مصروف جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>التصنيف <span className="text-destructive">*</span></Label>
            <Select value={form.category || "none"} onValueChange={v => set("category", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">اختر</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="وصف المصروف..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>المبلغ (ج.م) <span className="text-destructive">*</span></Label>
            <Input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" min={0} step={0.01} />
          </div>
          <div className="space-y-2">
            <Label>التاريخ <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-white">
            {isPending ? "جاري الحفظ..." : "إضافة المصروف"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
