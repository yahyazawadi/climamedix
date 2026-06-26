import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize the S3 client for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

/**
 * Uploads a file to Cloudflare R2 and returns the public URL.
 * @param {File} file - The file to upload.
 * @param {string} folder - The folder to upload to (e.g., 'cvs').
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export async function uploadFileToR2(file, folder = 'uploads') {
  if (!file) return null;

  const fileExtension = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

  const fileArrayBuffer = await file.arrayBuffer();
  const fileUint8Array = new Uint8Array(fileArrayBuffer);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: fileUint8Array,
    ContentType: file.type,
  });

  try {
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error(`Failed to upload file to storage: ${error.message || error.toString()}`);
  }
}
