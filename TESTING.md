# Testing Strategy for Radio Calico

## Overview

This document outlines the comprehensive testing strategy for both the backend (Flask/Python) and frontend (JavaScript) rating systems.

## Backend Testing (Flask + Python)

### Framework: pytest + pytest-flask

**Why pytest?**
- Native Python testing framework
- Excellent fixture support for database mocking
- Flask integration via `pytest-flask`
- Parametrized testing for multiple scenarios
- Coverage reporting with `pytest-cov`

### Test Coverage Areas

#### 1. Database Layer Tests (`tests/test_database.py`)
- `test_init_db()` - Database initialization
- `test_get_db_connection()` - Connection establishment
- `test_create_tables()` - Schema validation
- `test_unique_constraints()` - Email/song+user uniqueness

#### 2. Rating Logic Tests (`tests/test_ratings.py`)
- `test_rate_song_new()` - First-time rating insertion
- `test_rate_song_update()` - Update existing rating
- `test_rate_song_toggle()` - Thumbs up → thumbs down
- `test_get_ratings_count()` - Accurate thumbs up/down counts
- `test_rating_validation()` - Invalid rating values (not 0 or 1)
- `test_missing_user_id()` - Missing required fields
- `test_get_user_rating()` - Check user's existing rating

#### 3. API Endpoint Tests (`tests/test_api.py`)
- `test_get_ratings()` - GET /api/ratings/<song_id>
- `test_post_rating()` - POST /api/ratings/<song_id>
- `test_get_user_rating()` - GET /api/ratings/<song_id>/user/<user_id>
- `test_metadata_proxy()` - GET /api/metadata
- `test_cors_headers()` - CORS configuration validation

#### 4. Edge Cases (`tests/test_edge_cases.py`)
- `test_concurrent_ratings()` - Race conditions
- `test_invalid_song_id()` - Malformed song IDs
- `test_sql_injection()` - Security validation
- `test_large_volume()` - Performance with 1000+ ratings

### Test Database Strategy
- Use in-memory SQLite (`:memory:`) for speed
- `conftest.py` fixtures for test database setup/teardown
- Isolated tests - no shared state between tests

### Example Backend Test Structure

```python
# tests/conftest.py
import pytest
from app import app as flask_app, init_db
import sqlite3
import os

@pytest.fixture
def app():
    """Create application for testing."""
    flask_app.config['TESTING'] = True
    flask_app.config['DATABASE'] = ':memory:'

    with flask_app.app_context():
        init_db()

    yield flask_app

@pytest.fixture
def client(app):
    """Test client for making requests."""
    return app.test_client()

@pytest.fixture
def db_connection(app):
    """Provide database connection for tests."""
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()
```

```python
# tests/test_ratings.py
def test_rate_song_new(client):
    """Test creating a new rating."""
    response = client.post('/api/ratings/song123', json={
        'user_id': 'fp_abc123',
        'rating': 1
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == 'Rating saved successfully'
    assert data['thumbs_up'] == 1
    assert data['thumbs_down'] == 0

def test_rate_song_update(client):
    """Test updating an existing rating."""
    # First rating
    client.post('/api/ratings/song123', json={
        'user_id': 'fp_abc123',
        'rating': 1
    })

    # Update rating
    response = client.post('/api/ratings/song123', json={
        'user_id': 'fp_abc123',
        'rating': 0
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == 'Rating updated successfully'
    assert data['thumbs_up'] == 0
    assert data['thumbs_down'] == 1

def test_invalid_rating_value(client):
    """Test rating validation."""
    response = client.post('/api/ratings/song123', json={
        'user_id': 'fp_abc123',
        'rating': 5
    })

    assert response.status_code == 400
    data = response.get_json()
    assert 'must be 0' in data['error'] or 'must be 1' in data['error']
```

---

## Frontend Testing (JavaScript)

### Framework: Jest + jsdom

**Why Jest?**
- Zero-config testing for JavaScript
- Built-in mocking and assertion library
- jsdom for DOM manipulation testing
- Async/await support for API calls
- Snapshot testing for UI components

### Test Coverage Areas

#### 1. Browser Fingerprinting Tests (`tests/frontend/fingerprint.test.js`)
- `test_generateUserId()` - Consistent hash generation
- `test_getBrowserFingerprint()` - Fingerprint data collection
- `test_getWebGLFingerprint()` - WebGL renderer detection
- `test_hashString()` - SHA-256 hashing
- `test_userId_format()` - "fp_" prefix validation

#### 2. Rating Submission Tests (`tests/frontend/ratings.test.js`)
- `test_rateSong_success()` - Successful API call
- `test_rateSong_network_error()` - Network failure handling
- `test_rateSong_api_error()` - API error responses
- `test_getSongId()` - Song ID generation from metadata
- `test_loadRatings()` - Load existing user rating

