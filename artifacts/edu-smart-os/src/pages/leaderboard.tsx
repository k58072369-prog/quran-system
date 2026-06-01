import { useLeaderboard } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Users, BookOpen, CheckCircle } from "lucide-react";

export default function Leaderboard() {
  const { leaderboard, loading } = useLeaderboard();
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 25);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-2xl mb-1">
          <Trophy className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold text-secondary">لوحة الشرف والصدارة</h1>
        <p className="text-muted-foreground">أفضل الطلاب أداءً والتزاماً — مكتب الفرقان لتحفيظ القرآن الكريم</p>
        {leaderboard.length > 0 && (
          <div className="flex justify-center gap-6 pt-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{Math.min(leaderboard.length, 25)} طالب</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !leaderboard.length ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border max-w-4xl mx-auto">
          <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد بيانات متاحة للوحة الصدارة</p>
          <p className="text-sm mt-1">سيتم حساب النقاط عند تسجيل الحصص والحضور</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {top3.length >= 1 && (
            <div className="grid grid-cols-3 gap-4 mb-2 items-end">
              {top3[1] ? (
                <div className="text-center space-y-2">
                  <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mx-2">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-gray-600">2</span>
                    </div>
                    <div className="font-bold text-secondary text-sm truncate">{top3[1].student_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{top3[1].circle_name}</div>
                    <div className="text-lg font-bold text-gray-600 mt-1">{top3[1].points}</div>
                    <div className="text-xs text-muted-foreground">نقطة</div>
                  </div>
                  <div className="bg-gray-200 rounded-t-lg h-12 mx-4" />
                </div>
              ) : <div />}

              <div className="text-center space-y-2">
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 shadow-lg shadow-yellow-200">
                  <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-yellow-700">1</span>
                  </div>
                  <div className="font-bold text-secondary truncate">{top3[0].student_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{top3[0].circle_name}</div>
                  {top3[0].is_student_of_month && (
                    <Badge className="bg-accent text-white text-xs mt-1">
                      <Star className="h-3 w-3 ml-0.5 fill-current" />
                      طالب الشهر
                    </Badge>
                  )}
                  <div className="text-2xl font-bold text-yellow-600 mt-1">{top3[0].points}</div>
                  <div className="text-xs text-muted-foreground">نقطة</div>
                </div>
                <div className="bg-yellow-300 rounded-t-lg h-16 mx-4" />
              </div>

              {top3[2] ? (
                <div className="text-center space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-2">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-amber-700">3</span>
                    </div>
                    <div className="font-bold text-secondary text-sm truncate">{top3[2].student_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{top3[2].circle_name}</div>
                    <div className="text-lg font-bold text-amber-700 mt-1">{top3[2].points}</div>
                    <div className="text-xs text-muted-foreground">نقطة</div>
                  </div>
                  <div className="bg-amber-200 rounded-t-lg h-8 mx-4" />
                </div>
              ) : <div />}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">المراكز 4 – 25</h3>
              {rest.map((entry, index) => {
                const rank = index + 4;
                return (
                  <Card key={entry.student_id} className="border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-secondary truncate">{entry.student_name}</h3>
                            {entry.is_student_of_month && (
                              <Badge className="bg-accent text-white text-xs">
                                <Star className="h-3 w-3 ml-0.5 fill-current" />
                                طالب الشهر
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{entry.circle_name || "حلقة غير محددة"}</div>
                        </div>
                        <div className="hidden sm:flex items-center gap-5 text-sm flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mb-0.5" />
                            <span className="font-semibold">{entry.attendance_score}%</span>
                            <span className="text-xs text-muted-foreground">حضور</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-3.5 w-3.5 text-primary mb-0.5" />
                            <span className="font-semibold">{entry.memorization_score}%</span>
                            <span className="text-xs text-muted-foreground">حفظ</span>
                          </div>
                        </div>
                        <div className="bg-primary/10 px-4 py-2 rounded-lg text-center flex-shrink-0">
                          <div className="text-xs text-primary font-medium">النقاط</div>
                          <div className="text-xl font-bold text-primary">{entry.points}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="border-gold-500/20 bg-gradient-to-l from-primary/5 to-transparent">
            <CardContent className="p-5">
              <h4 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                كيفية احتساب النقاط
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { label: "الحضور", desc: "10 نقاط لكل حضور" },
                  { label: "الحفظ", desc: "حسب درجة الأداء" },
                  { label: "المراجعة", desc: "حسب المقدار المراجع" },
                  { label: "التقييم", desc: "5 نقاط × التقييم" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/60 rounded-lg p-2.5 border border-primary/10 text-center">
                    <div className="font-semibold text-primary text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
