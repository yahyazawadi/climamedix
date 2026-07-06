import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

async function uploadToR2(filePath, mimeType, folder) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = filePath.split('.').pop();
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await r2Client.send(command);
  console.log(`Uploaded ${filePath} to R2: ${key}`);
  return key; // return the object key
}

async function seed() {
  console.log('🚀 Deleting all existing courses...');
  const { error: delError } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error('Error deleting courses:', delError);
    return;
  }
  console.log('✅ All courses deleted.');

  console.log('🚀 Uploading real media to R2...');
  const audioPath = 'C:\\Users\\CLICK\\Downloads\\audio.mp3';
  const videoPath = 'C:\\Users\\CLICK\\Downloads\\5999373.mp4';

  const audioKey = await uploadToR2(audioPath, 'audio/mpeg', 'audios');
  const videoKey = await uploadToR2(videoPath, 'video/mp4', 'videos');

  const publicAudioUrl = audioKey ? `${R2_PUBLIC_URL}/${audioKey}` : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const videoUrlKey = videoKey || 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const publicVideoUrl = videoKey ? `${R2_PUBLIC_URL}/${videoKey}` : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  console.log('🚀 Creating new courses...');
  
  const coursesToCreate = [
    {
      title_ar: 'الماجستير المصغر في التغير المناخي والصحة العامة',
      title_en: 'Mini-Masterclass: Climate Change & Public Health',
      category: 'climate_health'
    },
    {
      title_ar: 'الاستدامة البيئية في المستشفيات',
      title_en: 'Environmental Sustainability in Hospitals',
      category: 'public_health'
    },
    {
      title_ar: 'التكيف مع الكوارث المناخية',
      title_en: 'Adapting to Climate Disasters',
      category: 'climate_health'
    }
  ];

  for (let i = 0; i < coursesToCreate.length; i++) {
    const courseInfo = coursesToCreate[i];
    const coursePayload = {
      title_ar: courseInfo.title_ar,
      title_en: courseInfo.title_en,
      description_ar: `هذه الدورة رقم ${i + 1}. تحتوي على أمثلة لملفات الصوت والفيديو المتكررة لتجربة العرض.`,
      description_en: `This is course #${i + 1}. It contains examples of repeated audio and video files for testing.`,
      category: courseInfo.category,
      duration: '4',
      teaser_permission_key: 'view:free_content',
      full_access_permission_key: 'view:all_courses',
      cover_image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=800'
    };

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert(coursePayload)
      .select()
      .single();

    if (courseError) {
      console.error('Course Insert Error:', courseError.message);
      continue;
    }
    console.log(`✅ Created Course: ${courseData.title_en}`);

    // Module 1
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseData.id,
        title_ar: 'الوحدة الأولى: محتوى غني بالوسائط',
        title_en: 'Module 1: Media Rich Content',
        sequence_order: 1
      })
      .select()
      .single();

    if (!moduleError) {
      // Lesson: Multiple Audios and Videos
      const repeatedContentAr = `
        <p>مقدمة صوتية (الصوت الأول):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>شرح مرئي (الفيديو الأول):</p>
        <video src="${publicVideoUrl}"></video>
        <hr/>
        <p>تكملة صوتية (الصوت الثاني):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>عرض عملي (الفيديو الثاني):</p>
        <video src="${publicVideoUrl}"></video>
        <hr/>
        <p>خاتمة صوتية (الصوت الثالث):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>ملخص مرئي (الفيديو الثالث):</p>
        <video src="${publicVideoUrl}"></video>
      `;

      const repeatedContentEn = `
        <p>Audio Introduction (Audio 1):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>Visual Explanation (Video 1):</p>
        <video src="${publicVideoUrl}"></video>
        <hr/>
        <p>Audio Continuation (Audio 2):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>Practical Demo (Video 2):</p>
        <video src="${publicVideoUrl}"></video>
        <hr/>
        <p>Audio Conclusion (Audio 3):</p>
        <audio src="${publicAudioUrl}"></audio>
        <p>Visual Summary (Video 3):</p>
        <video src="${publicVideoUrl}"></video>
      `;

      await supabase.from('lessons').insert({
        module_id: moduleData.id,
        title_ar: 'درس الوسائط المتعددة المكررة',
        title_en: 'Repeated Multimedia Lesson',
        content_ar: repeatedContentAr,
        content_en: repeatedContentEn,
        duration: '25',
        video_url: videoUrlKey, // Optional main video for the header player
        sequence_order: 1,
        is_quiz: false
      });
    }
  }

  console.log('🎉 Done deleting and seeding with real media!');
}

seed().catch(console.error);
