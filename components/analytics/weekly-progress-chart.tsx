"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface WeeklyProgressChartProps {
  data: { date: string; completed: number }[];
}

export function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {

  return (
    <Card className="glass-card w-full h-full animate-slide-up shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Tasks completed vs Trend</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.length === 0 || data.every((d) => d.completed === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>No activity recorded this week.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 0,
                }}
              >
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  scale="band"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={40}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />

                {/* Bar for Volume */}
                <Bar
                  name="Completed"
                  dataKey="completed"
                  barSize={30}
                  fill="#364ce0ff"
                  radius={[6, 6, 0, 0]}
                  fillOpacity={0.98}
                />

                {/* Line for Trend */}
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Trend"
                  stroke="#ff7300"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ff7300", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}