"""
Pytest configuration and fixtures for backend tests.
"""
import pytest
import os
import sys
import tempfile
import sqlite3

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app as app_module
from app import app as flask_app


@pytest.fixture
def app():
    """Create and configure a test application instance with isolated database."""
    # Create a temporary database file for this test
    db_fd, db_path = tempfile.mkstemp()

    # Store original DATABASE value
    original_db = app_module.DATABASE

    # Override the DATABASE path for this test
    app_module.DATABASE = db_path

    # Configure Flask app for testing
    flask_app.config.update({
        'TESTING': True,
        'DATABASE': db_path,
    })

    # Initialize the database with the test path
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(song_id, user_id)
        )
    ''')

    conn.commit()
    conn.close()

    yield flask_app

    # Restore original DATABASE path
    app_module.DATABASE = original_db

    # Cleanup temporary database
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner for the app."""
    return app.test_cli_runner()
