import json
from pathlib import Path
from typing import Optional, Dict


# ==========================================================
# LOAD NUTRITION DATABASE (USDA + IFCT MASTER)
# ==========================================================

PROJECT_ROOT = Path(__file__).resolve().parent
DB_PATH = PROJECT_ROOT / "Nutrition_Database" / "processed" / "nutrition_master.json"

if not DB_PATH.exists():
    raise RuntimeError(f"Nutrition database not found at {DB_PATH}")

with open(DB_PATH, "r", encoding="utf-8") as f:
    NUTRITION_DB: Dict[str, Dict] = json.load(f)

print(f"✅ Loaded nutrition database with {len(NUTRITION_DB)} foods")


# ==========================================================
# LABEL NORMALIZATION
# ==========================================================

def normalize_label(label: str) -> str:
    return (
        label.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )


# ==========================================================
# GET NUTRITION (PER 100g)
# ==========================================================

def get_nutrition(label: str) -> Optional[Dict]:
    label = normalize_label(label)

    # Exact match
    if label in NUTRITION_DB:
        return NUTRITION_DB[label]

    # Partial fallback match
    for food_name in NUTRITION_DB.keys():
        if label in food_name:
            return NUTRITION_DB[food_name]

    return None


# ==========================================================
# CALCULATE CALORIES FOR GIVEN GRAMS
# ==========================================================

def calculate_calories(label: str, grams: float) -> Optional[Dict]:
    nutrition = get_nutrition(label)

    if not nutrition:
        return None

    kcal_100g = nutrition.get("kcal_100g", 0)
    protein_100g = nutrition.get("protein_100g", 0)
    carbs_100g = nutrition.get("carbs_100g", 0)
    fat_100g = nutrition.get("fat_100g", 0)

    total_kcal = (kcal_100g * grams) / 100

    return {
        "food": normalize_label(label),
        "grams": grams,
        "calories": round(total_kcal, 2),
        "protein": round((protein_100g * grams) / 100, 2),
        "carbs": round((carbs_100g * grams) / 100, 2),
        "fat": round((fat_100g * grams) / 100, 2),
    }


# ==========================================================
# OPTIONAL: QUICK TEST
# ==========================================================

if __name__ == "__main__":
    test_food = "rice"
    result = calculate_calories(test_food, 250)

    if result:
        print("🍽 Sample Calculation:")
        print(result)
    else:
        print("Food not found in database.")