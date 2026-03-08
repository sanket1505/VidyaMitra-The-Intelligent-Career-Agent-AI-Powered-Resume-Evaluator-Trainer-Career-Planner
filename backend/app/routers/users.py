from fastapi import APIRouter, Depends
from app import schemas, models
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user