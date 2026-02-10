"use client";

import { Target, CheckCircle2, TrendingUp, BarChart3, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsStatsCardsProps {
  activeGoals: number;
  completedGoals: number;
  avgProgress: number;
  completionRate: number;
}

interface StatItem {
  label: string;
  icon: LucideIcon;
  color: string;
  shadowColor: string;
  getValue: (props: AnalyticsStatsCardsProps) => string | number;
  subtext: string;
}

const statItems: StatItem[] = [
  {
    label: "Active Goals",
    icon: Target,
    color: "text-primary",
    shadowColor: "hover:shadow-primary/60",
    getValue: (props) => props.activeGoals,
    subtext: "In progress",
  },
  {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    shadowColor: "hover:shadow-green-500/60",
    getValue: (props) => props.completedGoals,
    subtext: "Total achieved",
  },
  {
    label: "Avg Progress",
    icon: TrendingUp,
    color: "text-accent",
    shadowColor: "hover:shadow-accent/60",
    getValue: (props) => `${props.avgProgress}%`,
    subtext: "Across all goals",
  },
  {
    label: "Task Rate",
    icon: BarChart3,
    color: "text-orange-500",
    shadowColor: "hover:shadow-orange-500/60",
    getValue: (props) => `${props.completionRate}%`,
    subtext: "Tasks completed",
  },
];

export function AnalyticsStatsCards(props: AnalyticsStatsCardsProps) {
  return (
    <div 
      className="md:mx-10 grid grid-cols-2 lg:grid-cols-4 md:gap-16 gap-3 animate-slide-up" 
      style={{ animationDelay: "0.1s" }}
    >
      {statItems.map((item) => (
        <Card 
          key={item.label}
          className={`glass border-border/50 ${item.shadowColor} hover:scale-105 transition-all duration-400`}
        >
          <CardHeader className="flex flex-row items-center justify-center gap-2 space-y-0">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold">
              {item.getValue(props)}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.subtext}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}