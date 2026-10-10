import { spawn } from 'child_process';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

const FFMPEG_PATH = 'C:\\Users\\CLICK\\.stacher\\ffmpeg.exe';
const SOURCE_DIR = 'C:\\Users\\CLICK\\Downloads\\videos of modules\\m4_source\\m4';
const OUTPUT_DIR = 'C:\\Users\\CLICK\\Downloads\\videos of modules\\videos_h264_1080p';

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 9 target videos for Module 4: m4v1 through m4v9
const VIDEOS = [
  'm4v1.mp4', 'm4v2.mp4', 'm4v3.mp4', 'm4v4.mp4', 'm4v5.mp4',
  'm4v6.mp4', 'm4v7.mp4', 'm4v8.mp4', 'm4v9.mp4'
];

console.log('================================================================');
console.log('  CLIMAMEDIX MODULE 4: 1080P H.264 CUDA BATCH ENCODER (RTX 3060)');
console.log('================================================================');
console.log(`Source Directory : ${SOURCE_DIR}`);
console.log(`Output Directory : ${OUTPUT_DIR}`);
console.log(`Concurrency      : 3 parallel CUDA streams (~90% GPU load)`);
console.log(`Target Codec     : H.264 High (NVENC, CQ 24, scale_cuda=1920:1080)`);
console.log(`Audio            : Lossless Master Studio AAC (stream copy)`);
console.log(`Web Flag         : -movflags +faststart`);
console.log('----------------------------------------------------------------\n');

function transcodeVideo(filename) {
  return new Promise((resolvePromise, reject) => {
    const inputPath = join(SOURCE_DIR, filename);
    const outputPath = join(OUTPUT_DIR, filename);

    if (!existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    console.log(`[START] Encoding ${filename} -> 1080p H.264 NVENC...`);
    const startTime = Date.now();

    const args = [
      '-hwaccel', 'cuda',
      '-hwaccel_output_format', 'cuda',
      '-i', inputPath,
      '-vf', 'scale_cuda=1920:1080',
      '-c:v', 'h264_nvenc',
      '-preset', 'p4',
      '-tune', 'hq',
      '-cq', '24',
      '-b:v', '0',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ];

    const proc = spawn(FFMPEG_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let lastProgress = '';
    proc.stderr.on('data', (data) => {
      const str = data.toString();
      const match = str.match(/fps=\s*(\d+).*?speed=\s*([\d\.]+x)/);
      if (match) {
        lastProgress = `fps: ${match[1]}, speed: ${match[2]}`;
      }
    });

    proc.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        const stats = statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        console.log(`[DONE]  ${filename} finished in ${elapsed}s (${sizeMB} MB) [${lastProgress}]`);
        resolvePromise({ filename, elapsed, sizeMB });
      } else {
        console.error(`[ERROR] ${filename} failed with exit code ${code}`);
        reject(new Error(`${filename} failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// 3 concurrent CUDA streams for ~90% load on RTX 3060
async function runPool(items, concurrency, workerFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = Promise.resolve().then(() => workerFn(item));
    results.push(promise);
    executing.add(promise);

    const clean = () => executing.delete(promise);
    promise.then(clean, clean);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

const batchStart = Date.now();
runPool(VIDEOS, 3, transcodeVideo)
  .then((results) => {
    const totalElapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(` ALL MODULE 4 VIDEOS ENCODED IN ${totalElapsed} SECONDS! `);
    console.log('================================================================');
    let totalSize = 0;
    for (const r of results) {
      totalSize += parseFloat(r.sizeMB);
      console.log(`- ${r.filename.padEnd(10)}: ${r.sizeMB} MB (${r.elapsed}s)`);
    }
    console.log('----------------------------------------------------------------');
    console.log(`Total Package Size: ${totalSize.toFixed(1)} MB`);
  })
  .catch((err) => {
    console.error('\nBatch transcode encountered an error:', err);
    process.exit(1);
  });
