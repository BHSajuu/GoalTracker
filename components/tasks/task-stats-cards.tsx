"use client";

import { ListTodo, Calendar, CheckSquare, CheckCircle2 } from "lucide-react";

interface TaskStatsCardsProps {
  totalTasks: number;
  todayTasksCount: number;
  pendingTasks: number;
  completedTasks: number;
}

const stats = [
  {
    title: "Total",
    icon: ListTodo,
    color: "text-primary",
    bgColor: "bg-primary/10",
    getValue: (props: TaskStatsCardsProps) => props.totalTasks,
  },
  {
    title: "Today",
    icon: Calendar,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    getValue: (props: TaskStatsCardsProps) => props.todayTasksCount,
  },
  {
    title: "Pending",
    icon: CheckSquare,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    getValue: (props: TaskStatsCardsProps) => props.pendingTasks,
  },
  {
    title: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    getValue: (props: TaskStatsCardsProps) => props.completedTasks,
  },
];

export function TaskStatsCards(props: TaskStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-18">
      {stats.map((stat, index) => (
        <div
          key={stat.title}
          className={`flex glass-card rounded-xl p-4 animate-slide-up stagger-${index + 1}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xs text-foreground">{stat.title}</p>
            <div>
              <p className="text-2xl ml-2 lg:ml-8 font-bold text-foreground">
                {stat.getValue(props)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}