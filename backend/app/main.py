import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.database.connection import engine, Base
from backend.app.api import auth, users, machines, diagnostic, llm, reports, dashboard
from backend.app.sample_data.seed import seed_database
from backend.app.database.connection import SessionLocal
from backend.app.models.models import User

app = FastAPI(
    title="Plug-and-Play Industrial Machine Diagnostic System API",
    description="Enterprise API supporting configuration differential checking, automated diagnostics, and AI root cause analysis.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory to serve generated PDF reports
os.makedirs("backend/static/reports", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Startup database initialization and seeding
@app.on_event("startup")
def startup_event():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if database is empty
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Database is empty. Running auto-seeding...")
            seed_database()
        else:
            print("Database already initialized with records.")
    except Exception as e:
        print(f"Error on startup database check: {e}")
    finally:
        db.close()

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(machines.router, prefix="/api")
app.include_router(diagnostic.router, prefix="/api")
app.include_router(llm.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Caterpillar Industrial Diagnostics Portal API",
        "documentation": "/docs"
    }
