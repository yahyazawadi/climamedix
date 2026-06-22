import iconEmpowerment  from '../assets/icon_empowerment.svg';
import iconScience      from '../assets/icon_science.svg';
import iconEmpowerment2 from '../assets/icon_empowerment2.svg';
import iconInnovation   from '../assets/icon_innovation.svg';
import iconCommunity    from '../assets/icon_community.svg';
import aboutBg          from '../assets/svgbackground.svg';


export function AboutUsPage({ onJoinClick }) {
  return (
    <main className="au-page" dir="rtl">

      {/* Full-page SVG background */}
      <div className="au-bg-wrap" aria-hidden="true">
        <img src={aboutBg} alt="" className="au-bg-img" />
      </div>

      {/* ══ VISION ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">رؤيتنا</h2>
          <p className="au-body">
            أن نكون المنصة البحثية الرائدة في مجال الصحة والتغير المناخي، من خلال إنتاج أبحاث متقدمة،
            تمكين الطواقم الطبية بالمعرفة، والمساهمة في بناء سياسات صحية مستدامة لمواجهة التحديات البيئية.
          </p>
        </div>
      </section>

      {/* ══ MISSION ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">مهمتنا</h2>
          <p className="au-body">
            نهدف إلى تمكين المهنيين في القطاع الصحي من لعب دور قيادي في الاستجابة العالمية لتغير المناخ،
            من خلال تعزيز البحث العلمي، تطوير دراسات ميدانية، ودعم الأبحاث التطبيقية التي تساعد في تقديم
            حلول فعالة. كما نعمل على بناء شبكة عالمية من الباحثين، ونوفر فرصاً للمشاركة في المشاريع
            البحثية التي تسهم في تحسين الصحة العامة.
          </p>
        </div>
      </section>

      {/* ══ VALUES ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">قيمنا</h2>

          <div className="au-values-grid">
            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconEmpowerment} alt="التمكين" />
              </div>
              <h3 className="au-value-title">التمكين:</h3>
              <p className="au-value-desc">نوفر الأدوات والتدريب اللازم لتمكين الطواقم الصحية من قيادة التغيير.</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconScience} alt="البحث العلمي" />
              </div>
              <h3 className="au-value-title">البحث العلمي:</h3>
              <p className="au-value-desc">نركز على الأبحاث والدراسات التي توفر حلولاً حقيقية لتحديات الصحة والتغير المناخي.</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconEmpowerment2} alt="التمكين" />
              </div>
              <h3 className="au-value-title">التمكين:</h3>
              <p className="au-value-desc">بناء شبكة عالمية من الباحثين والأكاديميين لدعم وتطوير المعرفة العلمية.</p>
            </div>

            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconInnovation} alt="الابتكار" />
              </div>
              <h3 className="au-value-title">الابتكار:</h3>
              <p className="au-value-desc">تطوير منهجيات جديدة لتعزيز دور البحث في دعم الاستدامة الصحية.</p>
            </div>
          </div>

          {/* 5th card — centered */}
          <div className="au-values-center-row">
            <div className="au-value-card">
              <div className="au-value-icon-wrap">
                <img src={iconCommunity} alt="التأثير المجتمعي" />
              </div>
              <h3 className="au-value-title">التأثير المجتمعي:</h3>
              <p className="au-value-desc">تحويل الأبحاث العلمية إلى حلول عملية تُطبَّق على أرض الواقع.</p>
            </div>
          </div>


        </div>
      </section>

      {/* ══ PARTNERSHIPS ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">شراكاتنا</h2>
          <p className="au-body">
            نعمل بالتعاون مع مؤسسات بحثية، جامعات، ومنظمات عالمية لدعم الأبحاث المتخصصة في الصحة
            البيئية. هذه الشراكات تتيح لنا تنفيذ دراسات موسعة، وتبادل الخبرات بين الباحثين،
            والمشاركة في المؤتمرات العلمية.
          </p>
          <ul className="au-checklist">
            <li>إذا كنت مهتماً بالبحث العلمي في مجال الصحة والتغير المناخي، يمكنك الانضمام إلى فريق ClimaMedix البحثي.</li>
            <li>نحن نبحث عن باحثين وعلميين مهتمين بتطوير حلول علمية لمشاكل الصحة البيئية.</li>
            <li>شارك في أبحاثنا وكن جزءاً من فريق يقود التغيير العلمي نحو مستقبل صحي مستدام.</li>
          </ul>
          <button className="au-btn-primary" onClick={onJoinClick}>
            انضم لفريق البحث
          </button>
        </div>
      </section>

      {/* ══ HISTORY ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">تاريخنا</h2>
          <p className="au-body">
            بدأت ClimaMedix كمبادرة بحثية تهدف إلى سد الفجوة بين الصحة والتغير المناخي. منذ انطلاقنا،
            ركزنا على دعم الباحثين وتوفير بيئة علمية مناسبة لإجراء دراسات متخصصة تساهم في إيجاد حلول
            عملية للمشاكل الصحية الناتجة عن التغيرات البيئية.
          </p>
        </div>
      </section>

      {/* ══ COMMITMENT ══ */}
      <section className="au-section">
        <div className="au-container">
          <h2 className="au-heading">التزامنا تجاه المجتمع</h2>
          <p className="au-body">
            نحن ملتزمون بنشر المعرفة العلمية، وتطوير أبحاث طبية قائمة على الأدلة، وتعزيز الوعي الصحي
            حول تأثيرات المناخ. هدفنا أن نجعل البحث العلمي أداة فعالة في بناء مجتمع صحي ومستدام للجميع.
          </p>
        </div>
      </section>

    </main>
  );
}
