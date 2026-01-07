"use client"

import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp, IndianRupee, Clock, Wallet, Activity } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    getSchedule,
    ScheduleRequest,
    getFleetStatus,
    FleetStatus,
    TrainDetail
} from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function KPIDashboard() {
    const [loading, setLoading] = useState(true)
    const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null)
    const [metrics, setMetrics] = useState({
        fareRevenue: 0,
        nonFareRevenue: 0,
        operatingCostPerUser: 0,
        punctuality: 0
    })

    useEffect(() => {
        async function calculateKPIs() {
            try {
                const today = new Date().toISOString().split('T')[0]
                // Fetch aggregate data for the whole network
                // We'll simulate a fetch for a few major stations to estimate network health
                const req: ScheduleRequest = {
                    date: today,
                    stations: [
                        { station: "Aluva", predicted_passengers: 12000 },
                        { station: "Edapally", predicted_passengers: 35000 },
                        { station: "MG Road", predicted_passengers: 28000 },
                        { station: "Vytila", predicted_passengers: 22000 },
                        { station: "Pettah", predicted_passengers: 15000 }
                    ],
                    available_trains: 500,
                    staff_available: 2000
                }

                const res = await getSchedule(req)
                const fleetRes = await getFleetStatus()
                setFleetStatus(fleetRes)

                let totalPassengers = 0
                let totalTrains = 0
                let onTimeTrains = 0

                // Aggregate data
                Object.values(res.schedule).forEach(s => {
                    totalPassengers += s.predicted_passengers
                    totalTrains += s.trains_assigned_total

                    // Simulate punctuality based on schedule details
                    // In our mock logic in dashboard, we mocked delays. We need to approximate here.
                    // Let's assume 92% base reliability + variation
                    const randomPunctuality = 0.85 + (Math.random() * 0.14) // 85-99%
                    onTimeTrains += s.trains_assigned_total * randomPunctuality
                })

                // Calculations
                // 1. Fare Revenue: Avg fare ~ ₹35
                const fareRevenue = totalPassengers * 35

                // 2. Non-Fare Revenue: KMRL is known for high non-fare. ~25% of Total Revenue (so roughly 33% of Fare)
                const nonFareRevenue = fareRevenue * 0.33

                // 3. Operating Cost Per Passenger
                // Fixed daily cost + Variable cost per train
                const fixedCost = 1000000 // 10 Lakhs daily fixed
                const variableCost = totalTrains * 5000 // ₹5k per train run
                const totalCost = fixedCost + variableCost
                const costPerPassenger = totalCost / totalPassengers

                // 4. Punctuality
                // Use real fleet punctuality if available, else calc
                const punctuality = fleetRes ? fleetRes.punctuality : (onTimeTrains / totalTrains) * 100

                setMetrics({
                    fareRevenue,
                    nonFareRevenue,
                    operatingCostPerUser: costPerPassenger,
                    punctuality
                })
            } catch (e) {
                console.error("KPI Calc Failed", e)
            } finally {
                setLoading(false)
            }
        }
        calculateKPIs()
    }, [])

    const kpis = [
        {
            title: "Fare Revenue",
            value: `₹${(metrics.fareRevenue / 100000).toFixed(1)} Lakhs`,
            description: "Per passenger journey revenue",
            icon: IndianRupee,
            trend: "+12.5%",
            trendUp: true,
            subtext: "Avg Fare: ₹35.00"
        },
        {
            title: "Non-Fare Revenue",
            value: `₹${(metrics.nonFareRevenue / 100000).toFixed(1)} Lakhs`,
            description: "Advertising & Leasing",
            icon: Wallet,
            trend: "+28.4%", // KMRL strong point
            trendUp: true,
            subtext: "~25% of Total Revenue"
        },
        {
            title: "Cost per Passenger",
            value: `₹${metrics.operatingCostPerUser.toFixed(2)}`,
            description: "Total Operating Cost / Pax",
            icon: Activity,
            trend: "-3.2%",
            trendUp: false, // Lower cost is good, so green? Standard semantics vary. Let's assume trending down is 'good' color logic usually needs care.
            // Shadcn cards usually emphasize the trend direction.
            subtext: "Operational Efficiency"
        },
    ]

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
                <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
                    <h2 className="text-2xl font-bold tracking-tight">Key Performance Indicators</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {kpis.map((kpi) => {


                            return (
                                <Card key={kpi.title}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {kpi.title}
                                        </CardTitle>
                                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{loading ? "..." : kpi.value}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {kpi.trendUp ? (
                                                <span className="text-green-500 flex items-center gap-1 inline-flex">
                                                    <TrendingUp className="h-3 w-3" /> {kpi.trend}
                                                </span>
                                            ) : (
                                                <span className="text-green-500 flex items-center gap-1 inline-flex">
                                                    <TrendingDown className="h-3 w-3" /> {kpi.trend}
                                                </span>
                                            )}
                                            <span className="ml-2">{kpi.subtext}</span>
                                        </p>
                                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                                            {kpi.description}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Context Section */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Health</CardTitle>
                                <CardDescription>Revenue vs Operating Costs</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                                    Financial Trend Chart (Projected)
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Quality</CardTitle>
                                <CardDescription>Punctuality & Reliability Score</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                                    Reliability Index Chart
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
