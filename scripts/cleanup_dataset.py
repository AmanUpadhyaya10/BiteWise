import shutil
from pathlib import Path

BASE = Path(r"C:\Users\91875\Documents\FoodCalorieApp")
TRAIN = BASE / "merged_dataset" / "train"

# ─────────────────────────────────────────
# STEP 1: Merge duplicate classes
# ─────────────────────────────────────────
merges = {
    "aloo_gobhi": "aloo_gobi",       # merge into aloo_gobi
    "tikki": "aloo_tikki",           # merge into aloo_tikki
    "waffles": "waffle",             # merge into waffle
    "naan_bread": "naan",            # merge into naan
    "rice_cooked": "rice",           # merge into rice
    "mishti_doi": "misti_doi",       # merge into misti_doi
    "khubani_ka_meetha": "qubani_ka_meetha",  # same dish
    "chicken_rezala": "chicken_razala",
    "missi_roti": "misi_roti",
}

for src_name, dest_name in merges.items():
    src = TRAIN / src_name
    dest = TRAIN / dest_name

    if not src.exists():
        print(f"⚠ Source not found: {src_name}")
        continue

    dest.mkdir(parents=True, exist_ok=True)
    existing = len(list(dest.glob("*")))
    copied = 0

    for img in src.iterdir():
        if img.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
            continue
        new_name = f"{dest_name}_{existing + copied + 1}{img.suffix.lower()}"
        dest_file = dest / new_name
        if not dest_file.exists():
            shutil.copy2(img, dest_file)
            copied += 1

    shutil.rmtree(src)
    print(f"✅ Merged {src_name} → {dest_name} (+{copied} images)")

# ─────────────────────────────────────────
# STEP 2: Delete junk classes
# ─────────────────────────────────────────
delete_classes = [
    "indian_food_images",
    "vegetable-fruit",   # too generic, not a real class
]

for name in delete_classes:
    path = TRAIN / name
    if path.exists():
        shutil.rmtree(path)
        print(f"🗑 Deleted junk class: {name}")
    else:
        print(f"⚠ Not found: {name}")

# ─────────────────────────────────────────
# STEP 3: Final stats
# ─────────────────────────────────────────
print("\n📊 Final class count:")
classes = sorted(TRAIN.iterdir())
print(f"Total classes: {len(classes)}")

small = [(c.name, len(list(c.glob("*")))) for c in classes if len(list(c.glob("*"))) < 50]
if small:
    print(f"Classes still under 50 images:")
    for name, count in small:
        print(f"  ⚠ {name}: {count}")
else:
    print("✅ All classes have 50+ images!")