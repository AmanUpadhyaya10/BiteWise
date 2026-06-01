import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms, models
from pathlib import Path
import json
from collections import Counter
from tqdm import tqdm
import warnings
import time

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────
# FIX: lambda replaced with picklable func
# ─────────────────────────────────────────
def convert_to_rgb(img):
    return img.convert("RGB")

# ─────────────────────────────────────────
# GPU optimizations
# ─────────────────────────────────────────
torch.backends.cudnn.benchmark = True
torch.set_float32_matmul_precision('high')

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
BASE        = Path(r"C:\Users\91875\Documents\FoodCalorieApp")
TRAIN_DIR   = BASE / "merged_dataset" / "train"
OUTPUT_DIR  = BASE / "trained_model_b4"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EPOCHS      = 30
BATCH_SIZE  = 16     # B4 + AMP + 4.3GB VRAM → 16 is safe; drop to 8 if OOM
LR          = 2e-4
IMG_SIZE    = 224    # Safe for 4.3GB. B4 native is 380 but that will OOM.
NUM_WORKERS = 4      # Slight speedup vs 2; won't stress CPU too hard
DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🖥  Device : {DEVICE}")
if DEVICE == "cuda":
    print(f"🎮 GPU    : {torch.cuda.get_device_name(0)}")
    print(f"💾 VRAM   : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

# ─────────────────────────────────────────
# TRANSFORMS  (stronger aug to fight overfit)
# ─────────────────────────────────────────
train_transforms = transforms.Compose([
    transforms.Lambda(convert_to_rgb),
    transforms.Resize((IMG_SIZE + 20, IMG_SIZE + 20)),   # slightly larger then crop
    transforms.RandomCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(p=0.1),
    transforms.RandomRotation(25),
    transforms.ColorJitter(brightness=0.4, contrast=0.4,
                           saturation=0.4, hue=0.15),
    transforms.RandomGrayscale(p=0.05),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),  # Cutout-style
])

val_transforms = transforms.Compose([
    transforms.Lambda(convert_to_rgb),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# ─────────────────────────────────────────
# DATASET
# ─────────────────────────────────────────
def load_data():
    print("\n📂 Loading dataset...")
    full_dataset = datasets.ImageFolder(str(TRAIN_DIR), transform=train_transforms)

    val_size   = int(0.1 * len(full_dataset))
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = torch.utils.data.random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)   # reproducible split
    )

    val_ds.dataset.transform = val_transforms

    num_classes = len(full_dataset.classes)

    print(f"✅ Total images : {len(full_dataset)}")
    print(f"✅ Train images : {train_size}")
    print(f"✅ Val images   : {val_size}")
    print(f"✅ Classes      : {num_classes}")

    # Save class mapping
    with open(OUTPUT_DIR / "class_to_idx.json", "w") as f:
        json.dump(full_dataset.class_to_idx, f, indent=2)
    print("✅ class_to_idx.json saved")

    # Balanced sampler
    targets      = [full_dataset.targets[i] for i in train_ds.indices]
    class_counts = Counter(targets)
    weights      = [1.0 / class_counts[t] for t in targets]
    sampler      = WeightedRandomSampler(weights, len(weights), replacement=True)

    train_loader = DataLoader(
        train_ds,
        batch_size=BATCH_SIZE,
        sampler=sampler,
        num_workers=NUM_WORKERS,
        pin_memory=True,
        persistent_workers=True,   # keeps workers alive between epochs → faster
        prefetch_factor=2,
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=True,
        persistent_workers=True,
        prefetch_factor=2,
    )

    return train_loader, val_loader, num_classes, train_size, val_size

# ─────────────────────────────────────────
# MODEL  — EfficientNet-B4
# ─────────────────────────────────────────
def build_model(num_classes):
    print("\n🧠 Loading EfficientNet-B4...")
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)

    # Unfreeze all layers (full fine-tune, same as B0 script)
    for param in model.features.parameters():
        param.requires_grad = True

    # B4 classifier in_features = 1792
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.45),           # slightly higher dropout vs B0 to curb overfit
        nn.Linear(in_features, num_classes)
    )

    print(f"   Classifier in_features : {in_features}")
    print(f"   Output classes         : {num_classes}")

    return model.to(DEVICE)

