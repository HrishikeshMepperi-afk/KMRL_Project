import os
import json
from math import ceil
from typing import Optional, Dict, List
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import requests
import urllib3

# ---------------- Suppress LibreSSL warning ----------------
urllib3.disable_warnings(urllib3.exceptions.NotOpenSSLWarning)

# ---------------- Load Environment Variables ----------------
load_dotenv("api.env")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_KEY = os.getenv("WEATHER_API_KEY")
HOLIDAY_KEY = os.getenv("HOLIDAY_KEY")

genai.configure(api_key=GEMINI_KEY)

genai.configure(api_key=GEMINI_KEY)

app = FastAPI(title="KMRL AI Backend 🚇")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Models ----------------
class ForecastRequest(BaseModel):
    date: str
    time: str
    station: str
    passengers: int
    event: Optional[str] = None
    day_of_week: Optional[str] = None
    weather: Optional[str] = None
    holiday: Optional[bool] = False
    nearby_events: Optional[str] = None
    train_delays: Optional[int] = 0

class PlanRequest(BaseModel):
    date: str
    station: str
    predicted_passengers: int

class ScheduleStation(BaseModel):
    station: str
    predicted_passengers: int

class ScheduleRequest(BaseModel):
    date: str
    stations: List[ScheduleStation]
    available_trains: Optional[int] = 10
    maintenance_trains: Optional[int] = 0
    staff_available: Optional[int] = 10
    peak_hours: Optional[Dict[str, float]] = None  # {"08:00-09:00":1.5}

# ---------------- Root ----------------
@app.get("/")
def root():
    return {"message": "KMRL AI Backend Running 🚇"}

# ---------------- Helper Functions ----------------
def get_weather(city="Kochi"):
    try:
        res = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_KEY}"
        )
        data = res.json()
        return data['weather'][0]['main']
    except:
        return "Clear"

def is_holiday(date):
    try:
        year, month, day = map(int, date.split("-"))
        res = requests.get(
            f"https://calendarific.com/api/v2/holidays?api_key={HOLIDAY_KEY}&country=IN&year={year}&month={month}&day={day}"
        )
        holidays = res.json().get('response', {}).get('holidays', [])
        return len(holidays) > 0
    except:
        return False

# ---------------- Forecast Endpoint ----------------
@app.post("/forecast")
def forecast(data: ForecastRequest):
    weather = get_weather() if not data.weather else data.weather
    holiday_flag = is_holiday(data.date) if not data.holiday else data.holiday

    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""
    You are an expert metro ridership forecaster.
    Predict passenger demand using the data below.

    Date: {data.date}
    Time: {data.time}
    Station: {data.station}
    Current passengers: {data.passengers}
    Day of week: {data.day_of_week or 'Unknown'}
    Weather: {weather}
    Holiday: {holiday_flag}
    Special event: {data.event or 'None'}
    Nearby events: {data.nearby_events or 'None'}
    Previous train delays: {data.train_delays} minutes

    Respond ONLY in valid JSON:
    {{ "predicted_passengers": number }}
    """

    try:
        response = model.generate_content(prompt)
        text = response.candidates[0].content.parts[0].text.strip()
        result = json.loads(text)
        predicted = result.get("predicted_passengers", int(data.passengers * 1.2))
    except Exception as e:
        print("Gemini API failed:", e)
        multiplier = 1.0
        if data.day_of_week in ["Saturday","Sunday"]:
            multiplier *=1.2
        if holiday_flag:
            multiplier *=1.3
        if weather in ["Rain","Storm"]:
            multiplier *=0.9
        if data.nearby_events:
            multiplier *=1.15
        predicted = int(data.passengers * multiplier)

    return {
        "station": data.station,
        "date": data.date,
        "time": data.time,
        "predicted_passengers": predicted
    }

# ---------------- Plan Endpoint ----------------
@app.post("/plan")
def plan_train(request: PlanRequest):
    train_capacity = 1000
    trains_required = ceil(request.predicted_passengers / train_capacity)
    peak_hours = ["08:00-10:00","17:00-19:00"]

    return {
        "station": request.station,
        "date": request.date,
        "trains_required": trains_required,
        "train_capacity": train_capacity,
        "peak_hours": peak_hours
    }

@app.post("/schedule")
def schedule_trains(req: ScheduleRequest):
    train_capacity = 800  # More realistic capacity
    schedule_result = {}

    # Standard Metro Demand Curve (Percentage of daily traffic per hour)
    # Total sums to ~1.0 (100%)
    demand_curve = {
        "06:00-07:00": 0.02, # Early Morning
        "07:00-08:00": 0.05,
        "08:00-09:00": 0.12, # Morning Peak
        "09:00-10:00": 0.15, # Morning Peak High
        "10:00-11:00": 0.08,
        "11:00-12:00": 0.05,
        "12:00-13:00": 0.05, # Lunch
        "13:00-14:00": 0.04,
        "14:00-15:00": 0.04,
        "15:00-16:00": 0.05,
        "16:00-17:00": 0.08, # Pre-Evening
        "17:00-18:00": 0.15, # Evening Peak
        "18:00-19:00": 0.12, # Evening Peak
        "19:00-20:00": 0.08,
        "20:00-21:00": 0.05,
        "21:00-22:00": 0.03, # Late Night
        "22:00-23:00": 0.01  # Closing
    }

    # Calculate schedule for each station independently based on its demand
    total_trains_deployed = 0

    for station in req.stations:
        hourly_schedule = {}
        daily_passengers = station.predicted_passengers
        station_total_trains = 0
        
        for time_range, demand_share in demand_curve.items():
            # Expected passengers for this hour
            hourly_passengers = int(daily_passengers * demand_share)
            
            # Trains needed (Capacity limit + Minimum Service)
            # Minimum 1 train every hour if station is active, unless very low demand
            trains_needed = ceil(hourly_passengers / train_capacity)
            trains_needed = max(trains_needed, 1) # Ensure connection exists
            
            # Cap by available fleet frequency (e.g. max 15 trains/hour per line section)
            # Assuming 'available_trains' in request is roughly max fleet capacity
            # Simplified: allow up to 20 per hour max
            trains_needed = min(trains_needed, 20)

            hourly_schedule[time_range] = {
                "trains_assigned": trains_needed,
                "projected_load": hourly_passengers
            }
            station_total_trains += trains_needed

        schedule_result[station.station] = {
            "predicted_passengers": daily_passengers,
            "trains_assigned_total": station_total_trains,
            "hourly_schedule": hourly_schedule
        }
        total_trains_deployed += station_total_trains

    return {
        "date": req.date,
        "train_capacity": train_capacity,
        "total_trains_needed": total_trains_deployed,
        "schedule": schedule_result
    }
