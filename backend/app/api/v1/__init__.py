from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.subjects import router as subjects_router
from app.api.v1.materials import router as materials_router
from app.api.v1.topics import router as topics_router
from app.api.v1.past_papers import router as past_papers_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.diagnosis import router as diagnosis_router
from app.api.v1.planning import router as planning_router
from app.api.v1.progress import router as progress_router
from app.api.v1.tutor import router as tutor_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(subjects_router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(materials_router, tags=["Materials"])
api_router.include_router(topics_router, tags=["Topics"])
api_router.include_router(past_papers_router, tags=["Past Papers"])
api_router.include_router(quizzes_router, tags=["Assessments"])
api_router.include_router(diagnosis_router, tags=["Diagnostic Engine"])
api_router.include_router(planning_router, tags=["Adaptive Revision Planner"])
api_router.include_router(progress_router, tags=["Progress & Analytics"])
api_router.include_router(tutor_router, tags=["AI Tutor"])
