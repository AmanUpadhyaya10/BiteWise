FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libzbar0 \
    libzbar-dev \
    pkg-config \
    curl \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

RUN git lfs install

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ===== DEBUG NUTRITION FILE =====
RUN python -c "\
import os; \
p='/app/app/nutrition/nutrition_master.json'; \
print('=============================='); \
print('NUTRITION FILE DEBUG'); \
print('PATH:', p); \
print('EXISTS:', os.path.exists(p)); \
print('SIZE:', os.path.getsize(p) if os.path.exists(p) else 'missing'); \
print('=============================='); \
"

RUN find /app -name 'nutrition_master.json' || true

# Create required folders
RUN mkdir -p app/storage/uploads && \
    mkdir -p app/storage/crops && \
    mkdir -p app/storage/dataset/train && \
    mkdir -p app/storage/dataset/test && \
    mkdir -p app/storage/ml/classifier && \
    mkdir -p app/storage/ml/detector

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]