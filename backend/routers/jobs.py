from fastapi import APIRouter

router = APIRouter()

@router.get("/trending")
def get_trending_roles():
    # In a production app, this could fetch from a Job Board API
    return [
        {"id": 1, "title": "Full Stack Developer", "salary": "₹8L - ₹18L", "demand": "Very High", "skills": ["React", "Node.js", "PostgreSQL"]},
        {"id": 2, "title": "Data Scientist", "salary": "₹10L - ₹25L", "demand": "High", "skills": ["Python", "TensorFlow", "Pandas"]},
        {"id": 3, "title": "DevOps Engineer", "salary": "₹12L - ₹22L", "demand": "Critical", "skills": ["Docker", "AWS", "Kubernetes"]},
        {"id": 4, "title": "AI Prompt Engineer", "salary": "₹15L - ₹30L", "demand": "Emerging", "skills": ["LLMs", "NLP", "Python"]},
    ]