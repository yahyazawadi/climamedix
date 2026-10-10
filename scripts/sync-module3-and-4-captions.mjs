import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MODULE_3_LESSONS = [
  {
    sequence: 1,
    title_ar: 'مقدمة في علوم المناخ (الفرق بين الطقس والمناخ)',
    title_en: 'Introduction to Climate Science: Weather vs Climate',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يؤسس هذا الدرس الفارق العلمي الجوهري بين "الطقس" العابر الذي نعيشه يوماً بيوم، و"المناخ" كنظام كوكبي متكامل يمتد لعقود وقرون. يوضح كيف أن اختلال ميزان الطاقة العالمي ليس مجرد حرارة صيفية عادية، بل تغير جذري في القواعد الفيزيائية التي تحكم حياة البشر على الأرض.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>الطقس مقابل المناخ:</strong> الطقس حالة الغلاف الجوي اللحظية (ساعات أو أيام)، بينما المناخ هو السلوك الإحصائي التراكمي للنظام الجوي على مدى 30 عاماً فأكثر.</li>
        <li><strong>ميزانية طاقة الأرض:</strong> التوازن الحرج بين الإشعاع الشمسي القصير الوافد والإشعاع الحراري طويل الموجة المنبعث إلى الفضاء.</li>
        <li><strong>النظام المناخي المعقد:</strong> التفاعل المتشابك بين الغلاف الجوي، والمحيطات، والغلاف الجليدي، وسطح الأرض، والغلاف الحيوي.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">مفتاح الفهم الميداني:</strong>
        لا تدع أحداً يخلط بين يوم بارد غير معتاد وبين نفي الاحتباس الحراري. الطقس هو مزاج الكوكب اليومي، أما المناخ فهو شخصيته الثابتة التي باتت تضطرب بسرعة غير مسبوقة.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This foundational lesson establishes the crucial scientific distinction between daily atmospheric weather and long-term planetary climate systems. It demonstrates how global energy imbalance is not merely an unusually hot summer, but a profound transformation of the fundamental physical dynamics governing human habitability.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Weather vs. Climate:</strong> Weather reflects immediate local conditions over hours or days; climate represents the 30-year statistical baseline of planetary atmospheric patterns.</li>
        <li><strong>Earth's Energy Budget:</strong> The delicate equilibrium between incoming shortwave solar radiation and outgoing longwave infrared radiation.</li>
        <li><strong>The Coupled Climate Engine:</strong> Complex bidirectional feedbacks linking the atmosphere, oceans, cryosphere, lithosphere, and terrestrial biosphere.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Field Perspective:</strong>
        Never confuse a single cold day with climate denial. Weather is Earth's day-to-day mood; climate is its enduring personality, which is undergoing unprecedented rapid destabilization.
      </div>
    `
  },
  {
    sequence: 2,
    title_ar: 'نظام المناخ وميزانية طاقة الأرض وحلقات التغذية الراجعة',
    title_en: 'Earth Energy Budget & Climate Feedback Loops',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يغوص هذا الدرس في فيزياء الطاقة الكوكبية وحلقات التغذية الراجعة الذاتية التسارع. يكشف كيف تؤدي التغيرات الطفيفة في درجات الحرارة إلى إطلاق تفاعلات متسلسلة في المحيطات والجليد تعزز الاحترار ذاتياً دون الحاجة إلى تدخل بشري إضافي.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>أثر الألبيدو (الوضاءة الجليدية):</strong> كيف يفقد الكوكب مرآته الطبيعية العاكسة عند ذوبان الجليد الأبيض، مما يرفع امتصاص مياه المحيط الداكنة للحرارة بأكثر من 90%.</li>
        <li><strong>بخار الماء كمعزز للاحترار:</strong> الهواء الدافئ يستوعب رطوبة أعلى، وبخار الماء أقوى غاز دفيئة طبيعي يضاعف احتجاز الطاقة الحرارية.</li>
        <li><strong>نقاط التحول الحرجة (Tipping Points):</strong> العتبات الفيزيائية التي إذا تجاوزها النظام المناخي تصبح مسارات التدهور غير قابلة للعكس لعقود وقرون.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">خلاصة علمية حاسمة:</strong>
        الخطر الحقيقي في المناخ ليس فقط كمية الانبعاثات التي نطلقها اليوم، بل إيقاظ حلقات التغذية الراجعة الطبيعية التي تدحرج كرة الثلج الحرارية من تلقاء نفسها.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores planetary thermodynamics and self-amplifying climate feedback loops. It reveals how small temperature increments trigger compounding cascading chain reactions across oceans and cryospheric reservoirs that intensify warming autonomously.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Ice-Albedo Feedback:</strong> The progressive loss of reflective sea ice exposes dark ocean surfaces, which absorb over 90% of incoming solar heat instead of reflecting it.</li>
        <li><strong>Water Vapor Amplification:</strong> Warmer atmospheric columns hold higher vapor concentrations, acting as a potent greenhouse gas that doubles initial warming forcings.</li>
        <li><strong>Planetary Tipping Points:</strong> Critical physical thresholds beyond which structural ecosystem shifts become irreversible across centuries.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">Scientific Insight:</strong>
        The paramount existential risk is not merely current emissions volume, but awakening latent geophysical feedback mechanisms that perpetuate warming independently.
      </div>
    `
  },
  {
    sequence: 3,
    title_ar: 'ظاهرة الاحتباس الحراري الطبيعي والمعزز',
    title_en: 'Natural vs Enhanced Greenhouse Effect',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يفكك هذا الدرس الآلية الجزيئية للاحتباس الحراري. يوضح كيف كان الاحتباس الطبيعي شرطاً أساسياً لجعل كوكب الأرض قابلاً للحياة (بمتوسط 15 درجة مئوية بدلاً من 18 تحت الصفر)، وكيف تحول بفعل الأنشطة الصناعية إلى غطاء سميك يهدد استقرار الحضارة الإنسانية.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>الفيزياء الجزيئية للاحتباس:</strong> تمايز الغازات ثنائية الذرة الشفافة (النيتروجين والأكسجين) عن جزيئات الغازات الدفيئة متعددة الذرات التي تهتز وتمتص الأشعة تحت الحمراء.</li>
        <li><strong>الاحتباس الطبيعي كدرع للحياة:</strong> لولا هذا الغطاء الحراري الطبيعي لكانت الأرض كرة جليدية غير صالحة لأي شكل من أشكال الحياة المتطورة.</li>
        <li><strong>الاحتباس المعزز بفعل الإنسان:</strong> إضافة مليارات الأطنان من الكربون السنوي التي تزيد من سماكة هذا الغطاء وتحتجز الحرارة الإضافية داخل الغلاف الجوي.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">تأصيل علمي دقيق:</strong>
        الغازات الدفيئة ليست "سماً" بذاتها، بل هي غطاء صوف حمى الكوكب لآلاف السنين. المشكلة بدأت حين وضعنا أغطية صوفية إضافية فوق كوكب محموم أصلاً.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson deconstructs the molecular mechanisms of the greenhouse effect. It distinguishes between the indispensable natural greenhouse blanket that made Earth hospitable (sustaining an average 15°C instead of a frozen -18°C) and the modern anthropogenic enhancement threatening human health.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Molecular Dynamics:</strong> Transparent diatomic gases (N2, O2) transmit thermal radiation, whereas multi-atomic greenhouse molecules vibrate and re-radiate infrared energy.</li>
        <li><strong>The Baseline Habitable Envelope:</strong> Without natural atmospheric insulating blankets, terrestrial life would never have evolved beyond microbial extremophiles.</li>
        <li><strong>Anthropogenic Forcing:</strong> Injecting gigatons of fossil carbon thickens the thermal blanket, forcing unprecedented energy retention within the lower atmosphere.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">Scientific Principle:</strong>
        Greenhouse gases are not intrinsic toxins; they formed the planetary blanket that nurtured civilization. The crisis arose because we doubled the blanket over an already feverish planet.
      </div>
    `
  },
  {
    sequence: 4,
    title_ar: 'كيمياء الغلاف الجوي وغازات الدفيئة الأربعة الكبرى',
    title_en: 'Atmospheric Chemistry & The Big Four Greenhouse Gases',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يفتح هذا الدرس الملفات الكيميائية الدقيقة لغازات الدفيئة الأربعة الكبرى المسؤولة عن أزمة المناخ: ثاني أكسيد الكربون، الميثان، أكسيد النيتروز، والغازات المفلورة. يحلل التفاوت الهائل بينها في العمر الافتراضي وفي القدرة على احتباس الحرارة.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>ثاني أكسيد الكربون (CO2):</strong> المحرك طويل الأمد للاحترار؛ يمكث في الجو لقرون وآلاف السنين وتجاوز تركيزه 420 جزءاً بالمليون بقفزة تاريخية بنسبة 50%.</li>
        <li><strong>الميثان (CH4):</strong> العملاق الحراري السريع؛ قدرته على احتباس الحرارة تفوق ثاني أكسيد الكربون بـ 28 ضعفاً على مدى قرن، وبـ 80 ضعفاً في العشرين سنة الأولى.</li>
        <li><strong>أكسيد النيتروز (N2O) والغازات الفلورية:</strong> غازات زراعية وصناعية فائقة الشدة تحتجز حرارة أعلى بمئات وآلاف المرات مع فترات بقاء ممتدة.</li>
      </ul>

      <div style="background: rgba(139, 92, 246, 0.08); border-right: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">معادلة العمل المناخي:</strong>
        لحل الأزمة نحتاج استراتيجية مزدوجة: خفض الميثان يمنحنا تبريداً فورياً يشتري لنا الوقت، بينما القضاء على انبعاثات ثاني أكسيد الكربون هو الضمانة الوحيدة لحماية مستقبل الأجيال القادمة.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson provides a comprehensive forensic analysis of the Big Four greenhouse gases driving global warming: Carbon Dioxide (CO2), Methane (CH4), Nitrous Oxide (N2O), and Fluorinated Gases (F-gases), comparing atmospheric lifetimes and Global Warming Potentials (GWP).</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Carbon Dioxide (CO2):</strong> The long-term climate anchor; persists across centuries, surpassing 420 ppm (+50% increase above pre-industrial baselines).</li>
        <li><strong>Methane (CH4):</strong> The near-term thermal powerhouse; traps 28x more heat than CO2 over a century and 80x more over a 20-year horizon.</li>
        <li><strong>Nitrous Oxide & F-Gases:</strong> Potent agrochemical and industrial refrigerants capturing hundreds to thousands of times more infrared radiation with extended persistence.</li>
      </ul>

      <div style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">Strategic Insight:</strong>
        Tackling methane delivers fast near-term cooling that buys critical survival time, while eliminating CO2 emissions is the non-negotiable imperative to secure long-term civilization survival.
      </div>
    `
  },
  {
    sequence: 5,
    title_ar: 'القطاعات المسؤولة عن الانبعاثات وأثرها الصحي',
    title_en: 'Emission Sectors & Direct Public Health Impacts',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يدخل هذا الدرس إلى غرف العمليات في الاقتصاد العالمي ليفكك القطاعات المسؤولة عن الانبعاثات بنسبها الدقيقة، ويوضح كيف تتحول عوادم الطاقة، والصناعة، والزراعة، والنفايات إلى جسيمات سامة تخترق مجرى دم الإنسان وتفجر الأزمات القلبية والرئوية.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>قطاع الطاقة (73% من الانبعاثات):</strong> توليد الكهرباء والحرارة، النقل، واستهلاك المصانع القائم على حرق الفحم والنفط والغاز.</li>
        <li><strong>الزراعة واستخدام الأراضي (قرابة 20%):</strong> انبعاثات التخمر المعوي من المجترات، الأسمدة النيتروجينية، وتجريف الغابات المطيرة.</li>
        <li><strong>من مداخن الاقتصاد إلى رئة الإنسان:</strong> تلازم حرق الوقود الأحفوري مع إطلاق جسيمات PM2.5 الدقيقة التي تسبب السكتات الدماغية ونوبات الربو الحادة.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-right: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">الرابط الصحي المباشر:</strong>
        التحول نحو الطاقة النظيفة ليس رفاهية اقتصادية أو ترفاً بيئياً؛ بل هو أعظم وصفة طبية وقائية نمتلكها لحماية صدور أطفالنا وشرايين كبار السن في مجتمعاتنا.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores global industrial, agricultural, and energy sectors driving greenhouse emissions, demonstrating how macroeconomic emissions translate into particulate pollution that penetrates deep human lung tissue, enters circulation, and triggers strokes and cardiovascular failure.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Energy & Power Generation (~73%):</strong> Heavy electricity generation, vehicular transport, and industrial combustion reliant on fossil fuels.</li>
        <li><strong>Agriculture & Land Use (~20%):</strong> Enteric livestock fermentation, synthetic nitrogen fertilization, and extensive deforestation.</li>
        <li><strong>From Smokestacks to Human Arteries:</strong> Fossil combustion directly co-emits fine particulate matter (PM2.5), precipitating fatal strokes and acute asthma exacerbations.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">Clinical Reality:</strong>
        Accelerating the clean energy transition is not merely an ecological aspiration; it is the most potent preventive public health intervention available to save human lives.
      </div>
    `
  },
  {
    sequence: 6,
    title_ar: 'الأدلة الفيزيائية والرصدية لتغير المناخ',
    title_en: 'Observational Physical Evidence of Climate Change',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يضع هذا الدرس النظريات جانباً ليتسلح بالقياسات الفيزيائية المباشرة التي رصدتها الأقمار الصناعية ومراكز الأبحاث العالمية (NASA, NOAA, WMO). يقدم خمسة براهين قاطعة لا تقبل التشكيك على احترار الأرض وتغير ملامح بيئاتها الحيوية.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>ارتفاع الحرارة القياسي:</strong> ارتفاع متوسط حرارة سطح الكوكب بمقدار 1.1 إلى 1.2 درجة مئوية، وتسجيل العقد الأخير كأشد الفترات سخونة تاريخياً.</li>
        <li><strong>فقاعات الهواء في الجليد القطبي:</strong> تحليل عينات الجليد لـ 800 ألف سنة يثبت أن البشرية لم تعش يوماً في غلاف جوي يحمل هذه الكثافة الكربونية.</li>
        <li><strong>انحسار الجليد والتمدد الحراري:</strong> ذوبان مئات مليارات الأطنان الجليدية سنوياً وتمدد مياه المحيطات الدافئة لترفع منسوب البحر بوتيرة متسارعة.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">سلاح المثقف الصحي:</strong>
        تحدث بلغة الأرقام الرصدية المؤكدة، واربط كل درجة مئوية إضافية على مقياس الكوكب بارتفاع حالات الإجهاد الحراري وأزمات الربو في غرف طوارئ مشافينا.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson moves beyond hypothetical models to examine direct physical instrumentation recorded by NASA, NOAA, and the WMO. It details five empirical observational indicators proving planetary warming, accelerated glacial loss, and oceanic thermal expansion.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Empirical Surface Warming:</strong> Global mean surface temperatures have increased by 1.1-1.2°C, marking the last decade as the hottest in recorded human history.</li>
        <li><strong>Paleoclimate Ice Core Archives:</strong> Trapped atmospheric gas bubbles dating back 800,000 years verify that humanity has never existed under current CO2 concentrations.</li>
        <li><strong>Cryospheric Retreat & Thermal Expansion:</strong> Annual loss of hundreds of billions of tons of land ice coupled with volumetric ocean warming drives accelerated sea-level rise.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Practitioner Framework:</strong>
        Anchor your advocacy in validated empirical measurements. Connect every fraction of a degree in global temperature rise directly to emergency room admissions for thermal and respiratory distress.
      </div>
    `
  },
  {
    sequence: 7,
    title_ar: 'تفاعل أغلفة الأرض وأثرها المتسلسل على صحة المجتمع',
    title_en: 'Earth Spheres Interaction & Cascading Health Impacts',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يختتم هذا الدرس الموديول الثالث بتوضيح كيف تعمل أغلفة الأرض الخمسة (الجوي، المائي، الصخري، الجليدي، والحيوي) كجسد واحد متكامل، وكيف يتدفق أي اضطراب بيئي كالشلال المتتالي ليصيب صحة الإنسان وأمنه الغذائي والنفسي والمجتمعي.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>الترابط بين أغلفة الكوكب:</strong> تدفق الطاقة ودورات الماء والكربون والمغذيات التي تضمن عدم وجود أي ظاهرة بيئية معزولة عن الأخرى.</li>
        <li><strong>امتصاص المحيطات للحرارة:</strong> استيعاب البحار لأكثر من 90% من فائض الاحتباس، مما يغير التيارات المطرية ويفجر موجات الجفاف والسيول.</li>
        <li><strong>شلال التأثيرات الصحية المتتابعة:</strong> من جفاف السدود إلى تلوث المياه، فتفشي الأوبئة المعوية وسوء تغذية الأطفال، وصولاً إلى الأزمات النفسية والنزوح.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">القاعدة الكلية للموديول الثالث:</strong>
        كوكب الأرض جسد واحد، وحين يعطس المحيط تصاب اليابسة بالحمى وتختنق الرئة في المدينة. حماية صحة الإنسان تبدأ بفهم هذا التوازن البيئي الشامل.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This concluding lesson of Module 3 integrates Earth's five spheres (atmosphere, hydrosphere, lithosphere, cryosphere, and biosphere) into a single functional organism, illustrating how geophysical disruptions cascade into severe nutrition, psychological, and community health emergencies.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Interconnected Earth Spheres:</strong> Perpetual fluxes of energy, hydrologic cycles, carbon pools, and biochemical nutrients unify planetary ecosystems.</li>
        <li><strong>Oceanic Thermal Buffering:</strong> Oceans absorbing over 90% of excess planetary heat, disrupting monsoon rainfall systems and causing destructive drought-flood whiplash.</li>
        <li><strong>Cascading Public Health Pathways:</strong> From reservoir depletion to contaminated water supplies, epidemic cholera outbreaks, childhood malnutrition, and displacement trauma.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">Module Core Synthesis:</strong>
        Earth operates as one living entity: when the ocean sneezes, the land catches a fever, and city lungs choke. Securing human health demands honoring this planetary equilibrium.
      </div>
    `
  }
];

const MODULE_4_LESSONS = [
  {
    sequence: 1,
    title_ar: 'مدخل إلى الأثر الصحي: من تغير الكوكب إلى صحة الإنسان',
    title_en: 'Health Impacts Overview: Planetary Crisis to Human Body',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يفتتح هذا الدرس الموديول الرابع بنقلة نوعية تنقل قضية المناخ من القوالب البيئية المجردة إلى بيولوجيا أجسادنا وغرف الطوارئ في أحيائنا. يستعرض تحذير منظمة الصحة العالمية القاطع بأن التغير المناخي هو أكبر مهدد صحي وجودي يواجه البشرية في القرن الحادي والعشرين.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>المحددات الصحية الشاملة:</strong> نقاء الهواء، سلامة مياه الشرب، القيمة الغذائية للطعام، وأمان المساكن التي يهاجمها المناخ في ضربة واحدة.</li>
        <li><strong>الصدمات المباشرة وغير المباشرة:</strong> التفرقة بين الآثار الفورية لموجات الحر والكوارث، وبين التداعيات البطيئة كأزمات المياه وسوء التغذية وتفشي الأوبئة.</li>
        <li><strong>أرقام منظمة الصحة العالمية:</strong> توقع 250 ألف وفاة إضافية سنوياً بين 2030 و2050، ووجود 3.6 مليار إنسان في مناطق عالية الهشاشة المناخية.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">نداء للمثقف الصحي:</strong>
        دورك ليس كتابة الوصفات أو الفحص السريري؛ أنت خط الدفاع الأول وصانع النجاة عند منبع الخطر، تنقذ الأرواح بالوعي الاستباقي قبل أن تصل لغرف الطوارئ.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This opening lesson of Module 4 anchors the climate crisis firmly within human physiology and clinical emergency medicine. It examines the WHO declaration designating climate change as the single greatest existential threat facing humanity in the 21st century.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Comprehensive Determinants of Health:</strong> Clean air, potable water, bioavailable food, and secure shelter being compromised simultaneously.</li>
        <li><strong>Direct vs. Indirect Pathways:</strong> Distinguishing between acute trauma from extreme heatwaves and slow-moving systemic crises like food insecurity and vector shifts.</li>
        <li><strong>WHO Projections:</strong> 250,000 excess annual deaths expected between 2030 and 2050, with 3.6 billion people living in climate-vulnerable zones.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Practitioner Calling:</strong>
        Your mission is not clinical prescription; you are the frontline champion at the upstream source of hazard, saving lives through proactive preventive education before trauma reaches the ICU.
      </div>
    `
  },
  {
    sequence: 2,
    title_ar: 'الأثر الفسيولوجي لارتفاع درجات الحرارة وموجات الحر',
    title_en: 'Physiological Impacts of Extreme Heat & Heatwaves',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يغوص هذا الدرس في آليات التنظيم الحراري لجسم الإنسان وسر الرقم الذهبي (37 درجة مئوية). يوضح كيف يدافع الجسم عن برودته، ومتى ينهار نظامه الذاتي تحت وطأة الحرارة والرطوبة الخانقة ليتحول الإجهاد الحراري إلى ضربة شمس قاتلة.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>آليات التبريد الذاتي:</strong> دور منطقة تحت المهاد (Hypothalamus) في توسيع الأوعية الدموية وتفعيل التعرق التبخيري لتبريد الجلد.</li>
        <li><strong>طيف أمراض الحرارة:</strong> التدرج السريري من الطفح الحراري والتشنجات العضلية، إلى الإجهاد الحراري، وصولاً لضربة الشمس المهددة للحياة.</li>
        <li><strong>الأثر الخفي على أصحاب الأمراض المزمنة:</strong> كيف يضاعف الإجهاد الحراري وفيات جلطات القلب، وتفاقم الفشل الكلوي، واعتلالات السكري.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-right: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">قاعدة الإنقاذ السريع:</strong>
        الإجهاد الحراري فرصة ذهبية للنجاة بالظل والترطيب؛ أما ضربة الشمس (حرارة تتجاوز 40 درجة مع توقف العرق وهذيان) فهي طوارئ قاتلة تستلزم التبريد الفوري وطلب الإسعاف بلا تردد.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores human thermoregulation and the physiological imperative of maintaining the 37°C core setpoint. It reveals how the hypothalamus activates vasodilation and evaporative sweating, and explains how high humidity causes total cardiovascular collapse.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Thermoregulatory Defenses:</strong> Hypothalamic cutaneous vasodilation and evaporative cooling dissipating metabolic heat into ambient air.</li>
        <li><strong>The Heat Illness Spectrum:</strong> Progressive clinical stages from heat rash and painful cramps to heat exhaustion and fatal heatstroke.</li>
        <li><strong>Chronic Disease Exacerbation:</strong> Cardiovascular strain multiplying myocardial infarctions, acute kidney failure, and diabetic autonomic complications.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">Clinical Lifeline:</strong>
        Heat exhaustion is a critical golden window for hydration and shaded rest; heatstroke (core temp &gt;40°C, anhidrosis, altered mental status) is a lethal medical emergency requiring immediate active cooling and EMS dispatch.
      </div>
    `
  },
  {
    sequence: 3,
    title_ar: 'تلوث الهواء والجسيمات الدقيقة وأثرها القلبي الرئوي',
    title_en: 'Air Pollution, Particulate Matter & Cardiorespiratory Health',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يكشف هذا الدرس خطورة القاتل الصامت الذي يستنشقه الإنسان يومياً (11 إلى 15 ألف لتر هواء). يوضح كيف يطبخ التغير المناخي الأوزون السطحي السام، وكيف تعبر جسيمات PM2.5 الدقيقة من الحويصلات الرئوية إلى مجرى الدم لتحدث التهاباً مزمناً يهدد القلب والدماغ.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>معمل التلوث الكيميائي:</strong> تشكل الأوزون السطحي من تفاعل حرارة الصيف مع عوادم السيارات، وتفاقم حرائق الغابات والعواصف الغبارية.</li>
        <li><strong>جسيمات PM2.5 المجهرية:</strong> جسيمات أصغر من سمك الشعرة بـ 30 مرة تخترق فلاتر الأنف لتستقر في الحويصلات وتعبر مباشرة لتيار الدم.</li>
        <li><strong>المفارقة القلبية الصادمة:</strong> غالبية وفيات تلوث الهواء (7 ملايين سنوياً عالمياً) لا تنتج عن أمراض الرئة فحسب، بل عن جلطات الشرايين والسكتات الدماغية.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">توجيه ميداني حاسم:</strong>
        في أوقات العواصف الغبارية، كمامات القماش العادية لا تجدي نفعاً؛ وحدها كمامات N95 تحجب الجسيمات المجهرية. وإحكام النوافذ وتجنب التدخين والبخور داخل المنازل يحمي صدور الأطفال.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson investigates the silent killer humans breathe every day (11,000-15,000 liters daily). It demonstrates how heat cooks toxic ground-level ozone and how fine particulate matter (PM2.5) bypasses respiratory filters to trigger systemic vascular inflammation.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Photochemical Smog Synthesis:</strong> Ground-level ozone formation driven by high solar radiation interacting with traffic emissions and dust storms.</li>
        <li><strong>PM2.5 Penetration:</strong> Particles 30x finer than a human hair penetrating deep alveoli and entering arterial blood circulation.</li>
        <li><strong>Cardiovascular Mortality Paradox:</strong> The majority of the 7 million annual air pollution deaths stem not from lung diseases, but from myocardial infarctions and ischemic strokes.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">Protection Protocol:</strong>
        During dust storms, cloth masks provide negligible protection; only certified N95 respirators capture fine particulate matter. Sealing windows and eliminating indoor smoke and incense preserves pediatric respiratory function.
      </div>
    `
  },
  {
    sequence: 4,
    title_ar: 'الأوبئة والأمراض المعدية الحساسة للمناخ ومنظور الصحة الواحدة',
    title_en: 'Climate-Sensitive Infectious Diseases & One Health',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يوضح هذا الدرس كيف يعيد التغير المناخي كتابة قواعد الثالوث الوبائي في عالمنا العربي. يحلل توسع رقعة البعوض وذباب الرمل (الملاريا، حمى الضنك، الليشمانيا)، وتفشي أمراض المياه والغذاء، ويقدم مفهوم "الصحة الواحدة" كمدخل أساسي للوقاية.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>الثالوث الوبائي والمضخم المناخي:</strong> المناخ لا يخلق ميكروبات جديدة، بل يهيئ البيئة الحاضنة لتكاثر النواقل وانتشار العدوى لمناطق جديدة.</li>
        <li><strong>تسارع دورة حياة الحشرات:</strong> الحرارة والرطوبة تختصران وقت نضج يرقات البعوض وتسرعان تكاثر الطفيليات داخل بطونها.</li>
        <li><strong>منظور الصحة الواحدة (One Health):</strong> صحة الإنسان ترتبط عضوياً بصحة الحيوان وسلامة البيئة؛ وتدمير الغابات يجلب الفيروسات من البرية إلى التجمعات السكنية.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">خط أحمر مهني:</strong>
        دور المثقف الصحي ينحصر في ردم البرك الراكدة، والطهي الآمن، والتوعية الوقائية. لا تتطوع أبداً بتشخيص العدوى أو صرف المضادات الحيوية دون إشراف طبي متخصص.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores how environmental disruptions rewrite the epidemiological triad in the Arab world, analyzing vector expansion (Malaria, Dengue, Leishmaniasis), water-food contamination, and the interdisciplinary One Health paradigm.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Climate-Amplified Epidemiological Triad:</strong> Climate shifts serve as environmental magnifiers, expanding ecological niches for pathogens into previously unexposed zones.</li>
        <li><strong>Accelerated Vector Dynamics:</strong> Elevated temperatures accelerate mosquito larval maturation and shorten extrinsic incubation periods inside vector guts.</li>
        <li><strong>The One Health Imperative:</strong> Human wellness is inseparable from animal welfare and ecological integrity; habitat destruction drives zoonotic spillovers.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">Professional Boundary:</strong>
        A health educator focuses strictly on source reduction, safe cooking protocols, and community empowerment. Never attempt clinical diagnosis or antibiotic dispensing without licensed physicians.
      </div>
    `
  },
  {
    sequence: 5,
    title_ar: 'المياه والإصحاح البيئي والنظافة الصحية (WASH) في الأزمات المناخية',
    title_en: 'WASH Infrastructure & Water Security in Climate Crises',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يتناول هذا الدرس حجر الزاوية لصحة المجتمعات: منظومة المياه والإصحاح والنظافة (WASH). يكشف مفارقة المناخ المزدوجة بين السيول التي تخلط مياه الشرب بالصرف الصحي، وبين الجفاف الذي يضحي بالنظافة ويفجر الأوبئة المعوية في المستشفيات والمدارس.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>مثلث أمان منظومة WASH:</strong> المياه المأمونة، الإصحاح البيئي العازل للمخلفات، والنظافة الشخصية بغسل اليدين التي تقطع سلاسل العدوى بنسبة 40%.</li>
        <li><strong>التلوث التبادلي أثناء الفيضانات:</strong> اختراق مياه الصرف الصحي لخطوط الشرب المتصدعة وتفشي الكوليرا والإشريكية القولونية في ساعات.</li>
        <li><strong>الجفاف وانهيار النظافة:</strong> التضحية بنظافة الأواني والمرافق لحفظ مياه الشرب، مما ينشط مسار العدوى البرازي الفموي وأمراض العيون والجلد.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-right: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">بروتوكول السلامة المائية:</strong>
        غلي مياه الشرب لدقيقة كاملة من الغليان الفقاعي النشط، وإبعاد مصادر التلوث 30 متراً عن الآبار، وبدء محلول الإماهة الفموية (ORS) فور ظهور الإسهال يحمي الأطفال من الجفاف القاتل.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson examines the bedrock of community survival: Water, Sanitation, and Hygiene (WASH). It highlights the climate paradox between storm floods cross-contaminating drinking mains and extreme droughts forcing hygiene compromises across clinics and schools.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>The WASH Security Triangle:</strong> Potable water access, safe wastewater containment, and hand hygiene reducing enteric transmission chains by over 40%.</li>
        <li><strong>Cross-Contamination in Flood Disasters:</strong> Infiltrating sewage penetrating cracked water networks, sparking rapid outbreaks of Cholera and pathogenic E. coli.</li>
        <li><strong>Drought-Driven Hygiene Erosion:</strong> Rationing potable supplies forces families to eliminate basic washing, opening fecal-oral transmission, Trachoma, and scabies.</li>
      </ul>

      <div style="background: rgba(14, 165, 233, 0.08); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Field Water Safety Protocol:</strong>
        Boiling suspect drinking water for one minute of active rolling boil, enforcing a 30-meter buffer around wells, and administering Oral Rehydration Salts (ORS) instantly halts fatal pediatric dehydration.
      </div>
    `
  },
  {
    sequence: 6,
    title_ar: 'الأمن الغذائي والتغذية وتداعيات المناخ على صحة الأطفال',
    title_en: 'Food Security, Nutrition & Pediatric Climate Vulnerability',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يفكك هذا الدرس الترابط الحيوي بين تدهور إنتاجية المحاصيل ومناعة أجسادنا. يناقش أركان الأمن الغذائي الأربعة، وظاهرة "الجوع المستتر" الناتجة عن زيادة تركيز ثاني أكسيد الكربون، وتداعيات سوء التغذية والتقزم على ذكاء ونمو أطفالنا.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>أركان الأمن الغذائي (الفاو):</strong> التوافر، إمكانية الوصول المادي والاقتصادي، الاستخدام الغذائي والامتصاص البيولوجي، واستقرار المنظومة.</li>
        <li><strong>مفارقة الجوع المستتر (Hidden Hunger):</strong> امتلاء الحبوب بالنشويات والسكريات مقابل فقدان حاد في الحديد والزنك والبروتين بفعل زيادة الكربون.</li>
        <li><strong>نافذة الألف يوم الأولى والتقزم:</strong> سوء التغذية من الحمل لعمر سنتين يسبب قصر القامة وتلفاً غير قابل للإصلاح في القدرات العقلية والإدراكية.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-right: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">حلول غذائية ذكية:</strong>
        خلط البقوليات مع الحبوب (كالعدس مع الأرز والخبز) يوفر بروتيناً نباتياً متكاملاً بتكلفة زهيدة، وعصرة ليمون غنية بفيتامين (ج) تضاعف امتصاص الحديد النباتي ثلاث مرات وتقي من فقر الدم.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores the biological link between climate-induced agricultural declines and pediatric immune failure. It dissects FAO food security pillars, the "Hidden Hunger" paradox driven by elevated CO2, and the lifelong cognitive consequences of childhood stunting.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>FAO Food Security Pillars:</strong> Production availability, economic accessibility, physiological utilization, and long-term systemic stability.</li>
        <li><strong>The Hidden Hunger Phenomenon:</strong> Accelerated carbohydrate synthesis under high atmospheric CO2 diluting vital micronutrients: iron, zinc, and plant proteins.</li>
        <li><strong>The First 1,000 Days Window:</strong> Micronutrient deficits between conception and age two causing permanent cognitive deficits and irreversible stunting.</li>
      </ul>

      <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px;">Community Nutrition Action:</strong>
        Combining legumes with whole grains delivers complete amino acid profiles on minimal budgets, and adding fresh citrus vitamin C triples non-heme iron bioavailability to prevent anemia.
      </div>
    `
  },
  {
    sequence: 7,
    title_ar: 'الصحة النفسية وتداعيات المناخ: القلق المناخي والسولستالجيا',
    title_en: 'Mental Health, Eco-Anxiety & Solastalgia',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>ينتقل هذا الدرس إلى الجانب الأكثر حساسية: أذهاننا ومشاعرنا وسلامتنا النفسية. يحلل الصدمات الحادة واضطراب ما بعد الصدمة (PTSD) عقب الكوارث، ويفكك مفهومي "القلق المناخي" و"السولستالجيا" (الحزن على تدهور البيئة المألوفة)، ويقدم الإسعافات النفسية الأولية.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>لا صحة بدون صحة نفسية:</strong> التوتر والإجهاد المزمن يفرزان الكورتيزول الذي يضعف المناعة ويهيج القولون ويرفع ضغط الدم.</li>
        <li><strong>القلق المناخي (Eco-Anxiety) والسولستالجيا:</strong> استجابة وجدانية طبيعية للخطر البيئي، والحزن المشروع على فقدان الأماكن والذكريات الطبيعية المألوفة.</li>
        <li><strong>الإسعافات النفسية الأولية (PFA):</strong> التحقق من مشاعر المتضررين، نبذ لغة التهويل المشلولة، وتحويل القلق إلى مشاريع ومبادرات تطوعية ميدانية.</li>
      </ul>

      <div style="background: rgba(139, 92, 246, 0.08); border-right: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">بناء الأمل والعمل:</strong>
        القلق المناخي ليس مرضاً عقلياً بل وعي وإحساس إنساني صادق؛ وأفضل ترياق لمواجهة العجز واليأس هو العمل التطوعي المشترك وتشجير الأحياء لبناء مجتمعات صامدة.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores the psychological dimensions of the climate crisis. It investigates acute catastrophe trauma, Post-Traumatic Stress Disorder (PTSD), Eco-Anxiety, and Solastalgia (homesickness experienced without leaving home), establishing Psychological First Aid (PFA) protocols.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>No Health Without Mental Health:</strong> Chronic stress elevates cortisol and adrenaline, compromising immune surveillance, gut integrity, and cardiovascular stability.</li>
        <li><strong>Eco-Anxiety & Solastalgia:</strong> Legitimate psychological responses to perceived environmental collapse, and existential grief over the degradation of ancestral ecosystems.</li>
        <li><strong>Psychological First Aid (PFA):</strong> Emotion validation, rejecting catastrophic alarmism, and transforming existential dread into collective civic initiatives.</li>
      </ul>

      <div style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #6d28d9; display: block; margin-bottom: 6px;">Restoring Agency:</strong>
        Eco-anxiety is not a pathology; it is an empathic human response to a real crisis. The supreme antidote to despair is collective, tangible neighborhood restoration.
      </div>
    `
  },
  {
    sequence: 8,
    title_ar: 'صحة الأمهات والأطفال وحديثي الولادة في مواجهة الصدمات المناخية',
    title_en: 'Maternal, Newborn & Child Health in Climate Shocks',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يركز هذا الدرس على الفئات الأكثر هشاشة بيولوجياً: النساء الحوامل، الأجنة، وحديثو الولادة. يشرح الخصوصية الفسيولوجية للحمل وتمدد بلازما الدم، وعلاقة الإجهاد الحراري بالولادة المبكرة وتسمم الحمل، ويحدد علامات الخطر التوليدية الطارئة.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>الفسيولوجيا الحرارية للحمل:</strong> حجم الدم يتمدد بنسبة 50% وتولد المشيمة حرارة إضافية، مما يجعل الحامل عرضة للجفاف وهبوط ضغط الدم.</li>
        <li><strong>مضاعفات الحمل المرتبطة بالحرارة:</strong> الجفاف يحفز هرمون الأوكسيتوسين مسبباً الولادة المبكرة، وتضيق أوعية المشيمة يسبب نقص وزن المواليد وتسمم الحمل.</li>
        <li><strong>خصوصية الأطفال وحديثي الولادة:</strong> مساحة الجلد الواسعة وغياب نضج الغدد العرقية يرفعان حرارة الرضيع أسرع بـ 3-5 مرات من البالغين.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-right: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">إنقاذ حياة الرضع والحوامل:</strong>
        حذروا الأمهات بشدة من تغطية عربة الطفل بشرشف أو بطانية صيفاً لأنها تتحول لفرن قاتل في دقائق؛ وعند ظهور صداع نابض مفاجئ أو تشوش رؤية أو نزيف لدى الحامل، يجب التوجه للطوارئ فوراً.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>This lesson explores the physiological vulnerabilities of pregnant women, developing fetuses, and neonates during climate shocks. It examines maternal hemodilution, preterm birth, preeclampsia, and obstetric danger signs.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>Maternal Thermal Physiology:</strong> Plasma volume expands by 40-50% and fetal metabolism generates extra heat, leaving mothers prone to dehydration and hypotensive fainting.</li>
        <li><strong>Heat-Induced Obstetric Pathology:</strong> Acute dehydration triggers oxytocin release causing preterm labor, while placental vasoconstriction induces intrauterine growth restriction.</li>
        <li><strong>Neonatal Vulnerability:</strong> Large body surface-area-to-mass ratios and underdeveloped sweating mechanisms warm infants 3-5x faster than mature adults.</li>
      </ul>

      <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #b91c1c; display: block; margin-bottom: 6px;">Life-Saving Warning:</strong>
        Strictly advise caregivers against draping strollers with blankets in warm weather; this creates a lethal heat trap within minutes. Immediate hospital transfer is non-negotiable if a pregnant woman presents with severe headaches, visual disturbances, or bleeding.
      </div>
    `
  },
  {
    sequence: 9,
    title_ar: 'دمج المناخ في الممارسة الميدانية والأنظمة الصحية المرنة',
    title_en: 'Climate-Resilient Health Systems & Field Integration',
    content_ar: `
      <h4>نظرة عامة على الدرس</h4>
      <p>يختتم هذا الدرس الموديول الرابع برسم خارطة طريق للقيادة الصحية الميدانية. يقدم منهجية "عدسة المناخ" وقاعدة "شريحة المناخ الواحدة" لدمج البعد البيئي بذكاء داخل الجلسات الصحية المعتادة، ويستعرض مواصفات الأنظمة الصحية المرنة المقاومة للكوارث.</p>
      
      <h4>المحاور والمفاهيم الجوهرية</h4>
      <ul>
        <li><strong>منهجية عدسة المناخ (Climate Lens):</strong> إضافة المحدد البيئي والمناخي إلى محددات الصحة الشاملة دون إلغاء المحتوى السريري والتثقيفي المعتاد.</li>
        <li><strong>قاعدة شريحة المناخ الواحدة:</strong> دمج 3 دقائق عملية في ختام كل جلسة (كالربو، السكري، أو رعاية الحوامل) لتقديم حلول استباقية تحمي من تقلبات الطقس.</li>
        <li><strong>الأنظمة الصحية المقاومة لتغير المناخ:</strong> مرافق صحية مستعدة بالطاقة الشمسية لحفظ اللقاحات والإنسولين، وأنظمة إنذار مبكر، وكوادر توعية مجتمعية ميدانية.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">البوصلة القيادية للمثقف الصحي:</strong>
        أنت لست منظر مناخ ولا طبيباً سريرياً يصرف الأدوية؛ أنت قائد وعي ميداني يربط العلم بحياة الناس، ويحول الإنذار إلى سلوك وقائي يصون كرامة وصحة المجتمع.
      </div>
    `,
    content_en: `
      <h4>Lesson Overview</h4>
      <p>The capstone lesson of Module 4 establishes the leadership roadmap for community health practitioners. It introduces the "Climate Lens" and "One Climate Slide" frameworks to integrate environmental variables into daily clinical education and defines climate-resilient health infrastructure.</p>
      
      <h4>Core Themes & Concepts</h4>
      <ul>
        <li><strong>The Climate Lens Methodology:</strong> Incorporating environmental hazards into social determinants of health without diluting core clinical instruction.</li>
        <li><strong>The One Climate Slide Principle:</strong> Integrating a concise 3-minute actionable module into standard chronic disease sessions (asthma, diabetes, prenatal care).</li>
        <li><strong>Climate-Resilient Health Systems:</strong> Disaster-ready primary healthcare centers equipped with solar-backed cold chains and proactive community surveillance.</li>
      </ul>

      <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #047857; display: block; margin-bottom: 6px;">Health Leadership Compass:</strong>
        You are neither an abstract climate theorist nor a diagnosing clinician; you are the community health leader translating scientific evidence into life-saving daily protection for every household.
      </div>
    `
  }
];

async function updateCaptions() {
  console.log('🚀 Updating Lesson Overview & Captions for Module 3 and Module 4 in Supabase...\n');

  // Module 3
  const mod3Id = '66666666-6666-6666-6666-666666666603';
  for (const lesson of MODULE_3_LESSONS) {
    const { data, error } = await supabase
      .from('lessons')
      .update({
        title_ar: lesson.title_ar,
        title_en: lesson.title_en,
        content_ar: lesson.content_ar.trim(),
        content_en: lesson.content_en.trim(),
      })
      .eq('module_id', mod3Id)
      .eq('sequence_order', lesson.sequence)
      .select('id, title_ar');

    if (error) {
      console.error(`❌ Error updating M3L${lesson.sequence}:`, error.message);
    } else {
      console.log(`✅ M3L${lesson.sequence} updated: ${data[0]?.title_ar} (${data[0]?.id})`);
    }
  }

  // Module 4
  const mod4Id = '66666666-6666-6666-6666-666666666604';
  for (const lesson of MODULE_4_LESSONS) {
    const { data, error } = await supabase
      .from('lessons')
      .update({
        title_ar: lesson.title_ar,
        title_en: lesson.title_en,
        content_ar: lesson.content_ar.trim(),
        content_en: lesson.content_en.trim(),
      })
      .eq('module_id', mod4Id)
      .eq('sequence_order', lesson.sequence)
      .select('id, title_ar');

    if (error) {
      console.error(`❌ Error updating M4L${lesson.sequence}:`, error.message);
    } else {
      console.log(`✅ M4L${lesson.sequence} updated: ${data[0]?.title_ar} (${data[0]?.id})`);
    }
  }

  console.log('\n✨ All 16 lessons in Modules 3 & 4 successfully updated with rich overviews and cards!');
}

updateCaptions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
