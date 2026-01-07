"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertTriangle, ShieldAlert, AlertCircle, Info, CheckCircle, Play, Filter, ShieldCheck
} from "lucide-react"
import { runConflictCheck, getConflicts, resolveConflict, overrideConflict, Conflict } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function ConflictAlertsPage() {
    const [conflicts, setConflicts] = useState<Conflict[]>([])
    const [loading, setLoading] = useState(false)
    const [filterSeverity, setFilterSeverity] = useState<"All" | "Critical" | "Warning" | "Info">("All")

    // Override Dialog State
    const [overrideId, setOverrideId] = useState<string | null>(null)
    const [overrideComment, setOverrideComment] = useState("")

    const fetchConflicts = async () => {
        try {
            const data = await getConflicts()
            setConflicts(data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchConflicts()
    }, [])

    const handleRunSimulation = async () => {
        setLoading(true)
        try {
            const data = await runConflictCheck()
            setConflicts(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (id: string) => {
        try {
            await resolveConflict(id)
            fetchConflicts()
        } catch (e) {
            console.error(e)
        }
    }

    const handleOverrideSubmit = async () => {
        if (!overrideId || !overrideComment) return
        try {
            await overrideConflict(overrideId, overrideComment)
            setOverrideId(null)
            setOverrideComment("")
            fetchConflicts()
        } catch (e) {
            console.error(e)
        }
    }

    const filteredConflicts = conflicts.filter(c => {
        if (c.status !== 'Active') return false // Only show active conflicts in main list? Or maybe keep resolved ones visually distinct.
        if (filterSeverity === 'All') return true
        return c.severity === filterSeverity
    })

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
                <div className="flex flex-1 flex-col gap-6 p-4 lg:px-6 lg:py-6 max-w-[1200px] mx-auto w-full">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">System Conflict Alerts</h1>
                            <p className="text-muted-foreground">Detect and manage roster violations and operational clashes.</p>
                        </div>
                        <Button
                            onClick={handleRunSimulation}
                            disabled={loading}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        >
                            <Play className="h-4 w-4" /> {loading ? "Scanning..." : "Run Conflict Simulation"}
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 mr-4 text-sm font-medium text-muted-foreground">
                            <Filter className="h-4 w-4" /> Filter by Severity:
                        </div>
                        {(["All", "Critical", "Warning", "Info"] as const).map(sev => (
                            <Button
                                key={sev}
                                variant={filterSeverity === sev ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSeverity(sev)}
                                className={cn(
                                    "rounded-full px-4",
                                    filterSeverity === sev && sev === "Critical" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    filterSeverity === sev && sev === "Warning" && "bg-amber-500 text-white hover:bg-amber-600",
                                    filterSeverity === sev && sev === "Info" && "bg-blue-500 text-white hover:bg-blue-600"
                                )}
                            >
                                {sev}
                            </Button>
                        ))}
                    </div>

                    {/* Conflict List */}
                    <div className="grid gap-4">
                        {filteredConflicts.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                                <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium">No Active Conflicts Found</h3>
                                <p className="text-muted-foreground">Run a simulation check to scan for issues.</p>
                            </div>
                        ) : (
                            filteredConflicts.map(conflict => (
                                <Card key={conflict.id} className={cn(
                                    "border-l-4 transition-all hover:shadow-md",
                                    conflict.severity === "Critical" ? "border-l-destructive" :
                                        conflict.severity === "Warning" ? "border-l-amber-500" : "border-l-blue-500"
                                )}>
                                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={conflict.severity === "Critical" ? "destructive" : "outline"}
                                                    className={cn(
                                                        conflict.severity === "Warning" && "border-amber-500 text-amber-600",
                                                        conflict.severity === "Info" && "border-blue-500 text-blue-600",
                                                        "uppercase text-[10px] tracking-wider"
                                                    )}
                                                >
                                                    {conflict.severity}
                                                </Badge>
                                                <span className="text-xs font-medium text-muted-foreground">{conflict.category} Conflict</span>
                                            </div>
                                            <CardTitle className="text-lg">{conflict.title}</CardTitle>
                                        </div>
                                        <div className="opacity-10">
                                            {conflict.severity === "Critical" ? <AlertTriangle className="h-8 w-8 text-destructive" /> :
                                                conflict.severity === "Warning" ? <AlertCircle className="h-8 w-8 text-amber-500" /> :
                                                    <Info className="h-8 w-8 text-blue-500" />}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <p className="text-sm text-foreground/80">{conflict.description}</p>

                                        <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Entities Involved</span>
                                            <div className="flex flex-wrap gap-2">
                                                {conflict.entities.map((entity, i) => (
                                                    <Badge key={i} variant="secondary" className="font-mono text-xs">{entity}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-3 pt-2 border-t bg-muted/10">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                            onClick={() => { setOverrideId(conflict.id); setOverrideComment(""); }}
                                        >
                                            Override
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleResolve(conflict.id)}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 mr-2" /> Resolve
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Override Dialog */}
                    <Dialog open={!!overrideId} onOpenChange={(open) => !open && setOverrideId(null)}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Override Conflict</DialogTitle>
                                <DialogDescription>
                                    Forcing approval requires a justification. This action will be logged.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="comment" className="text-right">
                                        Justification
                                    </Label>
                                    <Input
                                        id="comment"
                                        placeholder="e.g., Short-term emergency approval by GM"
                                        value={overrideComment}
                                        onChange={(e) => setOverrideComment(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleOverrideSubmit}>Confirm Override</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
