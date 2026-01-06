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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getNotes, createNote, addComment, acknowledgeNote, resolveNote, Note, NoteCreate } from "@/lib/api"
import {
    Plus, Search, Filter, MessageSquare, CheckCircle,
    AlertTriangle, Clock, History, Send, Eye, Shield
} from "lucide-react"

export default function OperationsNotesPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        category: "All",
        priority: "All",
        search: "",
        date: ""
    })

    // Form State
    const [newNote, setNewNote] = useState<NoteCreate>({
        category: "Routine",
        priority: "Normal",
        subject: "",
        description: "",
        visibility: "Station Only",
        author: "Current User", // Mock user
        asset_id: ""
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [commentText, setCommentText] = useState<Record<string, string>>({})

    const fetchNotesData = async () => {
        setLoading(true)
        try {
            const data = await getNotes(filters)
            setNotes(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotesData()
    }, [filters]) // Re-fetch when filters change

    const handleCreate = async () => {
        try {
            await createNote(newNote)
            setIsDialogOpen(false)
            fetchNotesData()
            // Reset form
            setNewNote({
                category: "Routine",
                priority: "Normal",
                subject: "",
                description: "",
                visibility: "Station Only",
                author: "Current User",
                asset_id: ""
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleAction = async (action: 'ack' | 'resolve' | 'comment', noteId: string) => {
        try {
            if (action === 'ack') {
                await acknowledgeNote(noteId, "Current User")
            } else if (action === 'resolve') {
                await resolveNote(noteId, "Current User")
            } else if (action === 'comment') {
                if (!commentText[noteId]) return;
                await addComment(noteId, "Current User", commentText[noteId])
                setCommentText(prev => ({ ...prev, [noteId]: "" }))
            }
            fetchNotesData() // Refresh to show updates
        } catch (e) {
            console.error(e)
        }
    }

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "Critical": return "destructive"
            case "High": return "warning" // unexpected, default fallback usually
            case "Normal": return "secondary"
            default: return "outline"
        }
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
                <div className="flex flex-1 flex-col gap-4 p-4 lg:px-6 lg:py-6">

                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Operations Log</h1>
                            <p className="text-muted-foreground">Manage station incidents, handovers, and routine checks.</p>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                                    <Plus className="h-4 w-4" /> New Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Note</DialogTitle>
                                    <DialogDescription>Log an event or issue. Critical items escalate automatically.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <Select value={newNote.category} onValueChange={(v) => setNewNote({ ...newNote, category: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Routine">Routine</SelectItem>
                                                <SelectItem value="Incident">Incident</SelectItem>
                                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                <SelectItem value="Handover">Handover</SelectItem>
                                                <SelectItem value="Lost & Found">Lost & Found</SelectItem>
                                                <SelectItem value="VIP Movement">VIP Movement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Priority</label>
                                        <Select value={newNote.priority} onValueChange={(v) => setNewNote({ ...newNote, priority: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Normal">Normal</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Subject</label>
                                        <Input placeholder="e.g. Escalator Breakdown" value={newNote.subject} onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                            placeholder="Details..."
                                            value={newNote.description}
                                            onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Asset ID (Optional)</label>
                                        <Input placeholder="e.g. ESC-01" value={newNote.asset_id} onChange={(e) => setNewNote({ ...newNote, asset_id: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Visibility</label>
                                        <Select value={newNote.visibility} onValueChange={(v) => setNewNote({ ...newNote, visibility: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Station Only">Station Only</SelectItem>
                                                <SelectItem value="HQ/Admin">Escalate to HQ/Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreate}>Submit Log</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Filters */}
                    <Card className="p-4 flex flex-wrap gap-4 items-center bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>
                        <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                            <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                <SelectItem value="Routine">Routine</SelectItem>
                                <SelectItem value="Incident">Incident</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                            <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Priorities</SelectItem>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8 h-8"
                                placeholder="Search logs..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <Input
                            type="date"
                            className="w-auto h-8"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                        />
                    </Card>

                    {/* Feed */}
                    <div className="space-y-4">
                        {loading ? <div className="text-center py-10">Loading Logs...</div> : notes.map((note) => (
                            <Card key={note.id} className={`overflow-hidden transition-all hover:shadow-md ${note.priority === 'Critical' ? 'border-l-4 border-l-destructive bg-destructive/5' : note.priority === 'High' ? 'border-l-4 border-l-yellow-500 bg-yellow-500/5' : ''}`}>
                                {/* Shift Handover Marker Logic - simplified visually here */}
                                {note.category === 'Handover' && <div className="w-full h-1 bg-primary/20 mb-2" title="Shift Handover Boundary"></div>}

                                <div className="p-4 sm:p-6 grid gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="grid gap-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={note.priority === 'Critical' ? 'destructive' : 'outline'} className={note.priority === 'High' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}>
                                                    {note.priority}
                                                </Badge>
                                                <Badge variant="secondary">{note.category}</Badge>
                                                {note.asset_id && <Badge variant="outline" className="font-mono text-xs">{note.asset_id}</Badge>}
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {note.timestamp}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg leading-none">{note.subject}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{note.author[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-xs text-right hidden sm:block">
                                                <div className="font-medium">{note.author}</div>
                                                <div className="text-muted-foreground">{note.visibility}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                        {note.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 border ${note.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100'}`}>
                                                {note.status === 'Resolved' && <CheckCircle className="h-3 w-3" />}
                                                {note.status}
                                            </div>
                                            {note.history.some(h => h.action === 'Edited') && (
                                                <Badge variant="outline" className="text-[10px] h-5"><History className="h-3 w-3 mr-1" /> Edited</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {note.status !== 'Resolved' && (
                                                <Button variant="ghost" size="sm" onClick={() => handleAction('ack', note.id)} disabled={note.acknowledged_by.includes("Current User")}>
                                                    {note.acknowledged_by.includes("Current User") ? <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                                    {note.acknowledged_by.includes("Current User") ? 'Ack\'d' : 'Acknowledge'}
                                                </Button>
                                            )}
                                            {note.status !== 'Resolved' && (
                                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction('resolve', note.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                        {note.comments.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {note.comments.map(c => (
                                                    <div key={c.id} className="flex gap-2 text-xs">
                                                        <span className="font-bold">{c.author}:</span>
                                                        <span>{c.content}</span>
                                                        <span className="text-[10px] text-muted-foreground ml-auto">{c.timestamp.split(' ')[1]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add a comment..."
                                                className="h-8 text-xs bg-background"
                                                value={commentText[note.id] || ""}
                                                onChange={(e) => setCommentText(prev => ({ ...prev, [note.id]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAction('comment', note.id)
                                                }}
                                            />
                                            <Button size="icon" className="h-8 w-8" onClick={() => handleAction('comment', note.id)}>
                                                <Send className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            </Card>
                        ))}
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
