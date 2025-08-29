import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '../route';

// Mock vercel/blob
vi.mock('@vercel/blob', () => ({
  del: vi.fn().mockResolvedValue({ success: true })
}));

// Mock utils
vi.mock('../../../../shared/utils', () => ({
  decodeImageId: vi.fn((imageId) => {
    if (imageId === 'validImageId') {
      return 'https://example.blob.vercel-storage.com/test-image-abc123.png';
    }
    return '';
  })
}));

describe('Image DELETE API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an image successfully', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/api/images/validImageId', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ imageId: 'validImageId' });
    const { del } = await import('@vercel/blob');

    // Act
    const response = await DELETE(req, { params });
    const body = await response.json();

    // Assert
    expect(del).toHaveBeenCalledWith('test-image-abc123.png');
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Image deleted successfully',
      deletedUrl: 'https://example.blob.vercel-storage.com/test-image-abc123.png'
    });
  });

  it('should return 400 for invalid image ID', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/api/images/invalidImageId', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ imageId: 'invalidImageId' });

    // Act
    const response = await DELETE(req, { params });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid image ID' });
  });

  it('should handle blob deletion errors', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/api/images/validImageId', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ imageId: 'validImageId' });
    const { del } = await import('@vercel/blob');
    vi.mocked(del).mockRejectedValueOnce(new Error('Blob deletion failed'));

    // Act
    const response = await DELETE(req, { params });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Error deleting image' });
  });
});
