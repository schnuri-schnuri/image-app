import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { decodeImageId } from '../../../shared/utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    // Decode the base64 URL
    const imageUrl = decodeImageId((await params).imageId);
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }
    
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    
    // The pathname starts with '/', so we need to remove it to get the blob path
    const blobPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    
    console.log(`Deleting blob at path: ${blobPath}`);
    
    // Delete from Vercel Blob storage
    await del(blobPath);
    
    return NextResponse.json({
      message: 'Image deleted successfully',
      deletedUrl: imageUrl
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      error: 'Error deleting image' 
    }, { status: 500 });
  }
}
