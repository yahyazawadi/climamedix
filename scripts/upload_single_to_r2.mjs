import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env
dotenv.config({ path: path.join(rootDir, '.env') });

const R2_ENDPOINT = process.env.VITE_R2_ENDPOINT;
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL?.replace(/\/+$/, '');

if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ Missing R2 environment variables in .env');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const lessonCode = process.argv[2];
if (!lessonCode) {
  console.error('Usage: node scripts/upload_subtitles_to_r2.mjs <lesson_code> (e.g. m3v1)');
  process.exit(1);
}

const filePath = path.join(rootDir, 'scripts', 'subtitles_ar', `${lessonCode}.vtt`);
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

async function upload() {
  const content = fs.readFileSync(filePath);
  const key = `subtitles/ar/${lessonCode}.vtt`;

  console.log(`🚀 Uploading ${lessonCode}.vtt (${content.length} bytes) to Cloudflare R2: ${key}...`);

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: content,
    ContentType: 'text/vtt; charset=utf-8',
    CacheControl: 'no-cache, max-age=0',
    ContentLength: content.length,
  }));

  console.log(`✅ Upload complete!`);
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  console.log(`🔗 Public URL: ${publicUrl}`);

  // Verification head
  const head = await client.send(new HeadObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  }));
  console.log(`🔍 Verified on R2: Size = ${head.ContentLength} bytes, LastModified = ${head.LastModified?.toISOString()}`);
}

upload().catch((err) => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
