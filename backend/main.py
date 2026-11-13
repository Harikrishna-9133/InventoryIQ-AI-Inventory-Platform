from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()  # Load .env before anything else

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from routers.ai_alerts import reorder_alerts
from sqlalchemy import text

from database import engine, Base
import models

from routers.product import router as product_router
from routers.ai_forecast import router as ai_forecast_router
from routers.ai_decision import router as ai_decision_router
from routers.ai_dashboard import router as ai_dashboard_router
from routers.ai_alerts import router as ai_alerts_router
from routers.ai_purchase_order import router as ai_purchase_order_router
from routers.ai_purchase_draft import router as ai_purchase_draft_router
from routers.ai_purchase_create import router as ai_purchase_create_router
from routers.advanced_analytics import router as advanced_analytics_router
from routers.ai_insights import router as ai_insights_router
from routers.customer import router as customer_router
from routers.supplier import router as supplier_router
from routers.warehouse import router as warehouse_router
from routers.inventory import router as inventory_router
from routers.sale import router as sale_router
from routers.purchase_order import router as purchase_order_router
from routers.analytics import router as analytics_router
from routers.auth import router as auth_router
from routers.admin_users import router as admin_users_router
from routers.category import router as category_router



app = FastAPI(
    title="Inventory Intelligence API",
    description="AI-powered multi-customer inventory management system",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://inventory-iq-ai-inventory-platform.vercel.app",
        "https://inventory-iq-ai-inventory-platform-21ae7k7jr-range5.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


# Register API routers
app.include_router(product_router)
app.include_router(ai_forecast_router)
app.include_router(ai_decision_router)
app.include_router(ai_dashboard_router)
app.include_router(ai_alerts_router)
app.include_router(ai_purchase_order_router)
app.include_router(ai_purchase_draft_router)
app.include_router(ai_purchase_create_router)
app.include_router(advanced_analytics_router)
app.include_router(ai_insights_router)
app.include_router(customer_router)
app.include_router(supplier_router)
app.include_router(warehouse_router)
app.include_router(inventory_router)
app.include_router(sale_router)
app.include_router(purchase_order_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(admin_users_router)
app.include_router(category_router)



# Initialize Background Scheduler
scheduler = BackgroundScheduler()

@app.on_event("startup")
def startup_event():
    # Schedule the AI Inventory Check and Email Alerts every 6 hours
    scheduler.add_job(reorder_alerts, "interval", hours=6)
    scheduler.start()
    print("Background scheduler started: AI alerts scheduled every 6 hours.")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("Background scheduler shutdown.")

@app.get("/")
def root():
    return {
        "message": "Inventory Intelligence API is running",
        "version": "1.0.0"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("SELECT version()")
            )

            version = result.scalar()

        return {
            "status": "success",
            "message": "PostgreSQL connected successfully!",
            "database_version": version
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }