"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Expected passenger spike for today at Kochi platform"

const chartConfig = {
  passengers: {
    label: "Passengers",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: { data: { time: string; passengers: number }[] }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Passenger Prediction</CardTitle>
          <CardDescription>Expected passengers throughout today</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, (dataMax: number) => Math.floor(dataMax * 1.2)]}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="passengers"
                type="natural"
                stroke="var(--color-passengers)"
                strokeWidth={2}
                dot={{ fill: "var(--color-passengers)" }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            AI Forecast loaded <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Showing expected passenger counts for Kochi platform today
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
