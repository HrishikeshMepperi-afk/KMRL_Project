from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import random
from .notes import NOTES_DB # Import in-memory notes
from .staff import STATIONS # Import station list

reports_router = APIRouter(prefix="/reports", tags=["Reports"])

# --- Models ---

class KPISummary(BaseModel):
    total_footfall: int
    total_revenue: int
    incidents_logged: int
    staff_present_pct: float

class ChartDataPoint(BaseModel):
    name: str # X-axis label (e.g., "08:00", "Smart Card")
    value: float # Y-axis value
    category: Optional[str] = None # For stack/group

class ReportCharts(BaseModel):
    peak_hour: List[ChartDataPoint]
    revenue_breakdown: List[ChartDataPoint]
    incident_types: List[ChartDataPoint]

class DetailedRow(BaseModel):
    id: str
    col1: str
    col2: str
    col3: str
    col4: str
    col5: str
    status: str

# --- Helpers ---

def get_deterministic_seed(date_str: str, station: str):
    """Generates a seed based on date and station to ensure consistent 'random' data"""
    s = date_str + (station if station != "All Stations" else "ALL")
    return sum(ord(c) for c in s)

# --- Endpoints ---

@reports_router.get("/summary", response_model=KPISummary)
def get_summary(
    date: str = Query(..., description="YYYY-MM-DD"),
    station: str = Query("All Stations"),
    report_type: str = Query("Revenue") # Revenue, Ridership, Staff, Incidents
):
    random.seed(get_deterministic_seed(date, station))
    
    # 1. Footfall (Simulated)
    base_footfall = 125000 if station == "All Stations" else 8500
    variation = random.uniform(0.9, 1.15)
    total_footfall = int(base_footfall * variation)
    
    # 2. Revenue (Avg ticket price ~35)
    total_revenue = total_footfall * 35
    
    # 3. Incidents (Real from NOTES_DB)
    # Filter notes by date and station (if applicable)
    # Note: Our notes don't strictly have 'station' field yet (just description/asset), 
    # but we can filter by date string matching.
    incidents_count = 0
    for note in NOTES_DB:
        if note.timestamp.startswith(date) and note.priority in ["High", "Critical"]:
            incidents_count += 1
            
    # 4. Staff Presence
    staff_pct = random.uniform(88.0, 97.5)
    
    return KPISummary(
        total_footfall=total_footfall,
        total_revenue=total_revenue,
        incidents_logged=incidents_count,
        staff_present_pct=round(staff_pct, 1)
    )

@reports_router.get("/charts", response_model=ReportCharts)
def get_charts(
    date: str = Query(..., description="YYYY-MM-DD"),
    station: str = Query("All Stations"),
    report_type: str = Query("Revenue")
):
    random.seed(get_deterministic_seed(date, station))
    
    # 1. Peak Hour (Line Chart)
    peak_data = []
    # Morning Peak 8-10, Evening 5-7
    for h in range(6, 23): # 6 AM to 10 PM
        hour_label = f"{h:02d}:00"
        
        # Base Curve
        val = 1000
        if 8 <= h <= 10: val = 3500
        elif 17 <= h <= 19: val = 4200
        elif 11 <= h <= 16: val = 1500
        else: val = 800
        
        val = int(val * random.uniform(0.8, 1.2))
        if station != "All Stations": val = int(val / 15) # Scale down for single station
        
        peak_data.append(ChartDataPoint(name=hour_label, value=val))
        
    # 2. Revenue Breakdown (Pie Chart)
    revenue_data = [
        ChartDataPoint(name="Smart Card", value=int(random.uniform(40, 50))),
        ChartDataPoint(name="QR Code", value=int(random.uniform(30, 40))),
        ChartDataPoint(name="Cash/Token", value=int(random.uniform(10, 20))),
    ]
    
    # 3. Incident Types (Bar Chart) - Mocked based on 'types'
    inc_types = ["Signal", "Track", "Train", "Station", "Staff"]
    incident_data = []
    for t in inc_types:
        incident_data.append(ChartDataPoint(name=t, value=int(random.randint(0, 5))))
        
    return ReportCharts(
        peak_hour=peak_data,
        revenue_breakdown=revenue_data,
        incident_types=incident_data
    )

@reports_router.get("/details", response_model=List[DetailedRow])
def get_details(
    date: str = Query(..., description="YYYY-MM-DD"),
    station: str = Query("All Stations"),
    report_type: str = Query("Operational")
):
    random.seed(get_deterministic_seed(date, station))
    rows = []
    
    if report_type == "Operational" or report_type == "Incidents":
        # Return Incidents from NOTES_DB + Some mock maintenance
        # Real Notes first
        for i, note in enumerate(NOTES_DB):
            if note.timestamp.startswith(date):
                rows.append(DetailedRow(
                    id=note.id,
                    col1=note.timestamp.split(" ")[1], # Time
                    col2=note.category,
                    col3=note.subject,
                    col4=note.priority,
                    col5=note.author,
                    status=note.status
                ))
        
        # Fill with mock maintenance if empty for demo
        if len(rows) < 5:
             for i in range(5):
                 rows.append(DetailedRow(
                     id=f"MOCK-{i}",
                     col1=f"{random.randint(6,22):02d}:{random.randint(0,59):02d}",
                     col2="Maintenance",
                     col3=f"Routine Check - {random.choice(['Escalator', 'Lift', 'AFC Gate'])}",
                     col4="Normal",
                     col5="System Admin",
                     status="Closed"
                 ))

    elif report_type == "Staff Report" or report_type == "Staff Attendance":
        names = ["Sandeep", "Rahul", "Priya", "Anjali", "Vikram", "Arun", "Deepa"]
        limit = 20 if station == "All Stations" else 5
        for i in range(limit):
            name = random.choice(names) + f" {chr(65+i)}"
            in_time = f"{random.randint(7,9):02d}:{random.randint(0,59):02d}"
            out_time = f"{random.randint(16,18):02d}:{random.randint(0,59):02d}"
            rows.append(DetailedRow(
                id=f"ST-{i}",
                col1=name,
                col2="Security" if i % 2 == 0 else "Manager",
                col3=in_time,
                col4=out_time,
                col5="8h 30m",
                status="Present"
            ))
            
    elif report_type == "Revenue" or report_type == "Commercial":
        target_stations = STATIONS if station == "All Stations" else [station]
        for st in target_stations:
             rows.append(DetailedRow(
                id=f"REV-{st}",
                col1=st,
                col2=f"₹ {int(random.uniform(50000, 200000)):,}", # Cash
                col3=f"₹ {int(random.uniform(100000, 400000)):,}", # UPI
                col4=f"₹ {int(random.uniform(80000, 300000)):,}", # Card
                col5=f"₹ {int(random.uniform(250000, 900000)):,}", # Total
                status="Verified"
            ))
            
    return rows
