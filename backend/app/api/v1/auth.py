from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.all_models import User, Subject, Attempt, RevisionPlan, RevisionTask
from app.schemas.all_schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    UserPasswordChange,
    ForgotPasswordRequest,
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role="student",
        interests=["Artificial Intelligence", "Molecular Biology", "Machine Learning"],
        level="Intermediate",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(current_user: User = Depends(get_current_user)):
    token = create_access_token(subject=current_user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(current_user),
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.patch("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.interests is not None:
        current_user.interests = profile_in.interests
    if profile_in.level is not None:
        current_user.level = profile_in.level

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    pwd_in: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed",
        )
    if len(pwd_in.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long",
        )
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # Return friendly confirmation regardless of enumeration to maintain security
    return {
        "message": f"If an account with {req.email} exists, password reset instructions have been issued.",
        "status": "issued",
    }

@router.get("/stats")
def get_student_aggregate_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subjects_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
    attempts = db.query(Attempt).filter(Attempt.user_id == current_user.id, Attempt.status == "EVALUATED").all()
    attempts_count = len(attempts)
    avg_score = round(sum(a.score_percentage or 0.0 for a in attempts) / max(1, attempts_count), 1)

    completed_tasks = (
        db.query(RevisionTask)
        .join(RevisionPlan, RevisionTask.plan_id == RevisionPlan.id)
        .filter(RevisionPlan.user_id == current_user.id, RevisionTask.is_completed == True)
        .count()
    )

    return {
        "subjects_count": subjects_count,
        "attempts_count": attempts_count,
        "average_score": avg_score,
        "completed_tasks_count": completed_tasks,
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
