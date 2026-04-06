from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.models.user import User, RoleEnum
from app.models.audit_log import AuditLog
from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.config import settings
from app.api.deps import get_current_user
import uuid

router = APIRouter()

async def log_action(db: AsyncSession, action: str, ip: str, user_id=None, details=None):
    """Helper to record audit logs for critical auth actions."""
    audit_log = AuditLog(user_id=user_id, action=action, ip_address=ip, details=details)
    db.add(audit_log)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: Request, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user context (defaults to VIEWER)."""
    # Defensive check: if users exist, make sure we only allow first to be ADMIN? 
    # For now, it's just raw registration logic
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_pwd,
        role=RoleEnum.VIEWER # Start as viewer
    )
    
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        # Log successful registration
        await log_action(db, "USER_REGISTERED", request.client.host, new_user.id)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    response: Response, 
    login_data: UserLogin, 
    db: AsyncSession = Depends(get_db)  
):
    """
    Authenticates user and returns an Access Token in JSON, 
    while setting a Refresh Token inside an HttpOnly cookie.
    """
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        # We don't distinguish between wrong password and wrong username internally for security reasons (username enumeration defense)
        if user:
            await log_action(db, "LOGIN_FAILED_BAD_PASSWORD", request.client.host, user.id)
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Set refresh token as heavily secured HttpOnly cookie avoiding XSS.
    # SameSite=Lax (or Strict) to mitigate CSRF natively.
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth/refresh"
    )

    await log_action(db, "LOGIN_SUCCESS", request.client.host, user.id)
    await db.commit()

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Validates the HttpOnly Refresh Token and issues a new Access Token."""
    # Obtain refresh token specifically from Cookies
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        # Decode token and verify type
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Generate a fresh Access Token
    access_token = create_access_token(subject=user.id)

    # Optional security: Rotate refresh token on use
    # new_refresh_token = create_refresh_token(subject=user.id)
    # response.set_cookie(...)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Deletes the HttpOnly refresh token cookie to complete client logout."""
    # Note: On client side, they should drop the access token from their memory.
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth/refresh",
        secure=settings.ENVIRONMENT == "production",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user
