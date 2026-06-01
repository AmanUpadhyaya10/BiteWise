# 🍽️ BiteWise — AI-Powered Food Calorie Tracker

BiteWise is an AI-powered mobile app that helps you track your nutrition by scanning food items using your camera or barcode scanner. It identifies food, estimates calories, and provides detailed nutritional information instantly.

---

## ✨ Features

- 📸 **Food Image Recognition** — Snap a photo of your meal and get instant calorie estimates using a trained EfficientNet-B4 model
- 🔍 **Barcode Scanner** — Scan packaged food barcodes for accurate nutrition labels
- 🥗 **Nutrition Breakdown** — View calories, protein, carbs, fats and more
- 📊 **Nutrition Database** — Backed by USDA FoodData Central dataset
- 📱 **Mobile Ready** — Built with React + Capacitor for Android deployment

---

## 🗂️ Project Structure

```
BiteWise/
├── frontend/          # React + Capacitor mobile app
├── scripts/           # Helper and data processing scripts
├── nutrition_engine.py  # Core nutrition lookup logic
├── combine.py         # Dataset combining utility
└── train.py           # ML model training script
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.9+
- Android Studio (for APK build)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Build Android APK

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```
Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### Python / Backend Setup

```bash
pip install -r requirements.txt
python nutrition_engine.py
```

### Train the Model (optional)

```bash
python train.py
```

---

## 🧠 ML Model

- Architecture: **EfficientNet-B4**
- Trained on a custom merged food image dataset
- Used for real-time food classification from camera input

---

## 📦 Dataset

The app uses the **USDA FoodData Central** foundation foods dataset for nutritional data.  
Dataset not included in this repo due to size — download from [FoodData Central](https://fdc.nal.usda.gov/download-datasets.html).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Mobile | Capacitor (Android) |
| ML Model | Python, EfficientNet-B4 |
| Nutrition Data | USDA FoodData Central |
| Barcode Scan | Capacitor Barcode Scanner |

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙋‍♂️ Author

**Aman Upadhyaya**  
[GitHub](https://github.com/AmanUpadhyaya10)
