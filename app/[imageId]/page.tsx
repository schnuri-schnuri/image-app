"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { decodeImageId } from '../shared/utils';

export default function ImagePage({ params }: { params: { imageId: string } }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{message?: string, error?: string} | null>(null);
  const router = useRouter();

  // Decode the base64 URL
  const imageUrl = decodeImageId(params.imageId);

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    
    setIsDeleting(true);
    setDeleteResult(null);
    
    try {
      const response = await fetch(`/api/images/${params.imageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          setDeleteResult({ error: errorJson.error || `Delete failed with status ${response.status}` });
        } catch (e) {
          setDeleteResult({ error: `Delete failed with status ${response.status}: ${errorText || response.statusText}` });
        }
        return;
      }
      
      const result = await response.json();
      setDeleteResult({ message: `${result.message}` });
      
      // Redirect to homepage after successful deletion
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteResult({ error: 'Error deleting image' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!imageUrl) {
    return (
      <div className="font-sans grid items-center justify-items-center min-h-screen p-8">
        <div className="p-3 bg-red-100 text-red-800 rounded">Invalid image ID</div>
      </div>
    );
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">Image Viewer</h1>
        
        <div className="w-full max-w-lg space-y-6">
          <div className="relative w-full h-[400px] border rounded overflow-hidden">
            <Image 
              src={imageUrl}
              alt="Flipped image"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={handleDeleteImage}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Image'}
            </button>
            
            <a 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Home
            </a>
          </div>
          
          {deleteResult?.message && (
            <div className="p-3 bg-green-100 text-green-800 rounded">{deleteResult.message}</div>
          )}
          
          {deleteResult?.error && (
            <div className="p-3 bg-red-100 text-red-800 rounded">{deleteResult.error}</div>
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
