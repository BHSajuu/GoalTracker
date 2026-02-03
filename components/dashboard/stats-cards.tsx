"use client";

import { Target, Flame, CheckCircle2, Clock } from "lucide-react";

interface StatsCardsProps {
  totalGoals: number;
  activeGoals: number;
  completedTasks: number;
  pendingTasks: number;
}

const stats = [
  {
    title: "Total Goals",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    getValue: (props: StatsCardsProps) => props.totalGoals,
  },
  {
    title: "Active Goals",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    getValue: (props: StatsCardsProps) => props.activeGoals,
  },
  {
    title: "Tasks Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    getValue: (props: StatsCardsProps) => props.completedTasks,
  },
  {
    title: "Pending Tasks",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    getValue: (props: StatsCardsProps) => props.pendingTasks,
  },
];

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <div
          key={stat.title}
          className={`glass-card rounded-2xl p-4 md:p-6 animate-slide-up stagger-${index + 1}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}
            >
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
            </div>
             <p className="text-2xl md:text-3xl font-bold text-foreground mb-1 mr-6 md:mr-10">
              {stat.getValue(props)}
            </p>
          </div>
          <div>
           
            <p className="text-xs md:text-sm text-muted-foreground">
              {stat.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
