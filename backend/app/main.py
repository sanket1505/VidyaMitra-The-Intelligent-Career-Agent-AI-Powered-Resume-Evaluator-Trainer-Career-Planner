from fastapi import FastAPI
from app.routers import auth as auth_router
from app.routers import users as users_router

app = FastAPI(title="VidyāMitra Auth API")

app.include_router(auth_router.router)
app.include_router(users_router.router)

@app.get("/")
def root():
    return {"message": "VidyāMitra Auth API Running"}