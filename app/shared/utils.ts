/**
 * Decodes a base64 encoded image URL
 * @param base64Id The base64 encoded image URL
 * @returns The decoded URL or empty string if decoding fails
 */
export function decodeImageId(base64Id: string): string {
  try {
    return atob(base64Id);
  } catch (error) {
    console.error('Failed to decode image ID:', error);
    return '';
  }
}

/**
 * Encodes a URL as base64
 * @param url The URL to encode
 * @returns The base64 encoded URL
 */
export function encodeImageUrl(url: string): string {
  try {
    // Handle null and undefined values
    if (url === null || url === undefined) {
      return '';
    }
    return btoa(url);
  } catch (error) {
    console.error('Failed to encode URL:', error);
    return '';
  }
}
