export interface ForecastRequest {
    date: string;
    time: string;
    station: string;
    passengers: number;
    event?: string;
    day_of_week?: string;
    weather?: string;
    holiday?: boolean;
    nearby_events?: string;
    train_delays?: number;
}

export interface ForecastResponse {
    station: string;
    date: string;
    time: string;
    predicted_passengers: number;
}

export interface ScheduleStation {
    station: string;
    predicted_passengers: number;
}

export interface ScheduleRequest {
    date: string;
    stations: ScheduleStation[];
    available_trains?: number;
    maintenance_trains?: number;
    staff_available?: number;
    peak_hours?: Record<string, number>;
}

export interface ScheduleResponse {
    date: string;
    train_capacity: number;
    total_trains_needed: number;
    schedule: Record<
        string,
        {
            predicted_passengers: number;
            trains_assigned_total: number;
            hourly_schedule: Record<
                string,
                {
                    trains_assigned: number;
                    projected_load: number;
                }
            >;
        }
    >;
}

const API_URL = "http://localhost:8000";

export async function getForecast(data: ForecastRequest): Promise<ForecastResponse> {
    const res = await fetch(`${API_URL}/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
}

export async function getSchedule(data: ScheduleRequest): Promise<ScheduleResponse> {
    const res = await fetch(`${API_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to fetch schedule");
    return res.json();
}

export interface BatchForecastRequest {
    date: string;
    time: string;
    stations: string[];
    weather?: string;
    holiday?: boolean;
    day_of_week?: string;
}

export interface BatchForecastResponse {
    date: string;
    time: string;
    forecasts: {
        station: string;
        predicted_passengers: number;
    }[];
}

export async function getBatchForecast(data: BatchForecastRequest): Promise<BatchForecastResponse> {
    const res = await fetch(`${API_URL}/forecast/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to fetch batch forecast");
    return res.json();
}

export interface TrainDetail {
    id: string;
    status: string;
    location: string;
    delay_minutes: number;
    km_run_today: number;
    ridership_load: number;
}

export interface FleetStatus {
    availability: number;
    punctuality: number;
    health_alerts: string[];
    utilization: number;
    total_fleet: number;
    active_trains: number;
    train_details: TrainDetail[];
}

export async function getFleetStatus(): Promise<FleetStatus> {
    const res = await fetch(`${API_URL}/fleet`);
    if (!res.ok) throw new Error("Failed to fetch fleet status");
    return res.json();
}

// ---------------- Notes API ----------------

export interface Comment {
    id: string;
    author: string;
    content: string;
    timestamp: string;
}

export interface HistoryEntry {
    action: string;
    timestamp: string;
    details: string;
}

export interface Note {
    id: string;
    category: string;
    priority: "Normal" | "High" | "Critical";
    subject: string;
    description: string;
    asset_id?: string;
    attachments: string[];
    visibility: string;
    author: string;
    timestamp: string;
    status: string;
    is_escalated: boolean;
    history: HistoryEntry[];
    comments: Comment[];
    acknowledged_by: string[];
}

export interface NoteCreate {
    category: string;
    priority: string;
    subject: string;
    description: string;
    asset_id?: string;
    visibility: string;
    author: string;
}

export async function getNotes(filters?: { category?: string; priority?: string; search?: string; date?: string }): Promise<Note[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "All") params.append("category", filters.category);
    if (filters?.priority && filters.priority !== "All") params.append("priority", filters.priority);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.date) params.append("date", filters.date);

    const res = await fetch(`${API_URL}/notes?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    return res.json();
}

export async function createNote(note: NoteCreate): Promise<Note> {
    const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error("Failed to create note");
    return res.json();
}

export async function addComment(noteId: string, author: string, content: string): Promise<Note> {
    const params = new URLSearchParams({ author, content });
    const res = await fetch(`${API_URL}/notes/${noteId}/comment?${params.toString()}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
}

export async function acknowledgeNote(noteId: string, user: string): Promise<Note> {
    const params = new URLSearchParams({ user });
    const res = await fetch(`${API_URL}/notes/${noteId}/acknowledge?${params.toString()}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to acknowledge note");
    return res.json();
}

export async function resolveNote(noteId: string, user: string): Promise<Note> {
    const params = new URLSearchParams({ user });
    const res = await fetch(`${API_URL}/notes/${noteId}/resolve?${params.toString()}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to resolve note");
    return res.json();
}

export async function updateNote(noteId: string, update: Partial<NoteCreate>, user: string): Promise<Note> {
    const params = new URLSearchParams({ user });
    const res = await fetch(`${API_URL}/notes/${noteId}?${params.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error("Failed to update note");
    return res.json();
}

// ---------------- Reports API ----------------

export interface KPISummary {
    total_footfall: number;
    total_revenue: number;
    incidents_logged: number;
    staff_present_pct: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    category?: string;
}

export interface ReportCharts {
    peak_hour: ChartDataPoint[];
    revenue_breakdown: ChartDataPoint[];
    incident_types: ChartDataPoint[];
}

export interface DetailedRow {
    id: string;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    status: string;
}

export async function getReportSummary(date: string, station: string, type: string): Promise<KPISummary> {
    const params = new URLSearchParams({ date, station, report_type: type });
    const res = await fetch(`${API_URL}/reports/summary?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch summary");
    return res.json();
}

export async function getReportCharts(date: string, station: string, type: string): Promise<ReportCharts> {
    const params = new URLSearchParams({ date, station, report_type: type });
    const res = await fetch(`${API_URL}/reports/charts?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch charts");
    return res.json();
}

export async function getReportDetails(date: string, station: string, type: string): Promise<DetailedRow[]> {
    const params = new URLSearchParams({ date, station, report_type: type });
    const res = await fetch(`${API_URL}/reports/details?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch details");
    return res.json();
}

// ---------------- Conflicts API ----------------

export interface Conflict {
    id: string;
    category: string;
    title: string;
    description: string;
    severity: "Critical" | "Warning" | "Info";
    entities: string[];
    status: "Active" | "Resolved" | "Overridden";
    override_comment?: string;
}

export async function runConflictCheck(): Promise<Conflict[]> {
    const res = await fetch(`${API_URL}/conflicts/run-check`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to run conflict check");
    return res.json();
}

export async function getConflicts(): Promise<Conflict[]> {
    const res = await fetch(`${API_URL}/conflicts/`);
    if (!res.ok) throw new Error("Failed to fetch conflicts");
    return res.json();
}

export async function resolveConflict(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/conflicts/${id}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to resolve conflict");
}

export async function overrideConflict(id: string, comment: string): Promise<void> {
    const res = await fetch(`${API_URL}/conflicts/${id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
    });
    if (!res.ok) throw new Error("Failed to override conflict");
}
