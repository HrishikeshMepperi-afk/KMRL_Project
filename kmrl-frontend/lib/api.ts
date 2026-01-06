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
