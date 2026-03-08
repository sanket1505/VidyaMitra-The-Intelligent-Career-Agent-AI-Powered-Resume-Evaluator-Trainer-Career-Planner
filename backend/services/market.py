import os
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

def get_market_insights(domain: str):
    news_key = os.getenv("NEWS_API_KEY")
    exchange_key = os.getenv("EXCHANGE_API_KEY")

    if not news_key or not exchange_key:
        raise HTTPException(status_code=500, detail="Market API keys missing in .env")

    # 1. Fetch Latest Industry News
    # Appending "technology" or "industry" helps narrow down the results
    news_url = f"https://newsapi.org/v2/everything?q={domain} industry&sortBy=relevancy&pageSize=3&apiKey={news_key}"
    news_data = []
    try:
        news_res = requests.get(news_url)
        if news_res.status_code == 200:
            articles = news_res.json().get("articles", [])
            # Extract just the useful parts to send to the frontend
            news_data = [{
                "title": a["title"], 
                "url": a["url"], 
                "source": a["source"]["name"]
            } for a in articles]
    except Exception as e:
        print(f"News API Error: {e}")

    # 2. Fetch Exchange Rate (USD to INR is standard for global tech roles)
    exchange_rate = None
    exchange_url = f"https://v6.exchangerate-api.com/v6/{exchange_key}/pair/USD/INR"
    try:
        ex_res = requests.get(exchange_url)
        if ex_res.status_code == 200:
            exchange_rate = ex_res.json().get("conversion_rate")
    except Exception as e:
        print(f"Exchange API Error: {e}")

    return {
        "domain": domain,
        "news": news_data,
        "exchange_rate": {
            "currency_pair": "USD to INR", 
            "rate": exchange_rate
        }
    }