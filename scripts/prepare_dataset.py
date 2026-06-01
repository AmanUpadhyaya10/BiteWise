import os
import shutil
from pathlib import Path

BASE = Path(r"C:\Users\91875\Documents\FoodCalorieApp")

SOURCES = [
    BASE / "dataset" / "train",
    BASE / "raw_datasets" / "archive (7)" / "Indian Food Images" / "Indian Food Images",
    BASE / "raw_datasets" / "archive (8)" / "Final Dataset - Cleaned",
    BASE / "raw_datasets" / "archive (9)" / "Train",
    BASE / "raw_datasets" / "archive (10)" / "training",
    BASE / "raw_datasets" / "archive (6)" / "food-101" / "food-101" / "images",
    BASE / "raw_datasets" / "Food Classification",
    BASE / "raw_datasets" / "Indian Food Images",
]

OUTPUT = BASE / "merged_dataset" / "train"
OUTPUT.mkdir(parents=True, exist_ok=True)

total_copied = 0

for source in SOURCES:
    if not source.exists():
        print(f"⚠ Skipping (not found): {source}")
        continue

    print(f"\n📂 Processing: {source.name}")

    for class_dir in source.iterdir():
        if not class_dir.is_dir():
            continue

        class_name = class_dir.name.strip().lower().replace(" ", "_")
        dest_dir = OUTPUT / class_name
        dest_dir.mkdir(parents=True, exist_ok=True)

        existing = len(list(dest_dir.glob("*")))
        copied = 0

        for img in class_dir.iterdir():
            if img.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
                continue

            new_name = f"{class_name}_{existing + copied + 1}{img.suffix.lower()}"
            dest = dest_dir / new_name

            if not dest.exists():
                shutil.copy2(img, dest)
                copied += 1

        total_copied += copied
        print(f"  ✅ {class_name}: +{copied} images (total: {existing + copied})")

print(f"\n🎉 Done! Total images copied: {total_copied}")
print(f"📁 Output: {OUTPUT}")

print("\n📊 Class statistics:")
classes = sorted(OUTPUT.iterdir())
small_classes = []

for c in classes:
    count = len(list(c.glob("*")))
    status = "✅" if count >= 50 else "⚠️ "
    print(f"  {status} {c.name}: {count} images")
    if count < 50:
        small_classes.append((c.name, count))

print(f"\nTotal classes: {len(classes)}")
print(f"Classes with less than 50 images: {len(small_classes)}")
if small_classes:
    print("These classes need more data:")
    for name, count in small_classes:
        print(f"  - {name}: {count} images")