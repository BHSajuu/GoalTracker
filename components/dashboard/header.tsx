"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Menu, LogOut, User, Zap } from "lucide-react";

export function DashboardHeader() {
  const { logout, userEmail } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="flex lg:hidden items-center justify-between h-16 px-4 md:px-6">

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-xl text-foreground">GoalForge</span>
        </div>

        {/* Spacer for Desktop */}
        <div className="hidden lg:block" />

        {/* User Menu */} 
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 hover:bg-secondary/50"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm font-medium text-foreground">
                {userEmail}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">Account</p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
            <DropdownMenuSeparator />
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
