FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and other libs
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender-dev \
    libxext-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create necessary directories
RUN mkdir -p app/storage/uploads \
    && mkdir -p app/storage/dataset/train \
    && mkdir -p app/storage/ml/classifier \
    && mkdir -p app/storage/ml/detector \
    && mkdir -p logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/docs', timeout=5)"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]