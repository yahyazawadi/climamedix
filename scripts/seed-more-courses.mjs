import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SAMPLE_VIDEO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const newCourses = [
  {
    title_ar: 'التغذية المستدامة والمناخ',
    title_en: 'Sustainable Nutrition and Climate',
    description_ar: 'دورة تركز على كيفية تأثير النظم الغذائية على المناخ، والخيارات المستدامة للتغذية الصحية.',
    description_en: 'A course focusing on how food systems impact the climate and sustainable choices for healthy nutrition.',
    category: 'climate_health',
    duration: '4',
    teaser_permission_key: 'view:free_content',
    full_access_permission_key: 'view:all_courses',
    cover_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    modules: [
      {
        title_ar: 'الزراعة المستدامة',
        title_en: 'Sustainable Agriculture',
        lessons: [
          { title_ar: 'تأثير اللحوم على المناخ', title_en: 'Meat Impact on Climate', type: 'video' },
          { title_ar: 'البدائل النباتية', title_en: 'Plant-Based Alternatives', type: 'audio' }
        ]
      }
    ]
  },
  {
    title_ar: 'إدارة الكوارث الطبيعية والأوبئة',
    title_en: 'Natural Disasters and Pandemics Management',
    description_ar: 'تعلم استراتيجيات التكيف مع الكوارث المناخية المتطرفة وتأثيرها على انتشار الأوبئة.',
    description_en: 'Learn strategies for adapting to extreme climate disasters and their impact on pandemic spread.',
    category: 'public_health',
    duration: '5',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:all_courses',
    cover_image: 'https://images.unsplash.com/photo-1548407260-da850faa41e3?auto=format&fit=crop&q=80&w=800',
    modules: [
      {
        title_ar: 'الاستعداد للطوارئ',
        title_en: 'Emergency Preparedness',
        lessons: [
          { title_ar: 'التخطيط المبكر', title_en: 'Early Planning', type: 'video' },
          { title_ar: 'استجابة القطاع الصحي', title_en: 'Health Sector Response', type: 'video' }
        ]
      }
    ]
  },
  {
    title_ar: 'الصحة العقلية في ظل التغير المناخي',
    title_en: 'Mental Health in the Climate Crisis',
    description_ar: 'استكشف مصطلح "القلق المناخي" وكيفية التعامل مع الآثار النفسية للتغيرات البيئية الجذرية.',
    description_en: 'Explore "Climate Anxiety" and how to deal with the psychological effects of drastic environmental changes.',
    category: 'mental_health',
    duration: '2',
    teaser_permission_key: 'view:free_content',
    full_access_permission_key: 'view:all_courses',
    cover_image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=800',
    modules: [
      {
        title_ar: 'القلق المناخي',
        title_en: 'Climate Anxiety',
        lessons: [
          { title_ar: 'ما هو القلق المناخي؟', title_en: 'What is Climate Anxiety?', type: 'audio' },
          { title_ar: 'استراتيجيات التكيف النفسي', title_en: 'Psychological Adaptation Strategies', type: 'video' }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('🚀 Seeding more courses...');

  for (const courseInfo of newCourses) {
    const { modules, ...coursePayload } = courseInfo;
    
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

    let seqOrder = 1;
    for (const mod of modules) {
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: courseData.id,
          title_ar: mod.title_ar,
          title_en: mod.title_en,
          sequence_order: seqOrder++
        })
        .select()
        .single();

      if (moduleError) {
        console.error('Module Error:', moduleError.message);
        continue;
      }

      let lesOrder = 1;
      for (const les of mod.lessons) {
        const isVideo = les.type === 'video';
        const mediaTag = isVideo 
          ? `<video src="${SAMPLE_VIDEO_URL}"></video>` 
          : `<audio src="${SAMPLE_AUDIO_URL}"></audio>`;
        
        await supabase
          .from('lessons')
          .insert({
            module_id: moduleData.id,
            title_ar: les.title_ar,
            title_en: les.title_en,
            content_ar: `<p>Sample content for ${les.title_ar}</p>${mediaTag}`,
            content_en: `<p>Sample content for ${les.title_en}</p>${mediaTag}`,
            duration: '10',
            video_url: isVideo ? SAMPLE_VIDEO_URL : null,
            sequence_order: lesOrder++,
            is_quiz: false
          });
      }
      
      // Add a quiz lesson at the end of each module
      const { data: quizLesson, error: qlError } = await supabase
        .from('lessons')
        .insert({
            module_id: moduleData.id,
            title_ar: `اختبار ${mod.title_ar}`,
            title_en: `Quiz ${mod.title_en}`,
            content_ar: '<p>Please complete the quiz below.</p>',
            content_en: '<p>Please complete the quiz below.</p>',
            duration: '5',
            sequence_order: lesOrder++,
            is_quiz: true
        })
        .select()
        .single();
        
      if(!qlError && quizLesson) {
         const { data: quizData } = await supabase
          .from('quizzes')
          .insert({
            course_id: courseData.id,
            lesson_id: quizLesson.id,
            title_ar: `اختبار ${mod.title_ar}`,
            title_en: `Quiz ${mod.title_en}`,
            passing_score: 50
          })
          .select()
          .single();
          
          if(quizData) {
            const { data: q1Data } = await supabase
              .from('quiz_questions')
              .insert({
                quiz_id: quizData.id,
                question_text_ar: 'سؤال تجريبي سريع؟',
                question_text_en: 'Sample quick question?',
                points: 10,
                sequence_order: 1
              })
              .select()
              .single();
              
            if(q1Data) {
              await supabase.from('quiz_options').insert([
                { question_id: q1Data.id, option_text_ar: 'الخيار الصحيح', option_text_en: 'Correct Option', is_correct: true },
                { question_id: q1Data.id, option_text_ar: 'خاطئ', option_text_en: 'Wrong', is_correct: false }
              ]);
            }
          }
      }
    }
  }

  console.log('🎉 Done seeding more courses!');
}

seed().catch(console.error);
