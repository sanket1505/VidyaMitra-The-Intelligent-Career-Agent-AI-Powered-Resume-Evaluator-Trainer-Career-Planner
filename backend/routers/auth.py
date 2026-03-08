from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.auth_service import login_user, refresh_user_session, register_user

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post('/signup')
def signup(data: SignupRequest):
    result = register_user(data.email, data.password, data.first_name, data.last_name)
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result


@router.post('/login')
def login(data: LoginRequest):
    result = login_user(data.email, data.password)
    if 'error' in result:
        raise HTTPException(status_code=401, detail=result['error'])
    return result


@router.post('/refresh')
def refresh(data: RefreshRequest):
    result = refresh_user_session(data.refresh_token)
    if 'error' in result:
        raise HTTPException(status_code=401, detail=result['error'])
    return result
