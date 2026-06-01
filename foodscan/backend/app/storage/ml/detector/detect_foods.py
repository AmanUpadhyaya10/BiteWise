from segment_anything import SamAutomaticMaskGenerator, sam_model_registry
import cv2
import numpy as np
from pathlib import Path
import uuid
import torch

MODEL_PATH = Path(__file__).resolve().parent / "sam_vit_b_01ec64.pth"
CROPS_DIR  = Path(__file__).resolve().parents[3] / "storage" / "crops"
CROPS_DIR.mkdir(parents=True, exist_ok=True)

device = "cpu" if torch.cuda.is_available() else "cpu"
sam    = sam_model_registry["vit_b"](checkpoint=str(MODEL_PATH))
sam.to("cpu")

mask_generator = SamAutomaticMaskGenerator(
    model=sam,
    points_per_side=16,
    pred_iou_thresh=0.90,
    stability_score_thresh=0.92,
    min_mask_region_area=5000,
    box_nms_thresh=0.5,
)

def compute_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter == 0:
        return 0.0
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0

def non_max_suppression(masks, iou_threshold=0.4):
    kept = []
    for m in masks:
        box_i = m["bbox_xyxy"]
        keep  = True
        for k in kept:
            if compute_iou(box_i, k["bbox_xyxy"]) > iou_threshold:
                keep = False
                break
        if keep:
            kept.append(m)
    return kept

def detect_foods(image_path, max_items=8):
    # ── Import here to avoid circular import
    from app.storage.ml.classifier.inference import offload_to_cpu, reload_to_gpu

    img_bgr = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # ── Resize to 640px max to reduce VRAM usage
    max_dim = 640
    h, w = img_rgb.shape[:2]
    if max(h, w) > max_dim:
        scale   = max_dim / max(h, w)
        img_rgb = cv2.resize(img_rgb, (int(w * scale), int(h * scale)))
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)))

    h, w       = img_rgb.shape[:2]
    total_area = h * w

    # ── Free EfficientNet VRAM so SAM can run on GPU
    offload_to_cpu()

    try:
        masks = mask_generator.generate(img_rgb)
    finally:
        # ── Always reload EfficientNet back to GPU
        torch.cuda.empty_cache()
        reload_to_gpu()

    # ── Filter by area
    filtered = []
    for mask in masks:
        area = mask["area"]
        if area < total_area * 0.01:
            continue
        if area > total_area * 0.55:
            continue
        x, y, bw, bh = mask["bbox"]
        x1, y1 = int(x), int(y)
        x2, y2 = int(x + bw), int(y + bh)
        aspect = bw / bh if bh > 0 else 0
        if aspect > 5 or aspect < 0.2:
            continue
        mask["bbox_xyxy"] = [x1, y1, x2, y2]
        filtered.append(mask)

    filtered = sorted(filtered, key=lambda x: x["area"], reverse=True)
    filtered = non_max_suppression(filtered, iou_threshold=0.4)
    filtered = filtered[:max_items]

    foods = []
    for mask in filtered:
        x1, y1, x2, y2 = mask["bbox_xyxy"]
        binary_mask = mask["segmentation"].astype(np.uint8)
        masked_img  = img_bgr.copy()
        masked_img[binary_mask == 0] = 0
        crop = masked_img[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        crop_path = CROPS_DIR / f"{uuid.uuid4()}.jpg"
        cv2.imwrite(str(crop_path), crop)
        foods.append({
            "bbox":      [x1, y1, x2, y2],
            "crop_path": str(crop_path)
        })

    return foods