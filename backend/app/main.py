from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.websockets import router as ws_router
from app.api.routes import auth, iocs, cves, admin, feeds, enrich, mitre, alerts, reports

def get_application() -> FastAPI:
    """Sets up FastAPI backend application with initial routes and middleware."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        description="Core API for ThreatLens Intelligence Platform",
        version="1.0.0",
    )

    # CORS Middleware handles frontend cross-origin preflight requests securely.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True, # Critical for allowing `httpOnly` cookies over CORS
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
    app.include_router(iocs.router, prefix=f"{settings.API_V1_STR}/iocs", tags=["iocs"])
    app.include_router(cves.router, prefix=f"{settings.API_V1_STR}/cves", tags=["cves"])
    app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
    app.include_router(feeds.router, prefix=f"{settings.API_V1_STR}/feeds", tags=["feeds"])
    app.include_router(enrich.router, prefix=f"{settings.API_V1_STR}/enrich", tags=["enrichment"])
    app.include_router(mitre.router, prefix=f"{settings.API_V1_STR}/mitre", tags=["mitre"])
    app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
    app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
    app.include_router(ws_router, prefix=f"{settings.API_V1_STR}/ws", tags=["websocket"])

    @app.on_event("startup")
    async def startup_event():
        from app.worker.collectors.mitre_collector import seed_mitre_if_empty
        import asyncio
        asyncio.create_task(seed_mitre_if_empty())

    @app.get("/api/docs", include_in_schema=False)
    async def docs_redirect():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{settings.API_V1_STR}/docs")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app

app = get_application()
