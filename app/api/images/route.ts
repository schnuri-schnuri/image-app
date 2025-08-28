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
        
        const apiKey = process.env.PIXBAY_API_KEY;
        if (!apiKey) {
            console.error("No PIXBAY_API_KEY found");
            return NextResponse.json({ error: 'Error removing background' }, { status: 500 });
        }

        const formData = new FormData();
        formData.append('img', buffer, {
            filename: 'image.jpg',
            contentType: contentType
        });
        
        const pixlabResponse = await fetch(`https://api.pixlab.io/bgremove?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });
        
        if (!pixlabResponse.ok) {
            console.error("Error with PixLab API:", await pixlabResponse.text());
            return NextResponse.json({ error: 'Error removing background' }, { status: 500 });
        }

        // Process the response from PixLab
        const pixlabData = await pixlabResponse.json();
        
        // Überprüfe den Status der Antwort
        if (pixlabData.status !== 200) {
            console.error("Error from PixLab API:", pixlabData.error || "Unknown error");
            return NextResponse.json({ error: 'Error removing background' }, { status: 500 });
        }
        
        
        if (!pixlabData.imgData) {
            console.error("No image data (link or imgData) in PixLab response");
            return NextResponse.json({ error: 'Error removing background: no image data returned' }, { status: 500 });
        }

        console.log("Using base64 image data from PixLab API response");
        const bgRemovedBuffer = Buffer.from(pixlabData.imgData, 'base64');

        
        const image = await Jimp.read(bgRemovedBuffer);
        image.flip({horizontal: true, vertical: false});
        
        // Verwende den Mime-Type aus der PixLab-Antwort, wenn verfügbar
        const outputContentType = pixlabData.mimeType || contentType;
        const flippedImageBuffer = await image.getBuffer(outputContentType);
        
        // Verwende die Dateiendung aus der PixLab-Antwort, wenn verfügbar
        const fileExtension = pixlabData.extension || outputContentType.split('/')[1] || 'jpg';
        const path = `${uuidv4()}.${fileExtension}`;
            
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
            fileExtension,
            bgRemoved: true,
            pixlabResponseType: pixlabData.link ? 'link' : 'base64',
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