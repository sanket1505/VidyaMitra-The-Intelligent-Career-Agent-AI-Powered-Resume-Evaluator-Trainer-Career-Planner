import os
from typing import Any, Dict, List

from dotenv import load_dotenv

load_dotenv()


def _safe_text(value: Any, fallback: str = '') -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text or fallback


def _normalize_video(item: Dict[str, Any], idx: int, query: str) -> Dict[str, str]:
    video_id = _safe_text(item.get('id') or item.get('videoId') or item.get('video_id'))
    if not video_id:
        # Stable fallback id-like key so frontend map doesn't break.
        video_id = f'fallback-{idx + 1}'

    title = _safe_text(item.get('title'), f'{query} tutorial #{idx + 1}')
    description = _safe_text(item.get('description'), 'Practical learning resource.')
    thumbnail = _safe_text(item.get('thumbnail') or item.get('thumbnail_url') or item.get('image'))
    if not thumbnail and not video_id.startswith('fallback-'):
        thumbnail = f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg'

    channel = _safe_text(item.get('channel'), 'Learning Channel')

    return {
        'id': video_id,
        'title': title,
        'description': description,
        'thumbnail': thumbnail,
        'channel': channel,
    }


def get_fallback_videos(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    # Reliable fallback list shown when YouTube API fails.
    fallback = [
        {
            'id': 'rfscVS0vtbw',
            'title': f'{query}: Full Course for Beginners',
            'description': 'Hands-on beginner-friendly walkthrough.',
            'thumbnail': 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
            'channel': 'freeCodeCamp.org',
        },
        {
            'id': 'PkZNo7MFNFg',
            'title': f'{query}: Practical Project Tutorial',
            'description': 'Build a practical project step by step.',
            'thumbnail': 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
            'channel': 'freeCodeCamp.org',
        },
        {
            'id': '3PHXvlpOkf4',
            'title': f'{query}: Interview-Focused Concepts',
            'description': 'Interview-ready concepts and examples.',
            'thumbnail': 'https://i.ytimg.com/vi/3PHXvlpOkf4/hqdefault.jpg',
            'channel': 'TechWorld with Nana',
        },
    ]

    return fallback[: max(max_results, 1)]


def fetch_youtube_videos(query: str, max_results: int = 3):
    api_key = os.getenv('YOUTUBE_API_KEY')

    if not api_key:
        print('YOUTUBE_API_KEY not found. Using fallback videos.')
        return get_fallback_videos(query, max_results=max_results)

    try:
        # Lazy import so missing dependency never crashes app startup.
        from googleapiclient.discovery import build

        youtube = build('youtube', 'v3', developerKey=api_key)
        search_query = f'{query} tutorial programming'

        request = youtube.search().list(
            q=search_query,
            part='snippet',
            type='video',
            maxResults=max_results,
            relevanceLanguage='en',
        )
        response = request.execute()

        raw_videos = []
        for item in response.get('items', []):
            snippet = item.get('snippet') or {}
            id_part = item.get('id') or {}
            raw_videos.append(
                {
                    'id': id_part.get('videoId'),
                    'title': snippet.get('title'),
                    'description': snippet.get('description'),
                    'thumbnail': ((snippet.get('thumbnails') or {}).get('medium') or {}).get('url'),
                    'channel': snippet.get('channelTitle'),
                }
            )

        normalized = [_normalize_video(v, idx, query) for idx, v in enumerate(raw_videos)]
        if normalized:
            return normalized

        return get_fallback_videos(query, max_results=max_results)

    except Exception as e:
        print(f'YouTube API Error: {e}. Using fallback videos.')
        return get_fallback_videos(query, max_results=max_results)
