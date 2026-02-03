"use client";

import React from "react"

import { Progress } from "@/components/ui/progress";
import { Doc } from "@/convex/_generated/dataModel";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface GoalProgressChartProps {
  goals: Doc<"goals">[];
}

export function GoalProgressChart({ goals }: GoalProgressChartProps) {
  const sortedGoals = [...goals].sort((a, b) => b.progress - a.progress);

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Goal Progress Overview</h3>
          <p className="text-sm text-muted-foreground">
            Progress across all your goals
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No goals to display</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedGoals.map((goal, index) => (
            <Link
              key={goal._id}
              href={`/dashboard/goals/${goal._id}`}
              className="block group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />
                  <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {goal.title}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${goal.color}20`,
                      color: goal.color,
                    }}
                  >
                    {goal.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground ml-4">
                  {goal.progress}%
                </span>
              </div>
              <Progress
                value={goal.progress}
                className="h-2.5"
                style={
                  {
                    "--primary": goal.color,
                  } as React.CSSProperties
                }
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
