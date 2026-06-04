
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
    && rm -rf /var/lib/apt/lists/* \
    && git lfs install

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Pull LFS files using GitHub token
RUN git init && \
    git config user.email "deploy@railway.app" && \
    git config user.name "Railway" && \
    git remote add origin https://${GITHUB_TOKEN}@github.com/AmanUpadhyaya10/BiteWise.git && \
    git lfs pull --include="*.json" origin main || true

RUN mkdir -p app/storage/{uploads,crops,dataset/{train,test}} \
    && mkdir -p app/storage/ml/{classifier,detector}

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
