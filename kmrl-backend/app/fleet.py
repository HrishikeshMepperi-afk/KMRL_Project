from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import random
from datetime import datetime, timedelta

fleet_router = APIRouter(prefix="/fleet", tags=["Fleet Management"])

# --- Models ---

class TrainDetail(BaseModel):
    id: str
    status: str # "Available", "Maintenance", "In Service"
    location: Optional[str] = None
    delay_minutes: int = 0
    km_run_today: float = 0.0
    ridership_load: float = 0.0 # Percentage 0-100

class FleetStatus(BaseModel):
    availability: float
    punctuality: float
    health_alerts: List[str]
    utilization: float
    total_fleet: int
    active_trains: int
    train_details: List[TrainDetail]

class TripRequest(BaseModel):
    id: str
    route_name: str
    start_time: str # HH:MM
    origin_station: str # "Aluva", "Pettah"

class AssignmentResult(BaseModel):
    trip_id: str
    train_id: str
    train_km_run: float
    is_peak_match: bool # True if Fresh Train assigned to Peak Trip
    match_reason: str

class AssignmentRequest(BaseModel):
    trips: List[TripRequest]

# --- Logic ---

def _generate_mock_fleet(total_fleet=25) -> List[TrainDetail]:
    """
    Generates a consistent mock fleet state for both Fleet Status and Assignment modules.
    Ensures trains are numbered TM-101 to TM-(100+total_fleet).
    Central Source of Truth for Trains.
    """
    train_details = []
    
    now = datetime.now()
    start_of_service = now.replace(hour=6, minute=0, second=0, microsecond=0)
    current_hour = now.hour
    
    for i in range(1, total_fleet + 1):
        train_id = f"TM-{100+i}"
        delay = 0

        # Status Logic
        if i == 5:
             status = "Maintenance"
             loc = "Aluva Depot"
        elif i == 12:
             status = "Maintenance"
             loc = "Muttom Yard"
        elif i == 18:
             status = "Maintenance"
             loc = "Pettah Terminal"
        else:
             status = "In Service" if i % 2 == 0 else "Available"
             loc = f"Station {chr(65 + (i%5))}" if status == "In Service" else "Depot"
        
        # --- Metrics Calculation ---
        if status == "In Service":
            # Delays
            if random.random() < 0.15: 
                delay = random.randint(2, 12)
            
            # 1. KM Run Calculation
            if now < start_of_service:
                km_run = 0.0
            else:
                elapsed_hours = (now - start_of_service).total_seconds() / 3600
                avg_speed = 33.0 
                km_run = elapsed_hours * avg_speed
                km_run *= random.uniform(0.85, 1.15)
                km_run = round(max(0.0, km_run), 1)

            # 2. Ridership Load Calculation
            if 8 <= current_hour < 11: # Morning Peak
                base_load = random.uniform(80, 90)
            elif 17 <= current_hour < 20: # Evening Peak
                base_load = random.uniform(85, 95)
            elif 11 <= current_hour < 17: # Mid-Day
                base_load = random.uniform(40, 60)
            else: 
                base_load = random.uniform(10, 30)

            # Station Tier Multiplier
            if loc in ["Aluva", "Edapally", "M.G. Road", "Maharaja's College", "Vytila"]:
                tier_multiplier = 1.2
            elif loc in ["Kalamassery", "Kaloor", "JLN Stadium", "Palarivattom", "Ernakulam South", "Petta"]:
                tier_multiplier = 1.0
            else:
                tier_multiplier = 0.7
            
            ridership_load = base_load * tier_multiplier
            ridership_load *= random.uniform(0.9, 1.1)
            ridership_load = round(min(120.0, max(0.0, ridership_load)), 1)
            
        else:
            # "Available" or "Maintenance"
            ridership_load = 0.0
            km_run = 0.0
            
            # Simulate Morning Shift Completion for "Available" trains
            if status == "Available" and random.random() < 0.70:
                 km_run = round(random.uniform(100.0, 350.0), 1)

        train_details.append(TrainDetail(
            id=train_id, 
            status=status, 
            location=loc, 
            delay_minutes=delay,
            km_run_today=km_run,
            ridership_load=ridership_load
        ))
        
    return train_details

# --- Internal API for other modules ---
FLEET_DB = _generate_mock_fleet(25)

def get_all_trains() -> List[TrainDetail]:
    return FLEET_DB

# --- Endpoints ---

@fleet_router.get("/", response_model=FleetStatus)
def get_fleet_status():
    total_fleet = 25 
    train_details = FLEET_DB
    
    # Calculate aggregates
    active_trains = len([t for t in train_details if t.status == "In Service"])
    availability = round((active_trains / total_fleet) * 100, 1)
    
    delayed_trains = len([t for t in train_details if t.delay_minutes > 5])
    
    calculated_punctuality = 100.0
    if active_trains > 0:
        calculated_punctuality = ((active_trains - delayed_trains) / active_trains) * 100

    return FleetStatus(
        availability=availability,
        punctuality=round(calculated_punctuality, 1),
        health_alerts=["Train 105: HVAC degraded", "Train 112: Door sensor warning"],
        utilization=78.4,
        total_fleet=total_fleet,
        active_trains=active_trains,
        train_details=train_details
    )

@fleet_router.post("/assign-trains")
def assign_trains_endpoint(data: AssignmentRequest):
    assignments = []
    
    # 1. Get Consistent Fleet State
    all_trains = FLEET_DB
    
    # Filter for "Available" trains only
    available_trains = [
        {"id": t.id, "km_run": t.km_run_today} 
        for t in all_trains 
        if t.status == "Available"
    ]
    
    # 2. Sort Trains: Fresher first (Lowest KM)
    available_trains.sort(key=lambda x: x['km_run'])
    
    # 3. Analyze Trips & Assign Priority
    prioritized_trips = []
    for trip in data.trips:
        hour = int(trip.start_time.split(':')[0])
        is_peak = (8 <= hour <= 10) or (17 <= hour <= 19)
        is_hub_start = trip.origin_station in ["Aluva", "Pettah", "SN Junction"]
        
        score = 0
        if is_peak: score += 2
        if is_hub_start: score += 1
        
        prioritized_trips.append({
            "trip": trip,
            "score": score,
            "is_peak": is_peak
        })
    
    # Sort trips by Score
    prioritized_trips.sort(key=lambda x: x['score'], reverse=True)
    
    # 4. Perform Matching
    used_train_ids = set()
    
    for item in prioritized_trips:
        trip = item['trip']
        score = item['score']
        
        # Find best available train
        selected_train = None
        candidates = [t for t in available_trains if t['id'] not in used_train_ids]
        
        if not candidates:
            break # No more trains!
            
        if score >= 2: # Priority Trip
            # Try to find a fresh one (< 100km used)
            fresh_candidates = [t for t in candidates if t['km_run'] < 100]
            if fresh_candidates:
                selected_train = fresh_candidates[0]
                reason = "Optimum Service: Low-mileage rake assigned to ensure reliability during peak load."
                is_optimal = True
            else:
                selected_train = candidates[0]
                reason = "Demand Coverage: Best available rake deployed to meet high passenger demand."
                is_optimal = False
        else:
            selected_train = candidates[0]
            reason = "Standard Rotation: Routine rake assignment for balanced fleet utilization."
            is_optimal = False

        if selected_train:
            used_train_ids.add(selected_train['id'])
            assignments.append(AssignmentResult(
                trip_id=trip.id,
                train_id=selected_train['id'],
                train_km_run=selected_train['km_run'],
                is_peak_match=is_optimal,
                match_reason=reason
            ))

    return assignments
