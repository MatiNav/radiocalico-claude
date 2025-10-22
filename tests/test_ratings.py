"""
Tests for the rating system endpoints.
"""


def test_rate_song_new(client):
    """Test creating a new rating for a song."""
    # Submit a new rating
    response = client.post('/api/ratings/song123', json={
        'user_id': 'fp_test_user_123',
        'rating': 1
    })

    # Check response
    assert response.status_code == 200
    data = response.get_json()

    assert data['message'] == 'Rating saved successfully'
    assert data['song_id'] == 'song123'
    assert data['thumbs_up'] == 1
    assert data['thumbs_down'] == 0


def test_rate_song_update(client):
    """Test updating an existing rating."""
    # First rating - thumbs up
    client.post('/api/ratings/song456', json={
        'user_id': 'fp_test_user_456',
        'rating': 1
    })

    # Update to thumbs down
    response = client.post('/api/ratings/song456', json={
        'user_id': 'fp_test_user_456',
        'rating': 0
    })

    # Check response
    assert response.status_code == 200
    data = response.get_json()

    assert data['message'] == 'Rating updated successfully'
    assert data['thumbs_up'] == 0
    assert data['thumbs_down'] == 1


def test_rate_song_invalid_rating(client):
    """Test rating validation - rating must be 0 or 1."""
    response = client.post('/api/ratings/song789', json={
        'user_id': 'fp_test_user_789',
        'rating': 5  # Invalid rating
    })

    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert '0' in data['error'] or '1' in data['error']


def test_rate_song_missing_fields(client):
    """Test that user_id and rating are required."""
    # Missing rating
    response = client.post('/api/ratings/song999', json={
        'user_id': 'fp_test_user_999'
    })
    assert response.status_code == 400

    # Missing user_id
    response = client.post('/api/ratings/song999', json={
        'rating': 1
    })
    assert response.status_code == 400


def test_get_ratings(client):
    """Test getting ratings for a song."""
    # Add some ratings
    client.post('/api/ratings/song_popular', json={
        'user_id': 'fp_user_1',
        'rating': 1
    })
    client.post('/api/ratings/song_popular', json={
        'user_id': 'fp_user_2',
        'rating': 1
    })
    client.post('/api/ratings/song_popular', json={
        'user_id': 'fp_user_3',
        'rating': 0
    })

    # Get ratings
    response = client.get('/api/ratings/song_popular')

    assert response.status_code == 200
    data = response.get_json()

    assert data['song_id'] == 'song_popular'
    assert data['thumbs_up'] == 2
    assert data['thumbs_down'] == 1


def test_get_user_rating(client):
    """Test checking if a user has rated a song."""
    # Add a rating
    client.post('/api/ratings/song_check', json={
        'user_id': 'fp_user_check',
        'rating': 1
    })

    # Check if user has rated
    response = client.get('/api/ratings/song_check/user/fp_user_check')

    assert response.status_code == 200
    data = response.get_json()

    assert data['has_rated'] is True
    assert data['rating'] == 1

    # Check for user who hasn't rated
    response = client.get('/api/ratings/song_check/user/fp_user_other')

    assert response.status_code == 200
    data = response.get_json()

    assert data['has_rated'] is False
