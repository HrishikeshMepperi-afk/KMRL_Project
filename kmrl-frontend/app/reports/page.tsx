"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts"
import { getReportSummary, getReportCharts, getReportDetails, KPISummary, ReportCharts, DetailedRow } from "@/lib/api"
import {
    Download, Printer, TrendingUp, Users, AlertTriangle, IndianRupee, PieChart as PieIcon, BarChart3
} from "lucide-react"

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        station: "All Stations",
        type: "Revenue" // Revenue, Ridership, Staff, Incidents
    })

    const [summary, setSummary] = useState<KPISummary | null>(null)
    const [charts, setCharts] = useState<ReportCharts | null>(null)
    const [details, setDetails] = useState<DetailedRow[]>([])

    const stations = [
        "All Stations", "Aluva", "Pulinchodu", "Companypady", "Ambattukavu", "Muttom",
        "Kalamassery", "Cochin University", "Pathadipalam", "Edapally", "Palarivattom",
        "JLN Stadium", "Kaloor", "Lissie", "M.G. Road", "Maharaja's College",
        "Ernakulam South", "Kadavanthra", "Elamkulam", "Vytila", "Thykkoodam", "Petta"
    ]

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [sumRes, chartRes, detailRes] = await Promise.all([
                    getReportSummary(filters.date, filters.station, filters.type),
                    getReportCharts(filters.date, filters.station, filters.type),
                    getReportDetails(filters.date, filters.station, filters.type)
                ])
                setSummary(sumRes)
                setCharts(chartRes)
                setDetails(detailRes)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [filters])

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handlePrint = () => {
        window.print()
    }

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 lg:px-6 lg:py-6 max-w-[1600px] mx-auto w-full">

                    {/* 1. Control & Filter Bar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
                            <p className="text-muted-foreground">Comprehensive insights into operations, revenue, and staff.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                                <SelectTrigger className="w-[180px] bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Revenue">Revenue Report</SelectItem>
                                    <SelectItem value="Ridership">Ridership Analysis</SelectItem>
                                    <SelectItem value="Incidents">Operational Incidents</SelectItem>
                                    <SelectItem value="Staff Attendance">Staff Reports</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.station} onValueChange={(v) => setFilters({ ...filters, station: v })}>
                                <SelectTrigger className="w-[180px] bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {stations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Input
                                type="date"
                                className="w-auto bg-background"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 2. Quick Stats Cards (KPIs) */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Footfall</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.total_footfall.toLocaleString() || "..."}</div>
                                <p className="text-xs text-muted-foreground">+2.1% from yesterday</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {summary?.total_revenue.toLocaleString() || "..."}</div>
                                <p className="text-xs text-muted-foreground">+1.5% from average</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Incidents Logged</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.incidents_logged || 0}</div>
                                <p className="text-xs text-muted-foreground">Critical issues today</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Staff Present</CardTitle>
                                <Badge variant={summary && summary.staff_present_pct > 90 ? "default" : "destructive"}>{summary?.staff_present_pct}%</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary ? Math.floor(summary.total_footfall / 8000) : 0} Active</div>
                                <p className="text-xs text-muted-foreground">On duty currently</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. Visual Analytics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Peak Hour Traffic</CardTitle>
                                <CardDescription>Passenger density throughout the day</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={charts?.peak_hour || []}>
                                            <defs>
                                                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Revenue Breakdown</CardTitle>
                                <CardDescription>Payment methods used today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={charts?.revenue_breakdown || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {(charts?.revenue_breakdown || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Detailed Data Tables & 5. Actions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Detailed Report: {filters.type}</CardTitle>
                                <CardDescription>Raw data logs for verification and audit.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" /> Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">{filters.type === 'Incidents' || filters.type === 'Operational' ? 'Time' : 'Name/Station'}</TableHead>
                                        <TableHead>{filters.type === 'Incidents' ? 'Category' : (filters.type === 'Staff Attendance' ? 'Role' : 'Cash')}</TableHead>
                                        <TableHead>{filters.type === 'Incidents' ? 'Subject' : (filters.type === 'Staff Attendance' ? 'In Time' : 'UPI/Online')}</TableHead>
                                        <TableHead>{filters.type === 'Incidents' ? 'Priority' : (filters.type === 'Staff Attendance' ? 'Out Time' : 'Card')}</TableHead>
                                        <TableHead className="text-right">{filters.type === 'Incidents' ? 'Status' : 'Total/Status'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.col1}</TableCell>
                                            <TableCell>{row.col2}</TableCell>
                                            <TableCell>{row.col3}</TableCell>
                                            <TableCell>{row.col4}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline">{filters.type === 'Incidents' ? row.status : row.col5}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
