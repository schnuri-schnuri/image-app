"use client";
import { useState } from 'react';
import Link from 'next/link';
import { encodeImageUrl } from './shared/utils';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{message?: string, error?: string, imageUrl?: string} | null>(null);

  const handleImageUpload = async () => {
    if (!image) return;
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      console.log("Sending upload request with Content-Type:", image.type);
      const response = await fetch('/api/images', {
        method: 'POST',
        body: image,
        headers: {
          'Content-Type': image.type,
        },
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        console.error("Response error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          setUploadResult({ error: errorJson.error || `Upload failed with status ${response.status}` });
        } catch (e) {
          setUploadResult({ error: `Upload failed with status ${response.status}: ${errorText || response.statusText}` });
        }
        return;
      }
      
      const result = await response.json();
      console.log("Upload success:", result);
      
      // Get the image URL from the response
      const imageUrl = result.image?.url;
      
      setUploadResult({ 
        message: `Background removal successful! The processed image can be viewed below.`,
        imageUrl: imageUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ error: 'Error uploading image' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="text-3xl font-bold mb-4 text-center sm:text-left">The Next Image Flipper</h1>
      <div className="w-full max-w-md space-y-4">
        <label className="block">
          <span className="sr-only">Choose image to upload</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImage(file);
                setUploadResult(null);
              }
            }}
          />
        </label>
        
        {image && (
          <button
            onClick={handleImageUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>
        )}
        
        {uploadResult?.message && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            <p className="mb-2">{uploadResult.message}</p>
            {uploadResult.imageUrl && (
              <div className="flex flex-col gap-2">
                <p className="text-sm">Click the link below to view the image with background removed and horizontally flipped:</p>
                <Link 
                  href={`/${encodeImageUrl(uploadResult.imageUrl)}`}
                  className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Processed Image
                </Link>
                <p className="text-xs mt-1 text-gray-600">
                  You can save or delete the image on the next page.
                </p>
              </div>
            )}
          </div>
        )}
        
        {uploadResult?.error && (
          <div className="p-3 bg-red-100 text-red-800 rounded">{uploadResult.error}</div>
        )}
      </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.juriw.com/imprint"
          target="_blank"
          rel="noopener noreferrer"
        >
          Imprint
        </a>
      </footer>
    </div>
  );
}
