from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
import random
from datetime import datetime, timedelta

staff_router = APIRouter(prefix="/staff", tags=["staff"])

# --- Models ---

class Role(str, Enum):
    MANAGER = "Station Controller"
    SECURITY = "Metro Security"
    TICKET = "Ticket Staff"

class ShiftType(str, Enum):
    MORNING = "Morning (06-14)"
    EVENING = "Evening (14-22)"
    NIGHT = "Night (22-06)"
    OFF = "Rest Day"

class StaffMember(BaseModel):
    id: str
    name: str
    role: Role
    home_base: str # Station Name

class ShiftAssignment(BaseModel):
    staff_id: str
    date: str
    shift: ShiftType
    station_assigned: str
    is_consecutive_limit_reached: bool = False

class RosterRequest(BaseModel):
    start_date: str
    days: int = 7

class AllocationRequest(BaseModel):
    date: str
    shift: ShiftType

# --- Mock Data ---
STATIONS = [
    "Aluva", "Pulinchodu", "Companypady", "Ambattukavu", "Muttom",
    "Kalamassery", "Cochin University", "Pathadipalam", "Edapally",
    "Changampuzha Park", "Palarivattom", "JLN Stadium", "Kaloor",
    "Lissie", "M.G. Road", "Maharaja's College", "Ernakulam South",
    "Kadavanthra", "Elamkulam", "Vytila", "Thykkoodam", "Petta"
]

# Generate 50 Staff Members
mock_staff_db = []
for i in range(1, 51):
    role = Role.SECURITY
    if i % 5 == 0: role = Role.MANAGER
    elif i % 5 == 1: role = Role.TICKET
    
    mock_staff_db.append(StaffMember(
        id=f"S{i:03d}",
        name=f"Staff Member {i}",
        role=role,
        home_base=random.choice(STATIONS)
    ))

# --- Logic Helpers ---

def get_next_shift(current: ShiftType) -> ShiftType:
    if current == ShiftType.MORNING: return ShiftType.EVENING
    if current == ShiftType.EVENING: return ShiftType.NIGHT
    if current == ShiftType.NIGHT: return ShiftType.MORNING
    return ShiftType.MORNING

# --- Endpoints ---

@staff_router.get("/list")
def get_all_staff():
    return mock_staff_db

@staff_router.post("/generate-roster")
def generate_roster(req: RosterRequest):
    roster = []
    current_date = datetime.strptime(req.start_date, "%Y-%m-%d")
    
    # Simple state tracking for rotation
    staff_states = {s.id: {"consecutive_days": 0, "last_shift": ShiftType.MORNING} for s in mock_staff_db}

    for day in range(req.days):
        date_str = current_date.strftime("%Y-%m-%d")
        
        for staff in mock_staff_db:
            state = staff_states[staff.id]
            
            # Logic: Rest Day Enforcment
            if state["consecutive_days"] >= 6:
                assigned_shift = ShiftType.OFF
                state["consecutive_days"] = 0 # Reset
            else:
                # Logic: Rotation (Rotate every 2 days of same shift or just simple cycle)
                # Simplified: Just rotate daily for demo visual effect
                assigned_shift = get_next_shift(state["last_shift"])
                state["consecutive_days"] += 1
                state["last_shift"] = assigned_shift

            # Allocation Logic (Assign to Home Base if possible, or generic)
            # In a real roster, this happens *after* determining availability.
            # Here we tentatively assign them to their home base.
            assigned_station = staff.home_base if assigned_shift != ShiftType.OFF else "N/A"

            roster.append(ShiftAssignment(
                staff_id=staff.id,
                date=date_str,
                shift=assigned_shift,
                station_assigned=assigned_station,
                is_consecutive_limit_reached=(assigned_shift == ShiftType.OFF)
            ))
        
        current_date += timedelta(days=1)
        
    return {"roster": roster, "staff_details": {s.id: s for s in mock_staff_db}}

@staff_router.post("/allocations")
def get_allocations(req: AllocationRequest):
    # Simulates the live allocation for a specific shift
    # Rule: 1 Manager, 2 Security per station.
    
    allocations = {st: {"managers": [], "security": [], "ticket": []} for st in STATIONS}
    alerts = []

    # 1. Filter available staff for this virtual "Shift"
    # For demo, we just randomize who is available to simulate the roster result
    available_staff = [s for s in mock_staff_db if random.random() > 0.3] # 70% attendance

    # 2. First Pass: Home Base Assignment
    unassigned_staff = []
    for staff in available_staff:
        if staff.home_base in allocations:
            # Check if station is full? (Optional, let's just dump them for now)
            if staff.role == Role.MANAGER: allocations[staff.home_base]["managers"].append(staff)
            elif staff.role == Role.SECURITY: allocations[staff.home_base]["security"].append(staff)
            else: allocations[staff.home_base]["ticket"].append(staff)
        else:
            unassigned_staff.append(staff)

    # 3. Compliance Check & Re-balancing
    for station in STATIONS:
        status = allocations[station]
        
        # Missing Manager?
        if len(status["managers"]) < 1:
            # Find closest unassigned manager (Simplified: just any unassigned manager)
            found = False
            for i, s in enumerate(unassigned_staff):
                if s.role == Role.MANAGER:
                    status["managers"].append(s)
                    unassigned_staff.pop(i)
                    found = True
                    break
            if not found:
                alerts.append(f"CRITICAL: {station} has NO Manager!")

        # Missing Security? (Need 2)
        while len(status["security"]) < 2:
            found = False
            for i, s in enumerate(unassigned_staff):
                if s.role == Role.SECURITY:
                    status["security"].append(s)
                    unassigned_staff.pop(i)
                    found = True
                    break
            if not found:
                alerts.append(f"WARNING: {station} short on Security ({len(status['security'])}/2)")
                break 

    return {
        "date": req.date,
        "shift": req.shift,
        "allocations": allocations,
        "alerts": alerts
    }

@staff_router.get("/live")
def get_live_dashboard():
    # Determines current shift based on real time
    now = datetime.now()
    hour = now.hour
    
    current_shift = ShiftType.MORNING
    if 14 <= hour < 22: current_shift = ShiftType.EVENING
    elif 22 <= hour or hour < 6: current_shift = ShiftType.NIGHT
    
    # Reuse allocation logic for "Now"
    return get_allocations(AllocationRequest(
        date=now.strftime("%Y-%m-%d"),
        shift=current_shift
    ))
