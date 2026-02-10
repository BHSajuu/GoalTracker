"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Doc } from "@/convex/_generated/dataModel";
import { Target } from "lucide-react";

interface GoalDistributionChartProps {
  goals: Doc<"goals">[];
}

export function GoalDistributionChart({ goals }: GoalDistributionChartProps) {
  const statusData = [
    {
      name: "Active",
      value: goals.filter((g) => g.status === "active").length,
      color: "#10b981",
    },
    {
      name: "Completed",
      value: goals.filter((g) => g.status === "completed").length,
      color: "#00d4ff",
    },
    {
      name: "Paused",
      value: goals.filter((g) => g.status === "paused").length,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  const chartConfig = {
    active: { label: "Active", color: "#10b981" },
    completed: { label: "Completed", color: "#00d4ff" },
    paused: { label: "Paused", color: "#f59e0b" },
  };

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.25s" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Goal Distribution</h3>
          <p className="text-sm text-muted-foreground">
            Goals by status
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">No goals to display</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass rounded-lg p-3 border border-border/50 shadow-xl">
                        <p className="text-sm font-medium text-foreground">
                          {payload[0].name}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {payload[0].value} goals
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
