from pydantic import BaseModel, Field
from typing import List, Optional

class PredictionItem(BaseModel):
    label: str
    confidence: float

class Nutrition(BaseModel):
    kcal: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None

class PredictSingleResponse(BaseModel):
    scan_id: str
    needs_user: bool
    top_k: List[PredictionItem]
    chosen: Optional[PredictionItem] = None
    nutrition: Optional[Nutrition] = None
    message: Optional[str] = None

class FeedbackSingleRequest(BaseModel):
    scan_id: str
    chosen_label: str = Field(..., description="User-confirmed label")
    raw_text: Optional[str] = None
