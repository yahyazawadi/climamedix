#!/usr/bin/env node
/**
 * ============================================================================
 * ClimaMedix LMS - Automated Multi-Asset R2 Ingestion & Supabase Sync Engine
 * ============================================================================
 * 
 * Uploads CUDA NVENC HEVC 4K master videos and dual-language WebVTT subtitles
 * to Cloudflare R2, extracts precise video durations via ffprobe, and synchronizes
 * lesson records (with comprehensive rich text content) in Supabase.
 *
 * Supported CLI Options:
 *   --dry-run       Simulate upload and database operations without changes
 *   --force         Re-upload files even if they already exist on Cloudflare R2
 *   --skip-upload   Skip R2 asset uploads and perform database sync only
 *   --skip-db       Skip Supabase database sync and perform R2 uploads only
 *   --module <1|2>  Filter execution to only Module 1 or Module 2
 *
 * Usage:
 *   node scripts/upload-modules-and-sync-supabase.mjs
 *   node scripts/upload-modules-and-sync-supabase.mjs --dry-run
 *   node scripts/upload-modules-and-sync-supabase.mjs --module 1
 *   node scripts/upload-modules-and-sync-supabase.mjs --force
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve, join } from 'path';
import { Transform } from 'stream';
import fs from 'fs';
import dotenv from 'dotenv';

const execFileAsync = promisify(execFile);

// Load environment configuration strictly from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

// ─── CLI ARGUMENTS ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const IS_FORCE = args.includes('--force');
const SKIP_UPLOAD = args.includes('--skip-upload');
const SKIP_DB = args.includes('--skip-db');
const moduleArgIndex = args.indexOf('--module');
const TARGET_MODULE = moduleArgIndex !== -1 && args[moduleArgIndex + 1] 
  ? parseInt(args[moduleArgIndex + 1], 10) 
  : null;

// ─── STRICT ENVIRONMENT VALIDATION (ZERO HARDCODED FALLBACKS) ─────────────────
const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_R2_ENDPOINT',
  'VITE_R2_BUCKET_NAME',
  'VITE_R2_PUBLIC_URL',
  'VITE_R2_ACCESS_KEY_ID',
  'VITE_R2_SECRET_ACCESS_KEY',
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`\x1b[31m[ERROR] Missing required environment variables:\x1b[0m ${missingEnv.join(', ')}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ENDPOINT = process.env.VITE_R2_ENDPOINT;
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL.replace(/\/+$/, '');
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;

const TARGET_COURSE_ID = '0509ec71-4043-43d4-9865-b3bca0510458';

// Asset storage source folders (with multi-path fallbacks)
const VIDEO_SOURCE_DIRS = [
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\videos_nvenc_hevc',
  resolve(process.cwd(), 'videos_nvenc_hevc')
];

const SUBTITLES_AR_DIRS = [
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\subtitles',
  resolve(process.cwd(), 'subtitles')
];

const SUBTITLES_EN_DIRS = [
  resolve(process.cwd(), 'scripts', 'subtitles_en'),
  'C:\\Users\\CLICK\\Downloads\\videos of modules\\subtitles_en'
];

function findExistingFile(directories, filename) {
  for (const dir of directories) {
    const candidate = join(dir, filename);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// ─── CLIENT INITIALIZATION ───────────────────────────────────────────────────
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── MASTER CURRICULUM WITH IN-DEPTH RICH TEXT CONTENT ────────────────────────
const CURRICULUM = [
  {
    moduleNumber: 1,
    moduleId: '66666666-6666-6666-6666-666666666601',
    title_ar: 'الوحدة الأولى: أسس التثقيف الصحي والتغير المناخي',
    title_en: 'Module 1: Foundations of Health Education & Climate Change',
    description_ar: 'بناء المفاهيم الأساسية للتثقيف الصحي وتفكيك تحديات السلوك البشري والتواصل الفعال في ظل الإجهاد المناخي.',
    description_en: 'Core principles of health education, behavioral psychology, effective communication, and ethics under climate stress.',
    lessons: [
      {
        code: 'm1v1',
        sequence: 1,
        fallbackDuration: '04:36',
        title_ar: 'رسم خارطة الأثر الصحي المجتمعي',
        title_en: 'Mapping Community Health Impact',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يركز هذا الدرس التأسيسي على الدور الحيوي للمثقف الصحي في بناء خط دفاع مجتمعي متماسك ضد المخاطر الصحية المرتبطة بالتغيرات البيئية والمناخية. التثقيف الصحي ليس مجرد سرد لمعلومات نظرية، بل هو هندسة دقيقة للأثر الإيجابي المستدام داخل أحيائنا ومجتمعاتنا.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>خارطة الطريق الميدانية:</strong> كيفية الانتقال من التوعية العامة المبهمة إلى خطط تدخل محددة تستهدف بؤر الخطر المباشرة.</li>
            <li><strong>تحديد الفئات الأكثر هشاشة:</strong> الأطفال، كبار السن، والعمال في الميدان المكشوف هم الخط الأول المعرض للمضاعفات المناخية.</li>
            <li><strong>تكامل البيئة والسلوك:</strong> ربط الخصائص العمرانية والمكانية للحي بنمط حياة السكان وقدرتهم على الاستجابة.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">خلاصة التطبيق الميداني:</strong>
            المثقف الصحي الناجح يبدأ دائماً بالاستماع وتحليل واقع المجتمع قبل إطلاق أي توجيه، لأن الأثر الحقيقي يُقاس بمدى التغيير الواقعي في السلوك وليس بعدد الكلمات المنطوقة.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This foundational lesson examines the vital role of the health educator in establishing a resilient community defense against environment- and climate-driven health hazards. Health education extends far beyond imparting abstract knowledge; it is the deliberate design of sustainable, measurable impact within our neighborhoods.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>The Actionable Field Roadmap:</strong> Transitioning from generic public awareness to focused interventions addressing immediate environmental risks.</li>
            <li><strong>Identifying Vulnerable Cohorts:</strong> Children, the elderly, and outdoor laborers represent the frontline populations exposed to extreme thermal spikes.</li>
            <li><strong>Integrating Built Environment & Human Behavior:</strong> Connecting urban infrastructure traits to community resilience and coping capacity.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Field Practice Key:</strong>
            An effective health educator starts by actively listening to and analyzing community circumstances before issuing guidance, measuring true impact through sustained behavioral change rather than broadcast volume.
          </div>
        `
      },
      {
        code: 'm1v2',
        sequence: 2,
        fallbackDuration: '08:02',
        title_ar: 'سيكولوجية السلوك وتحديات الإجهاد الحراري',
        title_en: 'Behavioral Psychology & Heat Stress Challenges',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يعالج هذا الدرس معضلة الفجوة العميقة بين "المعرفة" و"الممارسة السلوكية". يدرك معظم الناس أن الحر الشديد يشكل خطراً مميتاً وأن الماء شريان الحياة، تماماً كما يعلم الجميع أضرار التدخين، ومع ذلك يواصل الكثيرون العمل أو المشي تحت أشعة الشمس الحارقة دون وقاية.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>نموذج المعتقدات الصحية (Health Belief Model):</strong> تحليل الإدراك الذاتي للتهديد (Perceived Threat) وحسابات الفوائد مقابل العوائق.</li>
            <li><strong>العوائق الاقتصادية والاجتماعية:</strong> عندما يضطر العامل للاختيار بين كسب قوت يومه أو التوقف للاحتماء من الحر، فإن العائق الاقتصادي يتغلب على المعرفة النظرية.</li>
            <li><strong>التأثير الإدراكي للإجهاد الحراري:</strong> درجات الحرارة المرتفعة تضعف الوظائف الإدراكية وتبطئ سرعة اتخاذ القرارات السليمة.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">توجيه للمثقف الصحي:</strong>
            لا تفترض أبداً أن نقص المعرفة هو سبب السلوك غير الآمن. ابحث عن المعوقات الواقعية التي تمنع الناس من الالتزام ووفر حلولاً بديلة قابلة للتنفيذ الفوري.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This lesson explores the profound paradox between knowledge and behavioral compliance. Most people are fully aware that extreme heat is hazardous and that hydration saves lives, yet many continue to perform strenuous physical labor under scorching temperatures without basic protection.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>The Health Belief Model (HBM):</strong> Dissecting perceived susceptibility, severity, and the real-world calculus between perceived benefits and barriers.</li>
            <li><strong>Socioeconomic Coercion:</strong> When an informal day-laborer must choose between immediate daily income and retreating into shade, economic necessity overrides public health advisories.</li>
            <li><strong>Cognitive Impacts of Thermal Stress:</strong> Prolonged acute heat exposure impairs judgment, slows decision-making, and reduces situational risk perception.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">Field Guidance:</strong>
            Never presume that non-compliance stems from ignorance. Identify the structural and material barriers preventing people from following safety protocols and co-create practical alternatives.
          </div>
        `
      },
      {
        code: 'm1v3',
        sequence: 3,
        fallbackDuration: '05:55',
        title_ar: 'استراتيجيات التواصل الفعال ونقل الرسالة الصحية',
        title_en: 'Effective Health Communication Strategies',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>تثبت التجارب الميدانية أن الصراخ عبر مكبرات الصوت أو إطلاق التحذيرات المجردة في الشوارع لا يوقف طفلاً عن ملاحقة كرته ولا يمنع مسناً من الخروج لقضاء حاجته. يناقش هذا الدرس كيفية هندسة رسائل صحية تصل إلى وجدان المتلقي وتدفعه للاستجابة التلقائية.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>تجزئة الجمهور (Audience Segmentation):</strong> الرسالة الموجهة للأم تختلف جذرياً في صياغتها ونبرتها عن الرسالة الموجهة للعامل الميداني أو الرياضي.</li>
            <li><strong>تجاوز شلل الخوف (Fear Paralysis):</strong> التخويف المفرط يؤدي إلى الإنكار واللامبالاة، بينما الرسائل الإيجابية المدعومة بخطوات عملية بسيطة تحقق أعلى درجات الالتزام.</li>
            <li><strong>التأطير العملي (Actionable Framing):</strong> استبدال التوجيهات العامة ("حافظوا على صحتكم") بأفعال واضحة وقابلة للقياس ("اشرب كوباً من الماء كل 30 دقيقة").</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">المعيار الذهبي للرسالة الصحية:</strong>
            الرسالة الممتازة تجيب دائماً على ثلاثة أسئلة في ذهن المتلقي: ما هو الخطر المباشر؟ ما الذي يجب أن أفعله الآن بالضبط؟ وكيف يحمي ذلك عائلتي؟
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>Field experience consistently shows that blaring generic warnings through loudspeakers or broadcasting panic will not stop a child chasing a ball or an elder buying essentials. This lesson examines how to engineer health communication that cuts through the noise and sparks self-motivated compliance.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Audience Segmentation:</strong> Messages addressed to caregivers require a fundamentally different framing and tone compared to those directed at construction crews or athletes.</li>
            <li><strong>Mitigating Fear Paralysis:</strong> Excessive panic induction promotes fatalism and denial; positive, action-oriented messaging unlocks highest compliance.</li>
            <li><strong>Actionable Framing:</strong> Replacing abstract slogans ("Protect your health") with explicit, quantifiable steps ("Drink one glass of water every 30 minutes").</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">The Golden Standard:</strong>
            A superior public health message simultaneously answers three intuitive questions: What is the immediate hazard? What explicit step must I take right now? How does this protect my household?
          </div>
        `
      },
      {
        code: 'm1v4',
        sequence: 4,
        fallbackDuration: '05:25',
        title_ar: 'تفكيك مبادئ الاتصال التفاعلي وصناعة التغيير',
        title_en: 'Interactive Communication & Behavior Change',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>التثقيف الصحي الحقيقي ليس عملية إلقاء أحادية الاتجاه (محاضر ومستمعون)، بل هو حوار تشاركي تفاعلي يبني الثقة المتبادلة ويفكك الشائعات والمفاهيم الخاطئة المتوارثة حول الحرارة والأمراض الموسمية.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>مهارات الاستماع النشط (Active Listening):</strong> فهم المعتقدات والمخاوف الكامنة لدى أفراد المجتمع قبل محاولة تصحيحها.</li>
            <li><strong>أسلوب الحوار التحفيزي (Motivational Interviewing):</strong> مساعدة الأفراد على استكشاف وتجاوز ترددهم الداخلي تجاه تغيير نمط حياتهم في فترات الطوارئ.</li>
            <li><strong>قياس التفاعل الحقيقي:</strong> التخلي عن مؤشرات الحضور الظاهرية والتركيز على استيعاب المفاهيم والقدرة على تطبيقها في اللحظات الحرجة.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-right: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">قاعدة التواصل:</strong>
            عندما يشعر الناس بأنك تفهم معاناتهم اليومية بصدق، يتحولون من متلقين سلبيين إلى شركاء نشطين في حماية مجتمعاتهم.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>True public health education is never a monologue between a lecturer and a passive audience. It is an interactive, bidirectional partnership designed to build trust, unravel cultural myths, and deconstruct entrenched misconceptions surrounding climate and health.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Active Listening Skills:</strong> Grasping underlying fears, cultural beliefs, and folk medical practices before attempting behavioral intervention.</li>
            <li><strong>Motivational Interviewing:</strong> Empowering individuals to resolve ambivalence and take ownership of protective behaviors during thermal emergencies.</li>
            <li><strong>Measuring True Engagement:</strong> Shifting away from superficial attendance tallies toward verified comprehension and emergency preparedness.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">Core Principle:</strong>
            When community members sense that you genuinely understand their daily struggles, they cease to be passive listeners and become proactive health advocates.
          </div>
        `
      },
      {
        code: 'm1v5',
        sequence: 5,
        fallbackDuration: '05:20',
        title_ar: 'أخلاقيات التثقيف الصحي والمسؤولية المهنية',
        title_en: 'Ethics in Health Education & Professional Responsibility',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يختتم هذا الدرس المرحلة الأولى من البرنامج بالتركيز على العمود الفقري للعمل الصحي: الميثاق الأخلاقي والمسؤولية المهنية. التثقيف الصحي أمانة إنسانية تمس حياة الناس وسلامتهم، ولا يمكن فصل المهارات التقنية عن النزاهة الأخلاقية.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>الصدق وتجنب التهويل:</strong> الموازنة الدقيقة بين التنبيه الجاد للمخاطر وتجنب الترويع غير المبرر الذي يولد الذعر أو اللامبالاة.</li>
            <li><strong>مكافحة الأوبئة المعلوماتية (Infodemic):</strong> التصدي للشائعات الطبية والنصائح الشعبية الخطرة حول علاج ضربات الشمس بطرق علمية رصينة.</li>
            <li><strong>العدالة والشمول:</strong> ضمان وصول التوعية الصحية لكافة الفئات دون تمييز طبقي أو جغرافي، مع احترام خصوصية وكرامة المرضى.</li>
          </ul>

          <div style="background: rgba(225, 29, 72, 0.08); border-right: 4px solid #e11d48; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #be123c; display: block; margin-bottom: 6px;">ميثاق الشرف:</strong>
            الأخلاق ليست مجرد نصوص نظرية، بل هي المقياس الحقيقي الذي يحدد استمرارية الثقة بين الكادر الصحي والمجتمع الذي يخدمه.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This final lesson of Module 1 underscores the backbone of all public health endeavors: bioethics and professional accountability. Health communication is a profound trust directly impacting lives, where technical proficiency must remain grounded in ethical integrity.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Truthfulness & Proportionality:</strong> Striking a meticulous balance between urgent hazard awareness and sensationalism that induces public panic.</li>
            <li><strong>Combatting the Infodemic:</strong> Countering viral medical misinformation and dangerous home remedies for heatstroke through evidence-based clarity.</li>
            <li><strong>Equitable Access & Dignity:</strong> Ensuring vulnerable and marginalized sectors receive prioritized guidance while preserving patient autonomy and confidentiality.</li>
          </ul>

          <div style="background: rgba(225, 29, 72, 0.08); border-left: 4px solid #e11d48; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #be123c; display: block; margin-bottom: 6px;">Ethical Charter:</strong>
            Ethics in health education is not an academic luxury; it is the currency of trust that determines whether a community heeds your warnings when disaster strikes.
          </div>
        `
      }
    ]
  },
  {
    moduleNumber: 2,
    moduleId: '66666666-6666-6666-6666-666666666602',
    title_ar: 'الوحدة الثانية: المحددات الاجتماعية والعدالة الصحية',
    title_en: 'Module 2: Social Determinants & Health Equity',
    description_ar: 'فهم المحددات الاجتماعية والبيئية للصحة، استعارة النهر والوقاية الاستباقية، وإنسانية العدالة المناخية.',
    description_en: 'Analyzing social determinants, upstream health prevention, climate justice, and epidemiological community interventions.',
    lessons: [
      {
        code: 'm2v1',
        sequence: 1,
        fallbackDuration: '05:03',
        title_ar: 'الانتقال من الرعاية الفردية إلى صحة المجتمع',
        title_en: 'Transitioning from Clinical Care to Population Health',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>ينطلق الموديول الثاني بنقلة نوعية تأخذنا من الإطار الضيق للطب السريري الفردي داخل أسوار المستشفيات إلى الفضاء الأوسع والأشمل: صحة المجتمع ككل. التحديات المناخية المعاصرة تفرض إعادة تعريف أولويات الرعاية الصحية لحماية الشعوب وليس فقط معالجة الأفراد المصابين.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>الصحة السكانية (Population Health):</strong> التركيز على التوزيع العام للنتائج الصحية داخل مجموعات سكانية بأكملها وتحليل العوامل البيئية المحددة لها.</li>
            <li><strong>حدود التدخل العلاجي:</strong> إدراك أن أرقى المضادات الحيوية وأحدث أجهزة التنفس لا يمكن أن تعوض بيئة هواء ملوثة أو مياه غير صالحة للشرب.</li>
            <li><strong>دور الكادر الصحي كمدافع مجتمعي:</strong> التوسع في مهام الطبيب والمثقف الصحي ليتضمن التأثير في السياسات الحضرية والبيئية الداعمة للصحة.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">التحول الذهني المطلوب:</strong>
            النجاح الحقيقي للمنظومة الصحية لا يُقاس بعدد الأسرة المشغولة في غرف العناية المركزة، بل بعدد الأشخاص الذين استطعنا حمايتهم من دخول المستشفى أصلاً.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>Module 2 begins with a paradigm shift that transitions our focus from the narrow confines of bedside clinical care to population health. Contemporary climate dynamics demand a fundamental re-evaluation of health priorities to safeguard entire communities.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Population Health Frameworks:</strong> Analyzing the distribution of health outcomes across demographics and tracing structural environmental drivers.</li>
            <li><strong>The Limits of Tertiary Care:</strong> Recognizing that state-of-the-art pharmaceuticals and ICUs cannot offset chronic atmospheric pollution or degraded drinking water.</li>
            <li><strong>The Practitioner as Civic Advocate:</strong> Expanding the mandate of health professionals to influence municipal urban planning and climate resilience policies.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">The Paradigm Shift:</strong>
            The ultimate success of a healthcare system is not measured by the bed occupancy rate in intensive care units, but by how many people we keep out of hospitals altogether.
          </div>
        `
      },
      {
        code: 'm2v2',
        sequence: 2,
        fallbackDuration: '05:19',
        title_ar: 'شبكة المحددات الاجتماعية والبيئية للصحة',
        title_en: 'Social & Environmental Determinants of Health',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يكشف هذا الدرس عن حقيقة قاطعة: الصحة ليست مجرد قرار شخصي أو التزام فردي بممارسة الرياضة والغذاء الصحي. من خلال مقارنة واقعية بين جارين يعيشان في ظروف سكنية واقتصادية متباينة، نرى بوضوح كيف تحدد جودة المسكن، العزل الحراري، وخدمات الحي مسار الصحة والمرض.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>المحددات الاجتماعية للصحة (SDOH):</strong> الظروف التي يولد فيها الإنسان وينمو ويعيش ويعمل ويشيخ، وتأثيرها على معدلات الإصابة بالأمراض المزمنة.</li>
            <li><strong>جزر الحرارة الحضرية (Urban Heat Islands):</strong> الأحياء المكتظة الخالية من الأشجار والمساحات الخضراء تسجل درجات حرارة تفوق المناطق المحيطة بعدة درجات مئوية.</li>
            <li><strong>العدالة المكانية:</strong> الربط الوثيق بين الرمز البريدي للشخص ومتوسط العمر المتوقع ومستوى تعرضه للمخاطر المناخية.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">رؤية تحليلية:</strong>
            عندما نصف العلاج لمريض يعيش في بيت يفتقر للتهوية السليمة ويعاني من تسرب مياه الصرف، فإننا نعالج الأعراض ونتجاهل السبب الجذري للمرض.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This lesson deconstructs the myth of purely individual lifestyle choices in health outcomes. Through an illustrative cohort comparison of two neighbors living under contrasting socioeconomic and housing conditions, we examine how physical infrastructure governs health outcomes.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Social Determinants of Health (SDOH):</strong> The conditions in which individuals are born, grow, live, work, and age, and their direct causal link to chronic pathology.</li>
            <li><strong>Urban Heat Islands (UHI):</strong> Densely constructed, unshaded neighborhoods experience micro-climates several degrees hotter than vegetated suburbs.</li>
            <li><strong>Spatial Environmental Injustice:</strong> How postal codes frequently correlate more strongly with life expectancy and thermal disease burden than genetic predisposition.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">Analytical Insight:</strong>
            Prescribing inhalers to a child returning daily to a mold-infested, unventilated room without addressing structural determinants is merely managing symptoms while ignoring etiology.
          </div>
        `
      },
      {
        code: 'm2v3',
        sequence: 3,
        fallbackDuration: '04:53',
        title_ar: 'تكافؤ الفرص وعدالة النظم الصحية',
        title_en: 'Equal Opportunity & Healthcare Disparities',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يطرح هذا الدرس سؤالاً جوهرياً ومحرجاً: هل يولد جميع البشر بفرص متكافئة للتمتع بحياة صحية سليمة؟ نستكشف هنا الآليات الهيكلية التي تولد الفوارق الصحية وتجعل الفئات الأضعف تدفع الفاتورة الأكبر للتدهور البيئي وتغير المناخ.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>التدرج الصحي الاجتماعي (Social Gradient):</strong> التناسب الطردي الصريح بين المستوى الاقتصادي والاجتماعي وبين مؤشرات السلامة البدنية وطول العمر.</li>
            <li><strong>الحواجز الهيكلية:</strong> غياب وسائل النقل الموثوقة، فقدان التأمين الصحي، وانعدام شبكات المياه الصالحة كعوائق حقيقية أمام الرعاية.</li>
            <li><strong>مضاعفة الأثر المناخي:</strong> الكوارث المناخية مثل الفيضانات وموجات الحر لا تضرب الجميع بالتساوي، بل تعمق الفقر وتدمر البنى التحتية الهشة أولاً.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">خلاصة الدرس:</strong>
            عدالة النظم الصحية تتطلب الاعتراف الصريح بأن الحياد في بيئة غير عادلة يعزز الظلم. واجبنا المهني هو الدفاع عن حقوق الفئات الأكثر تهميشاً.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This lesson tackles an uncomfortable inquiry: Are all human beings truly born with equal opportunities to attain vibrant health? We interrogate the systemic mechanisms producing health disparities, leaving marginalized cohorts to shoulder the burden of environmental breakdown.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>The Social Gradient in Health:</strong> The linear correlation between socioeconomic status, disease morbidity, and premature mortality.</li>
            <li><strong>Structural Barriers to Care:</strong> Public transit deficits, lack of health coverage, and absence of municipal water distribution networks.</li>
            <li><strong>Climatic Compounding:</strong> Climate anomalies do not affect populations uniformly; floods and heatwaves systematically devastate fragile settlements first.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">Ethical Imperative:</strong>
            Health justice requires acknowledging that neutrality in an unequal system only reinforces injustice. Our mandate is proactive advocacy for underserved communities.
          </div>
        `
      },
      {
        code: 'm2v4',
        sequence: 4,
        fallbackDuration: '05:32',
        title_ar: 'المساواة مقابل الإنصاف الصحي',
        title_en: 'Equality vs Health Equity',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يعد التمييز بين "المساواة" و"الإنصاف" أحد أهم المفاهيم التأسيسية في علم الصحة العامة المعاصر. استعارة السور الخشبي والمشاهدين الثلاثة توضح بجلاء لماذا يفشل توزيع الموارد المتساوي في تحقيق العدالة الحقيقية إذا لم نأخذ بعين الاعتبار نقطة البداية لكل فرد.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>المساواة (Equality):</strong> إعطاء الجميع نفس الصندوق للوقوف عليه، مما يترك الأقصر غير قادر على رؤية ما وراء السور.</li>
            <li><strong>الإنصاف (Equity):</strong> توزيع الموارد والدعم بحسب الاحتياج الفعلي والهشاشة لتمكين الجميع من تحقيق نفس النتيجة العادلة.</li>
            <li><strong>إزالة العائق الهيكلي (Justice):</strong> الحل الأسمى هو هدم السور الخشبي واستبداله بسياج شبكي شفاف يتيح الرؤية للجميع دون الحاجة لصناديق.</li>
            <li><strong>التطبيق المناخي:</strong> توجيه محطات التبريد والمولدات الكهربائية والمساعدات الطبية للأحياء الأكثر فقراً بالغطاء النباتي والمكيفات.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-right: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">قاعدة التوزيع العادل:</strong>
            الإنصاف الصحي لا يعني توزيع الميزانيات بالتساوي بالأرقام، بل توجيه القوة الاستثمارية لحماية الأرواح الأكثر عرضة للموت في أوقات الأزمات.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>Distinguishing between Equality and Equity represents a foundational cornerstone in contemporary epidemiology. The classic viewing-fence metaphor powerfully demonstrates why identical resource distribution exacerbates health inequities when baseline vulnerabilities diverge.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Equality:</strong> Providing every individual the identical box to stand upon, leaving the shortest person still unable to view over the fence.</li>
            <li><strong>Equity:</strong> Tailoring resources and support proportional to baseline deficits so that everyone achieves an equitable outcome.</li>
            <li><strong>Structural Justice:</strong> The ultimate goal is dismantling the wooden barrier entirely, replacing it with transparent fencing that eliminates structural disadvantages.</li>
            <li><strong>Climate Operationalization:</strong> Prioritizing emergency cooling centers, shade canopies, and hydration stations in thermally burdened neighborhoods.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">Operational Rule:</strong>
            Health equity does not mean dividing budgets mathematically into equal slices; it demands directing resources where vulnerability is highest and consequences are life-threatening.
          </div>
        `
      },
      {
        code: 'm2v5',
        sequence: 5,
        fallbackDuration: '06:19',
        title_ar: 'التحول الاستراتيجي: استعارة النهر والوقاية من المنبع',
        title_en: 'Upstream Prevention: The River Metaphor',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>ينقلنا هذا الدرس عبر القصة الشهيرة لاستعارة النهر: أشخاص يقفون على ضفة نهر جارف يرون غرقى يصرخون، فيندفع الجميع لانتشالهم وإنعاشهم. ومع تزايد أعداد الغرقى وتعب المنقذين، يصرخ أحدهم: "بدلاً من الاستمرار في انتشال الغرقى، دعونا نصعد للمنبع لنعرف من يدفعهم في الماء ونمنعه!".</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>الوقاية عند المصب (Downstream Care):</strong> العلاج السريري والطوارئ في المستشفيات بعد وقوع الإصابة (إنقاذ الغريق).</li>
            <li><strong>الوقاية في منتصف المجرى (Midstream Intervention):</strong> تعديل السلوك الفردي وتوزيع منشورات التوعية ومعدات الوقاية.</li>
            <li><strong>الوقاية من المنبع (Upstream Prevention):</strong> معالجة الأسباب الجذرية: تشريعات حماية العمال، التخطيط الحضري الأخضر، وخفض الانبعاثات الحرارية.</li>
            <li><strong>الجدوى الاقتصادية:</strong> تكلفة غرس الأشجار وتوفير مياه الشرب المجانية تعادل جزءاً ضئيلاً من تكلفة علاج ضربات الشمس في وحدات العناية الفائقة.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">الرؤية الاستراتيجية:</strong>
            البطولة الحقيقية في الصحة العامة ليست في عدد المرضى الذين نعالجهم في الطوارئ، بل في الحفاظ على صحة وسلامة الناس قبل أن يسقطوا في النهر.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This lesson explores the classic public health allegory of the raging river. Bystanders repeatedly dive into treacherous currents to rescue drowning victims. As casualties surge and rescuers exhaust their energy, a crucial insight emerges: "Instead of endlessly pulling victims out downstream, we must walk upstream to stop what is throwing them in!"</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Downstream Clinical Triage:</strong> Emergency room treatment and acute medical rescue after illness occurs.</li>
            <li><strong>Midstream Behavioral Mitigations:</strong> Promoting individual behavioral modifications, personal hydration, and warning alerts.</li>
            <li><strong>Upstream Structural Prevention:</strong> Eliminating root causes through municipal urban forestry, labor protection ordinances, and heat mitigation infrastructure.</li>
            <li><strong>Fiscal ROI:</strong> The capital expenditure required for urban tree canopies and civic hydration networks is a fraction of the cost of intensive hospital admissions.</li>
          </ul>

          <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Strategic Takeaway:</strong>
            True public health heroism lies not solely in the volume of emergency interventions, but in creating living conditions that prevent people from falling into the river in the first place.
          </div>
        `
      },
      {
        code: 'm2v6',
        sequence: 6,
        fallbackDuration: '05:27',
        title_ar: 'تصميم المبادرات الميدانية وفق الاحتياجات الواقعية',
        title_en: 'Designing Community Health Interventions',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>كم من المبادرات والخطط الصحية وُضعت خلف المكاتب المكيفة وفشلت فور نزولها إلى أرض الواقع لأنها لم تستشر أصحاب المصلحة الحقيقيين؟ يتعلم الطالب في هذا الدرس منهجية تصميم المبادرات التشاركية التي تنبع من صميم احتياجات السكان اليومية.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>التقييم السريع التشاركي (Participatory Rapid Appraisal):</strong> الاستماع المباشر للسكان المحليين والتعرف على المشاكل من وجهة نظرهم.</li>
            <li><strong>إشراك القيادات المجتمعية:</strong> التعاون مع وجهاء الأحياء، المعلمين، وأصحاب المتاجر لضمان قبول الحملة واستدامتها.</li>
            <li><strong>المرونة والتكيف الميداني:</strong> تعديل الأهداف والخطط بناءً على التغذية الراجعة الفورية من المستفيدين بدلاً من التمسك بالخطط الجامدة.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">حكمة التنفيذ:</strong>
            أي حل صحي مصمم "لأجل" المجتمع دون مشاركة المجتمع نفسه محكوم عليه بالفشل الميداني. المشاركة تصنع الملكية والالتزام.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>Countless well-funded health initiatives formulated in air-conditioned offices collapse upon field deployment because they failed to engage target communities. This lesson teaches participatory co-design methodologies rooted in lived realities.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Participatory Rapid Appraisal (PRA):</strong> Direct, structured stakeholder interviews to identify bottlenecks from the community perspective.</li>
            <li><strong>Mobilizing Local Leadership:</strong> Partnering with neighborhood elders, educators, and shopkeepers to cultivate institutional trust and long-term ownership.</li>
            <li><strong>Iterative Field Flexibility:</strong> Adapting project timelines and tactics based on continuous feedback loops rather than dogmatic protocol adherence.</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #b45309; display: block; margin-bottom: 6px;">Field Wisdom:</strong>
            Any public health strategy designed for a community without the active involvement of the community is bound to fail. Co-design breeds enduring ownership.
          </div>
        `
      },
      {
        code: 'm2v7',
        sequence: 7,
        fallbackDuration: '06:55',
        title_ar: 'إنسانية التغير المناخي وتجاوز الصورة النمطية',
        title_en: 'The Human Face of Climate Change Beyond Stereotypes',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يرفض هذا الدرس حصر أزمة التغير المناخي في صور الدببة القطبية والجليد الذائب في أقاصي الأرض. التغير المناخي هو قبل كل شيء أزمة صحة إنسان، أمن غذائي، وتهجير مجتمعي يمس عائلاتنا وأطفالنا هنا والآن في منطقتنا العربية وجنوب المتوسط.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>الوجه الإنساني للأزمة:</strong> انتشار الأمراض المنقولة بالنواقل كحمى الضنك والملاريا، تفاقم أمراض الكلى وأمراض القلب بسبب الجفاف المزمن.</li>
            <li><strong>العدالة المناخية (Climate Justice):</strong> المجتمعات التي ساهمت بأقل نسبة من الانبعاثات الكربونية هي التي تدفع أعلى فاتورة في الأرواح وخسارة سبل العيش.</li>
            <li><strong>القلق البيئي والصحة النفسية (Eco-Anxiety):</strong> الأثر النفسي العميق على الأجيال الشابة نتيجة الخوف من المستقبل والاضطرار للنزوح المناخي.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">تأكيد محوري:</strong>
            عندما نناقش التغير المناخي، نحن لا نتحدث عن رفاهية الحفاظ على الطبيعة، بل نتحدث عن حق أساسي في الحياة والأمان الصحي للأجيال القادمة.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This lesson rejects the conventional reduction of climate change to distant polar bears and melting ice caps. Climate change is fundamentally an immediate public health crisis, a food security emergency, and an existential displacement threat directly affecting communities across our region.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>The Human Face of the Crisis:</strong> The northward expansion of vector-borne epidemics (dengue, malaria), escalating chronic kidney disease (CKDu), and cardiovascular emergencies under prolonged dehydration.</li>
            <li><strong>Global Climate Justice:</strong> Frontline populations with minimal historical carbon emissions bear the highest mortality burdens and economic disruption.</li>
            <li><strong>Psychological & Eco-Anxiety Impacts:</strong> Chronic psychological trauma, eco-grief, and social disruption stemming from climatic displacement.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">Core Realization:</strong>
            When we advocate on climate change, we are not debating abstract conservation; we are defending the fundamental human right to life, clean air, and health.
          </div>
        `
      },
      {
        code: 'm2v8',
        sequence: 8,
        fallbackDuration: '05:31',
        title_ar: 'فاعلية الفرد والقيادة في مواجهة أزمات الكوكب',
        title_en: 'Individual Agency & Climate Health Leadership',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>أمام ضخامة التحديات الكوكبية، قد يتسرب شعور العجز إلى قلب الفرد: "ماذا يمكن لشخص واحد مثلي أن يفعل أمام أزمة تهدد كوكباً بأكمله؟". يفكك هذا الدرس عقدة العجز المكتسب ويبين كيف أن كل تحول تاريخي كبير بدأ بشرارة فردية امتلكت الرؤية والشجاعة.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>الفاعلية الذاتية (Self-Efficacy):</strong> الثقة بالقدرة على إحداث تأثير تراكمي يبدأ من محيط الأسرة والعيادة والحي السكني.</li>
            <li><strong>القيادة التحويلية:</strong> تحويل المعرفة العلمية إلى مبادرات ملهمة توحد جهود الأطباء، المهندسين، والنشطاء المحليين.</li>
            <li><strong>بناء الشبكات والتحالفات:</strong> تعظيم الأثر الفردي عبر الانخراط في تحالفات إقليمية ودولية تدافع عن العدالة المناخية والصحية.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-right: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">رسالة للأمل والعمل:</strong>
            لا تقلل أبداً من أثر خطوة واعية تقوم بها اليوم. كل قطرة وعي تزرعها في مجتمعك هي لبنة في بناء سد الصمود ضد الأزمات القادمة.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>Confronted with macroeconomic planetary shifts, individuals frequently experience paralysis: "What can one practitioner accomplish against a global crisis?". This lesson dismantles acquired helplessness, illustrating how historic public health breakthroughs consistently began with principled individual leadership.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>Self-Efficacy in Public Health:</strong> Cultivating confidence in individual capacity to trigger compounding changes across families, clinics, and municipal neighborhoods.</li>
            <li><strong>Transformational Leadership:</strong> Translating empirical scientific evidence into cohesive initiatives uniting clinicians, urban engineers, and civic activists.</li>
            <li><strong>Cross-Sectoral Coalition Building:</strong> Amplifying localized impact by joining regional and international coalitions championing climate health equity.</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">Call to Action:</strong>
            Never discount the compounding power of conscious local action. Every evidence-based practice you champion strengthens institutional resilience against coming challenges.
          </div>
        `
      },
      {
        code: 'm2v9',
        sequence: 9,
        fallbackDuration: '08:18',
        title_ar: 'العدسة الوبائية والتحليل السببي للأمراض',
        title_en: 'The Epidemiological Lens & Causal Disease Analysis',
        content_ar: `
          <h4>نظرة عامة على الدرس</h4>
          <p>يتوج هذا الدرس النهائي برنامج الزمالة بتسليح المشارك بالسلاح الأقوى في مواجهة الأزمات الصحية: العدسة الوبائية والتحليل السببي العلمي. عندما يرى غير المختص تفشي المرض كضربة حظ أو قدر عشوائي، يرى الوبائي شبكة متكاملة من الأسباب المترابطة التي يمكن كسرها والوقاية منها.</p>
          
          <h4>المحاور والمفاهيم الجوهرية</h4>
          <ul>
            <li><strong>المثلث الوبائي (Epidemiological Triad):</strong> التفاعل المعقد بين العامل الممرض (Agent)، المضيف البشري (Host)، والبيئة المناخية المحيطة (Environment).</li>
            <li><strong>التحليل المكاني ونظم المعلومات الجغرافية (GIS):</strong> ربط بيانات تفشي الأمراض بالخرائط الحرارية، مصادر المياه، وتجمعات النفايات لاكتشاف بؤر العدوى مبكراً.</li>
            <li><strong>الترصد الوبائي والإنذار المبكر:</strong> بناء أنظمة رصد استباقية تتوقع موجات الأمراض قبل أن تصل إلى ذروتها في المستشفيات.</li>
            <li><strong>ختام المساق:</strong> التعهد بالعمل كقادة ميدانيين يحملون رسالة الصحة والمناخ لحماية الأجيال القادمة في مجتمعاتنا.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">خاتمة الزمالة:</strong>
            العلم أمانة، والعدسة الوبائية مسؤولية. لقد تخرجت اليوم لتكون عيناً ساهرة تحمي مجتمعك وتصنع فارقاً حقيقياً في معركة الإنسانية من أجل مستقبل صحي مستدام.
          </div>
        `,
        content_en: `
          <h4>Lesson Overview</h4>
          <p>This capstone lesson concludes the fellowship by equipping participants with modern public health's strongest instrument: the epidemiological lens and rigorous causal disease analysis. Where untrained observers perceive outbreaks as misfortune, the epidemiologist deciphers actionable causal chains.</p>
          
          <h4>Core Themes & Concepts</h4>
          <ul>
            <li><strong>The Epidemiological Triad:</strong> Intersecting dynamics between the pathogenic Agent, the vulnerable human Host, and the changing ambient Environment.</li>
            <li><strong>Spatial GIS Analytics:</strong> Overlaying clinical disease incidence onto surface temperature maps, hydrological sources, and municipal sanitation infrastructure to detect transmission foci.</li>
            <li><strong>Syndromic Surveillance & Early Warning Systems:</strong> Operationalizing predictive telemetry to intercept epidemic waves prior to emergency room overflow.</li>
            <li><strong>Fellowship Culmination:</strong> Committing to serve as front-line public health stewards translating climate epidemiology into regional resilience.</li>
          </ul>

          <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #047857; display: block; margin-bottom: 6px;">Fellowship Conclusion:</strong>
            Scientific knowledge is a sacred trust, and the epidemiological lens is a professional responsibility. You step forward today equipped to safeguard communities and lead the transition toward planetary health resilience.
          </div>
        `
      }
    ]
  }
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function probeVideoDuration(filePath, fallbackDuration) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    const durationSec = parseFloat(stdout.trim());
    if (!isNaN(durationSec) && durationSec > 0) {
      return formatDuration(durationSec);
    }
  } catch (err) {
    // ffprobe failed or not in PATH, use fallback
  }
  return fallbackDuration;
}

function renderProgressBar(percentage, currentBytes, totalBytes, speedBytesSec, etaSec) {
  const width = 24;
  const filled = Math.min(width, Math.max(0, Math.round((percentage / 100) * width)));
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  const currentMB = (currentBytes / (1024 * 1024)).toFixed(1);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const speedMB = (speedBytesSec / (1024 * 1024)).toFixed(2);
  const etaStr = etaSec >= 0 && isFinite(etaSec) ? `${Math.round(etaSec)}s` : '--';

  process.stdout.write(`\r    [\x1b[36m${bar}\x1b[0m] ${percentage.toFixed(1).padStart(5)}% (${currentMB}/${totalMB} MB) | ${speedMB} MB/s | ETA: ${etaStr} `);
}

async function withRetry(fn, retries = 4, delayMs = 2500) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        process.stdout.write(`\n  \x1b[33m[NETWORK GLITCH - RETRYING ${attempt}/${retries - 1}]\x1b[0m ${err.message || err}. Backoff ${(delayMs / 1000).toFixed(1)}s...\n`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs = Math.round(delayMs * 1.5);
      }
    }
  }
  throw lastErr;
}

async function checkR2ObjectExists(key) {
  return withRetry(async () => {
    try {
      const res = await r2Client.send(new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
      }));
      return { exists: true, size: res.ContentLength };
    } catch (err) {
      if (err.name === 'NotFound' || err.name === 'NoSuchKey' || err['$metadata']?.httpStatusCode === 404) {
        return { exists: false, size: 0 };
      }
      throw err;
    }
  });
}

async function uploadFileToR2({ filePath, key, mimeType, showProgress = false }) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Local file not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  const totalBytes = stat.size;

  // Idempotence check
  if (!IS_FORCE) {
    const remote = await checkR2ObjectExists(key);
    if (remote.exists && remote.size === totalBytes) {
      return { skipped: true, key, size: totalBytes };
    }
  }

  if (IS_DRY_RUN) {
    return { skipped: false, key, size: totalBytes, dryRun: true };
  }

  if (!showProgress) {
    // Small file fast upload with retry
    await withRetry(async () => {
      const buffer = fs.readFileSync(filePath);
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: totalBytes,
      }));
    });
    return { skipped: false, key, size: totalBytes };
  }

  // Large file upload with live telemetry & retry
  await withRetry(async () => {
    let uploadedBytes = 0;
    const startTime = Date.now();
    let lastUpdate = startTime;

    const tracker = new Transform({
      transform(chunk, encoding, callback) {
        uploadedBytes += chunk.length;
        const now = Date.now();

        if (now - lastUpdate > 150 || uploadedBytes === totalBytes) {
          lastUpdate = now;
          const elapsedSec = (now - startTime) / 1000;
          const speed = elapsedSec > 0 ? uploadedBytes / elapsedSec : 0;
          const pct = (uploadedBytes / totalBytes) * 100;
          const remainingBytes = totalBytes - uploadedBytes;
          const eta = speed > 0 ? remainingBytes / speed : 0;
          renderProgressBar(pct, uploadedBytes, totalBytes, speed, eta);
        }

        callback(null, chunk);
      }
    });

    const stream = fs.createReadStream(filePath).pipe(tracker);

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: stream,
      ContentType: mimeType,
      ContentLength: totalBytes,
    }));
  });

  process.stdout.write('\n'); // Commit progress line
  return { skipped: false, key, size: totalBytes };
}

// ─── MAIN ORCHESTRATION ──────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m\x1b[34m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[34m  ClimaMedix LMS - Multi-Asset R2 Ingestion & Supabase Sync Engine\x1b[0m');
  console.log('\x1b[1m\x1b[34m========================================================================\x1b[0m\n');

  console.log(`\x1b[33m[TARGET COURSE]\x1b[0m ${TARGET_COURSE_ID}`);
  console.log(`\x1b[33m[R2 BUCKET]\x1b[0m     ${R2_BUCKET} (${R2_PUBLIC_URL})`);
  console.log(`\x1b[33m[OPTIONS]\x1b[0m       DryRun: ${IS_DRY_RUN} | Force: ${IS_FORCE} | SkipUpload: ${SKIP_UPLOAD} | SkipDB: ${SKIP_DB} | Module: ${TARGET_MODULE || 'All (1 & 2)'}\n`);

  // Filter modules if requested
  const modulesToProcess = TARGET_MODULE 
    ? CURRICULUM.filter(m => m.moduleNumber === TARGET_MODULE)
    : CURRICULUM;

  if (modulesToProcess.length === 0) {
    console.error(`\x1b[31m[ERROR] Module ${TARGET_MODULE} not found in curriculum matrix.\x1b[0m`);
    process.exit(1);
  }

  // Pre-flight check: Verify course exists in Supabase
  if (!SKIP_DB && !IS_DRY_RUN) {
    console.log('🔍 Verifying Course in Supabase...');
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, title_en')
      .eq('id', TARGET_COURSE_ID)
      .single();

    if (courseErr || !course) {
      console.error(`\x1b[31m[ERROR] Target course ${TARGET_COURSE_ID} not found in Supabase database:\x1b[0m`, courseErr?.message);
      process.exit(1);
    }
    console.log(`  \x1b[32m✔\x1b[0m Found course: "${course.title_en}"\n`);
  }

  const executionResults = [];

  for (const mod of modulesToProcess) {
    console.log(`\x1b[1m\x1b[35m------------------------------------------------------------------------\x1b[0m`);
    console.log(`\x1b[1m\x1b[35m  PROCESSING MODULE ${mod.moduleNumber}: ${mod.title_en}\x1b[0m`);
    console.log(`\x1b[1m\x1b[35m------------------------------------------------------------------------\x1b[0m`);

    // Ensure Module record exists in Supabase
    if (!SKIP_DB && !IS_DRY_RUN) {
      const { data: existingMod } = await supabase
        .from('modules')
        .select('id')
        .eq('id', mod.moduleId)
        .maybeSingle();

      if (existingMod) {
        await supabase
          .from('modules')
          .update({
            title_ar: mod.title_ar,
            title_en: mod.title_en,
            description_ar: mod.description_ar,
            description_en: mod.description_en,
            sequence_order: mod.moduleNumber,
          })
          .eq('id', mod.moduleId);
        console.log(`  \x1b[32m✔\x1b[0m Synchronized Module ${mod.moduleNumber} metadata`);
      } else {
        await supabase
          .from('modules')
          .insert({
            id: mod.moduleId,
            course_id: TARGET_COURSE_ID,
            title_ar: mod.title_ar,
            title_en: mod.title_en,
            description_ar: mod.description_ar,
            description_en: mod.description_en,
            sequence_order: mod.moduleNumber,
          });
        console.log(`  \x1b[32m✔\x1b[0m Created Module ${mod.moduleNumber} record`);
      }
    }

    for (const lesson of mod.lessons) {
      const lessonLabel = `[M${mod.moduleNumber}L${lesson.sequence}] ${lesson.code} - ${lesson.title_en}`;
      console.log(`\n\x1b[1m\x1b[36m➤ ${lessonLabel}\x1b[0m`);

      const result = {
        code: lesson.code,
        moduleNumber: mod.moduleNumber,
        sequence: lesson.sequence,
        title_ar: lesson.title_ar,
        title_en: lesson.title_en,
        duration: lesson.fallbackDuration,
        videoStatus: 'pending',
        arVttStatus: 'pending',
        enVttStatus: 'pending',
        dbStatus: 'pending',
      };

      // 1. Locate local asset files
      const videoFile = findExistingFile(VIDEO_SOURCE_DIRS, `${lesson.code}.mp4`);
      const arVttFile = findExistingFile(SUBTITLES_AR_DIRS, `${lesson.code}.vtt`);
      const enVttFile = findExistingFile(SUBTITLES_EN_DIRS, `${lesson.code}.vtt`);

      if (!videoFile) {
        console.warn(`  \x1b[31m✖ Video missing:\x1b[0m ${lesson.code}.mp4 not found in source dirs!`);
        result.videoStatus = 'missing_file';
      }
      if (!arVttFile) {
        console.warn(`  \x1b[31m✖ Arabic VTT missing:\x1b[0m ${lesson.code}.vtt`);
        result.arVttStatus = 'missing_file';
      }
      if (!enVttFile) {
        console.warn(`  \x1b[31m✖ English VTT missing:\x1b[0m ${lesson.code}.vtt`);
        result.enVttStatus = 'missing_file';
      }

      // 2. Probe Duration via ffprobe
      if (videoFile) {
        result.duration = await probeVideoDuration(videoFile, lesson.fallbackDuration);
        console.log(`  ⏱ Probed Duration: \x1b[32m${result.duration}\x1b[0m`);
      }

      // 3. Upload Arabic Subtitles
      const arKey = `subtitles/ar/${lesson.code}.vtt`;
      if (!SKIP_UPLOAD && arVttFile) {
        try {
          const res = await uploadFileToR2({
            filePath: arVttFile,
            key: arKey,
            mimeType: 'text/vtt; charset=utf-8',
            showProgress: false
          });
          result.arVttStatus = res.skipped ? 'skipped_exists' : (res.dryRun ? 'dry_run' : 'uploaded');
          const badge = res.skipped ? '\x1b[33m[SKIPPED - EXISTS]\x1b[0m' : '\x1b[32m[UPLOADED]\x1b[0m';
          console.log(`  ${badge} Subtitle AR: ${arKey}`);
        } catch (err) {
          result.arVttStatus = 'error';
          console.error(`  \x1b[31m[ERROR]\x1b[0m Subtitle AR upload failed:`, err.message);
        }
      } else if (SKIP_UPLOAD) {
        result.arVttStatus = 'skipped_cli';
      }

      // 4. Upload English Subtitles
      const enKey = `subtitles/en/${lesson.code}.vtt`;
      if (!SKIP_UPLOAD && enVttFile) {
        try {
          const res = await uploadFileToR2({
            filePath: enVttFile,
            key: enKey,
            mimeType: 'text/vtt; charset=utf-8',
            showProgress: false
          });
          result.enVttStatus = res.skipped ? 'skipped_exists' : (res.dryRun ? 'dry_run' : 'uploaded');
          const badge = res.skipped ? '\x1b[33m[SKIPPED - EXISTS]\x1b[0m' : '\x1b[32m[UPLOADED]\x1b[0m';
          console.log(`  ${badge} Subtitle EN: ${enKey}`);
        } catch (err) {
          result.enVttStatus = 'error';
          console.error(`  \x1b[31m[ERROR]\x1b[0m Subtitle EN upload failed:`, err.message);
        }
      } else if (SKIP_UPLOAD) {
        result.enVttStatus = 'skipped_cli';
      }

      // 5. Upload Master Video
      const videoKey = `course_videos/${lesson.code}.mp4`;
      if (!SKIP_UPLOAD && videoFile) {
        try {
          console.log(`  🚀 Ingesting Master Video: ${videoKey} ...`);
          const res = await uploadFileToR2({
            filePath: videoFile,
            key: videoKey,
            mimeType: 'video/mp4',
            showProgress: true
          });
          result.videoStatus = res.skipped ? 'skipped_exists' : (res.dryRun ? 'dry_run' : 'uploaded');
          const badge = res.skipped ? '\x1b[33m[SKIPPED - EXISTS]\x1b[0m' : '\x1b[32m[UPLOADED]\x1b[0m';
          console.log(`  ${badge} Video: ${videoKey} (${(res.size / (1024 * 1024)).toFixed(1)} MB)`);
        } catch (err) {
          result.videoStatus = 'error';
          console.error(`  \x1b[31m[ERROR]\x1b[0m Video upload failed:`, err.message);
        }
      } else if (SKIP_UPLOAD) {
        result.videoStatus = 'skipped_cli';
      }

      // 6. Synchronize with Supabase (incorporating Rich Text Content)
      if (!SKIP_DB && !IS_DRY_RUN) {
        try {
          await withRetry(async () => {
            const { data: existingLesson, error: findErr } = await supabase
              .from('lessons')
              .select('id')
              .eq('module_id', mod.moduleId)
              .eq('sequence_order', lesson.sequence)
              .maybeSingle();

            if (findErr) throw findErr;

            const lessonPayload = {
              module_id: mod.moduleId,
              sequence_order: lesson.sequence,
              title_ar: lesson.title_ar,
              title_en: lesson.title_en,
              content_ar: lesson.content_ar.trim(),
              content_en: lesson.content_en.trim(),
              duration: result.duration,
              video_url: videoKey,
              is_quiz: false,
            };

            if (existingLesson) {
              const { error: updateErr } = await supabase
                .from('lessons')
                .update(lessonPayload)
                .eq('id', existingLesson.id);

              if (updateErr) throw updateErr;
              result.dbStatus = `updated (${existingLesson.id.slice(0, 8)})`;
              console.log(`  \x1b[32m✔\x1b[0m Supabase Lesson record updated [${existingLesson.id}]`);
            } else {
              const { data: newLesson, error: insertErr } = await supabase
                .from('lessons')
                .insert(lessonPayload)
                .select('id')
                .single();

              if (insertErr) throw insertErr;
              result.dbStatus = `created (${newLesson.id.slice(0, 8)})`;
              console.log(`  \x1b[32m✔\x1b[0m Supabase Lesson record created [${newLesson.id}]`);
            }
          });
        } catch (err) {
          result.dbStatus = 'error';
          console.error(`  \x1b[31m[ERROR]\x1b[0m Supabase DB sync failed:`, err.message);
        }
      } else if (IS_DRY_RUN) {
        result.dbStatus = 'dry_run';
      } else {
        result.dbStatus = 'skipped_cli';
      }

      executionResults.push(result);
    }
  }

  // ─── EXECUTION SUMMARY MATRIX ────────────────────────────────────────────────
  console.log('\n\x1b[1m\x1b[32m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m  INGESTION & SYNCHRONIZATION SUMMARY MATRIX\x1b[0m');
  console.log('\x1b[1m\x1b[32m========================================================================\x1b[0m\n');

  console.log('| Lesson | Title (EN) | Duration | Video R2 | AR VTT | EN VTT | DB Sync |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const r of executionResults) {
    console.log(`| **${r.code}** | ${r.title_en.slice(0, 32)}... | ${r.duration} | ${r.videoStatus} | ${r.arVttStatus} | ${r.enVttStatus} | ${r.dbStatus} |`);
  }
  console.log('\n\x1b[32mDone! All requested tasks completed.\x1b[0m\n');
}

main().catch(err => {
  console.error('\x1b[31m[FATAL UNCAUGHT ERROR]\x1b[0m', err);
  process.exit(1);
});