# ─────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────
def train():
    train_loader, val_loader, num_classes, train_size, val_size = load_data()
    model = build_model(num_classes)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=2e-4)

    # OneCycleLR → reaches peak LR fast then anneals; converges quicker than cosine
    steps_per_epoch = len(train_loader)
    scheduler = optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=LR,
        steps_per_epoch=steps_per_epoch,
        epochs=EPOCHS,
        pct_start=0.1,       # 10% warmup
        anneal_strategy='cos'
    )

    scaler      = torch.amp.GradScaler("cuda")
    best_val_acc = 0.0

    print(f"\n🚀 Starting training — EfficientNet-B4 | {num_classes} classes\n")
    print(f"   Batch size   : {BATCH_SIZE}")
    print(f"   Steps/epoch  : {steps_per_epoch}")
    print(f"   Total epochs : {EPOCHS}\n")

    for epoch in range(1, EPOCHS + 1):
        epoch_start = time.time()
        torch.cuda.empty_cache()

        # ── TRAIN ──────────────────────────────
        model.train()
        train_correct = 0
        running_loss  = 0.0

        pbar = tqdm(train_loader,
                    desc=f"Ep {epoch:02d}/{EPOCHS} [Train]",
                    ncols=110,
                    dynamic_ncols=False)

        for batch_idx, (imgs, labels) in enumerate(pbar, 1):
            imgs   = imgs.to(DEVICE, non_blocking=True)
            labels = labels.to(DEVICE, non_blocking=True)

            optimizer.zero_grad()

            with torch.amp.autocast("cuda"):
                outputs = model(imgs)
                loss    = criterion(outputs, labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()

            batch_correct  = (outputs.argmax(1) == labels).sum().item()
            train_correct += batch_correct
            running_loss  += loss.item()

            # Real-time stats every 200 batches
            if batch_idx % 200 == 0:
                mem_gb   = torch.cuda.memory_allocated() / 1e9
                avg_loss = running_loss / batch_idx
                acc_so_far = 100 * train_correct / (batch_idx * BATCH_SIZE)
                pbar.set_postfix({
                    "loss"  : f"{avg_loss:.4f}",
                    "acc"   : f"{acc_so_far:.1f}%",
                    "mem"   : f"{mem_gb:.2f}GB",
                    "lr"    : f"{scheduler.get_last_lr()[0]:.2e}"
                })

        # ── VALIDATION ─────────────────────────
        model.eval()
        val_correct  = 0
        val_loss_sum = 0.0

        with torch.no_grad():
            for imgs, labels in tqdm(val_loader,
                                     desc=f"Ep {epoch:02d}/{EPOCHS} [Val]  ",
                                     ncols=110,
                                     dynamic_ncols=False):
                imgs   = imgs.to(DEVICE, non_blocking=True)
                labels = labels.to(DEVICE, non_blocking=True)

                with torch.amp.autocast("cuda"):
                    outputs = model(imgs)
                    loss    = criterion(outputs, labels)

                val_correct  += (outputs.argmax(1) == labels).sum().item()
                val_loss_sum += loss.item()

        train_acc = 100 * train_correct / train_size
        val_acc   = 100 * val_correct   / val_size
        epoch_min = (time.time() - epoch_start) / 60

        print(f"\n{'─'*65}")
        print(f"  Epoch [{epoch:02d}/{EPOCHS}]  "
              f"Train: {train_acc:.2f}%  |  Val: {val_acc:.2f}%  |  "
              f"Time: {epoch_min:.1f}m")
        print(f"{'─'*65}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), OUTPUT_DIR / "best_model_b4.pt")
            print(f"  💾 Best model saved! ({val_acc:.2f}%)\n")
        else:
            gap = train_acc - val_acc
            if gap > 15:
                print(f"  ⚠️  Overfit gap: {gap:.1f}% — augmentation is active\n")
            else:
                print()

    print(f"\n🎉 Training Complete! Best Val Acc: {best_val_acc:.2f}%")
    print(f"   Model saved → {OUTPUT_DIR / 'best_model_b4.pt'}")

# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    train()