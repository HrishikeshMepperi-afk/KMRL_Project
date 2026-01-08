from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
import random
from datetime import datetime, timedelta

from app.staff import get_all_pilots
from app.fleet import get_all_trains

schedule_router = APIRouter(prefix="/schedule", tags=["Service Schedule"])

# --- Models ---

class Pilot(BaseModel):
    id: str
    name: str # Mapped from Staff
    status: str = "Available" 

class TrainSet(BaseModel):
    id: str
    name: str # Mapped from ID
    status: str = "Operational" 

class Trip(BaseModel):
    id: str
    trip_id: str 
    route: str 
    train_set_id: Optional[str] = None
    pilot_id: Optional[str] = None
    departure_time: str 
    arrival_time: str 
    frequency: str = "+10 mins"
    status: str = "Scheduled" 
    delay_minutes: int = 0
    platform: str = "Platform 1"
    
class TripUpdate(BaseModel):
    departure_time: Optional[str] = None
    delay_minutes: Optional[int] = None
    status: Optional[str] = None
    pilot_id: Optional[str] = None
    train_set_id: Optional[str] = None
    platform: Optional[str] = None
    cancellation_reason: Optional[str] = None

# --- State ---

TRIPS_DB: List[Trip] = []

# --- Logic Helper (Must be defined before generation) ---

def check_resource_overlap(trip_id: str, pilot_id: Optional[str], train_id: Optional[str], departure: str, arrival: str) -> Optional[str]:
    """
    Checks if the given Pilot or Train is already assigned to a trip that overlaps with the proposed time window.
    """
    try:
        proposed_start = datetime.strptime(departure, "%H:%M")
        proposed_end = datetime.strptime(arrival, "%H:%M")
    except ValueError:
        return None # Return None if format invalid (safeguard)

    for t in TRIPS_DB:
        if t.id == trip_id: continue 
        if t.status == "Cancelled": continue 
        
        try:
            t_start = datetime.strptime(t.departure_time, "%H:%M")
            t_end = datetime.strptime(t.arrival_time, "%H:%M")
        except ValueError:
            continue

        # Overlap exists if (StartA < EndB) and (EndA > StartB)
        if proposed_start < t_end and proposed_end > t_start:
            if pilot_id and t.pilot_id == pilot_id:
                return f"Pilot is already assigned to {t.trip_id} ({t.departure_time}-{t.arrival_time})"
            if train_id and t.train_set_id == train_id:
                return f"Train {t.train_set_id} is already assigned to {t.trip_id} ({t.departure_time}-{t.arrival_time})"
    return None

# --- Schedule Generation ---

def generate_initial_schedule():
    global TRIPS_DB
    if TRIPS_DB: return
    
    # Gapless Schedule Generation (06:00 - 22:00)
    current_time = datetime.strptime("06:00", "%H:%M")
    end_time = datetime.strptime("22:00", "%H:%M")
    
    trip_counter = 1001
    
    # Fetch Central Resources
    pilots = get_all_pilots()
    trains = get_all_trains()
    
    # Availability Pools
    pilot_pool = [p for p in pilots]
    train_pool = [t for t in trains if t.status != "Maintenance"]
    
    while current_time < end_time:
        # Determine Frequency
        hour = current_time.hour
        
        if 8 <= hour < 11 or 16 <= hour < 20:
            freq = 10 # Peak
        elif 20 <= hour:
            freq = 20 # Night
        else:
            freq = 15 # Off-peak
            
        duration = 45 # Standard trip time
        
        # Create Trip Meta
        direction = "Aluva -> Petta" if trip_counter % 2 != 0 else "Petta -> Aluva"
        platform = "Platform 1" if trip_counter % 2 != 0 else "Platform 2"
        arrival = current_time + timedelta(minutes=duration)
        
        trip_id_str = str(uuid.uuid4())
        trip_friendly_id = f"TR-{trip_counter}"
        dept_str = current_time.strftime("%H:%M")
        arr_str = arrival.strftime("%H:%M")
        
        # --- Smart Assignment ---
        assigned_pilot = None
        assigned_train = None

        # Find first available Pilot
        for p in pilot_pool:
            if not check_resource_overlap(trip_id_str, p.id, None, dept_str, arr_str):
                assigned_pilot = p.id
                break
        
        # Find first available Train
        for t in train_pool:
            if not check_resource_overlap(trip_id_str, None, t.id, dept_str, arr_str):
                assigned_train = t.id
                # Rotate the pool for load distribution
                train_pool.append(train_pool.pop(0)) 
                break
        
        if assigned_pilot and pilot_pool:
             # Rotate pilot pool too
             pilot_pool.append(pilot_pool.pop(0))

        # Simulate Status
        status = "Scheduled"
        
        TRIPS_DB.append(Trip(
            id=trip_id_str,
            trip_id=trip_friendly_id,
            route=direction,
            departure_time=dept_str,
            arrival_time=arr_str,
            frequency=f"+{freq} mins",
            pilot_id=assigned_pilot,
            train_set_id=assigned_train,
            status=status,
            platform=platform
        ))
        
        current_time += timedelta(minutes=freq)
        trip_counter += 1

