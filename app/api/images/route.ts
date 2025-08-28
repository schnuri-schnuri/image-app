import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadImageToS3 } from '../../lib/s3';

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
        return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const imageBuffer = await req.arrayBuffer();
    
    const flippedImageBuffer = await sharp(Buffer.from(imageBuffer))
        .flop() 
        .toBuffer();
    
    try {
        // Upload the flipped image to S3
        const s3Result = await uploadImageToS3(Buffer.from(flippedImageBuffer), contentType);
        
        return NextResponse.json({
            message: 'Received, flipped image horizontally and uploaded to S3.',
            originalSize: imageBuffer.byteLength,
            flippedSize: flippedImageBuffer.length,
            contentType,
            s3: {
                url: s3Result.url,
                key: s3Result.key
            }
        });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return NextResponse.json({
            message: 'Received and flipped image horizontally, but failed to upload to S3.',
            error: (error instanceof Error) ? error.message : 'Unknown error',
            originalSize: imageBuffer.byteLength,
            flippedSize: flippedImageBuffer.length,
            contentType,
        }, { status: 500 });
    }
}