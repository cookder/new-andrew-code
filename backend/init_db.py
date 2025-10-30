"""
Initialize database - create all tables
Run this script to set up the database
"""
from models.database import engine, Base
from models.call import Call, Transcription, CallAnalytics
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Create all database tables"""
    logger.info("Creating database tables...")

    # Import all models to ensure they're registered with Base
    # (already done above)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    logger.info("✅ Database tables created successfully!")
    logger.info("Tables created:")
    for table in Base.metadata.tables:
        logger.info(f"  - {table}")

if __name__ == "__main__":
    init_database()
