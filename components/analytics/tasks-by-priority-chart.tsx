"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Doc } from "@/convex/_generated/dataModel";
import { Flag } from "lucide-react";

interface TasksByPriorityChartProps {
  tasks: Doc<"tasks">[];
}

export function TasksByPriorityChart({ tasks }: TasksByPriorityChartProps) {
  const priorityData = [
    {
      priority: "High",
      total: tasks.filter((t) => t.priority === "high").length,
      completed: tasks.filter((t) => t.priority === "high" && t.completed).length,
      color: "#ef4444",
    },
    {
      priority: "Medium",
      total: tasks.filter((t) => t.priority === "medium").length,
      completed: tasks.filter((t) => t.priority === "medium" && t.completed).length,
      color: "#f59e0b",
    },
    {
      priority: "Low",
      total: tasks.filter((t) => t.priority === "low").length,
      completed: tasks.filter((t) => t.priority === "low" && t.completed).length,
      color: "#10b981",
    },
  ];

  const chartConfig = {
    total: { label: "Total", color: "#2a2a3e" },
    completed: { label: "Completed", color: "#00d4ff" },
  };

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Flag className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Tasks by Priority</h3>
          <p className="text-sm text-muted-foreground">
            Completion rate per priority level
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">No tasks to display</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={priorityData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2a3e"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="priority"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass rounded-lg p-3 border border-border/50 shadow-xl">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {data.priority} Priority
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: {data.total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed: {data.completed}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="total"
                fill="#2a2a3e"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              />
              <Bar dataKey="completed" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
