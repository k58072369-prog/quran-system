import { useState } from "react";
import { useStudents, deleteStudent, type Student } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentModal } from "@/components/modals/student-modal";
import { StudentDetailModal } from "@/components/modals/student-detail-modal";

export default function Students() {
  const [search, setSearch] = useState("");
  const { students, loading } = useStudents(search);
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب "${name}"؟`)) {
      try {
        await deleteStudent(id);
        toast({ title: "تم حذف الطالب بنجاح" });
      } catch {
        toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    }
  };

  const paymentColor = (status: string) =>
    status === "مدفوع" ? "text-green-600 border-green-600 bg-green-50" :
    status === "غير مدفوع" ? "text-destructive border-destructive bg-destructive/5" :
    status === "معفي" ? "text-blue-600 border-blue-400 bg-blue-50" :
    "text-amber-600 border-amber-400 bg-amber-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">الطلاب</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات طلاب الحلقات القرءانية</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="ml-2 h-4 w-4" />
          إضافة طالب
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: students.length, color: "text-primary" },
          { label: "مدفوعون", value: students.filter(s => s.payment_status === "مدفوع").length, color: "text-green-600" },
          { label: "غير مدفوعين", value: students.filter(s => s.payment_status === "غير مدفوع").length, color: "text-destructive" },
          { label: "معفيون", value: students.filter(s => s.is_exempt).length, color: "text-blue-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-gold-500/20">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gold-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث باسم الطالب..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-sm text-muted-foreground mr-auto">
              <Users className="h-4 w-4 inline ml-1" />
              {students.length} طالب
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !students.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">لا يوجد طلاب</p>
              <p className="text-sm mt-1">اضغط على "إضافة طالب" لبدء التسجيل</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-muted-foreground bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">الاسم</th>
                    <th className="px-4 py-3">الصف</th>
                    <th className="px-4 py-3">الحلقة</th>
                    <th className="px-4 py-3">المعلم</th>
                    <th className="px-4 py-3">رقم ولي الأمر</th>
                    <th className="px-4 py-3">حالة الرسوم</th>
                    <th className="px-4 py-3">المستوى</th>
                    <th className="px-4 py-3 rounded-tl-lg text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-muted/60 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-secondary">
                        <button onClick={() => setDetailStudent(student)} className="hover:text-primary hover:underline transition-colors">
                          {student.full_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{student.grade}</td>
                      <td className="px-4 py-3">{student.circle_name || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">{student.teacher_name || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 font-mono text-sm" dir="ltr">{student.guardian_phone}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${paymentColor(student.payment_status ?? "")}`}>
                          {student.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {student.level ? (
                          <span className={`text-xs font-medium ${
                            student.level === "ممتاز" ? "text-green-600" :
                            student.level === "جيد جداً" ? "text-primary" :
                            student.level === "ضعيف" ? "text-destructive" :
                            "text-amber-600"
                          }`}>{student.level}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="عرض التفاصيل" onClick={() => setDetailStudent(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="تعديل" onClick={() => setEditStudent(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="حذف" onClick={() => handleDelete(student.id, student.full_name)}>
                            <Trash2 className="h-4 w-4" />
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

      <StudentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <StudentModal open={!!editStudent} onClose={() => setEditStudent(null)} student={editStudent} />
      <StudentDetailModal
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        onEdit={() => { setEditStudent(detailStudent); setDetailStudent(null); }}
      />
    </div>
  );
}
