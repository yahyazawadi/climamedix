import iconEmpowerment  from '../../assets/icon_empowerment.svg';
import iconScience      from '../../assets/icon_science.svg';
import iconEmpowerment2 from '../../assets/icon_empowerment2.svg';
import iconInnovation   from '../../assets/icon_innovation.svg';
import iconCommunity    from '../../assets/icon_community.svg';
import aboutBg          from '../../assets/svgbackground.svg';
import { translations } from '../../i18n/translations';

export function AboutUsPage({ onJoinClick, lang }) {
  const t = translations[lang] || translations.ar;

  return (
    <main className="au-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Full-page SVG background */}
      <div className="au-bg-wrap" aria-hidden="true">
        <img src={aboutBg} alt="" className="au-bg-img" />
      </div>

      {/* ══ VISION ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{t.ourVision}</h2>
          <p className="au-body">
            {t.visionText}
          </p>
        </div>
      </section>

      {/* ══ MISSION ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{t.ourMission}</h2>
          <p className="au-body">
            {t.missionText}
          </p>
        </div>
      </section>

      {/* ══ VALUES ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{t.ourValues}</h2>

          <div className="au-values-grid">
            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconEmpowerment} alt={t.empowerment} />
              </div>
              <h3 className="au-value-title">{t.empowerment}:</h3>
              <p className="au-value-desc">{t.empowermentDesc}</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconScience} alt={t.scientificResearch} />
              </div>
              <h3 className="au-value-title">{t.scientificResearch}:</h3>
              <p className="au-value-desc">{t.scientificResearchDesc}</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconEmpowerment2} alt={t.empowerment} />
              </div>
              <h3 className="au-value-title">{t.empowerment}:</h3>
              <p className="au-value-desc">{t.globalNetwork}</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconInnovation} alt={t.innovation} />
              </div>
              <h3 className="au-value-title">{t.innovation}:</h3>
              <p className="au-value-desc">{t.innovationDesc}</p>
            </div>
          </div>

          {/* 5th card — centered */}
          <div className="au-values-center-row">
            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconCommunity} alt={t.communityImpact} />
              </div>
              <h3 className="au-value-title">{t.communityImpact}:</h3>
              <p className="au-value-desc">{t.communityImpactDesc}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ══ PARTNERSHIPS ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{t.ourPartnerships}</h2>
          <p className="au-body">
            {lang === 'ar' 
              ? 'نعمل بالتعاون مع مؤسسات بحثية، جامعات، ومنظمات عالمية لدعم الأبحاث المتخصصة في الصحة البيئية. هذه الشراكات تتيح لنا تنفيذ دراسات موسعة، وتبادل الخبرات بين الباحثين، والمشاركة في المؤتمرات العلمية.'
              : 'We work in cooperation with research institutions, universities, and global organizations to support specialized research in environmental health. These partnerships allow us to conduct extensive studies, exchange expertise, and participate in scientific conferences.'}
          </p>
          <ul className="au-checklist">
            <li>
              {lang === 'ar' 
                ? 'إذا كنت مهتماً بالبحث العلمي في مجال الصحة والتغير المناخي، يمكنك الانضمام إلى فريق ClimaMedix البحثي.'
                : 'If you are interested in scientific research in health and climate change, you can join the ClimaMedix research team.'}
            </li>
            <li>
              {lang === 'ar'
                ? 'نحن نبحث عن باحثين وعلميين مهتمين بتطوير حلول علمية لمشاكل الصحة البيئية.'
                : 'We look for researchers and scientists interested in developing scientific solutions to environmental health issues.'}
            </li>
            <li>
              {lang === 'ar'
                ? 'شارك في أبحاثنا وكن جزءاً من فريق يقود التغيير العلمي نحو مستقبل صحي مستدام.'
                : 'Participate in our research and be part of a team leading scientific change towards a healthy, sustainable future.'}
            </li>
          </ul>
          <button className="au-btn-primary" onClick={onJoinClick}>
            {lang === 'ar' ? 'انضم لفريق البحث' : 'Join the Research Team'}
          </button>
        </div>
      </section>

      {/* ══ HISTORY ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{lang === 'ar' ? 'تاريخنا' : 'Our History'}</h2>
          <p className="au-body">
            {lang === 'ar'
              ? 'بدأت ClimaMedix كمبادرة بحثية تهدف إلى سد الفجوة بين الصحة والتغير المناخي. منذ انطلاقنا، ركزنا على دعم الباحثين وتوفير بيئة علمية مناسبة لإجراء دراسات متخصصة تساهم في إيجاد حلول عملية للمشاكل الصحية الناتجة عن التغيرات البيئية.'
              : 'ClimaMedix began as a research initiative aiming to bridge the gap between health and climate change. Since our launch, we have focused on supporting researchers and providing an appropriate scientific environment to conduct specialized studies.'}
          </p>
        </div>
      </section>

      {/* ══ COMMITMENT ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">{lang === 'ar' ? 'التزامنا تجاه المجتمع' : 'Our Commitment to Community'}</h2>
          <p className="au-body">
            {lang === 'ar'
              ? 'نحن ملتزمون بنشر المعرفة العلمية، وتطوير أبحاث طبية قائمة على الأدلة، وتعزيز الوعي الصحي حول تأثيرات المناخ. هدفنا أن نجعل البحث العلمي أداة فعالة في بناء مجتمع صحي ومستدام للجميع.'
              : 'We are committed to disseminating scientific knowledge, developing evidence-based medical research, and promoting health awareness. Our goal is to make scientific research an effective tool in building a healthy and sustainable community.'}
          </p>
        </div>
      </section>

    </main>
  );
}
