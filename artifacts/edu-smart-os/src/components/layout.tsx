import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CircleDot,
  CalendarDays,
  Wallet,
  Bell,
  Trophy,
} from "lucide-react";

export function AppSidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "لوحة التحكم", path: "/", icon: LayoutDashboard },
    { name: "الطلاب", path: "/students", icon: Users },
    { name: "المعلمون", path: "/teachers", icon: GraduationCap },
    { name: "الحلقات", path: "/circles", icon: CircleDot },
    { name: "الحصص", path: "/sessions", icon: CalendarDays },
    { name: "الشؤون المالية", path: "/finance", icon: Wallet },
    { name: "الإشعارات", path: "/notifications", icon: Bell },
    { name: "لوحة الصدارة", path: "/leaderboard", icon: Trophy },
  ];

  return (
    <Sidebar className="border-l border-sidebar-border" side="right">
      <div className="flex h-20 items-center px-5 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground flex-col justify-center gap-0.5">
        <h1 className="text-base font-bold tracking-tight text-gold-500 leading-tight text-center">مكتب الفرقان</h1>
        <p className="text-xs text-gold-500/70 text-center">لتحفيظ القرآن الكريم</p>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.path || (item.path !== "/" && location.startsWith(item.path))}
                  >
                    <Link href={item.path} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-center text-gold-500/50">نظام إدارة متكامل</p>
      </div>
    </Sidebar>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-background/95 relative z-10">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
          <div className="p-6 md:p-8 lg:p-10 relative z-20 flex-1 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}