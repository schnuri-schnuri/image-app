import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads an image to an S3 bucket
 * @param imageBuffer - The image buffer to be uploaded
 * @param contentType - The content type of the image (e.g. image/jpeg)
 * @param bucketName - The name of the S3 bucket (or default from environment variable)
 * @returns An object with the URL of the uploaded image and its S3 key
 */
export async function uploadImageToS3(
  imageBuffer: Buffer, 
  contentType: string,
  bucketName = process.env.AWS_S3_BUCKET_NAME
): Promise<{ url: string; key: string }> {
  if (!bucketName) {
    throw new Error('S3 bucket name is not defined');
  }

  const fileExtension = contentType.split('/')[1] || 'jpg';
  const key = `images/${uuidv4()}.${fileExtension}`;

  // Parameters for S3 upload
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType,
  };

  return s3Client.send(new PutObjectCommand(params))
    .then(() => {
      const region = process.env.AWS_REGION || 'eu-central-1';
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      
      return { url, key };
    })
    .catch((error) => {
      console.error('Error uploading image to S3:', error);
      throw new Error('Failed to upload image to S3');
    });
}
