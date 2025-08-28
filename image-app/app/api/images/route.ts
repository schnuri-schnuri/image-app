import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
        return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const imageBuffer = await req.arrayBuffer();
    
    const flippedImageBuffer = await sharp(Buffer.from(imageBuffer))
        .flop() 
        .toBuffer();

    return NextResponse.json({
        message: 'Received and flipped image horizontally.',
        originalSize: imageBuffer.byteLength,
        flippedSize: flippedImageBuffer.length,
        contentType,
    });
}