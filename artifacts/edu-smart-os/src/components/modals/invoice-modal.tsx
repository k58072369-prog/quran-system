import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateInvoice, type Invoice } from "@/lib/store";

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
}

export function InvoiceModal({ open, onClose, invoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState(invoice?.status ?? "غير مدفوع");

  const handleSave = async () => {
    if (!invoice) return;
    setIsPending(true);
    try {
      await updateInvoice(invoice.id, { status });
      toast({ title: "تم تحديث حالة الفاتورة" });
      onClose();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">تفاصيل الفاتورة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الطالب</span>
              <span className="font-semibold">{invoice.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الشهر</span>
              <span className="font-semibold">{invoice.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ</span>
              <span className="font-bold text-primary">{invoice.amount} ج.م</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الحالة الحالية</span>
              <Badge variant="outline" className={
                invoice.status === "مدفوع" ? "text-green-600 border-green-600" :
                invoice.status === "غير مدفوع" ? "text-destructive border-destructive" :
                "text-muted-foreground"
              }>{invoice.status}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>تغيير الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="مدفوع">مدفوع</SelectItem>
                <SelectItem value="غير مدفوع">غير مدفوع</SelectItem>
                <SelectItem value="معفي">معفي</SelectItem>
                <SelectItem value="متأخر">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
