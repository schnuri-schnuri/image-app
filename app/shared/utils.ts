/**
 * Decodes a URL-encoded and base64 encoded image URL
 * @param encodedId The URL-encoded base64 string
 * @returns The decoded URL or empty string if decoding fails
 */
export function decodeImageId(encodedId: string): string {
  try {
    // Handle empty, null or undefined inputs
    if (!encodedId) {
      return '';
    }
    // First decode the URL encoding, then decode the base64
    const decodedBase64 = decodeURIComponent(encodedId);
    return atob(decodedBase64);
  } catch (error) {
    console.error('Failed to decode image ID:', {error, encodedId});
    return '';
  }
}

/**
 * Encodes a URL as base64 and then URL-encodes it
 * @param url The URL to encode
 * @returns The URL-encoded base64 string
 */
export function encodeImageUrl(url: string): string {
  try {
    // Handle null and undefined values
    if (url === null || url === undefined) {
      return '';
    }
    // First encode as base64, then apply URL encoding
    const base64Encoded = btoa(url);
    return encodeURIComponent(base64Encoded);
  } catch (error) {
    console.error('Failed to encode URL:', {error, url});
    return '';
  }
}
