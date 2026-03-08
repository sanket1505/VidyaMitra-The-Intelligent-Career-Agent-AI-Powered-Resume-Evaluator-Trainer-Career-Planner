from fastapi import APIRouter, Query
from services.pexels import fetch_visual_resources

router = APIRouter()

@router.get("/visuals")
def get_visual_aids(topic: str = Query(default="Technology")):
    # Intercept bad strings sent from the frontend
    if not topic or topic == "undefined" or topic == "null":
        topic = "Programming Setup"
        
    visuals = fetch_visual_resources(topic)
    return {"visuals": visuals}