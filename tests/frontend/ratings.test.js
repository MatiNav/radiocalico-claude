/**
 * Frontend tests for the rating system
 */

// Mock fetch API
global.fetch = jest.fn();

// Mock crypto.subtle for fingerprinting
global.crypto = {
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

describe('Rating System - Song ID Generation', () => {
  test('getSongId generates base64 encoded ID from artist and title', () => {
    // This is a standalone function we'll test
    const getSongId = (data) => {
      return btoa(encodeURIComponent(`${data.artist}-${data.title}`));
    };

    const testData = {
      artist: 'Test Artist',
      title: 'Test Song'
    };

    const songId = getSongId(testData);

    // Should return a base64 encoded string
    expect(songId).toBeTruthy();
    expect(typeof songId).toBe('string');
    expect(songId).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern

    // Should be consistent
    const songId2 = getSongId(testData);
    expect(songId).toBe(songId2);

    // Different songs should have different IDs
    const differentData = {
      artist: 'Different Artist',
      title: 'Different Song'
    };
    const differentId = getSongId(differentData);
    expect(songId).not.toBe(differentId);
  });
});

describe('Rating System - API Mocking', () => {
  beforeEach(() => {
    // Clear mock before each test
    fetch.mockClear();
  });

  test('rateSong makes POST request with correct data', async () => {
    // Mock successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Rating saved successfully',
        song_id: 'test123',
        thumbs_up: 1,
        thumbs_down: 0
      })
    });

    // Simulate the rateSong function
    const rateSong = async (songId, userId, rating) => {
      const response = await fetch(`/api/ratings/${songId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          rating: rating
        })
      });

      if (!response.ok) {
        throw new Error('Rating failed');
      }

      return await response.json();
    };

    const result = await rateSong('test123', 'fp_user_123', 1);

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/ratings/test123',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"rating":1')
      })
    );

    // Verify response
    expect(result.message).toBe('Rating saved successfully');
    expect(result.thumbs_up).toBe(1);
  });

  test('rateSong handles network errors', async () => {
    // Mock network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const rateSong = async (songId, userId, rating) => {
      const response = await fetch(`/api/ratings/${songId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          rating: rating
        })
      });

      return await response.json();
    };

    // Should throw error
    await expect(rateSong('test123', 'fp_user_123', 1)).rejects.toThrow('Network error');
  });
});

describe('Browser Fingerprinting - User ID Format', () => {
  test('User ID has correct format with fp_ prefix', () => {
    // Simulate user ID generation
    const generateUserId = (hash) => {
      return 'fp_' + hash;
    };

    const testHash = 'abc123def4567890';
    const userId = generateUserId(testHash);

    // Should have fp_ prefix
    expect(userId).toMatch(/^fp_/);
    expect(userId).toBe('fp_abc123def4567890');

    // Should be consistent for same hash
    const userId2 = generateUserId(testHash);
    expect(userId).toBe(userId2);
  });

  test('User ID format validation', () => {
    const validateUserId = (userId) => {
      return /^fp_[a-f0-9]{16}$/.test(userId);
    };

    // Valid user IDs
    expect(validateUserId('fp_0123456789abcdef')).toBe(true);
    expect(validateUserId('fp_abcdef0123456789')).toBe(true);

    // Invalid user IDs
    expect(validateUserId('user_123')).toBe(false);
    expect(validateUserId('fp_')).toBe(false);
    expect(validateUserId('fp_short')).toBe(false);
    expect(validateUserId('fp_UPPERCASE123456')).toBe(false); // Should be lowercase
  });
});
