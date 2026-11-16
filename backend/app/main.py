from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models
from app.api.v1 import api_router

# Ensure tables are initialized
Base.metadata.create_all(bind=engine)

def ensure_demo_user():
    from app.core.database import SessionLocal
    from app.core.security import get_password_hash
    from app.models.all_models import User, Subject
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == settings.DEMO_EMAIL).first()
        if not demo_user:
            demo_user = User(
                email=settings.DEMO_EMAIL,
                hashed_password=get_password_hash(settings.DEMO_PASSWORD),
                full_name="Alex Chen (Demo Student)",
                role="student",
                interests=["Molecular Biology", "Cell Division", "Genetics"],
                level="Intermediate",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Also create an initial demo subject so the dashboard is populated
            demo_subj = Subject(
                user_id=demo_user.id,
                name="Cellular Biology",
                code="BIO-301",
                description="Comprehensive academic study of cell structure, mitosis, meiosis, and molecular regulatory pathways.",
                daily_study_hours=2.0,
            )
            db.add(demo_subj)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Demo user auto-init notice: {e}")
    finally:
        db.close()

# Auto-seed on server startup
ensure_demo_user()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="GapFinder AI: Academic Diagnostic Engine & Adaptive Revision Planner",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER,
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": "Find What You Don't Know.",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "api_v1": settings.API_V1_STR,
    }
