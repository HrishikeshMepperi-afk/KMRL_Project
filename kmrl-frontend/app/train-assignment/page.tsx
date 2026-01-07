"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Train, CheckCircle2, AlertCircle } from "lucide-react"
import { assignTrains, TripRequest, AssignmentResult } from "@/lib/api"
import { cn } from "@/lib/utils"

// Mock upcoming trips for demonstration
const UPCOMING_TRIPS: TripRequest[] = [
    { id: "TR-101", route_name: "Aluva - Petta", start_time: "08:15", origin_station: "Aluva" }, // Peak, Aluva
    { id: "TR-102", route_name: "Petta - Aluva", start_time: "08:30", origin_station: "Pettah" }, // Peak, Pettah
    { id: "TR-103", route_name: "JLN Stadium - Aluva", start_time: "09:00", origin_station: "JLN Stadium" }, // Peak, Non-Hub
    { id: "TR-104", route_name: "Aluva - SN Junction", start_time: "10:15", origin_station: "Aluva" }, // Off-peak boundary
    { id: "TR-105", route_name: "Vytila - MG Road", start_time: "11:00", origin_station: "Vytila" }, // Off-peak
    { id: "TR-106", route_name: "Aluva - Petta", start_time: "17:30", origin_station: "Aluva" }, // Evening Peak
    { id: "TR-107", route_name: "Thripunithura - Aluva", start_time: "17:45", origin_station: "Thripunithura" }, // Evening Peak
    { id: "TR-108", route_name: "Aluva - SN Junction", start_time: "18:00", origin_station: "Aluva" }, // Evening Peak (Hub Priority)
    { id: "TR-109", route_name: "Cochin University - Petta", start_time: "18:15", origin_station: "Cochin University" }, // Evening Peak
    { id: "TR-110", route_name: "Pettah - Aluva", start_time: "18:30", origin_station: "Pettah" }, // Evening Peak (Hub)
    { id: "TR-111", route_name: "Kaloor - Vytila", start_time: "20:00", origin_station: "Kaloor" }, // Night
    { id: "TR-112", route_name: "Edapally - MG Road", start_time: "20:30", origin_station: "Edapally" }, // Night
    { id: "TR-113", route_name: "Aluva - Petta", start_time: "07:30", origin_station: "Aluva" }, // Morning Pre-Peak
    { id: "TR-114", route_name: "SN Junction - Aluva", start_time: "07:45", origin_station: "SN Junction" }, // Morning Pre-Peak
]

export default function TrainAssignmentPage() {
    const [assignments, setAssignments] = useState<AssignmentResult[]>([])
    const [loading, setLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState("")

    const handleAutoAssign = async () => {
        setLoading(true)
        setStatusMessage("")
        try {
            const results = await assignTrains(UPCOMING_TRIPS)
            setAssignments(results)
            setStatusMessage("Optimization Complete: Rakes assigned based on peak-hour heuristics.")
        } catch (error) {
            console.error(error)
            setStatusMessage("Error: Failed to generate assignments.")
        } finally {
            setLoading(false)
        }
    }

    const getAssignmentForTrip = (tripId: string) => assignments.find(a => a.trip_id === tripId)

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">Operations</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Train Assignment</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex justify-between items-center bg-muted/20 p-6 rounded-lg border">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Auto-Engine Assignment</h2>
                            <p className="text-muted-foreground">
                                AI-driven heuristics to match fresh rakes to peak-hour services.
                            </p>
                        </div>
                        <Button
                            onClick={handleAutoAssign}
                            disabled={loading || assignments.length > 0}
                            size="lg"
                            className="gap-2"
                        >
                            {loading ? "Calculating..." : (
                                <>
                                    <Train className="h-4 w-4" />
                                    Auto-Assign Engines
                                </>
                            )}
                        </Button>
                    </div>

                    {statusMessage && (
                        <div className="text-sm p-2 px-4 rounded bg-green-50 text-green-700 flex items-center gap-2 border border-green-200">
                            <CheckCircle2 className="h-4 w-4" />
                            {statusMessage}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {UPCOMING_TRIPS.map((trip) => {
                            const assignment = getAssignmentForTrip(trip.id)
                            const isPeak = (trip.start_time >= "08:00" && trip.start_time <= "10:00") || (trip.start_time >= "17:00" && trip.start_time <= "19:00");

                            return (
                                <Card key={trip.id} className={cn("transition-all duration-300", assignment ? "border-l-4" : "", assignment?.is_peak_match ? "border-l-amber-500" : "border-l-blue-500")}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {trip.id}
                                                {isPeak && <Badge variant="destructive" className="text-[10px] h-5">Peak</Badge>}
                                                {trip.origin_station === "Aluva" && <Badge variant="outline" className="text-[10px] h-5">Hub</Badge>}
                                            </CardTitle>
                                            <div className="text-sm font-medium">{trip.start_time}</div>
                                        </div>
                                        <CardDescription>{trip.route_name}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {!assignment ? (
                                            <div className="h-20 flex items-center justify-center border border-dashed rounded bg-muted/10 text-muted-foreground text-sm">
                                                Waiting for assignment...
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center gap-3">
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-base text-primary flex items-center justify-between">
                                                            {assignment.train_id}
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                {assignment.train_km_run} km used
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-muted/50 p-2 rounded text-xs flex items-start gap-2">
                                                    {assignment.is_peak_match ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                                                    )}
                                                    <span className={cn(assignment.is_peak_match ? "text-amber-700 font-medium" : "text-muted-foreground")}>
                                                        {assignment.match_reason}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
