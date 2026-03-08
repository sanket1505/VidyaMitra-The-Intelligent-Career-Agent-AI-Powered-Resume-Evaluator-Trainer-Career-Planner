import os
import requests
from dotenv import load_dotenv

def fetch_visual_resources(query: str, per_page: int = 3):
    if not query or query == "undefined" or query.strip() == "":
        query = "Technology Programming"

    load_dotenv(override=True)
    api_key = os.getenv("PEXELS_API_KEY")
    
    # 🛡️ GUARANTEED FALLBACKS
    fallbacks = [
        {
            "id": 1181671,
            "src": "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
            "url": "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
            "image": "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
            "alt": "Programming Setup",
            "photographer": "Christina Morillo"
        },
        {
            "id": 577585,
            "src": "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800",
            "url": "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800",
            "image": "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800",
            "alt": "Data Analytics",
            "photographer": "Kevin Ku"
        },
        {
            "id": 270404,
            "src": "https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=800",
            "url": "https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=800",
            "image": "https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=800",
            "alt": "Code on Screen",
            "photographer": "Pixabay"
        }
    ]

    if not api_key or len(api_key) < 10:
        return fallbacks

    PEXELS_URL = "https://api.pexels.com/v1/search"
    headers = {"Authorization": api_key}
    params = {"query": f"{query} coding technology", "per_page": per_page, "orientation": "landscape"}

    try:
        response = requests.get(PEXELS_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        photos = data.get("photos", [])
        
        if not photos:
            return fallbacks
            
        return [{
            "id": photo["id"],
            "src": photo["src"]["large"],
            "url": photo["src"]["large"],
            "image": photo["src"]["large"],
            "alt": photo["alt"],
            "photographer": photo["photographer"]
        } for photo in photos]
        
    except Exception as e:
        print(f"Pexels Error: {e}")
        return fallbacks