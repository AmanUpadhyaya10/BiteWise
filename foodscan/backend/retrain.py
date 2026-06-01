#!/usr/bin/env python3
"""
Production-Ready Auto-Retrain Script for Bitewise
- Validates training data before training
- Tracks metrics and performance
- Implements early stopping
- Manages checkpoints
- Logs all operations
"""

import os
import json
from pathlib import Path
from datetime import datetime
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision.datasets import ImageFolder
from torchvision import transforms, models
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from tqdm import tqdm
import logging

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

BACKEND_DIR = Path(__file__).parent
TRAIN_DIR = BACKEND_DIR / "app/storage/dataset/train"
CHECKPOINT_DIR = BACKEND_DIR / "app/storage/ml/checkpoints"
MODEL_PATH = BACKEND_DIR / "app/storage/ml/classifier/efficientnet_b4.pth"
METRICS_FILE = BACKEND_DIR / "training_metrics.json"
LOG_FILE = BACKEND_DIR / "retrain.log"

BATCH_SIZE = 4
EPOCHS = 10
LEARNING_RATE = 1e-4
VAL_SPLIT = 0.2  # 20% validation
EARLY_STOPPING_PATIENCE = 3
DEVICE = torch.device("cpu")

# Create checkpoint dir
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

logger.info(f"Device: {DEVICE}")
logger.info(f"Batch size: {BATCH_SIZE}, Epochs: {EPOCHS}, LR: {LEARNING_RATE}")

# ─────────────────────────────────────────────────────────────────────────────
# DATA VALIDATION & LOADING
# ─────────────────────────────────────────────────────────────────────────────

def validate_dataset():
    """Check dataset integrity"""
    if not TRAIN_DIR.exists():
        logger.error(f"TRAIN_DIR does not exist: {TRAIN_DIR}")
        return False
    
    classes = list(TRAIN_DIR.glob('*'))
    if not classes:
        logger.warning("No classes found in TRAIN_DIR")
        return False
    
    # Count images per class
    for class_dir in classes:
        if not class_dir.is_dir():
            continue
        image_count = len(list(class_dir.glob('*.jpg'))) + \
                      len(list(class_dir.glob('*.jpeg'))) + \
                      len(list(class_dir.glob('*.png'))) + \
                      len(list(class_dir.glob('*.webp')))
        
        if image_count < 2:
            logger.warning(f"Class '{class_dir.name}' has only {image_count} images (need at least 2)")
    
    logger.info("✓ Dataset validation passed")
    return True

def load_data():
    """Load and split training/validation data"""
    if not validate_dataset():
        logger.error("Dataset validation failed")
        return None
    
    # Data transforms
    train_transforms = transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.RandomHorizontalFlip(0.5),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])
    
    val_transforms = transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])
    
    try:
        full_dataset = ImageFolder(str(TRAIN_DIR), transform=train_transforms)
        logger.info(f"Loaded {len(full_dataset)} images from {len(full_dataset.classes)} classes")
        
        # Split train/val
        val_size = int(len(full_dataset) * VAL_SPLIT)
        train_size = len(full_dataset) - val_size
        train_set, val_set = random_split(full_dataset, [train_size, val_size])
        
        train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_set, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
        
        logger.info(f"Train: {train_size}, Val: {val_size}")
        return train_loader, val_loader, full_dataset.classes
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        return None

# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADING & MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def load_model(num_classes):
    """Load EfficientNet-B4 model"""
    logger.info(f"Loading EfficientNet-B4 ({num_classes} classes)...")
    
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.DEFAULT)
    
    # Replace classifier
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(model.classifier[1].in_features, num_classes),
    )
    
    # Load existing checkpoint
    if MODEL_PATH.exists():
        try:
            state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
            model.load_state_dict(state_dict)
            logger.info(f"✓ Loaded checkpoint: {MODEL_PATH}")
        except Exception as e:
            logger.warning(f"Could not load checkpoint: {e}. Using pretrained weights.")
    
    return model.to(DEVICE)

