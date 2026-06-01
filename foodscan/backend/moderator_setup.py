from app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"))
        print("Added role column")
    except Exception:
        print("Role column already exists")

    conn.execute(text("UPDATE users SET role='moderator' WHERE email='moderator@bitewise.internal'"))
    conn.commit()
    print("Done! Moderator role set.")

    result = conn.execute(text("SELECT email, role FROM users"))
    for row in result:
        print(f"  {row[0]} -> {row[1]}")