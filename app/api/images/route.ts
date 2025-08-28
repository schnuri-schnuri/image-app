import { NextRequest, NextResponse } from 'next/server';
import { Jimp } from 'jimp';
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    console.log("received POST request")
    if (contentType !== "image/jpeg" && contentType !== "image/png" ) {
        console.log("Not an image: ", contentType);
        return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    try {
        const imageBuffer = await req.arrayBuffer();
        
        const image = await Jimp.read(Buffer.from(imageBuffer));
        image.flip({horizontal: true, vertical: false});
        const flippedImageBuffer = await image.getBuffer(contentType)

        const fileExtension = contentType.split('/')[1] || 'jpg';
        const path = `${uuidv4()}.${fileExtension}`;
            
        const blob = await put(path, flippedImageBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });

        console.log("Image processed and uploaded successfully");
        return NextResponse.json({
            message: 'Received, flipped image horizontally and uploaded.',
            originalSize: imageBuffer.byteLength,
            flippedSize: flippedImageBuffer.length,
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