import { describe, it, expect } from 'vitest';
import { decodeImageId, encodeImageUrl } from '../utils';

describe('URL encoding and decoding utilities', () => {
  it('should decode an encoded URL back to the original', () => {
    // Test cases with different URLs
    const testUrls = [
      'https://example.com/image1.png',
      'https://cdn.vercel.blob.core.windows.net/images/12345-abcdef.png',
      'https://api.test.com/image?id=123&token=abc',
      'https://localhost:3000/static/images/test_image.jpg',
      'https://subdomain.domain.com/path/to/image.png?version=1'
    ];
    
    testUrls.forEach(url => {
      // Encode URL
      const encoded = encodeImageUrl(url);
      
      // Should not be empty
      expect(encoded).not.toBe('');
      
      // Decode the encoded URL
      const decoded = decodeImageId(encoded);
      
      // The decoded URL should match the original
      expect(decoded).toBe(url);
    });
  });
  
  it('should encode a decoded ID back to the original', () => {
    // Test cases with different encoded URLs
    const testEncodedUrls = [
      encodeImageUrl('https://example.com/image1.png'),
      encodeImageUrl('https://cdn.vercel.blob.core.windows.net/images/test.png'),
      encodeImageUrl('https://api.test.com/image?id=123&token=abc')
    ];
    
    testEncodedUrls.forEach(encodedUrl => {
      // Decode the encoded URL
      const decoded = decodeImageId(encodedUrl);
      
      // Should not be empty
      expect(decoded).not.toBe('');
      
      // Encode the decoded URL
      const reEncoded = encodeImageUrl(decoded);
      
      // The re-encoded URL should match the original encoded URL
      expect(reEncoded).toBe(encodedUrl);
    });
  });
  
  it('should handle invalid inputs gracefully', () => {
    // Test with invalid base64 string
    const invalidBase64 = 'not-a-valid-base64!@#';
    expect(decodeImageId(invalidBase64)).toBe('');
    
    // Test with empty string
    expect(decodeImageId('')).toBe('');
    expect(encodeImageUrl('')).toBe('');
    
    // Test with undefined and null values
    // @ts-expect-error Testing invalid input
    expect(decodeImageId(undefined)).toBe('');
    // @ts-expect-error Testing invalid input
    expect(encodeImageUrl(null)).toBe('');
  });
});
