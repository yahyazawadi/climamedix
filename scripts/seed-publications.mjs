import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

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

const BUCKET = process.env.VITE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

// Upload the real PDF
async function uploadPdf() {
  const pdfPath = 'C:\\Users\\CLICK\\Downloads\\Project Instructions.pdf';
  const fileBuffer = readFileSync(pdfPath);
  const key = `research_publications/seed-project-instructions-${Date.now()}.pdf`;

  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/pdf',
  }));

  console.log('✅ PDF uploaded to R2');
  return `${PUBLIC_URL}/${key}`;
}

async function seed() {
  console.log('📄 Uploading PDF to Cloudflare R2...');
  const pdfUrl = await uploadPdf();

  const publications = [
    {
      title_ar: 'أثر تلوث الهواء على الأمراض التنفسية في المناطق الحضرية',
      title_en: 'Impact of Air Pollution on Respiratory Diseases in Urban Areas',
      abstract_ar: 'تهدف هذه الدراسة إلى تحليل العلاقة بين مستويات تلوث الهواء ومعدلات الإصابة بالأمراض التنفسية في المناطق الحضرية المكتظة في العالم العربي. تم جمع بيانات من خمس مدن رئيسية على مدار ثلاث سنوات.',
      abstract_en: 'This study analyzes the relationship between air pollution levels and respiratory disease incidence in densely populated urban areas across the Arab world. Data was collected from five major cities over three years.',
      authors: 'د. أحمد الخالدي، د. سارة المنصور',
      year: '2025',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content',
    },
    {
      title_ar: 'تغير المناخ وانتشار الأمراض المنقولة بالمياه في حوض البحر المتوسط',
      title_en: 'Climate Change and Waterborne Disease Spread in the Mediterranean Basin',
      abstract_ar: 'يستعرض هذا البحث تأثير التغيرات المناخية على جودة المياه وانتشار الأمراض المنقولة بالمياه في دول حوض البحر المتوسط العربية. النتائج تشير إلى زيادة ملحوظة في حالات الكوليرا والتيفوئيد.',
      abstract_en: 'This research reviews the impact of climate change on water quality and waterborne disease spread in Arab Mediterranean countries. Results indicate a notable increase in cholera and typhoid cases.',
      authors: 'د. ليلى عبد الرحمن، د. محمد الزعبي، أ. فاطمة الحسن',
      year: '2024',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content',
    },
    {
      title_ar: 'تقييم الاستدامة البيئية في المستشفيات والمراكز الطبية',
      title_en: 'Environmental Sustainability Assessment in Hospitals and Medical Centers',
      abstract_ar: 'دراسة ميدانية شاملة لتقييم ممارسات الاستدامة البيئية في 50 مستشفى ومركز طبي في المنطقة العربية، مع تقديم توصيات عملية لتقليل البصمة الكربونية للقطاع الصحي.',
      abstract_en: 'A comprehensive field study evaluating environmental sustainability practices across 50 hospitals and medical centers in the Arab region, with practical recommendations for reducing the healthcare sector carbon footprint.',
      authors: 'د. عمر الشريف، د. نور الدين',
      year: '2025',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:public_content',
    },
    {
      title_ar: 'تأثير موجات الحر على صحة العاملين في قطاع البناء بمنطقة الخليج',
      title_en: 'Impact of Heat Waves on Construction Worker Health in the Gulf Region',
      abstract_ar: 'يحلل هذا البحث المخاطر الصحية التي يتعرض لها عمال البناء خلال موجات الحر الشديدة في دول الخليج العربي، ويقترح إطار عمل وقائي قائم على الأدلة العلمية.',
      abstract_en: 'This research analyzes health risks faced by construction workers during extreme heat waves in the Arabian Gulf states, proposing an evidence-based preventive framework.',
      authors: 'د. خالد العتيبي، د. مريم السعيد، د. حسين الموسوي',
      year: '2026',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:all_courses',
    },
    {
      title_ar: 'سياسات التكيف المناخي في القطاع الصحي العربي: مراجعة نقدية',
      title_en: 'Climate Adaptation Policies in the Arab Health Sector: A Critical Review',
      abstract_ar: 'مراجعة منهجية للسياسات الصحية المتعلقة بالتكيف مع تغير المناخ في 12 دولة عربية، مع تحديد الفجوات والفرص لتعزيز المرونة الصحية الإقليمية.',
      abstract_en: 'A systematic review of health policies related to climate adaptation across 12 Arab countries, identifying gaps and opportunities for strengthening regional health resilience.',
      authors: 'أ.د. ياسمين الحداد، د. طارق بن سلمان',
      year: '2024',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content',
    },
    {
      title_ar: 'العلاقة بين الجفاف والأمن الغذائي والصحة العامة في شمال أفريقيا',
      title_en: 'Drought, Food Security, and Public Health in North Africa',
      abstract_ar: 'يدرس هذا البحث العلاقة المعقدة بين فترات الجفاف المتكررة وتراجع الأمن الغذائي وتدهور المؤشرات الصحية في دول شمال أفريقيا خلال العقد الأخير.',
      abstract_en: 'This research examines the complex relationship between recurring drought periods, declining food security, and deteriorating health indicators in North African countries over the past decade.',
      authors: 'د. عائشة بوزيد، د. يوسف المغربي',
      year: '2025',
      pdf_url: pdfUrl,
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content',
    },
  ];

  console.log(`📝 Inserting ${publications.length} sample publications...`);

  const { data, error } = await supabase
    .from('publications')
    .insert(publications)
    .select();

  if (error) {
    console.error('❌ Error inserting publications:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data.length} publications!`);
  data.forEach(pub => console.log(`   → ${pub.title_en}`));
}

seed().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
