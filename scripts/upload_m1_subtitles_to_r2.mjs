import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const R2_ENDPOINT = process.env.VITE_R2_ENDPOINT;
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL?.replace(/\/+$/, '');

if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Missing R2 environment variables in .env');
  process.exit(1);
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const lessons = ['m1v1', 'm1v2', 'm1v3', 'm1v4', 'm1v5'];
const subtitlesDir = path.resolve(process.cwd(), 'scripts', 'subtitles_ar');

async function uploadSubtitles() {
  console.log(`Starting Cloudflare R2 upload for Module 1 subtitles to bucket: ${R2_BUCKET}...`);
  for (const code of lessons) {
    const filePath = path.join(subtitlesDir, `${code}.vtt`);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    const key = `subtitles/ar/${code}.vtt`;
    const content = fs.readFileSync(filePath);
    console.log(`Uploading ${filePath} (${content.length} bytes) -> ${key}...`);

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: content,
      ContentType: 'text/vtt; charset=utf-8',
      ContentLength: content.length,
      CacheControl: 'no-cache, max-age=0'
    }));

    console.log(`✓ Successfully uploaded: ${R2_PUBLIC_URL}/${key}`);
  }
  console.log('All Module 1 Arabic subtitles updated on Cloudflare R2 successfully!');
}

uploadSubtitles().catch(err => {
  console.error('Upload error:', err);
  process.exit(1);
});
