import os
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple

# Import local modules
from nlp_processor import MultilingualNLPProcessor
from decision_engine import DecisionEngine
from routing import AStarGridRouter
from tts_engine import OfflineTTSEngine

app = FastAPI(title="AI Battlefield Co-Pilot Edge Service", version="1.0.0")

# Setup CORS so both Node.js and React dashboard can query directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
nlp_processor = MultilingualNLPProcessor()
decision_engine = DecisionEngine()
grid_router = AStarGridRouter()
tts_engine = OfflineTTSEngine()

# Pydantic models for request bodies
class NLPQuery(BaseModel):
    query: str
    context: dict

class RiskInput(BaseModel):
    enemy_probability: float
    terrain_danger: float
    visibility: float
    fatigue: float
    ammo: float

class PathQuery(BaseModel):
    start: List[int]
    end: List[int]
    obstacles: List[List[int]]
    terrain_data: List[dict]
    enemy_threats: List[dict]

class TTSRequest(BaseModel):
    text: str
    play_local: bool = True
    generate_file: bool = False

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "system": "AI Battlefield Co-Pilot Edge Brain",
        "capabilities": ["NLP", "Risk Assessment", "Pathfinding", "TTS"]
    }

@app.post("/api/nlp")
def process_nlp(data: NLPQuery):
    try:
        parsed = nlp_processor.parse_intent(data.query)
        # Merge context variables into response generator
        response_context = data.context.copy()
        response_context["query"] = data.query
        
        reply = nlp_processor.generate_response(parsed["intent"], response_context)
        return {
            "intent": parsed["intent"],
            "confidence": parsed["confidence"],
            "reply": reply,
            "query": data.query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk")
def calculate_risk(data: RiskInput):
    try:
        risk_profile = decision_engine.calculate_risk_score(
            enemy_probability=data.enemy_probability,
            terrain_danger=data.terrain_danger,
            visibility=data.visibility,
            fatigue=data.fatigue,
            ammo=data.ammo
        )
        return risk_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/route")
def calculate_route(data: PathQuery):
    try:
        # Validate coordinates
        if len(data.start) != 2 or len(data.end) != 2:
            raise HTTPException(status_code=400, detail="Start and End coordinates must be 2D lists.")
            
        start_coord = (data.start[0], data.start[1])
        end_coord = (data.end[0], data.end[1])
        
        # Format obstacles
        obstacles = [tuple(obs) for obs in data.obstacles if len(obs) == 2]
        
        path, cost = grid_router.find_path(
            start=start_coord,
            end=end_coord,
            obstacles=obstacles,
            terrain_data=data.terrain_data,
            enemy_threats=data.enemy_threats
        )
        
        return {
            "path": path,
            "cost": round(cost, 2),
            "success": len(path) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts")
def play_tts(data: TTSRequest):
    try:
        if data.play_local:
            tts_engine.speak(data.text)
            
        if data.generate_file:
            # Render to file inside temporary directory
            temp_dir = tempfile.gettempdir()
            filename = f"tts_{int(os.getpid())}.wav"
            filepath = os.path.join(temp_dir, filename)
            
            # Clean up old file if exists
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except:
                    pass
                    
            success = tts_engine.save_to_file(data.text, filepath)
            if success and os.path.exists(filepath):
                return FileResponse(
                    filepath, 
                    media_type="audio/wav", 
                    filename="co-pilot-reply.wav"
                )
            else:
                return {"status": "SPEECH_COMPLETED", "local_played": data.play_local, "file_generated": False}
                
        return {"status": "SPEECH_COMPLETED", "local_played": data.play_local}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start the server locally on port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
