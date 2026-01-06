from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid

notes_router = APIRouter(prefix="/notes", tags=["Operations Notes"])

# ---------------- Models ----------------

class Comment(BaseModel):
    id: str
    author: str
    content: str
    timestamp: str

class HistoryEntry(BaseModel):
    action: str # "Edited", "Status Change", "Acknowledged"
    timestamp: str
    details: str

class NoteCreate(BaseModel):
    category: str # "Routine", "Incident", "Maintenance", "Handover", "Lost & Found", "VIP Movement"
    priority: str # "Normal", "High", "Critical"
    subject: str
    description: str
    asset_id: Optional[str] = None
    visibility: str # "Station Only", "HQ/Admin"
    author: str

class NoteUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None

class Note(BaseModel):
    id: str
    category: str
    priority: str
    subject: str
    description: str
    asset_id: Optional[str] = None
    attachments: List[str] = [] # List of URLs
    visibility: str
    author: str
    timestamp: str
    status: str # "Open", "In Progress", "Resolved", "Closed"
    is_escalated: bool = False
    history: List[HistoryEntry] = []
    comments: List[Comment] = []
    acknowledged_by: List[str] = []

# ---------------- In-Memory Store ----------------
# Pre-populating with some sample data for demonstration
NOTES_DB: List[Note] = [
    Note(
        id=str(uuid.uuid4()),
        category="Maintenance",
        priority="High",
        subject="Escalator 3 Breakdown",
        description="Escalator near Platform 2 is making a grinding noise. Stopped for safety.",
        asset_id="ESC-03",
        visibility="Station Only",
        author="Rahul K.",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="In Progress",
        history=[
            HistoryEntry(action="Created", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), details="Initial Report")
        ],
        comments=[],
        acknowledged_by=[]
    ),
    Note(
        id=str(uuid.uuid4()),
        category="Routine",
        priority="Normal",
        subject="Morning Station Check",
        description="All systems normal. cleanliness check passed.",
        visibility="Station Only",
        author="Sandeep M.",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="Closed",
        history=[],
        comments=[],
        acknowledged_by=[]
    )
]

# ---------------- Endpoints ----------------

@notes_router.get("/", response_model=List[Note])
def get_notes(
    category: Optional[str] = None, 
    priority: Optional[str] = None, 
    search: Optional[str] = None,
    date: Optional[str] = None
):
    results = NOTES_DB
    
    if category:
        results = [n for n in results if n.category == category]
    if priority:
        results = [n for n in results if n.priority == priority]
    if date:
        # Simple string match for date part YYYY-MM-DD
        results = [n for n in results if n.timestamp.startswith(date)]
    if search:
        s = search.lower()
        results = [n for n in results if s in n.subject.lower() or s in n.description.lower()]
        
    # Sort by timestamp descending
    results.sort(key=lambda x: x.timestamp, reverse=True)
    return results

@notes_router.post("/", response_model=Note)
def create_note(note_in: NoteCreate):
    note_id = str(uuid.uuid4())
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Auto-escalate Critical notes
    escalated = False
    if note_in.priority == "Critical":
        escalated = True
        
    new_note = Note(
        id=note_id,
        category=note_in.category,
        priority=note_in.priority,
        subject=note_in.subject,
        description=note_in.description,
        asset_id=note_in.asset_id,
        visibility=note_in.visibility,
        author=note_in.author,
        timestamp=now,
        status="Open",
        is_escalated=escalated,
        history=[HistoryEntry(action="Created", timestamp=now, details="Initial Report")],
        comments=[],
        acknowledged_by=[]
    )
    
    NOTES_DB.append(new_note)
    return new_note

@notes_router.post("/{note_id}/comment", response_model=Note)
def add_comment(note_id: str, author: str, content: str):
    note = next((n for n in NOTES_DB if n.id == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    comment_id = str(uuid.uuid4())
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    note.comments.append(Comment(
        id=comment_id,
        author=author,
        content=content,
        timestamp=now
    ))
    return note

@notes_router.post("/{note_id}/acknowledge", response_model=Note)
def acknowledge_note(note_id: str, user: str):
    note = next((n for n in NOTES_DB if n.id == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if user not in note.acknowledged_by:
        note.acknowledged_by.append(user)
        note.history.append(HistoryEntry(
            action="Acknowledged", 
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
            details=f"Acknowledged by {user}"
        ))
        
    return note

@notes_router.post("/{note_id}/resolve", response_model=Note)
def resolve_note(note_id: str, user: str, status: str = "Resolved"):
    note = next((n for n in NOTES_DB if n.id == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    note.status = status
    note.history.append(HistoryEntry(
        action="Status Change", 
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
        details=f"Status changed to {status} by {user}"
    ))
    return note

@notes_router.patch("/{note_id}", response_model=Note)
def update_note(note_id: str, update: NoteUpdate, user: str):
    note = next((n for n in NOTES_DB if n.id == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    # Logic: Immutable Handover logs
    if note.category == "Handover":
        raise HTTPException(status_code=403, detail="Handover notes are immutable.")
        
    changes = []
    if update.subject and update.subject != note.subject:
        note.subject = update.subject
        changes.append("Subject")
    if update.description and update.description != note.description:
        note.description = update.description
        changes.append("Description")
    if update.priority and update.priority != note.priority:
        note.priority = update.priority
        changes.append("Priority")
    if update.category and update.category != note.category:
        note.category = update.category
        changes.append("Category")
        
    if changes:
        note.history.append(HistoryEntry(
            action="Edited",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            details=f"Updated {', '.join(changes)} by {user}"
        ))
        
    return note
