import { useState, useEffect } from 'preact/hooks';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Database, 
  Eye, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Globe,
  Server
} from 'lucide-preact';
import './LegalPage.css';

export function PrivacyPolicyPage({ lang = 'ar', onNavigate }) {
  const isArabic = lang === 'ar';
  const [activeSection, setActiveSection] = useState('controller');

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
    { id: 'controller', labelAr: '1. المتحكم بالبيانات', labelEn: '1. Data Controller' },
    { id: 'auth-sso', labelAr: '2. الدخول عبر Google SSO', labelEn: '2. Google OAuth SSO' },
    { id: 'profiles', labelAr: '3. الملف الشخصي والتواصل', labelEn: '3. Profiles & Social' },
    { id: 'applications', labelAr: '4. العضوية والسير الذاتية (CV)', labelEn: '4. Applications & CVs' },
    { id: 'lms-telemetry', labelAr: '5. مقاييس التعلّم والاختبارات', labelEn: '5. LMS Telemetry' },
    { id: 'certificates', labelAr: '6. الشهادات والتحقق العلني', labelEn: '6. Public Verification' },
    { id: 'public-matrix', labelAr: '7. جدول سرية البيانات', labelEn: '7. Privacy Matrix' },
    { id: 'security-rights', labelAr: '8. حقوقك وأمن البيانات', labelEn: '8. Security & Rights' },
  ];

  return (
    <div className="legal-page-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ══ HERO BANNER ══ */}
      <section className="legal-hero-banner">
        <div className="legal-hero-container">
          <div className="legal-hero-badge">
            <ShieldCheck size={16} />
            <span>{isArabic ? 'وثيقة حماية البيانات الرسمية' : 'Official Data Protection Policy'}</span>
          </div>
          <h1 className="legal-hero-title">
            {isArabic ? 'سياسة الاستخدام وحماية البيانات' : 'Terms of Use & Privacy Policy'}
          </h1>
          <p className="legal-hero-subtitle">
            {isArabic
              ? 'تلتزم مبادرة ClimaMedix بحماية خصوصية الكوادر الصحية والباحثين، وتطبيق أعلى معايير الشفافية والأمان البيولوجي والرقمي وفقاً لأحدث الممارسات والمعايير العالمية.'
              : 'ClimaMedix is committed to safeguarding the digital privacy of healthcare professionals and researchers, applying the highest standards of confidentiality, transparency, and data integrity.'}
          </p>
          <div className="legal-hero-meta">
            <span className="legal-hero-meta-item">
              <strong>{isArabic ? 'تاريخ التحديث:' : 'Last Updated:'}</strong> 2026-10-01
            </span>
            <span>•</span>
            <span className="legal-hero-meta-item">
              <strong>{isArabic ? 'النطاق القانوني:' : 'Scope:'}</strong> {isArabic ? 'المنصة والمحتوى الأكاديمي والشهادات' : 'Platform, LMS, Research & Verification'}
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
              {isArabic ? 'فهرس البنود والمحاور' : 'Policy Navigation'}
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

          {/* Policy Detail Sections */}
          <div className="legal-content-area">

            {/* Section 1: Data Controller */}
            <article id="controller" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Globe size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '1. هوية المنصة والمتحكم بالبيانات' : '1. Data Controller & Initiative Scope'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'منصة ClimaMedix هي مبادرة أكاديمية غير ربحية تُعنى بتمكين مقدمي الرعاية الصحية والأكاديميين للعمل المناخي والبحوث البيئية. تُعد المنصة هي المتحكم الرئيسي (Data Controller) بكافة البيانات المجمعة عبر النطاق الرسمي وتطبيقات الويب التابعة لها.'
                  : 'ClimaMedix is a non-profit academic initiative dedicated to empowering healthcare providers and researchers for climate action and environmental health studies. The platform acts as the sole Data Controller for all information gathered through its official domain and associated web applications.'}
              </p>
              <div className="legal-callout info">
                <AlertCircle size={20} className="legal-callout-icon" />
                <div className="legal-callout-content">
                  {isArabic
                    ? 'لا نقوم ببيع أو تأجير أي بيانات شخصية أو معلومات سريرية لأي جهات تسويقية أو تجارية على الإطلاق.'
                    : 'We never sell, lease, or monetize personal or clinical data to any commercial or advertising third parties.'}
                </div>
              </div>
            </article>

            {/* Section 2: Google SSO */}
            <article id="auth-sso" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Lock size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '2. تسجيل الدخول الموحد (Google OAuth SSO)' : '2. Authentication via Google OAuth 2.0'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'تعتمد المنصة حصرياً على بروتوكول Google OAuth 2.0 لإدارة جلسات الدخول والتحقق من الهوية، مما يعني أننا لا نخزن أو نطلب كلمات المرور الخاصة بك على خوادمنا.'
                  : 'The platform relies exclusively on the Google OAuth 2.0 protocol for authentication and identity verification. Consequently, ClimaMedix never stores, solicits, or processes user passwords.'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'البيانات المستلمة من Google:' : 'Data received from Google:'}</strong>{' '}
                    {isArabic
                      ? 'المعرف الفريد (Google User ID)، البريد الإلكتروني الأساسي الموثق، والصورة الرمزية الافتراضية للحساب.'
                      : 'Unique Google UID, verified primary email address, and default account avatar URL.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'التخزين المحلي الآمن للجلسة:' : 'Secure Client Session:'}</strong>{' '}
                    {isArabic
                      ? 'يتم حفظ رمز الجلسة المشفر (JWT) محلياً في متصفحك عبر التخزين المحلي الآمن لتمكين الوصول المستمر وتجديد الصلاحيات تلقائياً.'
                      : 'Encrypted JWT session tokens are cached in browser localStorage strictly to maintain your session and handle automatic token refresh.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 3: Profile Data & IP Geolocation */}
            <article id="profiles" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><UserCheck size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '3. بيانات الملف الشخصي والشبكة الأكاديمية' : '3. Professional Profile & Academic Directory'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'عند إكمال ملفك الشخصي أو الانضمام إلى دليل الكوادر، نقوم بمعالجة الحقول التي تزودنا بها طواعية لتوثيق المساهمات العلمية والتنسيق الطبي:'
                  : 'When completing your profile or participating in the network directory, we process the professional attributes you voluntarily provide:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'البيانات المهنية والأكاديمية:' : 'Professional & Academic Details:'}</strong>{' '}
                    {isArabic
                      ? 'اللقب (دكتور، بروفيسور، إلخ)، التخصص الطبي أو المناخي، الجامعة أو جهة العمل، والاهتمامات البحثية والميدانية.'
                      : 'Honorific title (Dr, Prof, etc.), medical or environmental specialty, university/organization, and research interests.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'الروابط الأكاديمية والرقمية:' : 'Scholarly & Social Identifiers:'}</strong>{' '}
                    {isArabic
                      ? 'معرف ORCID، Google Scholar، ResearchGate، وروابط التواصل المهني (LinkedIn) لتيسير الاستشهاد بالأوراق والتواصل العلمي.'
                      : 'ORCID ID, Google Scholar, ResearchGate, and LinkedIn links to facilitate citation exchange and peer collaboration.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'تحديد الموقع الجغرافي التلقائي:' : 'Automated Geolocation:'}</strong>{' '}
                    {isArabic
                      ? 'عند النقر على زر "تحديد الموقع تلقائياً" في الملف الشخصي، يتم الاستعلام من خدمة خارجية (ipapi.co) لملء اسم المدينة والدولة فقط دون تخزين عنوان IP الدقيق في قواعد البيانات العامة.'
                      : 'When clicking auto-detect location, an API call to ipapi.co resolves country and city names without storing precise user IP addresses in public tables.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 4: Membership & CV Uploads */}
            <article id="applications" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><FileText size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '4. طلبات الانضمام والسير الذاتية (CV)' : '4. Membership Requests & Uploaded CVs'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'يتيح مسار الانضمام (سواء كباحث أو كمدرب صحي مجتمعي) رفع السيرة الذاتية (CV) ونماذج الخبرة:'
                  : 'The membership application workflow allows researchers and health educators to submit curriculum vitae (CV) documents:'}
              </p>
              <div className="legal-callout warning">
                <Lock size={20} className="legal-callout-icon" />
                <div className="legal-callout-content">
                  {isArabic
                    ? 'ملفات السير الذاتية (PDF/DOCX) تُرفع وتُخزّن في مساحة تخزين سحابية خاصة (Cloudflare R2 Object Storage). ولا يمكن الوصول إليها إلا من قِبل منسقي المبادرة والمدراء المعتمدين لتقييم طلبات العضوية.'
                    : 'Uploaded CV files (PDF/DOCX) are stored in secure object storage (Cloudflare R2). They are strictly restricted to vetted platform coordinators and administrators reviewing applications.'}
                </div>
              </div>
            </article>

            {/* Section 5: LMS & Video Telemetry */}
            <article id="lms-telemetry" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Database size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '5. مقاييس المشاهدة والاختبارات التدريبية' : '5. Learning Analytics & Anti-Cheat Telemetry'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'لضمان المصداقية الأكاديمية واستحقاق الشهادات المعتمدة، يسجل نظام إدارة التعلم (LMS) قياسات تقدم الطالب بدقة:'
                  : 'To ensure academic integrity and validate eligibility for accredited credentials, our Learning Management System tracks instructional metrics:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'مقاييس المشاهدة الزمنية:' : 'Playback Telemetry:'}</strong>{' '}
                    {isArabic
                      ? 'تسجيل الثواني الفعلية للمشاهدة ونسبة إتمام الدروس لمنع تخطي المحتوى التعليمي قبل استحقاق الاختبارات.'
                      : 'Logging playback duration and highest timestamp reached to prevent skipping required didactic instruction.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'محاولات الاختبارات والدرجات:' : 'Examination Results:'}</strong>{' '}
                    {isArabic
                      ? 'تسجيل درجات الاختبارات، تاريخ المحاولة، وحالة النجاح/الرسوب لتأهيل إصدار الشهادة.'
                      : 'Tracking quiz scores, attempt timestamps, and passing thresholds required for certificate issuance.'}
                  </span>
                </li>
              </ul>
            </article>

            {/* Section 6: Certificates & Public Verification */}
            <article id="certificates" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Award size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '6. الشهادات الرقمية ونظام التحقق العلني' : '6. Digital Certificates & Public Verification'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'تُصدر منصة ClimaMedix شهادات تدريبية وبحثية مرقمة بختم تعريفي فريد (CERT-XXXXX). يرجى ملاحظة ما يلي فيما يخص التحقق العلني:'
                  : 'ClimaMedix issues unique, serial-coded digital certificates (CERT-XXXXX). Please note our transparency policy regarding credentials:'}
              </p>
              <div className="legal-callout">
                <Eye size={20} className="legal-callout-icon" />
                <div className="legal-callout-content">
                  {isArabic
                    ? 'رابط التحقق من الشهادة (climamedix.org/verify/CERT-...) هو صفحة عامة ومفتوحة. تتيح للمستشفيات، الجامعات، وجهات التوظيف التحقق الفوري من صحة الشهادة واسم المتدرب باللغتين العربية والإنجليزية وتاريخ الإصدار.'
                    : 'The certificate verification portal (/verify/CERT-...) is publicly accessible. This allows healthcare institutions, universities, and employers to independently verify certificate authenticity, recipient name, and issuance date.'}
                </div>
              </div>
            </article>

            {/* Section 7: Data Privacy Matrix Table */}
            <article id="public-matrix" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Server size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '7. جدول تصنيف وسرية البيانات المخزنة' : '7. Data Classification & Exposure Matrix'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'يوضح الجدول التالي تصنيف كافة البيانات في قواعد بيانات ClimaMedix ومستوى الوصول المسموح به:'
                  : 'The matrix below details every data category stored across ClimaMedix and its access boundary:'}
              </p>
              
              <div className="legal-table-responsive">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>{isArabic ? 'نوع البيانات' : 'Data Category'}</th>
                      <th>{isArabic ? 'أمثلة الحقول' : 'Example Fields'}</th>
                      <th>{isArabic ? 'مستوى الوصول' : 'Access Level'}</th>
                      <th>{isArabic ? 'الغرض' : 'Primary Purpose'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{isArabic ? 'الهوية والتوثيق' : 'Identity & Auth'}</strong></td>
                      <td>Google UID, Email, Google PFP</td>
                      <td><span className="legal-badge-pill private">{isArabic ? 'خاص بالمستخدم' : 'Private User'}</span></td>
                      <td>{isArabic ? 'تسجيل الدخول وإدارة الجلسات' : 'Login & session management'}</td>
                    </tr>
                    <tr>
                      <td><strong>{isArabic ? 'دليل الشبكة والخبراء' : 'Network Directory'}</strong></td>
                      <td>{isArabic ? 'الاسم، اللقب، التخصص، الدولة' : 'Name, title, specialty, country'}</td>
                      <td><span className="legal-badge-pill public">{isArabic ? 'معلن في الدليل' : 'Public Directory'}</span></td>
                      <td>{isArabic ? 'تواصل الكوادر والباحثين' : 'Peer discovery & networking'}</td>
                    </tr>
                    <tr>
                      <td><strong>{isArabic ? 'السير الذاتية والطلبات' : 'CVs & Applications'}</strong></td>
                      <td>{isArabic ? 'ملف الـ CV، رسالة الدافع' : 'Uploaded CV files, motivation'}</td>
                      <td><span className="legal-badge-pill restricted">{isArabic ? 'سري (إدارة فقط)' : 'Restricted Admin'}</span></td>
                      <td>{isArabic ? 'تقييم طلبات العضوية والزمالة' : 'Evaluation of applications'}</td>
                    </tr>
                    <tr>
                      <td><strong>{isArabic ? 'الشهادات المعتمدة' : 'Certificates'}</strong></td>
                      <td>Cert ID, Recipient Name, Course</td>
                      <td><span className="legal-badge-pill public">{isArabic ? 'تحقق علني' : 'Public Verification'}</span></td>
                      <td>{isArabic ? 'إثبات المؤهلات للجهات الطبية' : 'Credential proof for employers'}</td>
                    </tr>
                    <tr>
                      <td><strong>{isArabic ? 'القياسات التعليمية' : 'LMS Telemetry'}</strong></td>
                      <td>Watch seconds, Quiz scores</td>
                      <td><span className="legal-badge-pill private">{isArabic ? 'خاص بالمستخدم' : 'Private User'}</span></td>
                      <td>{isArabic ? 'متابعة التقدم والتأهل للشهادة' : 'Course completion validation'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Section 8: Security & Rights */}
            <article id="security-rights" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-wrap"><Lock size={22} /></div>
                <h2 className="legal-section-title">
                  {isArabic ? '8. حقوق المستخدم وإجراءات الأمان' : '8. User Rights & Data Protection Controls'}
                </h2>
              </div>
              <p className="legal-body-text">
                {isArabic
                  ? 'يحق لكل مستخدم في ClimaMedix ممارسة حقوقه الرقمية بموجب اللوائح والأنظمة المعترف بها لحماية البيانات:'
                  : 'Every ClimaMedix user retains full sovereignty over their personal and academic information:'}
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'الحق في الوصول والتعديل:' : 'Right to Access & Rectify:'}</strong>{' '}
                    {isArabic
                      ? 'يمكنك تعديل معلوماتك الشخصية والأكاديمية وروابطك في أي وقت عبر صفحة "الملف الشخصي".'
                      : 'You can update your personal, academic, and contact details anytime via My Profile.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'الحق في الحذف وطلب الإلغاء:' : 'Right to Erasure (Be Forgotten):'}</strong>{' '}
                    {isArabic
                      ? 'يمكنك طلب حذف حسابك وبياناتك المرتبطة به وسيرتك الذاتية بشكل نهائي بمراسلة فريق الدعم الأكاديمي.'
                      : 'You may request permanent deletion of your profile, account record, and uploaded CV files.'}
                  </span>
                </li>
                <li className="legal-list-item">
                  <CheckCircle2 size={18} className="legal-bullet-icon" />
                  <span>
                    <strong>{isArabic ? 'التدابير التقنية المشددة:' : 'Technical Safeguards:'}</strong>{' '}
                    {isArabic
                      ? 'تُطبّق المنصة تشفير النقل (TLS 1.3)، وسياسات أمان أسطر البيانات (Row Level Security - RLS) في PostgreSQL، لعزل صلاحيات كل مستخدم بدقة متناهية.'
                      : 'We enforce TLS 1.3 transit encryption and granular Row Level Security (RLS) in PostgreSQL to ensure strict data isolation.'}
                  </span>
                </li>
              </ul>

              {/* Contact Coordinator Box */}
              <div className="legal-contact-box">
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  {isArabic ? 'لأي استفسارات قانونية أو لممارسة حقوقك في البيانات:' : 'For inquiries or data sovereignty requests:'}
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
