"""
Bitewise API – v0.4
Production-ready food tracking & AI nutrition assistant
"""

import os
import re
import json
import uuid
import shutil
import hashlib
import math
import cv2
import numpy as np
import httpx
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Optional
from pyzbar.pyzbar import decode

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db import Base, engine, get_db, UPLOADS_DIR, SEED_TRAIN_DIR
from app.models import Scan, Prediction, UserLabel, User, UserGoal, MealLog
from app.schemas import FeedbackSingleRequest, Nutrition
from app.nutrition.search import search_food
from app.ocr.label_reader import extract_text_from_image
from app.ocr.parser import extract_nutrition
from app.storage.ml.classifier.inference import predict_image
from app.storage.ml.detector.detect_foods import detect_foods
from sqlalchemy import select, func, text  # Already there, just verify
# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Bitewise API", version="0.4")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
Base.metadata.create_all(bind=engine)
SEED_TRAIN_DIR.mkdir(parents=True, exist_ok=True)

# Ensure role column exists
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"))
        conn.commit()
except Exception:
    pass  # Column already exists

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

FORCE_CONFIRM_BELOW = 0.60

# ─────────────────────────────────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def _hash_password(pw: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(pw.encode()).hexdigest()

def _get_user_role(user: User) -> str:
    """Safely get user role"""
    try:
        return user.role or "user"
    except Exception:
        return "user"

def _get_current_user(x_user_id: str = Header(...), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user id")
    return user

def _require_moderator(current_user: User = Depends(_get_current_user)) -> User:
    """Require moderator role"""
    if _get_user_role(current_user) != "moderator":
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user

def _get_or_create_goals(user_id: str, db: Session) -> UserGoal:
    """Get or create user nutrition goals"""
    goals = db.query(UserGoal).filter(UserGoal.user_id == user_id).first()
    if not goals:
        goals = UserGoal(user_id=user_id)
        db.add(goals)
        db.commit()
        db.refresh(goals)
    return goals

# ─────────────────────────────────────────────────────────────────────────────
# FILE SERVING
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve uploaded images"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/octet-stream")

# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
async def register(payload: dict, db: Session = Depends(get_db)):
    """Register new user"""
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    name = payload.get("name", "").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=email, name=name, password_hash=_hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    _get_or_create_goals(user.id, db)

    role = _get_user_role(user)
    return {"user_id": user.id, "email": user.email, "name": user.name, "role": role}


@app.post("/auth/login")
async def login(payload: dict, db: Session = Depends(get_db)):
    """Login user"""
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    user = db.query(User).filter(User.email == email).first()
    if not user or user.password_hash != _hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = _get_user_role(user)
    return {"user_id": user.id, "email": user.email, "name": user.name, "role": role}

