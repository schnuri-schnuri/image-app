import { NextRequest, NextResponse } from 'next/server';
import { Jimp } from 'jimp';
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
    const contentType = req.headers.get('content-type') || '';
    console.log("received POST request")
    if (contentType !== "image/jpeg" && contentType !== "image/png" ) {
        console.log("Not an image: ", contentType);
        return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    try {
        const imageBuffer = await req.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);
        
        const apiKey = process.env.WITHOUTBG_API_KEY;
        if (!apiKey) {
            console.error("No WITHOUTBG_API_KEY found");
            return NextResponse.json({ error: 'Error removing background' }, { status: 500 });
        }

        // Create form data for the API request
        const formData = new FormData();
        formData.append('file', buffer, {
            filename: 'image.jpg',
            contentType: contentType
        });
        
        // Send request to WithoutBG API
        const withoutBgResponse = await fetch('https://api.withoutbg.com/v1.0/image-without-background', {
            method: 'POST',
            body: formData,
            headers: {
                'X-API-Key': apiKey
            }
        });
        
        if (!withoutBgResponse.ok) {
            let errorText = await withoutBgResponse.text();
            console.error(`Error with WithoutBG API: Status ${withoutBgResponse.status}, Response: ${errorText}`);
            try {
                // Try to parse as JSON to get detailed error
                const errorJson = JSON.parse(errorText);
                console.error("Parsed error:", errorJson.error || "No error message");
            } catch (e) {
                // If not JSON, use raw text
                console.error("Could not parse error as JSON");
            }
            return NextResponse.json({ 
                error: 'Error removing background',
                status: withoutBgResponse.status,
                details: errorText
            }, { status: 500 });
        }

        // Get the image with transparent background
        const bgRemovedBuffer = Buffer.from(await withoutBgResponse.arrayBuffer());

        // Flip the image horizontally
        const image = await Jimp.read(bgRemovedBuffer);
        image.flip({horizontal: true, vertical: false});
        
        // WithoutBG API returns a PNG with transparent background
        const outputContentType = 'image/png';
        const flippedImageBuffer = await image.getBuffer(outputContentType);
        
        // Upload to Vercel Blob
        const path = `${uuidv4()}.png`;
            
        const blob = await put(path, flippedImageBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });

        console.log("Image processed and uploaded successfully");
        return NextResponse.json({
            message: 'Received, removed background, flipped image horizontally and uploaded.',
            originalSize: imageBuffer.byteLength,
            flippedSize: flippedImageBuffer.length,
            contentType: outputContentType,
            fileExtension: 'png',
            bgRemoved: true,
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