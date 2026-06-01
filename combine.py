import pandas as pd
import json
import re
from pathlib import Path


# ==========================================================
# PATH CONFIGURATION
# ==========================================================

ROOT = Path("C:/Users/91875/Documents/FoodCalorieApp")
DB_ROOT = ROOT / "Nutrition_Database"

USDA_FOLDER = DB_ROOT / "FoodData_Central_csv_2025-12-18"
IFCT_PATH = DB_ROOT / "ifct2017_compositions.csv"

OUTPUT_PATH = DB_ROOT / "processed" / "nutrition_master.json"


# ==========================================================
# TEXT NORMALIZATION
# ==========================================================

def normalize_label(text):
    if pd.isna(text):
        return None

    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", "_", text)
    text = re.sub(r"_+", "_", text)

    return text


# ==========================================================
# SAFE FLOAT CONVERSION
# ==========================================================

def to_float(value):
    try:
        return float(value)
    except:
        return None


# ==========================================================
# LOAD USDA DATA
# ==========================================================

def load_usda():
    print("Reading USDA files...")

    food_file = USDA_FOLDER / "food.csv"
    nutrient_file = USDA_FOLDER / "food_nutrient.csv"
    nutrient_def_file = USDA_FOLDER / "nutrient.csv"

    foods = pd.read_csv(food_file, low_memory=False)
    food_nutrients = pd.read_csv(nutrient_file, low_memory=False)
    nutrients = pd.read_csv(nutrient_def_file, low_memory=False)

    nutrient_map = {
        "Energy": "kcal_100g",
        "Protein": "protein_100g",
        "Carbohydrate, by difference": "carbs_100g",
        "Total lipid (fat)": "fat_100g",
    }

    nutrients = nutrients[nutrients["name"].isin(nutrient_map.keys())]

    merged = food_nutrients.merge(
        nutrients[["id", "name"]],
        left_on="nutrient_id",
        right_on="id"
    )

    merged["mapped"] = merged["name"].map(nutrient_map)

    pivot = merged.pivot_table(
        index="fdc_id",
        columns="mapped",
        values="amount",
        aggfunc="first"
    ).reset_index()

    final = foods.merge(pivot, on="fdc_id", how="left")

    final = final.dropna(subset=["description"])

    final = final[[
        "description",
        "kcal_100g",
        "protein_100g",
        "carbs_100g",
        "fat_100g"
    ]]

    final["food"] = final["description"].apply(normalize_label)
    final["source"] = "USDA"

    for col in ["kcal_100g", "protein_100g", "carbs_100g", "fat_100g"]:
        final[col] = final[col].apply(to_float)

    final = final.dropna(subset=["food"])

    return final[[
        "food",
        "kcal_100g",
        "protein_100g",
        "carbs_100g",
        "fat_100g",
        "source"
    ]]


# ==========================================================
# LOAD IFCT DATA (MATCHES YOUR COLUMN STRUCTURE)
# ==========================================================

def load_ifct():
    print("Reading IFCT file...")

    df = pd.read_csv(IFCT_PATH, low_memory=False)
    df.columns = df.columns.str.strip().str.lower()

    required_cols = ["name", "enerc", "protcnt", "choavldf", "fatce"]

    for col in required_cols:
        if col not in df.columns:
            raise Exception(f"❌ Missing required IFCT column: {col}")

    df = df[required_cols]

    df = df.rename(columns={
        "name": "food",
        "enerc": "kcal_100g",
        "protcnt": "protein_100g",
        "choavldf": "carbs_100g",
        "fatce": "fat_100g",
    })

    df["food"] = df["food"].apply(normalize_label)
    df["source"] = "IFCT"

    for col in ["kcal_100g", "protein_100g", "carbs_100g", "fat_100g"]:
        df[col] = df[col].apply(to_float)

    df = df.dropna(subset=["food"])

    return df


# ==========================================================
# BUILD MASTER DATABASE
# ==========================================================

def build_master():
    print("Loading USDA...")
    usda = load_usda()

    print("Loading IFCT...")
    ifct = load_ifct()

    print("Merging datasets...")

    master = pd.concat([usda, ifct], ignore_index=True)

    # USDA gets priority
    master = master.drop_duplicates(subset=["food"], keep="first")

    # Replace NaN with None (JSON safe)
    master = master.where(pd.notnull(master), None)

    nutrition_dict = master.set_index("food").to_dict(orient="index")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(nutrition_dict, f, indent=4)

    print("\n✅ Master database created successfully!")
    print(f"Total foods: {len(nutrition_dict)}")
    print(f"Saved at: {OUTPUT_PATH}")


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    build_master()