def save_checkpoint(model, epoch, is_best=False):
    """Save model checkpoint"""
    checkpoint_path = CHECKPOINT_DIR / f"checkpoint_epoch_{epoch}.pth"
    torch.save(model.state_dict(), checkpoint_path)
    logger.info(f"Saved checkpoint: {checkpoint_path}")
    
    if is_best:
        torch.save(model.state_dict(), MODEL_PATH)
        logger.info(f"✓ Saved best model: {MODEL_PATH}")

# ─────────────────────────────────────────────────────────────────────────────
# TRAINING LOOP
# ─────────────────────────────────────────────────────────────────────────────

def train_epoch(model, loader, criterion, optimizer):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    
    for images, labels in tqdm(loader, desc="Training", leave=False):
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)
    
    return total_loss / len(loader), 100 * correct / total

def validate(model, loader, criterion):
    """Validate on validation set"""
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Validating", leave=False):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
    
    return total_loss / len(loader), 100 * correct / total

# ─────────────────────────────────────────────────────────────────────────────
# MAIN TRAINING PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def retrain():
    """Main retraining pipeline"""
    logger.info("=" * 80)
    logger.info("🚀 Starting production retraining...")
    logger.info("=" * 80)
    
    start_time = datetime.now()
    
    # Load data
    data = load_data()
    if data is None:
        logger.error("Failed to load data. Aborting.")
        return False
    
    train_loader, val_loader, classes = data
    num_classes = len(classes)
    logger.info(f"Classes: {', '.join(classes)}")
    
    # Load model
    model = load_model(num_classes)
    
    # Training setup
    criterion = nn.CrossEntropyLoss()
    optimizer = Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2, verbose=True)
    
    # Training loop with early stopping
    metrics = {
        "start_time": start_time.isoformat(),
        "epochs": [],
        "best_val_acc": 0.0,
        "best_epoch": 0,
    }
    
    best_val_acc = 0.0
    patience_counter = 0
    
    try:
        for epoch in range(EPOCHS):
            logger.info(f"\n{'─'*80}")
            logger.info(f"Epoch {epoch+1}/{EPOCHS}")
            logger.info(f"{'─'*80}")
            
            # Train
            train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
            logger.info(f"Train - Loss: {train_loss:.4f}, Accuracy: {train_acc:.2f}%")
            
            # Validate
            val_loss, val_acc = validate(model, val_loader, criterion)
            logger.info(f"Val   - Loss: {val_loss:.4f}, Accuracy: {val_acc:.2f}%")
            
            # Update scheduler
            scheduler.step(val_acc)
            
            # Save metrics
            epoch_metrics = {
                "epoch": epoch + 1,
                "train_loss": round(train_loss, 4),
                "train_acc": round(train_acc, 2),
                "val_loss": round(val_loss, 4),
                "val_acc": round(val_acc, 2),
            }
            metrics["epochs"].append(epoch_metrics)
            
            # Early stopping & checkpoint
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                metrics["best_val_acc"] = round(best_val_acc, 2)
                metrics["best_epoch"] = epoch + 1
                save_checkpoint(model, epoch + 1, is_best=True)
                patience_counter = 0
                logger.info(f"✓ New best accuracy: {best_val_acc:.2f}%")
            else:
                patience_counter += 1
                if patience_counter >= EARLY_STOPPING_PATIENCE:
                    logger.info(f"Early stopping triggered (patience {EARLY_STOPPING_PATIENCE} exceeded)")
                    break
            
            save_checkpoint(model, epoch + 1, is_best=False)
        
        # Training complete
        elapsed = (datetime.now() - start_time).total_seconds()
        metrics["end_time"] = datetime.now().isoformat()
        metrics["duration_seconds"] = elapsed
        
        # Save metrics
        with open(METRICS_FILE, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        logger.info("\n" + "=" * 80)
        logger.info(f"✅ Training complete!")
        logger.info(f"   Best validation accuracy: {metrics['best_val_acc']}% (Epoch {metrics['best_epoch']})")
        logger.info(f"   Duration: {elapsed:.1f} seconds")
        logger.info(f"   Model saved: {MODEL_PATH}")
        logger.info(f"   Metrics saved: {METRICS_FILE}")
        logger.info("=" * 80)
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    success = retrain()
    exit(0 if success else 1)