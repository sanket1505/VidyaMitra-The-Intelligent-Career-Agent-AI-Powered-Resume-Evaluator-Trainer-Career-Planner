from fastapi import APIRouter, Query

from services.youtube import fetch_youtube_videos

router = APIRouter()


@router.get('/videos')
def get_learning_resources(topic: str = Query(default='Software Development')):
    videos = fetch_youtube_videos(query=topic, max_results=3)

    # Guarantee stable response shape for frontend rendering.
    return {'topic': topic, 'videos': videos or []}
