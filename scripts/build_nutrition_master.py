import pandas as pd
import json
from pathlib import Path

# ==================================================
# PROJECT PATH CONFIG (ABSOLUTE + SAFE)
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BASE_DIR = PROJECT_ROOT / "Nutrition_Database"

USDA_DIR = BASE_DIR / "FoodData_Central_csv_2025-12-18"
IFCT_FILE = BASE_DIR / "ifct2017_compositions.xlsx"

OUT_DIR = BASE_DIR / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ==================================================
# 1️⃣ PROCESS IFCT
# ==================================================

def process_ifct():
    print("🔄 Processing IFCT dataset...")

    df = pd.read_excel(IFCT_FILE)

    # Adjust column selection if needed
    df = df.iloc[:, 0:5]  # first 5 columns only

    df.columns = [
        "food_name",
        "kcal_100g",
        "protein_100g",
        "fat_100g",
        "carbs_100g"
    ]

    df = df.dropna(subset=["kcal_100g"])

    df["food_name"] = (
        df["food_name"]
        .astype(str)
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(",", "", regex=False)
        .str.replace("-", "_", regex=False)
    )

    df["source"] = "IFCT"

    print(f"✅ IFCT records: {len(df)}")

    return df


# ==================================================
# 2️⃣ PROCESS USDA
# ==================================================

def process_usda():
    print("🔄 Processing USDA dataset...")

    # Load required files
    food = pd.read_csv(USDA_DIR / "food.csv", low_memory=False)
    food_nutrient = pd.read_csv(USDA_DIR / "food_nutrient.csv", low_memory=False)
    nutrient = pd.read_csv(USDA_DIR / "nutrient.csv", low_memory=False)

    # Only keep important nutrients
    required_nutrients = {
        1008: "kcal_100g",      # Energy
        1003: "protein_100g",   # Protein
        1004: "fat_100g",       # Fat
        1005: "carbs_100g"      # Carbs
    }

    nutrient = nutrient[nutrient["id"].isin(required_nutrients.keys())]

    # Merge food_nutrient with filtered nutrient ids
    food_nutrient = food_nutrient.merge(
        nutrient[["id"]],
        left_on="nutrient_id",
        right_on="id"
    )

    # Map nutrient names
    food_nutrient["nutrient_name"] = food_nutrient["nutrient_id"].map(required_nutrients)

    # Pivot table
    pivot = food_nutrient.pivot_table(
        index="fdc_id",
        columns="nutrient_name",
        values="amount",
        aggfunc="first"
    ).reset_index()

    # Merge with food descriptions
    merged = food.merge(pivot, on="fdc_id", how="inner")

    final = merged[[
        "description",
        "kcal_100g",
        "protein_100g",
        "carbs_100g",
        "fat_100g"
    ]].copy()

    final = final.rename(columns={"description": "food_name"})

    final = final.dropna(subset=["kcal_100g"])

    final["food_name"] = (
        final["food_name"]
        .astype(str)
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(",", "", regex=False)
        .str.replace("-", "_", regex=False)
    )

    final["source"] = "USDA"

    print(f"✅ USDA records: {len(final)}")

    return final


# ==================================================
# 3️⃣ BUILD MASTER DATASET
# ==================================================

def build_master():
    print("🚀 Building Unified Nutrition Database...\n")

    ifct_df = process_ifct()
    usda_df = process_usda()

    combined = pd.concat([ifct_df, usda_df], ignore_index=True)

    # Remove duplicates (keep IFCT priority over USDA)
    combined = combined.sort_values(by="source")
    combined = combined.drop_duplicates(subset=["food_name"], keep="first")

    # Final cleanup
    combined = combined.fillna(0)

    print(f"\n📊 Total unified records: {len(combined)}")

    # Save CSV
    csv_path = OUT_DIR / "nutrition_master.csv"
    combined.to_csv(csv_path, index=False)

    # Save JSON
    json_data = combined.set_index("food_name").to_dict(orient="index")
    json_path = OUT_DIR / "nutrition_master.json"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=4)

    print("\n✅ Nutrition master created successfully!")
    print(f"📁 CSV: {csv_path}")
    print(f"📁 JSON: {json_path}")


# ==================================================
# MAIN
# ==================================================

if __name__ == "__main__":
    build_master()