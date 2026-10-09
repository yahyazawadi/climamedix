import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.VITE_R2_ENDPOINT || 'https://fe19d3afc8180ebd5792c34afb1f85af.r2.cloudflarestorage.com';
const bucketName = process.env.VITE_R2_BUCKET_NAME || 'climamedix';
const accessKeyId = process.env.VITE_R2_ACCESS_KEY_ID || '7a8311cbfb7c07e7ed5156e219546c2d';
const secretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY || 'dfa932e2ccf9f1cd92d4e29b21b55acdbd136c82ab1123e5f365174102523b9f';

const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function main() {
  console.log(`Setting CORS on bucket: ${bucketName}...`);
  
  const corsRule = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        AllowedOrigins: [
          '*'
        ],
        ExposeHeaders: ['*'],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  const command = new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: corsRule,
  });

  await client.send(command);
  console.log('✅ PutBucketCorsCommand succeeded! Wildcard * and all origins allowed.');

  const getCmd = new GetBucketCorsCommand({ Bucket: bucketName });
  const res = await client.send(getCmd);
  console.log('Current CORS configuration:', JSON.stringify(res.CORSRules, null, 2));
}

main().catch(err => {
  console.error('❌ Error setting CORS:', err);
  process.exit(1);
});
