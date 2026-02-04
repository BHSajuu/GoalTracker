"use client";

import Link from "next/link";
import { Plus, Target, CheckSquare, BarChart3 } from "lucide-react";

const actions = [
  {
    title: "New Goal",
    description: "Create a new goal",
    href: "/dashboard/goals?new=true",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
    hoverBg: "hover:bg-primary/20",
  },
  {
    title: "Add Task",
    description: "Add a new task",
    href: "/dashboard/tasks?new=true",
    icon: CheckSquare,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    hoverBg: "hover:bg-green-500/20",
  },
  {
    title: "View Analytics",
    description: "Check your progress",
    href: "/dashboard/analytics",
    icon: BarChart3,
    color: "text-accent",
    bgColor: "bg-accent/10",
    hoverBg: "hover:bg-accent/20",
  },
];

export function QuickActions() {
  return (
    <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`glass-card rounded-2xl p-4 flex items-center gap-4 group transition-all ${action.hoverBg}`}
          >
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform`}
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                {action.title}
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
