import { useNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertTriangle, AlertCircle, ShieldAlert, DollarSign, Star, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { notifications, loading } = useNotifications();
  const { toast } = useToast();

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast({ title: "تم تحديد جميع الإشعارات كمقروءة" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "غياب": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "مالي": return <DollarSign className="h-5 w-5 text-destructive" />;
      case "إنجاز": return <Star className="h-5 w-5 text-accent" />;
      case "system": return <ShieldAlert className="h-5 w-5 text-primary" />;
      case "أداء": return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string | null | undefined) =>
    priority === "عاجل" ? "text-destructive border-destructive bg-destructive/5" :
    priority === "مهم" ? "text-amber-600 border-amber-400 bg-amber-50" :
    "text-muted-foreground border-muted";

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="text-primary border-primary hover:bg-primary/10">
            <CheckCircle2 className="ml-2 h-4 w-4" />
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي", value: notifications.length, icon: Bell, color: "text-primary" },
            { label: "غير مقروءة", value: unreadCount, icon: AlertCircle, color: "text-destructive" },
            { label: "غياب", value: notifications.filter(n => n.type === "غياب").length, icon: AlertTriangle, color: "text-amber-600" },
            { label: "مالية", value: notifications.filter(n => n.type === "مالي").length, icon: DollarSign, color: "text-blue-600" },
          ].map((stat, i) => (
            <Card key={i} className="border-gold-500/20">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-gold-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-secondary flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            قائمة الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 divide-y divide-border px-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="py-4 flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications.length ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
              <Bell className="h-12 w-12 text-muted mb-4 opacity-30" />
              <p>لا توجد إشعارات في الوقت الحالي</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 flex gap-4 transition-colors hover:bg-muted/30",
                    !notif.is_read && "bg-primary/5 border-r-2 border-r-primary"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type ?? "")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={cn("font-semibold text-secondary", !notif.is_read && "text-primary")}>
                          {notif.title}
                        </h4>
                        {!notif.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                        {notif.priority && notif.priority !== "عادي" && (
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(notif.priority)}`}>
                            {notif.priority}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0" dir="ltr">
                        {new Date(notif.created_at ?? "").toLocaleDateString('ar-EG', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    {notif.student_name && (
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-secondary">
                        الطالب: {notif.student_name}
                      </div>
                    )}
                  </div>
                  {!notif.is_read && (
                    <Button
                      variant="ghost" size="icon"
                      className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 h-8 w-8"
                      onClick={() => handleMarkRead(notif.id)}
                      title="تحديد كمقروء"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
