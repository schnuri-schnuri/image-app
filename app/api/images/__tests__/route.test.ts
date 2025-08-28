import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('sharp', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      flop: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.alloc(120))
    }))
  };
});

vi.mock('../../../lib/s3', () => ({
  uploadImageToS3: vi.fn().mockResolvedValue({
    url: 'https://example-bucket.s3.eu-central-1.amazonaws.com/images/test-image.jpg',
    key: 'images/test-image.jpg'
  })
}));

describe('Images API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should return 400 when content-type is not an image', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Not an image' });
  });

  it('should process image upload correctly', async () => {
    // Arrange
    const imageBuffer = new ArrayBuffer(100);
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'content-type': 'image/jpeg',
      },
      body: imageBuffer,
    });

    vi.spyOn(req, 'arrayBuffer').mockResolvedValue(imageBuffer);
    const sharp = await import('sharp');
    const mockSharp = sharp.default;
    const { uploadImageToS3 } = await import('../../../lib/s3');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(mockSharp).toHaveBeenCalledWith(Buffer.from(imageBuffer));
    expect(uploadImageToS3).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/jpeg'
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Received, flipped image horizontally and uploaded to S3.',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/jpeg',
      s3: {
        url: 'https://example-bucket.s3.eu-central-1.amazonaws.com/images/test-image.jpg',
        key: 'images/test-image.jpg'
      }
    });
  });

  it('should handle empty content-type header', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
    });

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Not an image' });
  });
  
  it('should horizontally flip the uploaded image', async () => {
    // Arrange
    const originalImageBuffer = new ArrayBuffer(100);
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'content-type': 'image/png',
      },
      body: originalImageBuffer,
    });

    vi.spyOn(req, 'arrayBuffer').mockResolvedValue(originalImageBuffer);
    const sharp = await import('sharp');
    const mockSharp = sharp.default;
    const { uploadImageToS3 } = await import('../../../lib/s3');
    
    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(mockSharp).toHaveBeenCalledWith(Buffer.from(originalImageBuffer));
    expect(uploadImageToS3).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png'
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Received, flipped image horizontally and uploaded to S3.',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/png',
      s3: {
        url: 'https://example-bucket.s3.eu-central-1.amazonaws.com/images/test-image.jpg',
        key: 'images/test-image.jpg'
      }
    });
  });
  
  it('should handle S3 upload failures', async () => {
    // Arrange
    const imageBuffer = new ArrayBuffer(100);
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'content-type': 'image/jpeg',
      },
      body: imageBuffer,
    });

    vi.spyOn(req, 'arrayBuffer').mockResolvedValue(imageBuffer);
    const { uploadImageToS3 } = await import('../../../lib/s3');
    vi.mocked(uploadImageToS3).mockRejectedValueOnce(new Error('S3 upload failed'));

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      message: 'Received and flipped image horizontally, but failed to upload to S3.',
      error: 'S3 upload failed',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/jpeg',
    });
  });
});
