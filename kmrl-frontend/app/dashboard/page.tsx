"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, columns, schema } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSchedule, getForecast, getBatchForecast, ScheduleRequest, ScheduleResponse } from "@/lib/api"
import { z } from "zod"

export default function Page() {
  const [data, setData] = useState<z.infer<typeof schema>[]>([])
  const [chartData, setChartData] = useState<{ time: string; passengers: number }[]>([])
  const [sectionData, setSectionData] = useState({
    runningTrains: 0,
    maintenanceTrains: 0,
    nextArrival: "--:--",
    nextArrivalStatus: "Unknown",
    totalStaff: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState("Aluva")
  const [fullSchedule, setFullSchedule] = useState<ScheduleResponse | null>(null)

  // Station list
  const stations = [
    "Aluva", "Pulinchodu", "Companypady", "Ambattukavu", "Muttom",
    "Kalamassery", "Cochin University", "Pathadipalam", "Edapally",
    "Changampuzha Park", "Palarivattom", "JLN Stadium", "Kaloor",
    "Lissie", "M.G. Road", "Maharaja's College", "Ernakulam South",
    "Kadavanthra", "Elamkulam", "Vytila", "Thykkoodam", "Petta"
  ]

  // 1. Fetch Data ONCE on load
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]

        // Generate real AI data using Batch API (Optimized)
        let stationRequests;
        try {
          const batchRes = await getBatchForecast({
            date: today,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            stations: stations,
            weather: "Cloudy",
            holiday: false,
            day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' })
          })
          stationRequests = batchRes.forecasts;
        } catch (e) {
          console.error("Batch forecast failed", e)
          // Fallback
          stationRequests = stations.map(st => ({
            station: st,
            predicted_passengers: Math.floor(Math.random() * (40000 - 5000 + 1)) + 5000
          }))
        }

        const req: ScheduleRequest = {
          date: today,
          stations: stationRequests,
          available_trains: undefined, // Let backend use KMRL_CONFIG default
          staff_available: 2000
        }

        const res = await getSchedule(req)
        setFullSchedule(res)
      } catch (e) {
        console.error("Failed to fetch data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, []) // Empty dependency array = run once on mount

  // 2. Update UI when Station changes (Instant)
  useEffect(() => {
    if (!fullSchedule) return;

    const stationSchedule = fullSchedule.schedule[selectedStation];

    // Transform for Table
    const tableRows: z.infer<typeof schema>[] = []
    let idCounter = 1

    if (stationSchedule) {
      Object.entries(stationSchedule.hourly_schedule).forEach(([range, details]) => {
        const [startHour] = range.split("-")
        const count = details.trains_assigned

        for (let i = 0; i < count; i++) {
          const isReturn = i % 2 !== 0;
          const hourPart = parseInt(startHour.split(":")[0]);
          const minutePart = Math.floor((60 / count) * i);
          const arrivalTime = `${hourPart.toString().padStart(2, '0')}:${minutePart.toString().padStart(2, '0')}`;

          tableRows.push({
            id: idCounter++,
            trainName: `KMRL-${selectedStation.substring(0, 3).toUpperCase()}-${hourPart}${minutePart.toString().padStart(2, '0')}-${i + 1}`,
            trainStatus: "On Time",
            estimatedArrival: arrivalTime,
            source: isReturn ? selectedStation : "Aluva Depot",
            destination: isReturn ? "Aluva Depot" : selectedStation,
            passengers: Math.floor(stationSchedule.predicted_passengers / stationSchedule.trains_assigned_total),
            bogies: 3,
            description: isReturn
              ? `Return service from ${selectedStation} to Depot`
              : `Scheduled service for ${selectedStation} peak demand.`
          })
        }
      })
    }

    tableRows.sort((a, b) => a.estimatedArrival.localeCompare(b.estimatedArrival));

    // Transform for Chart
    const hourlyTotals: Record<string, number> = {}
    if (stationSchedule) {
      Object.entries(stationSchedule.hourly_schedule).forEach(([range, details]) => {
        const hour = range.split("-")[0]
        hourlyTotals[hour] = details.trains_assigned * 800
      })
    }

    const chartPoints = Object.entries(hourlyTotals)
      .sort()
      .map(([time, passengers]) => ({ time, passengers }))

    // Update Section Cards
    if (stationSchedule) {
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const nextTrainObj = tableRows.find(t => t.estimatedArrival > currentTimeStr);
      const nextTrain = nextTrainObj ? nextTrainObj.estimatedArrival : "N/A";

      setSectionData({
        runningTrains: stationSchedule.trains_assigned_total,
        maintenanceTrains: Math.floor(stationSchedule.trains_assigned_total * 0.1),
        nextArrival: nextTrain,
        nextArrivalStatus: nextTrainObj ? "On Time" : "Finished",
        totalStaff: Math.floor(stationSchedule.predicted_passengers / 200)
      })
    }

    setData(tableRows)
    setChartData(chartPoints)

  }, [selectedStation, fullSchedule])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Metro Operations - {selectedStation}</h2>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="Select Station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SectionCards data={sectionData} />
              <div className="px-4 lg:px-6">
                {loading ? <div>Loading Forecast...</div> : <ChartAreaInteractive data={chartData} />}
              </div>
              {loading ? <div>Loading Trains...</div> : <DataTable columns={columns} data={data} />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
