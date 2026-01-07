from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
import random

conflicts_router = APIRouter(prefix="/conflicts", tags=["Conflicts"])

# --- Models ---
class Conflict(BaseModel):
    id: str
    category: str  # "Staffing", "Operational", "Asset"
    title: str
    description: str
    severity: str # "Critical", "Warning", "Info"
    entities: List[str] # ["Staff: John Doe", "Shift: Morning"]
    status: str = "Active" # "Active", "Resolved", "Overridden"
    override_comment: Optional[str] = None

class OverrideRequest(BaseModel):
    comment: str

# --- In-Memory DB ---
CONFLICTS_DB: List[Conflict] = []

# --- Logic ---

@conflicts_router.post("/run-check", response_model=List[Conflict])
def run_conflict_check():
    """Simulates a scan of the system and generates conflicts."""
    global CONFLICTS_DB
    CONFLICTS_DB = [] # Reset for demo simulation (or we could append)
    
    new_conflicts = []

    # 1. Staffing: Double Booking
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Staffing",
        title="Double Booking Detected",
        description="Staff member is assigned to two different stations simultaneously.",
        severity="Critical",
        entities=["Staff: S. Prince", "Station: Aluva (Shift A)", "Station: Edappally (Shift A)"],
        status="Active"
    ))

    # 2. Staffing: 12-Hour Rule Violation
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Staffing",
        title="Rest Period Violation",
        description="Insufficient rest gap between Night Shift and Morning Shift.",
        severity="Warning",
        entities=["Staff: M. Rahul", "Shift: Night (Yesterday)", "Shift: Morning (Today)"],
        status="Active"
    ))
    
    # 3. Staffing: Leave Overlap
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Staffing",
        title="Leave Overlap",
        description="Staff rostered on a day with approved Annual Leave.",
        severity="Warning",
        entities=["Staff: A. Priya", "Leave: Approved (Jan 7)", "Roster: Shift B"],
        status="Active"
    ))

    # 4. Staffing: License Expired
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Staffing",
        title="Certification Expired",
        description="Station Controller assigned without valid safety certification.",
        severity="Critical",
        entities=["Staff: K. Vikram", "Role: Station Controller", "Cert: Expired Dec 31"],
        status="Active"
    ))

    # 5. Operational: Track Possession
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Operational",
        title="Track Possession Conflict",
        description="Train scheduled on track section currently under power block.",
        severity="Critical",
        entities=["Track: Section 4 (Palarivattom)", "Train: Service #405", "Maintenance: Civil Team"],
        status="Active"
    ))
    
    # 6. Operational: Maintenance Overlap
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Operational",
        title="Maintenance vs Operations",
        description="Train designated for service is marked for depot maintenance.",
        severity="Warning",
        entities=["Asset: Train Set #08", "Schedule: 14:00 Service", "Depot: Wheel Turning"],
        status="Active"
    ))
    
     # 7. Asset: Counter Mismatch
    new_conflicts.append(Conflict(
        id=str(uuid.uuid4()),
        category="Asset",
        title="Insufficient Counters",
        description="Roster requires 3 counters, but only 2 machines are functional.",
        severity="Info",
        entities=["Station: MG Road", "Roster: 3 Staff", "Asset Log: 2 Working POMs"],
        status="Active"
    ))

    CONFLICTS_DB.extend(new_conflicts)
    return new_conflicts

@conflicts_router.get("/", response_model=List[Conflict])
def get_conflicts():
    return CONFLICTS_DB

@conflicts_router.post("/{conflict_id}/resolve")
def resolve_conflict(conflict_id: str):
    for c in CONFLICTS_DB:
        if c.id == conflict_id:
            c.status = "Resolved"
            return {"message": "Conflict resolved"}
    raise HTTPException(status_code=404, detail="Conflict not found")

@conflicts_router.post("/{conflict_id}/override")
def override_conflict(conflict_id: str, req: OverrideRequest):
    for c in CONFLICTS_DB:
        if c.id == conflict_id:
            c.status = "Overridden"
            c.override_comment = req.comment
            return {"message": "Conflict overridden"}
    raise HTTPException(status_code=404, detail="Conflict not found")
