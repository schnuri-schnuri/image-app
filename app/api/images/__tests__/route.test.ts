import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Simple mocks for all modules
vi.mock('jimp', () => {
  // Create a mock for the flip method
  const flipMock = vi.fn().mockReturnThis();
  const getBufferMock = vi.fn().mockResolvedValue(Buffer.alloc(120));
  
  // Mock image object
  const mockImage = {
    flip: flipMock,
    getBuffer: getBufferMock
  };
  
  return {
    Jimp: {
      read: vi.fn().mockResolvedValue(mockImage)
    }
  };
});

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://example.blob.vercel-storage.com/test-image-abc123.png'
  })
}));

// Mock for node-fetch - simplified
vi.mock('node-fetch', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(110)),
    text: vi.fn().mockResolvedValue("API Error")
  }))
}));

// Mock form-data - minimal
vi.mock('form-data', () => ({
  default: vi.fn().mockImplementation(() => ({
    append: vi.fn()
  }))
}));

// Mock environment variables
vi.stubEnv('WITHOUTBG_API_KEY', 'test-api-key');

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
    const { Jimp } = await import('jimp');
    const { put } = await import('@vercel/blob');
    const fetch = await import('node-fetch');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(fetch.default).toHaveBeenCalledWith(
      'https://api.withoutbg.com/v1.0/image-without-background',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'test-api-key'
        })
      })
    );
    expect(Jimp.read).toHaveBeenCalled();
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('.png'),
      expect.any(Buffer),
      {
        access: 'public',
        addRandomSuffix: true,
      }
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Received, removed background, flipped image horizontally and uploaded.',
      originalSize: 100,
      flippedSize: 120,
      contentType: 'image/png',
      fileExtension: 'png',
      bgRemoved: true,
      image: {
        url: 'https://example.blob.vercel-storage.com/test-image-abc123.png'
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
    
    // Act
    await POST(req);

    // Assert
    const { Jimp } = await import('jimp');
    const readSpy = vi.mocked(Jimp.read);
    
    // Check if read was called
    expect(readSpy).toHaveBeenCalled();
    
    // Check if flip was called with the correct parameters
    // We can access the mock image returned by read
    const mockImage = await readSpy.mock.results[0].value;
    expect(mockImage.flip).toHaveBeenCalledWith({horizontal: true, vertical: false});
  });
  
  it('should handle Blob upload failures', async () => {
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
    const { put } = await import('@vercel/blob');
    vi.mocked(put).mockRejectedValueOnce(new Error('Blob upload failed'));

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: 'Error processing image'
    });
  });
  
  it('should handle WithoutBG API failures', async () => {
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
    
    // Simplified mocking for error case
    const fetch = await import('node-fetch');
    vi.mocked(fetch.default).mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('Bad request'),
      arrayBuffer: vi.fn(),
      json: vi.fn()
    } as any)); // 'as any' avoids TypeScript errors

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: 'Error removing background',
      status: 400
    });
  });
  
  it('should handle missing API key', async () => {
    // Arrange
    vi.stubEnv('WITHOUTBG_API_KEY', '');
    const imageBuffer = new ArrayBuffer(100);
    const req = new NextRequest('http://localhost:3000/api/images', {
      method: 'POST',
      headers: {
        'content-type': 'image/jpeg',
      },
      body: imageBuffer,
    });

    vi.spyOn(req, 'arrayBuffer').mockResolvedValue(imageBuffer);

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Error removing background'
    });
    
    // Restore API key for other tests
    vi.stubEnv('WITHOUTBG_API_KEY', 'test-api-key');
  });
});
