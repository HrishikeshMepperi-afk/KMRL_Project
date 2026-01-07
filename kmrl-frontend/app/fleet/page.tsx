"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Train, Activity, Clock, TrendingUp } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { getFleetStatus, FleetStatus, TrainDetail } from "@/lib/api"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"





export default function FleetStatusPage() {
    const [data, setData] = useState<FleetStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedTrainId, setSelectedTrainId] = useState<string>("")
    const [openCombobox, setOpenCombobox] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                const json = await getFleetStatus()
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

                        <Dialog>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
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
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Punctuality Report</DialogTitle>
                                    <DialogDescription>
                                        Currently {data.train_details.filter(t => t.delay_minutes > 0).length} trains are running late.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {data.train_details.filter(t => t.delay_minutes > 0).length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Train ID</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead className="text-right">Delay (min)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.train_details.filter(t => t.delay_minutes > 0).map((train) => (
                                                    <TableRow key={train.id}>
                                                        <TableCell className="font-medium">{train.id}</TableCell>
                                                        <TableCell>{train.location}</TableCell>
                                                        <TableCell className="text-right text-red-500 font-bold">
                                                            +{train.delay_minutes}m
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                            <p>All trains are running on time!</p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>



                        <Dialog>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
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
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Train Utilization Details</DialogTitle>
                                    <DialogDescription>
                                        Select a train to view its daily running metrics.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {selectedTrainId
                                                        ? data.train_details.find((t) => t.id === selectedTrainId)?.id
                                                        : "Select train..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search train..." />
                                                    <CommandList>
                                                        <CommandEmpty>No train found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {data.train_details.map((train) => (
                                                                <CommandItem
                                                                    key={train.id}
                                                                    value={train.id}
                                                                    onSelect={(currentValue) => {
                                                                        setSelectedTrainId(currentValue === selectedTrainId ? "" : currentValue)
                                                                        setOpenCombobox(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedTrainId === train.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {train.id} - {train.status}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {selectedTrainId && (() => {
                                        const train = data.train_details.find(t => t.id === selectedTrainId);
                                        if (!train) return null;

                                        let progressColor = "bg-green-500";
                                        let loadLabel = "Low";
                                        if (train.ridership_load > 85) {
                                            progressColor = "bg-red-500";
                                            loadLabel = "High (Peak)";
                                        } else if (train.ridership_load > 50) {
                                            progressColor = "bg-yellow-500";
                                            loadLabel = "Moderate";
                                        }

                                        return (
                                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{train.id}</span>
                                                    <span className={cn("text-xs px-2 py-1 rounded-full", train.status === 'In Service' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                                                        {train.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between text-sm border-b pb-2">
                                                        <span className="text-muted-foreground">Distance Covered</span>
                                                        <span className="font-medium">{train.km_run_today} km</span>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Current Ridership Load</span>
                                                            <span className="font-medium">{train.ridership_load}%</span>
                                                        </div>
                                                        <Progress value={train.ridership_load} className="h-2" indicatorClassName={progressColor} />
                                                        <p className="text-xs text-right text-muted-foreground">{loadLabel} Occupancy</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
                                                    <span>Location: {train.location}</span>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </DialogContent>
                        </Dialog>

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
