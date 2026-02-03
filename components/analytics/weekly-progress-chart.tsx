"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Calendar } from "lucide-react";

interface WeeklyProgressChartProps {
  data: { date: string; completed: number }[];
}

export function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  const chartConfig = {
    completed: {
      label: "Tasks Completed",
      color: "#00d4ff",
    },
  };

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Weekly Progress</h3>
          <p className="text-sm text-muted-foreground">
            Tasks completed over the last 7 days
          </p>
        </div>
      </div>

      {data.length === 0 || data.every((d) => d.completed === 0) ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">
            No tasks completed this week yet
          </p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2a3e"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "rgba(0, 212, 255, 0.1)" }}
              />
              <Bar
                dataKey="completed"
                fill="#00d4ff"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
