"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

/**
 * Answers per week over the past 12 weeks. Recharts through the themed wrapper; the animation is
 * off because the headless browser this is verified with never finishes a series animation, and a
 * chart with a height that the parent gives it.
 */
const chartConfig = {
  answers: { label: "Answers", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type WeekDatum = { label: string; answers: number };

export function WeekChart({ data }: { data: WeekDatum[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={1}
          tickMargin={6}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={34}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="answers" fill="var(--color-answers)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
