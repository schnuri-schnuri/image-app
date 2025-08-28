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

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(sharp).toHaveBeenCalledWith(Buffer.from(imageBuffer));
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Received and flipped image horizontally.',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/jpeg',
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
    
    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(mockSharp).toHaveBeenCalledWith(Buffer.from(originalImageBuffer));
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Received and flipped image horizontally.',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/png',
    });
  });
});
