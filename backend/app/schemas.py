from pydantic import BaseModel, EmailStr


# 🔹 Base shared fields
class UserBase(BaseModel):
    username: str
    email: EmailStr


# 🔹 Used for registration
class UserCreate(UserBase):
    password: str


# 🔹 Used for login
class UserLogin(BaseModel):
    username: str
    password: str


# 🔹 What we return to frontend (NO password)
class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True   # for SQLAlchemy (Pydantic v2)


# 🔹 Token response
class Token(BaseModel):
    access_token: str
    token_type: str