# ─────────────────────────────────────────────────────────────────────────────
# USER PROFILE
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/users/me")
def get_profile(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get user profile"""
    goals = _get_or_create_goals(current_user.id, db)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": _get_user_role(current_user),
        "goals": {
            "calories": goals.calorie_goal,
            "protein": goals.protein_goal,
            "carbs": goals.carbs_goal,
            "fat": goals.fat_goal,
            "fiber": goals.fiber_goal,
        },
    }

@app.put("/users/me")
def update_profile(payload: dict, current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Update user profile"""
    if "name" in payload:
        current_user.name = payload["name"]
    db.commit()
    return {"ok": True, "name": current_user.name}

# ─────────────────────────────────────────────────────────────────────────────
# NUTRITION GOALS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/users/me/goals")
def get_goals(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get user nutrition goals"""
    goals = _get_or_create_goals(current_user.id, db)
    return {
        "calories": goals.calorie_goal,
        "protein": goals.protein_goal,
        "carbs": goals.carbs_goal,
        "fat": goals.fat_goal,
        "fiber": goals.fiber_goal,
    }

@app.put("/users/me/goals")
def update_goals(payload: dict, current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Update user nutrition goals"""
    goals = _get_or_create_goals(current_user.id, db)
    if "calories" in payload:
        goals.calorie_goal = int(payload["calories"])
    if "protein" in payload:
        goals.protein_goal = int(payload["protein"])
    if "carbs" in payload:
        goals.carbs_goal = int(payload["carbs"])
    if "fat" in payload:
        goals.fat_goal = int(payload["fat"])
    if "fiber" in payload:
        goals.fiber_goal = int(payload["fiber"])
    db.commit()
    return {"ok": True}

# ─────────────────────────────────────────────────────────────────────────────
# MEAL LOGGING
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/meals/log")
def log_meal(payload: dict, current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Log a meal"""
    print(f"DEBUG: Logging meal for user {current_user.id}")
    print(f"DEBUG: Payload: {payload}")
    
    try:
        meal = MealLog(
            user_id=current_user.id,
            scan_id=payload.get("scan_id"),
            meal_type=payload.get("meal_type", "meal"),
            food_name=payload.get("food_name", "Unknown"),
            quantity_g=float(payload.get("quantity_g", 100)),
            calories=float(payload.get("calories", 0)),
            protein=float(payload.get("protein", 0)),
            carbs=float(payload.get("carbs", 0)),
            fat=float(payload.get("fat", 0)),
            fiber=float(payload.get("fiber", 0)),
            image_url=payload.get("image_url"),
        )
        db.add(meal)
        db.commit()
        db.refresh(meal)
        
        print(f"DEBUG: Meal saved! ID={meal.id}, food={meal.food_name}, calories={meal.calories}")
        return {"ok": True, "meal_id": meal.id}
    
    except Exception as e:
        print(f"ERROR: Failed to log meal: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: str, current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Delete a meal"""
    meal = db.query(MealLog).filter(
        MealLog.id == meal_id,
        MealLog.user_id == current_user.id
    ).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"ok": True}

@app.get("/meals/today")
def get_today(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get today's meals and nutrition"""
    today_start = datetime.combine(date.today(), datetime.min.time())
    meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= today_start
    ).order_by(MealLog.logged_at.asc()).all()

    totals = {
        "calories": sum(m.calories for m in meals),
        "protein": sum(m.protein for m in meals),
        "carbs": sum(m.carbs for m in meals),
        "fat": sum(m.fat for m in meals),
        "fiber": sum(m.fiber for m in meals),
    }
    goals = _get_or_create_goals(current_user.id, db)
    return {
        "date": date.today().isoformat(),
        "totals": totals,
        "goals": {
            "calories": goals.calorie_goal,
            "protein": goals.protein_goal,
            "carbs": goals.carbs_goal,
            "fat": goals.fat_goal,
            "fiber": goals.fiber_goal,
        },
        "meals": [
            {
                "id": m.id,
                "food_name": m.food_name,
                "meal_type": m.meal_type,
                "quantity_g": m.quantity_g,
                "calories": m.calories,
                "protein": m.protein,
                "carbs": m.carbs,
                "fat": m.fat,
                "fiber": m.fiber,
                "image_url": m.image_url,
                "logged_at": m.logged_at.isoformat(),
            }
            for m in meals
        ],
    }

@app.get("/meals/history")
def get_history(days: int = 7, current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get meal history"""
    since = datetime.combine(date.today() - timedelta(days=days - 1), datetime.min.time())
    meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= since
    ).order_by(MealLog.logged_at.desc()).all()
    return [
        {
            "id": m.id,
            "food_name": m.food_name,
            "meal_type": m.meal_type,
            "quantity_g": m.quantity_g,
            "calories": m.calories,
            "protein": m.protein,
            "carbs": m.carbs,
            "fat": m.fat,
            "fiber": m.fiber,
            "image_url": m.image_url,
            "logged_at": m.logged_at.isoformat(),
        }
        for m in meals
    ]

@app.get("/meals/weekly")
def get_weekly(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get weekly meal summary"""
    result = []
    for offset in range(6, -1, -1):
        day = date.today() - timedelta(days=offset)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        meals = db.query(MealLog).filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at >= day_start,
            MealLog.logged_at <= day_end,
        ).all()
        result.append({
            "day": day.strftime("%a"),
            "date": day.isoformat(),
            "value": round(sum(m.calories for m in meals)),
        })
    return result

@app.get("/meals/streak")
def get_streak(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get user's logging streak"""
    streak = 0
    check_date = date.today()
    while True:
        day_start = datetime.combine(check_date, datetime.min.time())
        day_end = datetime.combine(check_date, datetime.max.time())
        count = db.query(MealLog).filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at >= day_start,
            MealLog.logged_at <= day_end,
        ).count()
        if count == 0:
            break
        streak += 1
        check_date -= timedelta(days=1)
    return {"streak": streak}

# ─────────────────────────────────────────────────────────────────────────────
# ACHIEVEMENTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/achievements")
async def get_achievements(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get user achievements and progress"""
    from datetime import timedelta
    
    # Get meal data
    today_start = datetime.combine(date.today(), datetime.min.time())
    since_30 = datetime.combine(date.today() - timedelta(days=29), datetime.min.time())
    
    today_meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= today_start
    ).all()
    
    month_meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= since_30
    ).all()
    
    # Get streak
    streak = 0
    check_date = date.today()
    while True:
        day_start = datetime.combine(check_date, datetime.min.time())
        day_end = datetime.combine(check_date, datetime.max.time())
        count = db.query(MealLog).filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at >= day_start,
            MealLog.logged_at <= day_end,
        ).count()
        if count == 0:
            break
        streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate achievements
    total_meals = len(month_meals)
    goals = _get_or_create_goals(current_user.id, db)
    
    # Count days with goals met
    days_goal_met = 0
    for offset in range(30):
        day = date.today() - timedelta(days=offset)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        meals = db.query(MealLog).filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at >= day_start,
            MealLog.logged_at <= day_end,
        ).all()
        
        if meals:
            cal_total = sum(m.calories for m in meals)
            if cal_total <= goals.calorie_goal:
                days_goal_met += 1
    
    # Get unique days with meals
    unique_days = set()
    for meal in month_meals:
        unique_days.add(meal.logged_at.date())
    
    # Define achievements
    achievements_data = [
        {
            "id": "week_warrior",
            "icon": "🔥",
            "title": "Week Warrior",
            "description": "Logged meals for 7 consecutive days",
            "unlocked": streak >= 7,
        },
        {
            "id": "protein_pro",
            "icon": "💪",
            "title": "Protein Pro",
            "description": "Reached protein goal 5 days in a row",
            "unlocked": streak >= 5,
        },
        {
            "id": "goal_getter",
            "icon": "🎯",
            "title": "Goal Getter",
            "description": "Stayed within calorie target for 10 days",
            "unlocked": days_goal_met >= 10,
        },
        {
            "id": "scanner_master",
            "icon": "📸",
            "title": "Scanner Master",
            "description": "Scanned 50 meals",
            "unlocked": total_meals >= 50,
        },
        {
            "id": "balanced_life",
            "icon": "🥗",
            "title": "Balanced Life",
            "description": "Maintained balanced macros for 14 days",
            "unlocked": streak >= 14,
        },
        {
            "id": "century_club",
            "icon": "⭐",
            "title": "Century Club",
            "description": "Logged 100 meals",
            "unlocked": total_meals >= 100,
        },
        {
            "id": "consistency_king",
            "icon": "🏆",
            "title": "Consistency King",
            "description": "30 day streak",
            "unlocked": streak >= 30,
        },
        {
            "id": "nutrition_expert",
            "icon": "🌟",
            "title": "Nutrition Expert",
            "description": "Reached all daily goals for 30 days",
            "unlocked": days_goal_met >= 30,
        },
    ]
    
    # Count stats
    unlocked_count = sum(1 for a in achievements_data if a["unlocked"])
    
    return {
        "achievements": achievements_data,
        "stats": {
            "totalMealsLogged": total_meals,
            "daysActive": len(unique_days),
            "goalsAchieved": days_goal_met,
            "achievementsUnlocked": unlocked_count,
            "currentStreak": streak,
        },
    }
# ─────────────────────────────────────────────────────────────────────────────
# STATIC PAGES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def home():
    """API home page"""
    return """<html><body><h1>Bitewise API v0.4</h1><p>Food tracking & AI nutrition assistant</p></body></html>"""

# ─────────────────────────────────────────────────────────────────────────────
# FOOD PREDICTION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    mode: str = Form(...),
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(default=None),
):
    """Predict food from image (single or multi-food)"""
    scan_id = str(uuid.uuid4())
    ext = Path(image.filename).suffix or ".jpg"
    save_path = UPLOADS_DIR / f"{scan_id}{ext}"
    content = await image.read()
    save_path.write_bytes(content)

    scan = Scan(id=scan_id, mode=mode, image_path=str(save_path), user_id=x_user_id)
    db.add(scan)
    db.commit()

    if mode == "single":
        top_k = predict_image(str(save_path), topk=5)
        # BUG FIX 1: Clean NaN confidence values
        top_k = [
            {
                "label": t["label"],
                "confidence": 0.0 if (isinstance(t["confidence"], float) and math.isnan(t["confidence"])) else float(t["confidence"]),
            }
            for t in top_k
        ]
        chosen = top_k[0]

        pred = Prediction(
            scan_id=scan_id,
            model_type="classifier",
            predicted_label=chosen["label"],
            confidence=chosen["confidence"],
            bbox_json=None,
            status="needs_user",
        )
        db.add(pred)
        db.commit()

        nutrition_results = search_food(chosen["label"], limit=1)
        nutr = None
        if nutrition_results:
            best = nutrition_results[0]["nutrition"]
            nutr = {
                "kcal": best.get("kcal_100g"),
                "protein": best.get("protein_100g"),
                "carbs": best.get("carbs_100g"),
                "fat": best.get("fat_100g"),
            }

        return {
            "mode": "single",
            "scan_id": scan_id,
            "needs_user": chosen["confidence"] < FORCE_CONFIRM_BELOW,
            "top_k": top_k,
            "nutrition": nutr,
            "image_url": f"/uploads/{scan_id}{ext}",
        }

    if mode == "multi":
        detected = detect_foods(str(save_path))
        if not detected:
            return {
                "mode": "multi",
                "scan_id": scan_id,
                "message": "No food items detected.",
                "items": [],
            }

        items = []
        for food in detected:
            top_k = predict_image(food["crop_path"], topk=3)
            # BUG FIX 2: Clean NaN confidence values
            top_k = [
                {
                    "label": t["label"],
                    "confidence": 0.0 if (isinstance(t["confidence"], float) and math.isnan(t["confidence"])) else float(t["confidence"]),
                }
                for t in top_k
            ]
            chosen = top_k[0]
            pred = Prediction(
                scan_id=scan_id,
                model_type="detector+classifier",
                predicted_label=chosen["label"],
                confidence=chosen["confidence"],
                bbox_json=json.dumps(food["bbox"]),
                status="needs_user",
            )
            db.add(pred)
            nutrition_results = search_food(chosen["label"], limit=1)
            nutr = None
            if nutrition_results:
                best = nutrition_results[0]["nutrition"]
                nutr = {
                    "kcal": best.get("kcal_100g"),
                    "protein": best.get("protein_100g"),
                    "carbs": best.get("carbs_100g"),
                    "fat": best.get("fat_100g"),
                }
            items.append({"bbox": food["bbox"], "top_k": top_k, "nutrition": nutr})

        db.commit()
        return {
            "mode": "multi",
            "scan_id": scan_id,
            "items": items,
            "image_url": f"/uploads/{scan_id}{ext}",
        }

# ─────────────────────────────────────────────────────────────────────────────
# FEEDBACK & LABELS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/feedback/single")
def feedback_single(payload: FeedbackSingleRequest, db: Session = Depends(get_db)):
    """Send feedback on predicted label"""
    pred = db.query(Prediction).filter(Prediction.scan_id == payload.scan_id).first()
    if not pred:
        return {"error": "Prediction not found"}

    top1_label = pred.predicted_label.strip().lower()
    user_label = payload.chosen_label.strip().lower()

    # User confirmed top-1
    if payload.raw_text is None and user_label == top1_label:
        pred.status = "auto_confirmed"
        db.commit()
        return {
            "ok": True,
            "message": "Top-1 confirmed.",
            "is_new_candidate": False,
            "label": user_label,
        }

    # Check if in top-5
    scan = db.query(Scan).filter(Scan.id == payload.scan_id).first()
    top_k_labels = []
    if scan:
        try:
            top_k_results = predict_image(scan.image_path, topk=5)
            top_k_labels = [r["label"].strip().lower() for r in top_k_results]
        except Exception:
            pass

    # User picked from top-5
    if payload.raw_text is None and user_label in top_k_labels:
        pred.status = "user_confirmed"
        pred.predicted_label = user_label
        db.commit()
        return {
            "ok": True,
            "label": user_label,
            "message": "Top-5 correction confirmed.",
            "is_new_candidate": False,
        }

    # New candidate for moderator
    ul = UserLabel(
        scan_id=payload.scan_id,
        label=user_label,
        raw_text=payload.raw_text,
        is_new_candidate=True,
    )
    db.add(ul)
    pred.status = "pending_moderator"
    pred.predicted_label = user_label
    db.commit()
    return {
        "ok": True,
        "label": user_label,
        "message": "New label sent to moderator for approval.",
        "is_new_candidate": True,
    }

# ─────────────────────────────────────────────────────────────────────────────
# BARCODE LOOKUP
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/barcode/{code}")
async def barcode_lookup(code: str):
    """Look up product from barcode (OpenFoodFacts)"""
    urls = [
        f"https://world.openfoodfacts.org/api/v0/product/{code}.json",
        f"https://in.openfoodfacts.org/api/v0/product/{code}.json",
    ]
    data = None
    async with httpx.AsyncClient(timeout=8) as client:
        for url in urls:
            try:
                r = await client.get(url)
                if r.status_code == 200:
                    j = r.json()
                    if j.get("status") == 1:
                        data = j
                        break
            except httpx.RequestError:
                continue

    if data is None:
        return {"error": "Product not found", "not_found": True}

    product = data["product"]
    nutriments = product.get("nutriments", {})
    serving_grams = None
    serving_size_raw = product.get("serving_size", "")
    if serving_size_raw:
        m = re.search(
            r"(\d+(?:\.\d+)?)\s*(?:g|grams?)",
            serving_size_raw,
            re.IGNORECASE,
        )
        if m:
            serving_grams = float(m.group(1))

    return {
        "name": product.get("product_name", "Unknown"),
        "brand": product.get("brands", "Unknown"),
        "calories": nutriments.get("energy-kcal_100g")
        or nutriments.get("energy-kcal")
        or 0,
        "protein": nutriments.get("proteins_100g") or nutriments.get("proteins") or 0,
        "carbs": nutriments.get("carbohydrates_100g")
        or nutriments.get("carbohydrates")
        or 0,
        "fat": nutriments.get("fat_100g") or nutriments.get("fat") or 0,
        "serving_grams": serving_grams,
        "not_found": False,
    }

@app.post("/scan-barcode")
async def scan_barcode(image: UploadFile = File(...)):
    """Detect and decode barcode with preprocessing"""
    try:
        file_bytes = await image.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image"}
        
        # Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        # Try original
        barcodes = decode(gray)
        if barcodes:
            return {"barcode": barcodes[0].data.decode("utf-8")}
        
        # Try upscaled
        upscaled = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        barcodes = decode(upscaled)
        if barcodes:
            return {"barcode": barcodes[0].data.decode("utf-8")}
        
        # Try enhanced contrast
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        barcodes = decode(enhanced)
        if barcodes:
            return {"barcode": barcodes[0].data.decode("utf-8")}
        
        # Try binary threshold
        _, binary = cv2.threshold(enhanced, 100, 255, cv2.THRESH_BINARY)
        barcodes = decode(binary)
        if barcodes:
            return {"barcode": barcodes[0].data.decode("utf-8")}
        
        return {"error": "Barcode not detected - try clearer image"}
    
    except Exception as e:
        print(f"ERROR: {e}")
        return {"error": "Barcode processing failed"}
# ─────────────────────────────────────────────────────────────────────────────
# NUTRITION SEARCH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/nutrition/search")
async def nutrition_search(q: str, limit: int = 5):
    """Search nutrition database"""
    if not q or len(q.strip()) < 2:
        return {"results": []}
    results = search_food(q.strip(), limit=limit)
    return {"results": results}

# ─────────────────────────────────────────────────────────────────────────────
# MODERATOR DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/admin/new-candidates")
def get_new_candidates(
    current_user: User = Depends(_require_moderator),
    db: Session = Depends(get_db),
):
    """Get pending new food labels for moderation"""
    results = db.query(UserLabel).filter(UserLabel.is_new_candidate == True).all()
    output = []
    for r in results:
        scan = db.query(Scan).filter(Scan.id == r.scan_id).first()
        if not scan:
            continue
        output.append(
            {
                "scan_id": r.scan_id,
                "label": r.label,
                "image_name": Path(scan.image_path).name,
            }
        )
    return output

@app.post("/admin/approve/{scan_id}")
def approve_label(
    scan_id: str,
    current_user: User = Depends(_require_moderator),
    db: Session = Depends(get_db),
):
    """Approve new food label and add to training dataset"""
    ul = db.query(UserLabel).filter(UserLabel.scan_id == scan_id).first()
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not ul or not scan:
        return {"error": "Not found"}
    src = Path(scan.image_path)
    dest_dir = SEED_TRAIN_DIR / ul.label
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name
    if src.exists() and not dest.exists():
        shutil.copy2(src, dest)
    ul.is_new_candidate = False
    db.commit()
    return {"status": "approved and added to training dataset"}

@app.post("/admin/decline/{scan_id}")
def decline_label(
    scan_id: str,
    current_user: User = Depends(_require_moderator),
    db: Session = Depends(get_db),
):
    """Decline new food label"""
    ul = db.query(UserLabel).filter(UserLabel.scan_id == scan_id).first()
    pred = db.query(Prediction).filter(Prediction.scan_id == scan_id).first()
    if not ul:
        return {"error": "Not found"}
    ul.is_new_candidate = False
    if pred:
        pred.status = "declined_by_moderator"
    db.commit()
    return {"status": "declined"}

# ─────────────────────────────────────────────────────────────────────────────
# AI CHAT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat(request: dict, current_user: User = Depends(_get_current_user)):
    """AI nutrition chatbot using Groq"""
    # BUG FIX 3: Proper error handling with try-catch
    try:
        GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=500, detail="GROQ_API_KEY not set on server."
            )

        messages = request.get("messages", [])
        system = request.get("system", "You are a helpful nutrition assistant.")

        print(f"DEBUG: User {current_user.id} sent chat with {len(messages)} messages")

        # BUG FIX 4: Proper API call with error handling
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "max_tokens": 1000,
                    "messages": [{"role": "system", "content": system}] + messages,
                },
            )

        if r.status_code != 200:
            print(f"Groq API error: {r.status_code} - {r.text}")
            raise HTTPException(status_code=502, detail="Groq API error")

        result = r.json()
        reply = result["choices"][0]["message"]["content"]
        return {"reply": reply}

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in /chat: {e}")
        raise HTTPException(status_code=500, detail="Chat processing failed")

# ─────────────────────────────────────────────────────────────────────────────
# AI INSIGHTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/insights")
async def get_insights(
    current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)
):
    """Get AI-generated nutrition insights"""
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

    today_start = datetime.combine(date.today(), datetime.min.time())
    since_7 = datetime.combine(date.today() - timedelta(days=6), datetime.min.time())

    today_meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id, MealLog.logged_at >= today_start
    ).all()
    week_meals = db.query(MealLog).filter(
        MealLog.user_id == current_user.id, MealLog.logged_at >= since_7
    ).all()
    goals = _get_or_create_goals(current_user.id, db)

    # BUG FIX 5: Build daily breakdown properly
    daily = {}
    for m in week_meals:
        d = m.logged_at.date().isoformat()
        if d not in daily:
            daily[d] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
        daily[d]["calories"] += m.calories
        daily[d]["protein"] += m.protein
        daily[d]["carbs"] += m.carbs
        daily[d]["fat"] += m.fat
        daily[d]["fiber"] += m.fiber

    today_totals = {
        "calories": sum(m.calories for m in today_meals),
        "protein": sum(m.protein for m in today_meals),
        "carbs": sum(m.carbs for m in today_meals),
        "fat": sum(m.fat for m in today_meals),
        "fiber": sum(m.fiber for m in today_meals),
    }
    
    avg_cal = (
        round(sum(d["calories"] for d in daily.values()) / max(len(daily), 1))
        if daily
        else 0
    )
    avg_prot = (
        round(sum(d["protein"] for d in daily.values()) / max(len(daily), 1))
        if daily
        else 0
    )
    avg_carb = (
        round(sum(d["carbs"] for d in daily.values()) / max(len(daily), 1))
        if daily
        else 0
    )
    avg_fat = (
        round(sum(d["fat"] for d in daily.values()) / max(len(daily), 1))
        if daily
        else 0
    )
    
    today_meal_names = (
        ", ".join(set(m.food_name for m in today_meals)) or "none logged yet"
    )

    cal_today = round(today_totals["calories"])
    prot_today = round(today_totals["protein"])
    carb_today = round(today_totals["carbs"])
    
    # BUG FIX 6: Fallback with proper structure
    fallback = {
        "today_insights": [
            f"You've consumed {cal_today} of {goals.calorie_goal} kcal today.",
            f"Protein: {prot_today}g of {goals.protein_goal}g goal.",
            f"Carbs: {carb_today}g of {goals.carbs_goal}g goal.",
        ],
        "issues": [],
        "recommendations": [
            {
                "emoji": "📝",
                "title": "Track every meal",
                "description": "Log all meals for accurate insights.",
            }
        ],
        "food_swaps": [],
        "weekly_summary": f"You averaged {avg_cal} kcal/day this week.",
    }

    if GROQ_API_KEY:
        prompt = f"""You are a nutrition AI. Generate a JSON response with:
1. "today_insights": array of 3-4 short insight strings about today
2. "issues": array of {{title, description}} objects for problems this week (max 3)
3. "recommendations": array of {{emoji, title, description}} objects with 3 tips
4. "food_swaps": array of {{avoid, better}} objects with 3-4 swaps
5. "weekly_summary": one sentence summary

User data:
- Goals: {goals.calorie_goal} kcal, P:{goals.protein_goal}g C:{goals.carbs_goal}g F:{goals.fat_goal}g Fiber:{goals.fiber_goal}g
- Today: {cal_today} kcal, P:{prot_today}g C:{carb_today}g F:{round(today_totals["fat"])}g
- Today foods: {today_meal_names}
- Weekly avg: {avg_cal} kcal, P:{avg_prot}g C:{avg_carb}g F:{avg_fat}g
- Days logged: {len(daily)}

Respond ONLY with valid JSON. No markdown, no backticks."""

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "max_tokens": 800,
                        "temperature": 0.4,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
            raw = r.json()["choices"][0]["message"]["content"].strip()
            insights = json.loads(raw)
        except Exception:
            insights = fallback
    else:
        insights = fallback

    insights["today_totals"] = today_totals
    insights["goals"] = {
        "calories": goals.calorie_goal,
        "protein": goals.protein_goal,
        "carbs": goals.carbs_goal,
        "fat": goals.fat_goal,
        "fiber": goals.fiber_goal,
    }
    insights["weekly_avg_calories"] = avg_cal
    insights["days_logged"] = len(daily)
    return insights