# Initialize
generate_initial_schedule()

# --- Endpoints ---

@schedule_router.get("/", response_model=List[Trip])
def get_schedule():
    return TRIPS_DB

@schedule_router.post("/trip", response_model=Trip)
def add_trip(trip: Trip):
    error = check_resource_overlap(trip.id, trip.pilot_id, trip.train_set_id, trip.departure_time, trip.arrival_time)
    if error:
        raise HTTPException(status_code=409, detail=error)

    TRIPS_DB.append(trip)
    TRIPS_DB.sort(key=lambda x: x.departure_time)
    return trip

@schedule_router.put("/trip/{id}", response_model=Trip)
def update_trip(id: str, update: TripUpdate):
    for trip in TRIPS_DB:
        if trip.id == id:
            new_pilot = update.pilot_id if update.pilot_id is not None else trip.pilot_id
            new_train = update.train_set_id if update.train_set_id is not None else trip.train_set_id
            new_dept = update.departure_time if update.departure_time else trip.departure_time
            new_arrival = trip.arrival_time 
            
            error = check_resource_overlap(trip.id, new_pilot, new_train, new_dept, new_arrival)
            if error:
                raise HTTPException(status_code=409, detail=error)

            if update.departure_time: trip.departure_time = update.departure_time
            if update.delay_minutes is not None: 
                trip.delay_minutes = update.delay_minutes
                if trip.delay_minutes > 0 and trip.status == "Scheduled":
                    trip.status = "Delayed"
                if trip.delay_minutes == 0 and trip.status == "Delayed":
                    trip.status = "Scheduled"
            if update.status: trip.status = update.status
            if update.pilot_id: trip.pilot_id = update.pilot_id
            if update.train_set_id: trip.train_set_id = update.train_set_id
            if update.platform: trip.platform = update.platform
            
            return trip
    raise HTTPException(status_code=404, detail="Trip not found")

@schedule_router.post("/reset")
def reset_schedule():
    """Resets the schedule to the initial state."""
    global TRIPS_DB
    TRIPS_DB = []
    generate_initial_schedule()
    return {"message": "Schedule reset to default."}

@schedule_router.get("/resources/pilots", response_model=List[Pilot])
def get_pilots():
    # Map Staff(Pilot) to Schedule Pilot Model
    pilots = get_all_pilots()
    return [Pilot(id=p.id, name=p.name, status="Available") for p in pilots]

@schedule_router.get("/resources/trains", response_model=List[TrainSet])
def get_trains():
    # Map Fleet(Train) to Schedule TrainSet Model
    trains = get_all_trains()
    return [
        TrainSet(
            id=t.id, 
            name=t.id, 
            status="Operational" if t.status == "In Service" or t.status == "Available" else "Maintenance"
        ) 
        for t in trains
    ]

@schedule_router.post("/publish")
def publish_schedule():
    return {"message": "Schedule published to Passenger Information System."}
