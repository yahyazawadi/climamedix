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
  return key; 
}

async function seed() {
  console.log('🚀 Uploading real media to R2...');
  const audioPath = 'C:\\Users\\CLICK\\Downloads\\audio.mp3';
  const videoPath = 'C:\\Users\\CLICK\\Downloads\\5999373.mp4';

  const audioKey = await uploadToR2(audioPath, 'audio/mpeg', 'audios');
  const videoKey = await uploadToR2(videoPath, 'video/mp4', 'videos');

  const publicAudioUrl = audioKey ? `${R2_PUBLIC_URL}/${audioKey}` : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const videoUrlKey = videoKey || 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const publicVideoUrl = videoKey ? `${R2_PUBLIC_URL}/${videoKey}` : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  console.log('🚀 Creating Complex Course...');
  
  const coursePayload = {
    title_ar: 'الدبلوم المتقدم الشامل المعقد',
    title_en: 'Advanced Complex Masterclass',
    description_ar: 'دورة شاملة تحتوي على العديد من الوحدات والدروس والاختبارات باستخدام ملفات الوسائط المرفوعة.',
    description_en: 'A comprehensive course with many modules, lessons, and quizzes using the uploaded media.',
    category: 'climate_health',
    duration: '20',
    teaser_permission_key: 'view:free_content',
    full_access_permission_key: 'view:all_courses',
    cover_image: 'https://images.unsplash.com/photo-1550064977-980da6a4c6a6?auto=format&fit=crop&q=80&w=800'
  };

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert(coursePayload)
    .select()
    .single();

  if (courseError) {
    console.error('Course Insert Error:', courseError.message);
    return;
  }
  console.log(`✅ Created Course: ${courseData.title_en}`);

  // Create 5 modules
  for (let m = 1; m <= 5; m++) {
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseData.id,
        title_ar: `الوحدة رقم ${m}: المفاهيم المعقدة`,
        title_en: `Module ${m}: Complex Concepts`,
        sequence_order: m
      })
      .select()
      .single();

    if (moduleError) {
      console.error('Module Error:', moduleError.message);
      continue;
    }
    console.log(`✅ Created Module ${m}`);

    // Create 3 normal lessons per module
    for (let l = 1; l <= 3; l++) {
      let contentAr, contentEn, vUrl = null;

      if (l === 1) { // Video focus
        contentAr = `<p>مقدمة مرئية رائعة للوحدة ${m}:</p><video src="${publicVideoUrl}"></video><p>تفاصيل إضافية تحت الفيديو...</p>`;
        contentEn = `<p>Amazing visual intro for module ${m}:</p><video src="${publicVideoUrl}"></video><p>More details below...</p>`;
        vUrl = videoUrlKey;
      } else if (l === 2) { // Audio focus
        contentAr = `<p>استمع إلى التسجيل الصوتي للوحدة ${m}:</p><audio src="${publicAudioUrl}"></audio><p>شكراً لاستماعك.</p>`;
        contentEn = `<p>Listen to the audio recording for module ${m}:</p><audio src="${publicAudioUrl}"></audio><p>Thanks for listening.</p>`;
      } else { // Mixed focus
        contentAr = `<p>مزيج معقد:</p><audio src="${publicAudioUrl}"></audio><video src="${publicVideoUrl}"></video><p>نهاية الدرس.</p>`;
        contentEn = `<p>Complex mix:</p><audio src="${publicAudioUrl}"></audio><video src="${publicVideoUrl}"></video><p>End of lesson.</p>`;
        vUrl = videoUrlKey;
      }

      await supabase.from('lessons').insert({
        module_id: moduleData.id,
        title_ar: `الدرس ${l} للوحدة ${m}`,
        title_en: `Lesson ${l} of Module ${m}`,
        content_ar: contentAr,
        content_en: contentEn,
        duration: '15',
        video_url: vUrl,
        sequence_order: l,
        is_quiz: false
      });
    }

    // Create 1 quiz lesson per module
    const { data: quizLesson } = await supabase.from('lessons').insert({
      module_id: moduleData.id,
      title_ar: `اختبار الوحدة ${m}`,
      title_en: `Module ${m} Quiz`,
      content_ar: '<p>يرجى إكمال الاختبار التالي.</p>',
      content_en: '<p>Please complete the following quiz.</p>',
      duration: '10',
      sequence_order: 4,
      is_quiz: true
    }).select().single();

    if (quizLesson) {
      const { data: quizData } = await supabase.from('quizzes').insert({
        course_id: courseData.id,
        lesson_id: quizLesson.id,
        title_ar: `اختبار الوحدة ${m}`,
        title_en: `Module ${m} Quiz`,
        passing_score: 100
      }).select().single();

      if (quizData) {
        const { data: qData } = await supabase.from('quiz_questions').insert({
          quiz_id: quizData.id,
          question_text_ar: 'هل فهمت المفاهيم المعقدة في هذه الوحدة؟',
          question_text_en: 'Did you understand the complex concepts here?',
          points: 100,
          sequence_order: 1
        }).select().single();

        if (qData) {
          await supabase.from('quiz_options').insert([
            { question_id: qData.id, option_text_ar: 'نعم بالتأكيد', option_text_en: 'Yes absolutely', is_correct: true },
            { question_id: qData.id, option_text_ar: 'لا', option_text_en: 'No', is_correct: false }
          ]);
        }
      }
    }
  }

  console.log('🎉 Done creating complex course with many modules!');
}

seed().catch(console.error);
