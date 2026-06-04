import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./foodscan.db")

# Convert postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite setup
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
# PostgreSQL setup
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )

# Database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# SQLAlchemy Base
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Directories
UPLOADS_DIR = os.getenv(
    "UPLOADS_DIR",
    "app/storage/uploads"
)

TRAINING_DIR = os.getenv(
    "TRAINING_DIR",
    "app/storage/dataset/train"
)

# Backward compatibility if main.py expects SEED_TRAIN_DIR
SEED_TRAIN_DIR = TRAINING_DIR

# Create directories
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(TRAINING_DIR, exist_ok=True)