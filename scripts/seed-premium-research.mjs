import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedPremiumResearch() {
  const publications = [
    {
      title_ar: '(بحث مقفول) تقنيات الذكاء الاصطناعي في توقع الكوارث المناخية',
      title_en: '(Locked) AI Techniques in Predicting Climate Disasters',
      abstract_ar: 'هذا البحث مخصص فقط للأعضاء الذين لديهم صلاحية عرض الأبحاث المتقدمة. يركز على استخدام نماذج تعلم الآلة لتحليل البيانات المناخية وتوقع الكوارث.',
      abstract_en: 'This research is exclusive to members with advanced research viewing permissions. It focuses on using machine learning models to analyze climate data and predict disasters.',
      authors: 'د. يحيى عمودي',
      year: '2026',
      // No URL since it's just a test, or we can leave it empty
      teaser_permission_key: 'view:all_research', // Requires permission just to see the card
      full_access_permission_key: 'view:all_research',
    },
    {
      title_ar: '(تحميل مقفول) سياسات خفض الانبعاثات الكربونية في الشرق الأوسط',
      title_en: '(Download Locked) Carbon Emission Reduction Policies in the Middle East',
      abstract_ar: 'تستطيع قراءة هذا الملخص لأن صلاحية العرض عامة، لكن لا يمكنك تحميل الملف إلا إذا كان لديك صلاحية عرض الأبحاث (view:all_research).',
      abstract_en: 'You can read this abstract because teaser permission is public, but you cannot download the file unless you have the view:all_research permission.',
      authors: 'د. محمد الأحمد',
      year: '2026',
      pdf_url: 'https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/research_publications/dummy.pdf', // Dummy URL to show the download button
      teaser_permission_key: 'view:public_content', // Visible to everyone
      full_access_permission_key: 'view:all_research', // Download restricted
    }
  ];

  console.log('📝 Inserting 2 premium test publications...');

  const { data, error } = await supabase
    .from('publications')
    .insert(publications)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted!`);
}

seedPremiumResearch();
