import json
import re
from pathlib import Path
from rapidfuzz import process, fuzz

# Correct path (same folder as this file)
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "nutrition_master.json"

# Load database once
with open(DB_PATH, "r", encoding="utf-8") as f:
    NUTRITION_DB = json.load(f)

FOOD_KEYS = list(NUTRITION_DB.keys())


def normalize_label(text):
    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", "_", text)
    text = re.sub(r"_+", "_", text)
    return text


def search_food(query, limit=5):
    query = normalize_label(query)

    matches = process.extract(
        query,
        FOOD_KEYS,
        scorer=fuzz.WRatio,
        limit=limit
    )

    results = []
    for match, score, _ in matches:
        results.append({
            "food": match,
            "score": score,
            "nutrition": NUTRITION_DB[match]
        })

    return results


def get_nutrition(food_key):
    return NUTRITION_DB.get(food_key)