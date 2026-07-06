import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample public media URLs for testing
const SAMPLE_VIDEO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

async function seed() {
  console.log('🚀 Seeding Courses, Modules, and Lessons...');

  // 1. Insert Course
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .insert({
      title_ar: 'الماجستير المصغر في تغير المناخ والصحة التنفسية',
      title_en: 'Mini-Masterclass: Climate Change & Respiratory Health',
      description_ar: 'مساق شامل يغطي أثر تلوث الهواء والتغير المناخي على الأمراض التنفسية. يتضمن فيديوهات تفاعلية، مقاطع صوتية، واختبارات لتقييم الفهم.',
      description_en: 'A comprehensive course covering the impact of air pollution and climate change on respiratory diseases. Includes interactive videos, audio tracks, and quizzes.',
      category: 'climate_health',
      duration: '3', // hours
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:all_courses',
      cover_image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=800'
    })
    .select()
    .single();

  if (courseError) throw new Error(`Course Insert Error: ${courseError.message}`);
  const courseId = courseData.id;
  console.log('✅ Created Course:', courseData.title_en);

  // 2. Insert Module
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title_ar: 'الوحدة الأولى: أساسيات جودة الهواء',
      title_en: 'Module 1: Foundations of Air Quality',
      sequence_order: 1
    })
    .select()
    .single();

  if (moduleError) throw new Error(`Module Insert Error: ${moduleError.message}`);
  const moduleId = moduleData.id;
  console.log('✅ Created Module:', moduleData.title_en);

  // 3. Insert Lessons

  // Lesson 1: Audio + Text
  const { data: lesson1Data, error: lesson1Error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title_ar: 'مقدمة في الملوثات الهوائية (صوتي)',
      title_en: 'Introduction to Air Pollutants (Audio)',
      content_ar: `<p>استمع إلى المقطع الصوتي التالي للتعرف على الملوثات الرئيسية الموجودة في الهواء الحضري.</p><audio src="${SAMPLE_AUDIO_URL}"></audio>`,
      content_en: `<p>Listen to the audio track below to learn about the primary pollutants found in urban air.</p><audio src="${SAMPLE_AUDIO_URL}"></audio>`,
      duration: '10',
      sequence_order: 1,
      is_quiz: false
    })
    .select()
    .single();

  if (lesson1Error) throw new Error(`Lesson 1 Error: ${lesson1Error.message}`);

  // Lesson 2: Video Lesson
  const { data: lesson2Data, error: lesson2Error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title_ar: 'التأثير الفسيولوجي (فيديو)',
      title_en: 'Physiological Impact (Video)',
      content_ar: `<p>يشرح هذا الفيديو الآليات الفسيولوجية لتأثير الجسيمات الدقيقة على الرئتين.</p><video src="${SAMPLE_VIDEO_URL}"></video>`,
      content_en: `<p>This video explains the physiological mechanisms of how fine particulate matter affects the lungs.</p><video src="${SAMPLE_VIDEO_URL}"></video>`,
      duration: '15',
      video_url: SAMPLE_VIDEO_URL,
      sequence_order: 2,
      is_quiz: false
    })
    .select()
    .single();

  if (lesson2Error) throw new Error(`Lesson 2 Error: ${lesson2Error.message}`);

  // Lesson 3: Quiz
  const { data: lesson3Data, error: lesson3Error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title_ar: 'اختبار الوحدة الأولى',
      title_en: 'Module 1 Quiz',
      content_ar: '<p>اختبر معلوماتك من الدروس السابقة.</p>',
      content_en: '<p>Test your knowledge from the previous lessons.</p>',
      duration: '5',
      sequence_order: 3,
      is_quiz: true
    })
    .select()
    .single();

  if (lesson3Error) throw new Error(`Lesson 3 Error: ${lesson3Error.message}`);
  
  // 4. Create the Quiz and Questions
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      course_id: courseId,
      lesson_id: lesson3Data.id,
      title_ar: 'اختبار الوحدة الأولى',
      title_en: 'Module 1 Quiz',
      passing_score: 70
    })
    .select()
    .single();

  if (quizError) throw new Error(`Quiz Insert Error: ${quizError.message}`);

  // Question 1
  const { data: q1Data, error: q1Error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: quizData.id,
      question_text_ar: 'ما هو الملوث الرئيسي الناتج عن عوادم السيارات؟',
      question_text_en: 'What is the primary pollutant from vehicle exhaust?',
      points: 10,
      sequence_order: 1
    })
    .select()
    .single();

  if (q1Error) throw new Error(`Q1 Error: ${q1Error.message}`);

  await supabase.from('quiz_options').insert([
    { question_id: q1Data.id, option_text_ar: 'ثاني أكسيد النيتروجين', option_text_en: 'Nitrogen Dioxide', is_correct: true },
    { question_id: q1Data.id, option_text_ar: 'الأكسجين', option_text_en: 'Oxygen', is_correct: false },
    { question_id: q1Data.id, option_text_ar: 'النيون', option_text_en: 'Neon', is_correct: false }
  ]);

  console.log('✅ Successfully seeded Course, Modules, Lessons (Video/Audio), and Quizzes!');
}

seed().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
