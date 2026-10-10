import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, statSync, createReadStream } from 'fs';
import { resolve, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const R2_ENDPOINT = process.env.VITE_R2_ENDPOINT;
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = (process.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('[ERROR] Missing R2 credentials in .env!');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Target videos for Module 3 and Module 4 (16 total)
const VIDEOS_TO_UPLOAD = [
  // Module 3
  'm3v1.mp4', 'm3v2.mp4', 'm3v3.mp4', 'm3v4.mp4', 'm3v5.mp4', 'm3v6.mp4', 'm3v7.mp4',
  // Module 4
  'm4v1.mp4', 'm4v2.mp4', 'm4v3.mp4', 'm4v4.mp4', 'm4v5.mp4', 'm4v6.mp4', 'm4v7.mp4', 'm4v8.mp4', 'm4v9.mp4'
];

const VIDEO_DIRS = [
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\videos_h264_1080p',
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\m3_source\\m3',
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\m4_source\\m4'
];

function findVideoFile(filename) {
  for (const dir of VIDEO_DIRS) {
    const candidate = join(dir, filename);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function checkExistsOnR2(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

async function uploadFile(key, localPath) {
  const stats = statSync(localPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  const stream = createReadStream(localPath);

  console.log(`[UPLOADING] ${key} (${sizeMB} MB)...`);
  const t0 = Date.now();

  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: stream,
    ContentLength: stats.size,
    ContentType: 'video/mp4',
    CacheControl: 'public, max-age=31536000, immutable'
  }));

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[SUCCESS]   ${key} uploaded in ${elapsed}s! (${R2_PUBLIC_URL}/${key})`);
}

async function main() {
  console.log('================================================================');
  console.log('  CLIMAMEDIX: UPLOAD M3 & M4 VIDEOS TO CLOUDFLARE R2            ');
  console.log('================================================================');
  console.log(`Target Bucket  : ${R2_BUCKET}`);
  console.log(`Endpoint       : ${R2_ENDPOINT}`);
  console.log(`Total Targets  : ${VIDEOS_TO_UPLOAD.length} videos`);
  console.log('----------------------------------------------------------------\n');

  let uploadedCount = 0;
  let skippedCount = 0;
  const tStart = Date.now();

  for (const filename of VIDEOS_TO_UPLOAD) {
    const localPath = findVideoFile(filename);
    if (!localPath) {
      console.warn(`[WARN] File not found locally: ${filename}`);
      continue;
    }

    const r2Key = `course_videos/${filename}`;
    const exists = await checkExistsOnR2(r2Key);
    if (exists) {
      console.log(`[SKIP]      ${r2Key} already exists in R2 bucket.`);
      skippedCount++;
      continue;
    }

    await uploadFile(r2Key, localPath);
    uploadedCount++;
  }

  const totalTime = ((Date.now() - tStart) / 1000).toFixed(1);
  console.log('\n================================================================');
  console.log(` SUMMARY: ${uploadedCount} uploaded, ${skippedCount} already existed in ${totalTime}s`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
