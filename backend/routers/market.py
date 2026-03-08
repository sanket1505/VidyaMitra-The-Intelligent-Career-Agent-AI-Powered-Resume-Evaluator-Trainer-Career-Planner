from fastapi import APIRouter, Query
from services.market import get_market_insights

router = APIRouter()

@router.get("/insights")
def fetch_industry_insights(domain: str = Query("Technology")):
    """
    Fetches real-time news and exchange rates based on the user's career domain.
    """
    return get_market_insights(domain)