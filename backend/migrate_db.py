"""
Database Migration Script
Adds new fields to CallAnalytics table
"""
import sqlite3
import os

db_path = "sales_feedback.db"  # Updated to correct database name

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if columns already exist
    cursor.execute("PRAGMA table_info(call_analytics)")
    columns = [col[1] for col in cursor.fetchall()]

    # Add missing columns
    if 'sentiment' not in columns:
        print("Adding 'sentiment' column...")
        cursor.execute("ALTER TABLE call_analytics ADD COLUMN sentiment VARCHAR(50)")

    if 'sentiment_score' not in columns:
        print("Adding 'sentiment_score' column...")
        cursor.execute("ALTER TABLE call_analytics ADD COLUMN sentiment_score FLOAT")

    if 'key_points' not in columns:
        print("Adding 'key_points' column...")
        cursor.execute("ALTER TABLE call_analytics ADD COLUMN key_points TEXT")

    # Update objections_detected to TEXT if it's not already
    # (SQLite doesn't have ALTER COLUMN, so we skip this)

    conn.commit()
    conn.close()
    print("✅ Database migration complete!")
else:
    print("❌ Database not found. Run init_db.py first.")
