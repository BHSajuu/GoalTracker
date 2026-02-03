"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Doc } from "@/convex/_generated/dataModel";
import { FolderOpen } from "lucide-react";

interface CategoryBreakdownChartProps {
  goals: Doc<"goals">[];
  tasks: Doc<"tasks">[];
}

export function CategoryBreakdownChart({
  goals,
  tasks,
}: CategoryBreakdownChartProps) {
  // Group tasks by category through goals
  const categoryData = goals.map((goal) => {
    const goalTasks = tasks.filter((t) => t.goalId === goal._id);
    return {
      name: goal.category,
      value: goalTasks.length,
      color: goal.color,
    };
  });

  // Combine same categories
  const combinedData = categoryData.reduce(
    (acc, curr) => {
      const existing = acc.find((item) => item.name === curr.name);
      if (existing) {
        existing.value += curr.value;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    },
    [] as typeof categoryData
  );

  const chartConfig = combinedData.reduce(
    (acc, item) => {
      acc[item.name] = { label: item.name, color: item.color };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>
  );

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.35s" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Category Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Tasks distributed by category
          </p>
        </div>
      </div>

      {combinedData.length === 0 || combinedData.every((d) => d.value === 0) ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">No tasks to display</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={combinedData.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {combinedData
                  .filter((d) => d.value > 0)
                  .map((entry, index) => (
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
                          {payload[0].value} tasks
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
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
