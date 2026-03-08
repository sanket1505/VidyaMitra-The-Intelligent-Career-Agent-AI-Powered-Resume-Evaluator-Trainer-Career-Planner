from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_skill_evaluation():
    return {
        "skills": [
            {"name": "Python (FastAPI)", "level": "Advanced", "score": 92},
            {"name": "React.js", "level": "Intermediate", "score": 78},
            {"name": "SQLAlchemy", "level": "Intermediate", "score": 75}
        ]
    }