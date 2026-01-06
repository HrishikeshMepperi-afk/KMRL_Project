"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// --- Types ---
const API_URL = "http://localhost:8000/staff"

export default function StaffPage() {
    const [activeTab, setActiveTab] = useState("roster")
    const [staffList, setStaffList] = useState<any[]>([])
    const [roster, setRoster] = useState<any[]>([])
    const [liveAllocation, setLiveAllocation] = useState<any>(null)

    useEffect(() => {
        fetch(`${API_URL}/list`).then(res => res.json()).then(setStaffList)
    }, [])

    const generateRoster = async () => {
        const res = await fetch(`${API_URL}/generate-roster`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start_date: new Date().toISOString().split('T')[0], days: 7 })
        })
        const data = await res.json()
        setRoster(data.roster)
    }

    const loadLiveStatus = async () => {
        const res = await fetch(`${API_URL}/live`)
        const data = await res.json()
        setLiveAllocation(data)
    }

    useEffect(() => {
        if (activeTab === "live") loadLiveStatus()
    }, [activeTab])

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Staff Management & Operations</h1>

                    <Tabs defaultValue="roster" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="roster">Roster Planner</TabsTrigger>
                            <TabsTrigger value="live">Live Deployment Dashboard</TabsTrigger>
                        </TabsList>

                        <TabsContent value="roster">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Automatic Shift Roster (7 Days)</CardTitle>
                                    <CardDescription>
                                        Rotating 3-shift system with mandatory Rest Day after 6 days.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={generateRoster} className="mb-4">Generate Roster</Button>

                                    {roster.length > 0 && (
                                        <div className="rounded-md border p-4 max-h-[500px] overflow-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-left">
                                                        <th className="p-2">Staff ID</th>
                                                        <th className="p-2">Date</th>
                                                        <th className="p-2">Shift</th>
                                                        <th className="p-2">Assigned Base</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {roster.map((r, i) => (
                                                        <tr key={i} className={`border-b ${r.shift === 'Rest Day' ? 'bg-muted/50' : ''}`}>
                                                            <td className="p-2 font-medium">{r.staff_id}</td>
                                                            <td className="p-2">{r.date}</td>
                                                            <td className="p-2">
                                                                <Badge variant={r.shift === 'Rest Day' ? 'secondary' : 'outline'}>
                                                                    {r.shift}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-2">{r.station_assigned}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="live">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {liveAllocation && Object.entries(liveAllocation.allocations).map(([station, data]: any) => (
                                    <Card key={station} className={data.managers.length < 1 || data.security.length < 2 ? "border-red-500 bg-red-50/10" : ""}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex justify-between">
                                                {station}
                                                {(data.managers.length < 1 || data.security.length < 2) && <Badge variant="destructive">Understaffed</Badge>}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm">
                                            <div className="flex justify-between py-1 border-b">
                                                <span>Managers:</span>
                                                <span className={data.managers.length < 1 ? "text-red-600 font-bold" : ""}>{data.managers.length} / 1</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span>Security:</span>
                                                <span className={data.security.length < 2 ? "text-red-600 font-bold" : ""}>{data.security.length} / 2</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {liveAllocation && liveAllocation.alerts.length > 0 && (
                                <Card className="mt-8 border-red-500">
                                    <CardHeader><CardTitle className="text-red-600">Critical Alerts</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 text-red-700">
                                            {liveAllocation.alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
