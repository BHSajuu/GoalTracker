"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  BarChart3,
  LogOut,
  Zap,
  StickyNote,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

// Navigation Items
const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Goals", href: "/dashboard/goals", icon: Target },
  { title: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { title: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { logout, userEmail } = useAuth();
  const [open, setOpen] = useState(false);

  // Reusable Nav Content to avoid duplication
  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:animate-glow-pulse transition-all">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            GoalForge
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30">
           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs">
              {userEmail?.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
           </div>
           <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
           </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Visible on lg and up) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col glass border-r border-border/50">
        <NavContent />
      </aside>

      {/* Mobile/Tablet Trigger (Visible on md and below, usually in Header, but we can put a trigger here if needed) 
          Actually, the Hamburger trigger is usually in the Header. 
          Let's export a specialized "MobileNav" component or handle it via the Header. 
          For now, we will leave the TRIGGER in the Header component (next step), 
          but we need to ensure this file exports the content or the Bottom Nav.
      */}

      {/* Mobile Bottom Navigation (Visible only on small screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive ? "text-primary scale-110" : "text-muted-foreground opacity-70"
                )}
              >
                <item.icon className="w-5 h-5" />
                {/* Hide text on very small screens if needed, but usually fine */}
              </Link>
            );
          })}
          <div className="flex flex-col items-center gap-1 px-4 py-2">
             <Sheet open={open} onOpenChange={setOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                   <Menu className="w-5 h-5" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="p-0 w-72 glass border-r-border/50">
                 <NavContent />
               </SheetContent>
             </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}