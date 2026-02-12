"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Zap, LayoutDashboard, Target, CheckSquare, StickyNote, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";

export function DashboardHeader() {
  const { logout, userEmail } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Goals", href: "/dashboard/goals", icon: Target },
    { title: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { title: "Notes", href: "/dashboard/notes", icon: StickyNote },
    { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/50 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">

        {/* Tablet/Mobile Hamburger (Visible up to lg) */}
        <div className="lg:hidden flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:flex hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 glass">
              <div className="flex flex-col h-full">
                <div className="flex items-center h-16 px-6 border-b border-border/50">
                  <div className="flex items-center gap-2 font-bold text-xl">
                    <Image src="/logo.png" alt="Logo" width={28} height={28}  />Zielio
                  </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo Text for Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <Image src="/logo.png" alt="Logo" width={28} height={28}  />
            <span className="font-bold text-lg">Zielio</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 lg:flex-none" />

        {/* User Menu - Always Visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-secondary/50 rounded-full md:rounded-md"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
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
    </header>
  );
}