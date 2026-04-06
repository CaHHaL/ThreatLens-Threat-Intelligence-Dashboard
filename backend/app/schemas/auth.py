from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import RoleEnum
from uuid import UUID

# ------------- Request Schemas -------------
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)  # Require minimal length for security

# ------------- Response Schemas -------------
class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    role: RoleEnum
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Note: refresh_token is NOT included here, as it will be returned via HttpOnly Cookie for security
