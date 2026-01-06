"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Train, Activity, Clock } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface TrainDetail {
    id: string
    status: string
    location: string
}

interface FleetStatus {
    availability: number
    punctuality: number
    health_alerts: string[]
    utilization: number
    total_fleet: number
    active_trains: number
    train_details: TrainDetail[]
}

export default function FleetStatusPage() {
    const [data, setData] = useState<FleetStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("http://127.0.0.1:8000/fleet")
                if (!res.ok) throw new Error("Failed to fetch")
                const json = await res.json()
                setData(json)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-8">Loading fleet status...</div>
    if (!data) return <div className="p-8">Error loading data. Is the backend running?</div>

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
                <div className="flex flex-1 flex-col gap-6 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Fleet Status</h1>
                            <p className="text-muted-foreground">Real-time fleet metrics and health diagnostics.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Availability</CardTitle>
                                        <Train className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.availability}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            {data.active_trains} / {data.total_fleet} trains active
                                        </p>
                                        <Progress value={data.availability} className="mt-3" />
                                    </CardContent>
                                </Card>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Fleet Availability Details</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-2">
                                    {data.train_details.map((train) => (
                                        <div key={train.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${train.status === 'Maintenance' ? 'bg-red-500' : 'bg-green-500'}`} />
                                                <div>
                                                    <div className="font-medium">{train.id}</div>
                                                    <div className="text-xs text-muted-foreground">{train.location}</div>
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${train.status === 'Maintenance' ? 'text-red-500' : 'text-green-600'}`}>
                                                {train.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.punctuality}%</div>
                                <p className="text-xs text-muted-foreground">On-time performance</p>
                                <Progress value={data.punctuality} className="mt-3 bg-secondary" indicatorClassName="bg-green-500" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.utilization}%</div>
                                <p className="text-xs text-muted-foreground">Average load factor</p>
                                <Progress value={data.utilization} className="mt-3" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Fleet Health</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Good</div>
                                <p className="text-xs text-muted-foreground">System nominal</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Health Alerts</CardTitle>
                                <CardDescription>
                                    Active diagnostics and maintenance warnings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.health_alerts.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {data.health_alerts.map((alert, i) => (
                                            <div key={i} className="flex items-center gap-4 rounded-md border p-4">
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        Maintenance Alert
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {alert}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>No active alerts</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div >
            </SidebarInset >
        </SidebarProvider >
    )
}
