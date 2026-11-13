import os
from datetime import datetime, timedelta
import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

import models
from database import get_db
from deps import JWT_SECRET, ALGORITHM

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

class GoogleAuthRequest(BaseModel):
    credential: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: dict

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/google", response_model=AuthResponse)
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google credential
        if GOOGLE_CLIENT_ID:
            idinfo = id_token.verify_oauth2_token(request.credential, requests.Request(), GOOGLE_CLIENT_ID)
        else:
            # Fallback if env variable isn't set perfectly, for testing. In prod it should be verified with Client ID.
            idinfo = id_token.verify_oauth2_token(request.credential, requests.Request())
            
        email = idinfo.get("email")
        google_id = idinfo.get("sub")
        name = idinfo.get("name", "Unknown")
        profile_image = idinfo.get("picture", "")
        email_verified = idinfo.get("email_verified", False)
        
        if not email_verified:
            raise HTTPException(status_code=400, detail="Email not verified by Google")
            
        # 1. Match by google_id first
        user = db.query(models.User).filter(models.User.google_id == google_id).first()
        
        # 2. If not found by google_id, try to match by email (account linking)
        if not user:
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                # Link account
                user.google_id = google_id
                user.auth_provider = "google"
                if profile_image and not user.profile_image:
                    user.profile_image = profile_image
        
        # 3. If still not found, create new user
        if not user:
            user = models.User(
                email=email,
                name=name,
                google_id=google_id,
                auth_provider="google",
                profile_image=profile_image,
                role="customer",  # Default safe role
                status="active",   # Or pending if you prefer approval
                password_hash=None
            )
            db.add(user)
            db.flush() # get ID
            
        # Check if disabled
        if user.status != "active":
            raise HTTPException(status_code=403, detail="Your account is disabled or pending.")
            
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        # Create JWT
        access_token = create_access_token(data={"sub": str(user.id)})
        
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "profileImage": user.profile_image,
            "status": user.status,
            "authProvider": user.auth_provider
        }
        
        return AuthResponse(success=True, token=access_token, user=user_data)
        
    except ValueError as e:
        # Invalid token
        print(f"Google Token error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/login", response_model=AuthResponse)
def login_basic(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Your account is disabled or pending.")
        
    if not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create JWT
    access_token = create_access_token(data={"sub": str(user.id)})
    
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "profileImage": user.profile_image,
        "status": user.status,
        "authProvider": user.auth_provider
    }
    
    return AuthResponse(success=True, token=access_token, user=user_data)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    allowed_roles = ["admin", "inventory_manager", "accountant", "supplier"]
    if request.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role selected")
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")
    password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    status = "pending" if request.role == "admin" else "active"
    new_user = models.User(
        name=request.name, email=request.email, password_hash=password_hash,
        role=request.role, auth_provider="local", status=status, profile_image=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    if status == "pending":
        raise HTTPException(status_code=202, detail="Account created! Admin role requires approval. You'll be notified once approved.")
    access_token = create_access_token(data={"sub": str(new_user.id)})
    user_data = {
        "id": new_user.id, "name": new_user.name, "email": new_user.email,
        "role": new_user.role, "profileImage": new_user.profile_image,
        "status": new_user.status, "authProvider": new_user.auth_provider
    }
    return AuthResponse(success=True, token=access_token, user=user_data)


# ─── Forgot Password ──────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def create_reset_token(email: str) -> str:
    """Create a short-lived 30-minute JWT reset token."""
    expire = datetime.utcnow() + timedelta(minutes=30)
    return jwt.encode({"sub": email, "purpose": "password_reset", "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always respond with the same generic message to prevent email enumeration
    user = db.query(models.User).filter(models.User.email == request.email).first()

    if user and user.auth_provider != "google":
        # Only send reset for local accounts (Google users don't have passwords)
        reset_token = create_reset_token(user.email)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8443")
        reset_link = f"{frontend_url}/?reset_token={reset_token}"

        subject = "🔐 InventoryIQ — Reset Your Password"
        body = f"""Hello {user.name},

We received a request to reset the password for your InventoryIQ account.

Click the link below to set a new password. This link expires in 30 minutes.

👉 Reset your password:
{reset_link}

If you did NOT request this, you can safely ignore this email. Your password will not change.

— The InventoryIQ Team
inventoryiq.ai
"""
        from email_service import send_alert_email
        send_alert_email(subject, body, to_email=user.email)

    # Always return success (security: don't reveal if email exists)
    return {"success": True, "message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        email = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or tampered reset token.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.auth_provider == "google":
        raise HTTPException(status_code=400, detail="This account uses Google sign-in. Password reset is not applicable.")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    return {"success": True, "message": "Password updated successfully. You can now sign in."}


# ─── Profile Update ───────────────────────────────────────────────────────────

from deps import get_current_user

class ProfileUpdateBody(BaseModel):
    name: str | None = None
    phone: str | None = None
    department: str | None = None

@router.put("/profile")
def update_my_profile(
    body: ProfileUpdateBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if body.name is not None:
        current_user.name = body.name
    if hasattr(current_user, 'phone') and body.phone is not None:
        current_user.phone = body.phone
    if hasattr(current_user, 'department') and body.department is not None:
        current_user.department = body.department
    db.commit()
    db.refresh(current_user)
    return {"success": True, "name": current_user.name}


# ─── Change Password (in-app) ─────────────────────────────────────────────────

class ChangePasswordBody(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password_inapp(
    body: ChangePasswordBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.auth_provider == "google":
        raise HTTPException(status_code=400, detail="Google accounts don't use passwords.")
    if not current_user.password_hash or not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    current_user.password_hash = bcrypt.hashpw(body.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    return {"success": True, "message": "Password changed successfully."}
