import { useState, useEffect } from 'preact/hooks';
import { 
  Scale, 
  BookOpen, 
  FileCheck, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  Mail, 
  ExternalLink,
  ShieldAlert
} from 'lucide-preact';
import './LegalPage.css';

export function CopyrightPolicyPage({ lang = 'ar', onNavigate }) {
  const isArabic = lang === 'ar';
  const [activeSection, setActiveSection] = useState('platform-ip');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'platform-ip', labelAr: '1. الملكية الفكرية للمنصة', labelEn: '1. Platform & Course IP' },
    { id: 'open-access', labelAr: '2. ترخيص الأبحاث (CC BY 4.0)', labelEn: '2. Open Access (CC BY 4.0)' },
    { id: 'editorial-ethics', labelAr: '3. معايير النشر والأصالة', labelEn: '3. Editorial & Anti-Plagiarism' },
    { id: 'medical-disclaimer', labelAr: '4. إخلاء المسؤولية الطبية', labelEn: '4. Medical Disclaimer' },
    { id: 'cert-protection', labelAr: '5. حماية وتجريم تزوير الشهادات', labelEn: '5. Credential Anti-Fraud' },
    { id: 'dmca-takedown', labelAr: '6. الإبلاغ وحماية الحقوق (DMCA)', labelEn: '6. Copyright Notice & DMCA' },
  ];

  return (
    <div className="legal-page-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ══ HERO BANNER ══ */}
      <section className="legal-hero-banner">
        <div className="legal-hero-container">
          <div className="legal-hero-badge">
            <Scale size={16} />
            <span>{isArabic ? 'حقوق الملكية الفكرية والتأليف' : 'Intellectual Property & Publishing Policy'}</span>
          </div>
          <h1 className="legal-hero-title">
            {isArabic ? 'حقوق الملكية والنشر الأكاديمي' : 'Copyright & Intellectual Property'}
          </h1>
          <p className="legal-hero-subtitle">
            {isArabic
              ? 'تحدد هذه الوثيقة الأطر القانونية لحقوق المؤلف، تراخيص الوصول الحر للأبحاث (Open Access)، سياسات النشر الأخلاقي للكوادر الطبية، وحماية العلامة والشهادات المعتمدة.'
              : 'This framework defines copyright ownership, Open Access licensing for climate & health research, scholarly publishing ethics, and digital credential integrity across ClimaMedix.'}
          </p>
          <div className="legal-hero-meta">
            <span className="legal-hero-meta-item">
              <strong>{isArabic ? 'تاريخ السريان:' : 'Effective Date:'}</strong> 2026-10-01
            </span>
            <span>•</span>
            <span className="legal-hero-meta-item">
              <strong>{isArabic ? 'نوع الترخيص البحثي:' : 'Scholarly Licensing:'}</strong> Creative Commons CC-BY 4.0
            </span>
          </div>
        </div>
      </section>

      {/* ══ MAIN CONTENT ══ */}
      <main className="legal-main-content">
        <div className="legal-grid-layout">
          
          {/* Quick-Navigation Sidebar */}
          <aside className="legal-sidebar" aria-label="Table of Contents">
            <div className="legal-sidebar-title">
              {isArabic ? 'فهرس حقوق الملكية' : 'Sections Navigation'}
            </div>
            <ul className="legal-nav-list">
              {navItems.map((item) => (
                <li key={item.id} className="legal-nav-item">
                  <button
                    className={`legal-nav-btn ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => scrollTo(item.id)}
                  >
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Detailed Policy Sections */}
          <div className="legal-content-area">

            {/* Section 1: Platform & Course Material IP */}
            <article id="platform-ip" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Scale size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '1. الملكية الفكرية للمنصة والمحتوى التعليمي' : '1. Intellectual Property & Course Materials'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'جميع عناصر الواجهة الرسومية، الأكواد البرمجية، الشعارات، الهوية البصرية، وتصميم المقررات التعليمية والإنتاج المرئي والمسموع المنشور على ClimaMedix هي ملكية فكرية حصرية ومحمية بموجب قوانين الملكية الفكرية والمعاهدات الدولية.'
                  : 'All visual design elements, software architecture, brand marks, typography, learning modules, video lectures, and instructional materials produced by ClimaMedix are the proprietary intellectual property of the initiative, protected under national and international copyright treaties.'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    {isArabic
                      ? 'يُحظر نسخ أو إعادة إنتاج أو هندسة عكسية للمنصة أو إعادة بيع المواد التدريبية دون إذن خطي مسبق.'
                      : 'Reproduction, unauthorized redistribution, reverse engineering, or commercial resale of course curricula is strictly prohibited.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    {isArabic
                      ? 'يُسمح للمتدربين بالاستخدام الشخصي والأكاديمي فقط للمقررات والشرائح التعليمية المخصصة للتنزيل.'
                      : 'Enrolled students are granted a limited, personal, non-exclusive license for academic self-study.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 2: Open Access CC-BY 4.0 */}
            <article id="open-access" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><BookOpen size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '2. سياسة الوصول المفتوح للأبحاث (CC BY 4.0)' : '2. Open Access Scholarly Licensing (CC BY 4.0)'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'إيماناً منا بأن المعرفة العلمية المتعلقة بالمناخ والصحة يجب أن تكون متاحة للجميع لإنقاذ الأرواح، تعتمد المنصة ترخيص المشاع الإبداعي (Creative Commons Attribution 4.0 International) للأوراق البحثية والدراسات المنشورة في مركز الأبحاث:'
                  : 'To accelerate climate health research and maximize public health impact globally, studies published in our Research Center operate under Creative Commons Attribution 4.0 (CC BY 4.0):'}
              </p>
              
              <div className="legal-callout info">
                <FileCheck size={20} className="legal-callout-icon" />
                <div className="legal-callout-content">
                  <strong>{isArabic ? 'شروط ترخيص CC BY 4.0 للأبحاث:' : 'CC BY 4.0 License Terms:'}</strong>
                  <br />
                  {isArabic
                    ? 'يحق للباحثين والمؤسسات مشاركة ونسخ وتكييف البحث العلمي بأي وسيط، شريطة ذكر المصدر الأصلي بوضوح (Attribution)، وتقديم رابط للترخيص، وتوضيح إن تم إجراء أي تعديل.'
                    : 'Scholars and institutions are free to share, redistribute, and adapt research publications in any medium, provided appropriate credit is given to the original authors and ClimaMedix (Attribution).'}
                </div>
              </div>

              <p className="legal-body-text">
                {isArabic
                  ? 'يحتفظ المؤلفون والباحثون بكامل حقوقهم المعنوية (Moral Rights) على منشوراتهم، مع منح ClimaMedix ترخيصاً دائماً وغير حصري لنشر وتوزيع وأرشفة الأوراق في الفهارس الطبية والبيئية العالمية.'
                  : 'Contributing researchers retain moral copyright over their scholarly work, granting ClimaMedix a perpetual, non-exclusive license to host, index, translate, and disseminate the work worldwide.'}
              </p>
            </article>

            {/* Section 3: Editorial Guidelines & Anti-Plagiarism */}
            <article id="editorial-ethics" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><FileCheck size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '3. معايير النشر والأصالة العلمية والمدونة' : '3. Editorial Guidelines & Anti-Plagiarism'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'تتيح المنصة للمتخصصين والكوادر الصحية كتابة مقالات في قسم "الأخبار والمدونة". وتخضع المقالات للمعايير الأخلاقية التالية:'
                  : 'When health professionals contribute articles via the Editorial Portal, submissions are bound by rigorous ethical standards:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'الأصالة ومنع الانتحال:' : 'Originality & Integrity:'}</strong>{' '}
                    {isArabic
                      ? 'يجب أن يكون المحتوى أصيلاً. يُحظر تماماً النقل غير المنسوب (Plagiarism) أو الاعتماد على مخرجات الذكاء الاصطناعي دون مراجعة وتدقيق بشري موثق.'
                      : 'Articles must represent original scholarship. Unattributed duplication, plagiarism, or unvetted AI hallucinations are strictly disallowed.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'حقوق مراجعة المحتوى:' : 'Editorial Discretion:'}</strong>{' '}
                    {isArabic
                      ? 'تحتفظ إدارة التحرير بحق تدقيق، تعديل، أو حذف أي مقال يتعارض مع الدليل العلمي أو ينشر معلومات طبية مضللة.'
                      : 'The editorial board retains the right to audit, revise, or retract articles disseminating medically or scientifically inaccurate claims.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 4: Medical Disclaimer */}
            <article id="medical-disclaimer" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><AlertTriangle size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '4. إخلاء المسؤولية الطبية والسريرية' : '4. Medical & Clinical Information Disclaimer'}
                </h2>
              </div>
              <div className="legal-callout warning">
                <ShieldAlert size={20} className="legal-callout-icon" />
                <div className="legal-callout-content">
                  <strong>{isArabic ? 'تنبيه سريري هام:' : 'Important Clinical Notice:'}</strong>
                  <br />
                  {isArabic
                    ? 'كافة المواد التدريبية، الأبحاث، المقالات، والأدوات التحليلية المنشورة على ClimaMedix هي لأغراض تعليمية وتثقيفية وبحثية فقط. لا تشكل هذه المعلومات بأي حال استشارة طبية سريرية مباشرة، ولا تغني عن الاستشارة السريرية المباشرة من قِبل الأطباء المرخصين.'
                    : 'All course modules, research findings, and editorial articles are provided strictly for educational and scientific research purposes. Content on ClimaMedix does not constitute individualized clinical diagnosis or emergency medical counsel.'}
                </div>
              </div>
            </article>

            {/* Section 5: Credential Anti-Fraud */}
            <article id="cert-protection" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Award size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '5. حماية الشهادات وتجريم التزوير الرقمي' : '5. Credential Integrity & Anti-Fraud Protection'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'شهادات ClimaMedix هي اعتمادات تدريبية رسمية تخضع لنظام التحقق اللامركزي والمشفر عبر الرمز التعريفي (CERT-ID):'
                  : 'Certificates issued by ClimaMedix represent certified professional learning validated via our centralized verification engine:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    {isArabic
                      ? 'يُعد التلاعب بالشهادة أو تعديل الاسم أو الرقم التعريفي جريمة تزوير واعتداء على الهوية الأكاديمية للمنصة.'
                      : 'Any alteration, visual forging, or deceptive modification of issued certificate names or IDs represents fraudulent misrepresentation.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    {isArabic
                      ? 'يحق للمنصة إلغاء أي شهادة تم الحصول عليها بالتحايل على مقاييس المشاهدة أو التلاعب في الاختبارات.'
                      : 'ClimaMedix reserves the right to revoke any certificate obtained through telemetry circumvention or examination compromise.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 6: Copyright Notice & DMCA */}
            <article id="dmca-takedown" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Scale size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '6. آلية الإبلاغ وحماية الحقوق (DMCA / Takedown)' : '6. Copyright Infringement & Takedown Protocol'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'إذا كنت تعتقد أن عملاً محمياً بحقوق الطبع والنشر خاصاً بك قد تم نشره على المنصة دون إذن أو بطريقة تشكل انتهاكاً لحقوق الملكية، يرجى تزويدنا بالتفاصيل التالية:'
                  : 'If you believe your copyrighted scholarly work or intellectual property has been incorporated into ClimaMedix without authorization, please notify our legal coordinator with:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>{isArabic ? 'رابط الصفحة أو الورقة البحثية المتضمنة للانتهاك المزعوم.' : 'URL or exact publication link containing the disputed material.'}</span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>{isArabic ? 'إثبات الملكية أو التوكيل القانوني عن صاحب الحق.' : 'Proof of copyright ownership or legal representation authority.'}</span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>{isArabic ? 'بيانات الاتصال الكاملة بك لمتابعة الإجراء.' : 'Direct contact credentials for rapid legal follow-up.'}</span>
                </li>
              </ul>

              {/* Takedown Contact Box */}
              <div className="legal-contact-box">
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  {isArabic ? 'عنوان مراسلات الملكية الفكرية وفريق المراجعة:' : 'Legal and intellectual property correspondence:'}
                </p>
                <a href="mailto:info@climamedix.org" className="legal-contact-email">
                  <Mail size={18} />
                  <span>info@climamedix.org</span>
                </a>
              </div>
            </article>

          </div>
        </div>
      </main>
    </div>
  );
}
