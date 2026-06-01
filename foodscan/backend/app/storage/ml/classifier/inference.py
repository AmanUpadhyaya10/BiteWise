import json
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image

BASE_DIR      = Path(__file__).resolve().parent
MODEL_PATH    = BASE_DIR / "model.pt"
CLASSMAP_PATH = BASE_DIR / "class_to_idx.json"
DEVICE        = "cuda" if torch.cuda.is_available() else "cpu"

# Load class map
with open(CLASSMAP_PATH, "r") as f:
    class_to_idx = json.load(f)
idx_to_class = {v: k for k, v in class_to_idx.items()}
num_classes  = len(class_to_idx)

# Load EfficientNet-B4
model = models.efficientnet_b4(weights=None)
in_features = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(p=0.45),
    nn.Linear(in_features, num_classes)
)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()

# Image transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

def offload_to_cpu():
    """Move EfficientNet off GPU so SAM can use the VRAM."""
    global model
    if DEVICE == "cuda":
        model.to("cpu")
        torch.cuda.empty_cache()

def reload_to_gpu():
    """Move EfficientNet back to GPU after SAM is done."""
    global model
    if DEVICE == "cuda":
        model.to(DEVICE)

def predict_image(image_path, topk=5):
    # Make sure model is on correct device before inference
    current_device = next(model.parameters()).device
    if str(current_device) != DEVICE:
        model.to(DEVICE)

    img = Image.open(image_path).convert("RGB")
    x   = transform(img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = model(x)
        probs  = F.softmax(logits, dim=1)[0]
    values, indices = torch.topk(probs, topk)
    results = []
    for v, i in zip(values, indices):
        results.append({
            "label":      idx_to_class[int(i)],
            "confidence": float(v.cpu().item())
        })
    return results