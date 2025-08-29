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
      'https://subdomain.domain.com/path/to/image.png?version=1',
      'https://9cthwswgtwmyyfos.public.blob.vercel-storage.com/e00bb4a9-0f74-47a6-8ea5-1c5682a1e5ff-FUnDWrHJAkjOUiYKpN2bOEANXljtCk.png'
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
    // Test cases with different URLs to encode
    const testUrls = [
      'https://example.com/image1.png',
      'https://cdn.vercel.blob.core.windows.net/images/test.png',
      'https://api.test.com/image?id=123&token=abc',
      'https://9cthwswgtwmyyfos.public.blob.vercel-storage.com/e00bb4a9-0f74-47a6-8ea5-1c5682a1e5ff-FUnDWrHJAkjOUiYKpN2bOEANXljtCk.png'
    ];
    
    testUrls.forEach(url => {
      // Encode the URL
      const encoded = encodeImageUrl(url);
      
      // Decode the encoded URL
      const decoded = decodeImageId(encoded);
      
      // Should not be empty
      expect(decoded).not.toBe('');
      
      // Re-encode the decoded URL
      const reEncoded = encodeImageUrl(decoded);
      
      // The re-encoded URL should match the original encoded URL
      expect(reEncoded).toBe(encoded);
      
      // The decoded URL should match the original URL
      expect(decoded).toBe(url);
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

  it('should properly handle URL-encoded Base64 strings', () => {
    // URL-encoded Base64 string example
    const encodedUrl = 'aHR0cHM6Ly85Y3Rod3N3Z3R3bXl5Zm9zLnB1YmxpYy5ibG9iLnZlcmNlbC1zdG9yYWdlLmNvbS8wN2RlMjEwNi05NGNhLTQ1YWItYTc3OC02NDMwZjMyZjk4OGUtbG54eTdvSklqVkdwRmhCcGZiUW5xMktQRFM2VWttLnBuZw%3D%3D';
    
    // Decode the URL-encoded Base64 string
    const decoded = decodeImageId(encodedUrl);
    
    // Should be a valid URL
    expect(decoded).toContain('https://');
    
    // Re-encode the URL
    const reEncoded = encodeImageUrl(decoded);
    
    // The re-encoded URL should contain URL-encoded characters
    expect(reEncoded).toContain('%3D'); // URL-encoded '='
    
    // Decode again to verify the round-trip works
    const reDecoded = decodeImageId(reEncoded);
    
    // The re-decoded URL should match the original decoded URL
    expect(reDecoded).toBe(decoded);
  });
});
