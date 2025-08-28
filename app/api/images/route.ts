import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from 'uuid';

// Fügen Sie eine OPTIONS-Methode hinzu, falls CORS-Probleme auftreten
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Allow': 'POST, OPTIONS',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    console.log("received POST request")
    if (!contentType.startsWith('image/')) {
        console.log("Not an image: ", contentType);
        return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    try {
        // const imageBuffer = await req.arrayBuffer();
        
        // const flippedImageBuffer = await sharp(Buffer.from(imageBuffer))
        //     .flop() 
        //     .toBuffer();

        const fileExtension = contentType.split('/')[1] || 'jpg';
        const path = `${uuidv4()}.${fileExtension}`;
            
        const blob = await put(path, flippedImageBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });

        console.log("Image processed and uploaded successfully");
        return NextResponse.json({
            message: 'Received, flipped image horizontally and uploaded.',
            // originalSize: imageBuffer.byteLength,
            // flippedSize: flippedImageBuffer.length,
            contentType,
            image: {
                url: blob.url
            }
        });
    } catch (error) {
        console.error("Error processing image:", error);
        return NextResponse.json({ 
            error: 'Error processing image' 
        }, { status: 500 });
    }
}