import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from tqdm import tqdm

# -------------------------
# CONFIG (edit paths if needed)
# -------------------------
SEED_DATASET_ROOT = Path(r"C:\Users\91875\Documents\FoodCalorieApp\dataset")
TRAIN_DIR = SEED_DATASET_ROOT / "train"
TEST_DIR = SEED_DATASET_ROOT / "test"

OUT_DIR = Path(__file__).resolve().parent
MODEL_PATH = OUT_DIR / "model.pt"
CLASSMAP_PATH = OUT_DIR / "class_to_idx.json"

BATCH_SIZE = 32
EPOCHS = 3
LR = 1e-3
IMG_SIZE = 224
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def main():
    assert TRAIN_DIR.exists(), f"Train folder not found: {TRAIN_DIR}"
    assert TEST_DIR.exists(), f"Test folder not found: {TEST_DIR}"

    train_tfms = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    test_tfms = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    train_ds = datasets.ImageFolder(TRAIN_DIR, transform=train_tfms)
    test_ds = datasets.ImageFolder(TEST_DIR, transform=test_tfms)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    num_classes = len(train_ds.classes)
    print("Classes:", num_classes)
    print("Example classes:", train_ds.classes[:10])

    # Save class map
    with open(CLASSMAP_PATH, "w") as f:
        json.dump(train_ds.class_to_idx, f, indent=2)
    print("Saved class_to_idx:", CLASSMAP_PATH)

    # Model: MobileNetV2 (fast + good)
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)

    model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    # -------------------------
    # TRAIN
    # -------------------------
    for epoch in range(1, EPOCHS + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        pbar = tqdm(train_loader, desc=f"Epoch {epoch}/{EPOCHS} [train]")
        for x, y in pbar:
            x, y = x.to(DEVICE), y.to(DEVICE)

            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=1)
            correct += (preds == y).sum().item()
            total += y.size(0)

            pbar.set_postfix(loss=loss.item(), acc=correct / max(total, 1))

        train_loss = running_loss / max(total, 1)
        train_acc = correct / max(total, 1)

        # -------------------------
        # EVAL
        # -------------------------
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            pbar = tqdm(test_loader, desc=f"Epoch {epoch}/{EPOCHS} [test ]")
            for x, y in pbar:
                x, y = x.to(DEVICE), y.to(DEVICE)
                logits = model(x)
                preds = logits.argmax(dim=1)
                correct += (preds == y).sum().item()
                total += y.size(0)
                pbar.set_postfix(acc=correct / max(total, 1))

        test_acc = correct / max(total, 1)
        print(f"Epoch {epoch}: train_loss={train_loss:.4f} train_acc={train_acc:.3f} test_acc={test_acc:.3f}")

    # Save model weights
    torch.save(model.state_dict(), MODEL_PATH)
    print("Saved model:", MODEL_PATH)
    print("Done ✅")


if __name__ == "__main__":
    main()
