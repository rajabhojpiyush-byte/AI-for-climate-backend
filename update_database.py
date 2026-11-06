
import sqlite3

conn = sqlite3.connect("disaster.db")
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(reports)")
columns = [column[1] for column in cursor.fetchall()]

# Add AI reasoning column
if "ai_reasoning" not in columns:
    cursor.execute("""
        ALTER TABLE reports
        ADD COLUMN ai_reasoning TEXT
    """)

# Add human review column
if "human_review_required" not in columns:
    cursor.execute("""
        ALTER TABLE reports
        ADD COLUMN human_review_required BOOLEAN DEFAULT 1
    """)

conn.commit()
conn.close()

print("Database updated successfully!")
