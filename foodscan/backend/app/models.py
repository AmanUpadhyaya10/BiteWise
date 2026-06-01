import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ─────────────────────────────────────────────
# EXISTING TABLES (unchanged)
# ─────────────────────────────────────────────

class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    mode: Mapped[str] = mapped_column(String, index=True)
    image_path: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )
    user_labels: Mapped[list["UserLabel"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    model_type: Mapped[str] = mapped_column(String)
    predicted_label: Mapped[str] = mapped_column(String, index=True)
    confidence: Mapped[float] = mapped_column(Float)
    bbox_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String)

    scan: Mapped["Scan"] = relationship(back_populates="predictions")


class UserLabel(Base):
    __tablename__ = "user_labels"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    label: Mapped[str] = mapped_column(String, index=True)
    bbox_id: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(String, nullable=True)
    is_new_candidate: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    scan: Mapped["Scan"] = relationship(back_populates="user_labels")


# ─────────────────────────────────────────────
# NEW TABLES
# ─────────────────────────────────────────────

class User(Base):
    """App users (email + password auth)."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="user", nullable=True)  # ← ADD THIS
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goals: Mapped["UserGoal | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    meals: Mapped[list["MealLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

class UserGoal(Base):
    """Per-user daily macro targets."""
    __tablename__ = "user_goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    calorie_goal: Mapped[int] = mapped_column(Integer, default=2000)
    protein_goal: Mapped[int] = mapped_column(Integer, default=150)
    carbs_goal: Mapped[int] = mapped_column(Integer, default=250)
    fat_goal: Mapped[int] = mapped_column(Integer, default=70)
    fiber_goal: Mapped[int] = mapped_column(Integer, default=30)

    user: Mapped["User"] = relationship(back_populates="goals")


class MealLog(Base):
    """One logged meal entry (post-scan or manual)."""
    __tablename__ = "meal_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    scan_id: Mapped[str | None] = mapped_column(String, nullable=True)   # link back to scan if from scan

    meal_type: Mapped[str] = mapped_column(String, default="meal")  # breakfast/lunch/dinner/snack/meal
    food_name: Mapped[str] = mapped_column(String)
    quantity_g: Mapped[float] = mapped_column(Float, default=100.0)

    # Nutrition per logged quantity
    calories: Mapped[float] = mapped_column(Float, default=0.0)
    protein: Mapped[float] = mapped_column(Float, default=0.0)
    carbs: Mapped[float] = mapped_column(Float, default=0.0)
    fat: Mapped[float] = mapped_column(Float, default=0.0)
    fiber: Mapped[float] = mapped_column(Float, default=0.0)

    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="meals")