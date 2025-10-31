"""
Database Migration Script
Adds new fields to CallAnalytics and Calls tables
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

    # Calls table migrations (title/account metadata)
    cursor.execute("PRAGMA table_info(calls)")
    call_columns = [col[1] for col in cursor.fetchall()]

    def add_call_column(name: str, definition: str):
        print(f"Adding '{name}' column to calls table...")
        cursor.execute(f"ALTER TABLE calls ADD COLUMN {name} {definition}")

    if 'title' not in call_columns:
        add_call_column('title', 'VARCHAR(255)')

    if 'account_name' not in call_columns:
        add_call_column('account_name', 'VARCHAR(255)')

    if 'account_slug' not in call_columns:
        add_call_column('account_slug', 'VARCHAR(255)')

    if 'meeting_type' not in call_columns:
        add_call_column('meeting_type', 'VARCHAR(100)')

    if 'opportunity_stage' not in call_columns:
        add_call_column('opportunity_stage', 'VARCHAR(50)')

    if 'technical_win' not in call_columns:
        add_call_column('technical_win', 'VARCHAR(50)')

    if 'decision_maker_alignment' not in call_columns:
        add_call_column('decision_maker_alignment', 'VARCHAR(50)')

    if 'customer_timeline' not in call_columns:
        add_call_column('customer_timeline', 'VARCHAR(120)')

    if 'competitor_position' not in call_columns:
        add_call_column('competitor_position', 'VARCHAR(50)')

    if 'ae_assessment' not in call_columns:
        add_call_column('ae_assessment', 'TEXT')

    # Helpful indexes for grouping/filtering
    print("Ensuring indexes exist for account grouping...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_calls_account_name ON calls(account_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_calls_account_slug ON calls(account_slug)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_calls_opportunity_stage ON calls(opportunity_stage)")

    conn.commit()
    conn.close()
    print("✅ Database migration complete!")
else:
    print("❌ Database not found. Run init_db.py first.")
