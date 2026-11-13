from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

import models
from database import get_db
from deps import get_current_admin_user

router = APIRouter(
    prefix="/api/admin/users",
    tags=["Admin Users"]
)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    auth_provider: str
    status: str
    profile_image: str | None
    last_login: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    role: str | None = None
    status: str | None = None

@router.get("", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    users = db.query(models.User).all()
    return users

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, request: UserUpdateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent admin from disabling themselves to avoid lockout
    if user.id == current_user.id and request.status == "disabled":
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
        
    if request.role is not None:
        user.role = request.role
    if request.status is not None:
        user.status = request.status
        
    db.commit()
    db.refresh(user)
    return user
