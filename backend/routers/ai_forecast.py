from fastapi import APIRouter, HTTPException
from pathlib import Path
import sys

# Make backend directory available for imports
BASE_DIR = Path(__file__).resolve().parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ai.forecast import forecast_demand


router = APIRouter(
    prefix="/ai",
    tags=["AI Forecasting"]
)


@router.get("/forecast")
def get_demand_forecast(days: int = 7):

    if days < 1:
        raise HTTPException(
            status_code=400,
            detail="Days must be greater than 0"
        )

    if days > 30:
        raise HTTPException(
            status_code=400,
            detail="Maximum forecast period is 30 days"
        )

    try:

        predictions = forecast_demand(days)

        return {
            "status": "success",
            "forecast_days": days,
            "predictions": [
                {
                    "day": index + 1,
                    "predicted_demand": round(
                        float(prediction),
                        2
                    )
                }

                for index, prediction in enumerate(predictions)
            ],

            "total_predicted_demand": round(
                float(sum(predictions)),
                2
            ),

            "average_daily_demand": round(
                float(sum(predictions) / len(predictions)),
                2
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {str(e)}"
        )