import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.connection import init_db, ping_db
from app.modules.news.router import router as news_router
from app.modules.news.scheduler import run_daily_news_collector
from app.modules.schedules.router import router as schedules_router
from app.modules.team_members.router import router as team_members_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(team_members_router, prefix="/api")
app.include_router(schedules_router, prefix="/api")
app.include_router(news_router, prefix="/api")


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    if not hasattr(app.state, "news_collector_task"):
        app.state.news_collector_task = asyncio.create_task(run_daily_news_collector())


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/api/system/status")
def system_status() -> dict[str, object]:
    database_status = ping_db()
    return {
        "api": {"status": "ok"},
        "database": {
            "status": database_status,
            "path": str(settings.database_path),
        },
        "features": ["team_members", "schedules", "excel_jobs", "complaints", "news", "audit"],
    }