#### 3. UI Update Tests (`tests/frontend/ui.test.js`)
- `test_thumbsUp_active_state()` - Button highlighting
- `test_thumbsDown_active_state()` - Button highlighting
- `test_rating_toggle()` - Switch between up/down
- `test_rating_visual_feedback()` - User feedback display

#### 4. API Integration Tests (`tests/frontend/api.test.js`)
- `test_fetchMetadata()` - Metadata endpoint
- `test_rating_api_call()` - Rating submission
- `test_check_user_rating()` - User rating check
- `test_api_timeout()` - Request timeout handling

### Mocking Strategy
- Mock `fetch()` API calls with `jest.fn()`
- Mock browser APIs (Canvas, WebGL) with jsdom
- Mock `crypto.subtle.digest()` for fingerprinting tests
- Isolated DOM testing with `document.createElement()`

### Example Frontend Test Structure

```javascript
// tests/frontend/ratings.test.js
import { rateSong, getSongId, generateUserId } from '../../public/app.js';

// Mock fetch API
global.fetch = jest.fn();

describe('Rating System', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('rateSong submits rating successfully', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Rating saved successfully',
        thumbs_up: 1,
        thumbs_down: 0
      })
    });

    const result = await rateSong(1);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ratings/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  test('rateSong handles network error', async () => {
    // Mock network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(rateSong(1)).rejects.toThrow('Network error');
  });

  test('getSongId generates consistent base64 ID', () => {
    const data = {
      artist: 'Test Artist',
      title: 'Test Song'
    };

    const id1 = getSongId(data);
    const id2 = getSongId(data);

    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
  });
});

describe('Browser Fingerprinting', () => {
  test('generateUserId creates fp_ prefixed ID', async () => {
    const userId = await generateUserId();

    expect(userId).toMatch(/^fp_[a-f0-9]{16}$/);
  });

  test('fingerprint is consistent for same browser', async () => {
    const id1 = await generateUserId();
    const id2 = await generateUserId();

    expect(id1).toBe(id2);
  });
});
```

---

## Test Execution

### Backend Tests

```bash
# Install testing dependencies
pip install pytest pytest-flask pytest-cov

# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_ratings.py

# Run with verbose output
pytest -v

# Run tests matching pattern
pytest -k "rating"
```

### Frontend Tests

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest jsdom

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ratings.test.js

# Watch mode (re-run on changes)
npm test -- --watch

# Update snapshots
npm test -- -u
```

---

## Continuous Integration (CI)

### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-flask pytest-cov
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Coverage Goals

**Backend:**
- **Target:** 90% code coverage
- **Critical paths:** 100% coverage for rating logic
- **Database operations:** 95% coverage

**Frontend:**
- **Target:** 85% code coverage
- **Rating functions:** 100% coverage
- **UI interactions:** 80% coverage

---

## Test Data Strategy

### Backend Test Data
```python
# tests/fixtures/ratings.py
SAMPLE_RATINGS = [
    {'song_id': 'song1', 'user_id': 'fp_user1', 'rating': 1},
    {'song_id': 'song1', 'user_id': 'fp_user2', 'rating': 0},
    {'song_id': 'song2', 'user_id': 'fp_user1', 'rating': 1},
]

SAMPLE_METADATA = {
    'artist': 'Test Artist',
    'title': 'Test Song',
    'album': 'Test Album',
    'date': '2024',
    'bit_depth': 16,
    'sample_rate': 44100
}
```

### Frontend Test Data
```javascript
// tests/fixtures/metadata.js
export const SAMPLE_METADATA = {
  artist: 'Test Artist',
  title: 'Test Song',
  album: 'Test Album',
  date: '2024',
  bit_depth: 16,
  sample_rate: 44100
};

export const SAMPLE_RATING_RESPONSE = {
  message: 'Rating saved successfully',
  song_id: 'c29uZzE=',
  thumbs_up: 5,
  thumbs_down: 2
};
```

---

## Best Practices

1. **Isolation**: Each test should be independent
2. **Descriptive names**: `test_rate_song_updates_existing_rating_to_thumbs_down()`
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: API calls, database, browser APIs
5. **Test edge cases**: Empty strings, null values, concurrent operations
6. **Performance tests**: Load testing with high volume
7. **Security tests**: SQL injection, XSS prevention

---

## Quick Reference

| Task | Backend Command | Frontend Command |
|------|----------------|------------------|
| Run all tests | `pytest` | `npm test` |
| Coverage report | `pytest --cov=app --cov-report=html` | `npm test -- --coverage` |
| Watch mode | `pytest-watch` | `npm test -- --watch` |
| Specific file | `pytest tests/test_ratings.py` | `npm test -- ratings.test.js` |
| Verbose | `pytest -v` | `npm test -- --verbose` |

---

## Next Steps

1. Install testing dependencies
2. Create test directory structure
3. Write initial test cases for rating endpoints
4. Set up CI/CD pipeline
5. Achieve 90% code coverage target
6. Add integration tests for full user flow
