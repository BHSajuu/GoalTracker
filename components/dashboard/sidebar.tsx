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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";

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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-blue-300/30 animate-glow-pulse transition-all">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="" />
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            Zielio
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
                  ? "text-white border border-blue-300/30 shadow-[0_0_25px_rgba(147,197,253,0.5)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105 hover:shadow-[0_0_15px_rgba(147,197,253,0.35)]"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              className="flex items-center gap-2 px-2 hover:bg-orange-800/70 rounded-full md:rounded-md"
            >
              <div className=" flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 hover:bg-gray-800 text-primary font-bold text-xs  transition-all">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm font-medium text-foreground">
                {userEmail}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">Account</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive gap-2 cursor-pointer">
              <LogOut className="w-4 h-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Visible on lg and up) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col glass border-r border-border/50">
        <NavContent />
      </aside>

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
                <item.icon className="w-6 h-6" />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}