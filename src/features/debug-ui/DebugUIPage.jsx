import { useEffect, useRef, useState } from 'preact/hooks';
import gsap from 'gsap';
import { Button } from '../shared/components/Button';
import { GlassCard } from '../shared/components/GlassCard';
import { supabase } from '../../utils/supabaseClient';
import leftSvg from '../../assets/leftsvg.svg';
import rightSvg from '../../assets/right-svg.svg';
import homeBg from '../../assets/bg_1.png';
import training1 from '../../assets/training_1.png';
import training2 from '../../assets/training_2.png';
import training3 from '../../assets/training_3.png';
import training4 from '../../assets/training_4.png';
import { OpportunitiesGrid } from '../opportunities/components/OpportunitiesGrid';
import { EventsCalendar } from '../events/components/EventsCalendar';
import { NewsFeed } from '../news-blog/components/NewsFeed';
import { ProgramDetailModal } from '../programs/components/ProgramDetailModal';
import { NetworkDirectory } from '../community/components/NetworkDirectory';
import { LMSDashboard } from '../learning-hub/components/student/LMSDashboard';
import { CourseDetailModal } from '../learning-hub/components/student/CourseDetailModal';
import { CertificateGenerator } from '../learning-hub/components/certificates/CertificateGenerator';
import { AdminCRUD } from '../admin/components/AdminCRUD';
import { AnalyticsDashboard } from '../admin/components/AnalyticsDashboard';
import { CustomAudioPlayer } from '../shared/components/CustomAudioPlayer';

const MOCK_EVENTS = [
  { id: 1, title: 'ورشة عمل: تقييم الأثر البيئي للمستشفيات', date: '2026-07-05', time: '10:00 ص', type: 'ورشة عمل', desc: 'تدريب عملي على أدوات قياس استهلاك الطاقة وإدارة النفايات الطبية.', link: '#' },
  { id: 2, title: 'ندوة: أزمة المياه وتأثيرها على الصحة العامة في العراق', date: '2026-07-12', time: '06:00 م', type: 'ندوة افتراضية', desc: 'جلسة حوارية مع خبراء البيئة لمناقشة انتشار الأمراض المنقولة بالمياه.', link: '#' },
  { id: 3, title: 'مؤتمر المناخ الطبي العربي الأول', date: '2026-07-20', time: '09:00 ص', type: 'مؤتمر حضوري', desc: 'تجمع سنوي للأطباء وصناع السياسات لبحث إستراتيجيات التكيف المناخي في الوطن العربي.', link: '#' },
  { id: 4, title: 'محاضرة: جودة الهواء والأمراض الصدرية عند الأطفال', date: '2026-07-26', time: '04:00 م', type: 'محاضرة علمية', desc: 'استعراض أحدث الأبحاث السريرية حول ملوثات الغلاف الجوي وصحة الرئتين.', link: '#' }
];

const MOCK_ARTICLES = [
  {
    title: 'كيف يساهم الأطباء العرب في مكافحة التغير المناخي؟',
    category: 'المناخ والصحة',
    date: '24 يونيو 2026',
    author: 'د. ياسمين السيد',
    summary: 'مقالة تسلط الضوء على المبادرات الطبية المحلية في مصر والأردن لمواجهة ارتفاع درجات الحرارة وتأثيرها السريري.',
    content: 'المحتوى الكامل هنا... تشهد المنطقة العربية تزايداً في المبادرات الطبية التي يقودها أطباء وممرضون للتوعية بمخاطر الإجهاد الحراري وتأثير ملوثات الهواء على صحة الأطفال وكبار السن.'
  },
  {
    title: 'إطلاق زمالة VSCHEF الجديدة للأبحاث البيئية',
    category: 'فرص وتطوير',
    date: '20 يونيو 2026',
    author: 'أكاديمية كلايما ميدكس',
    summary: 'نعلن عن فتح باب التقديم لزمالة التغير المناخي والصحة العامة المخصصة لطلاب الكليات الطبية بالوطن العربي.',
    content: 'المحتوى الكامل هنا... يهدف البرنامج إلى تزويد المشاركين بالمهارات الأساسية لكتابة المقترحات السياساتية وإجراء المسوح الميدانية البيئية.'
  },
  {
    title: 'دراسة حديثة: تلوث الهواء يرفع نسب الإصابة بالربو بالخليج',
    category: 'الأبحاث والابتكار',
    date: '15 يونيو 2026',
    author: 'مركز البحوث الطبية البيئية',
    summary: 'نشر الباحثون نتائج تقييم أثر جزيئات الغبار العالقة PM2.5 على زيادة حالات الطوارئ التنفسية بمستشفيات المنطقة.',
    content: 'المحتوى الكامل هنا... كشفت الدراسة عن علاقة طردية واضحة بين زيادة العواصف الرملية ونسب مراجعة طوارئ الأطفال للمستشفيات.'
  }
];

export function DebugUIPage() {
  const containerRef = useRef(null);

  // State for Concept 1 (Milestones)
  const [selectedMilestone, setSelectedMilestone] = useState(0);

  // State for Concept 2 (Metrics)
  const [activeMetric, setActiveMetric] = useState('temp');

  // State for Concept 4 (Arab Map Hub)
  const [selectedCountry, setSelectedCountry] = useState('Jordan');

  // State for Concept 5 (LMS Mini-Quiz)
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizStatus, setQuizStatus] = useState('idle');

  // State for Concept 6 (Publications Filter)
  const [activeCategory, setActiveCategory] = useState('all');

  // State for Concept 7 (Holographic Certificate Generator)
  const [certName, setCertName] = useState('د. مريم العتيبي');
  const [certEmail, setCertEmail] = useState('doctor.maryam@climamedix.org');
  const [certCourse, setCertCourse] = useState('زمالة VSCHEF للمناخ والصحة');
  const [certGenerating, setCertGenerating] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);
  const [verificationLink, setVerificationLink] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  // State for Concept 8 (Opportunities Slide-in Drawer)
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [isOppDrawerOpen, setIsOppDrawerOpen] = useState(false);

  // State for Concept 9 (SVG Analytics Chart)
  const [activeChartFilter, setActiveChartFilter] = useState('week');

  // State for Concept 10 (Event Countdown & Ticket Generator)
  const [eventRegistered, setEventRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, mins: 42, secs: 18 });

  // State for Concept 11 (Community Thread Votes & Comments)
  const [voteCount, setVoteCount] = useState(48);
  const [hasVoted, setHasVoted] = useState(false);
  const [comments, setComments] = useState([
    { author: 'د. يوسف صبري', text: 'هذه خطوة ممتازة لتعزيز الوعي الصحي البيئي في المنطقة.' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // State for Concept 12 (Admin Moderation Panel)
  const [moderationItems, setModerationItems] = useState([
    { id: 1, title: 'دراسة أثر الجفاف في البصرة', type: 'بحث علمي', author: 'د. علي حسين', status: 'pending' },
    { id: 2, title: 'مقترح سياسة استدامة مستشفيات طرابلس', type: 'سياسات عامة', author: 'أ. منى كامل', status: 'pending' }
  ]);

  // State for Concept 13 (LMS Lesson Player)
  const [currentLesson, setCurrentLesson] = useState('رصد الأوبئة وتأثير التغير الحراري');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // State for Concept 14 (Research explorer)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTag, setSearchTag] = useState('all');
  const [isSubmitPaperOpen, setIsSubmitPaperOpen] = useState(false);
  const [researchPapers, setResearchPapers] = useState([
    { title: 'تحليل جودة مياه الشرب في الدلتا', tag: 'water', author: 'د. أحمد شكري', year: '2025' },
    { title: 'تقييم مستويات الكربون بمستشفيات الرياض', tag: 'carbon', author: 'د. سارة فهد', year: '2026' },
    { title: 'خريطة انتشار حمى الضنك بمحافظات مصر', tag: 'health', author: 'د. هاني علي', year: '2026' }
  ]);

  // State for Concept 15 (Gamified Profile)
  const [badgeDetail, setBadgeDetail] = useState(null);

  // States for Events & News
  const [registeredEvents, setRegisteredEvents] = useState({});
  const [selectedArticle, setSelectedArticle] = useState(null);

  // States for Phase 2-5 components
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCountryName, setSelectedCountryName] = useState('all');
  const [enrolledCoursesList, setEnrolledCoursesList] = useState([
    {
      id: 1, title: 'زمالة طب الكوارث المناخية والبيئية', category: 'طبي بيئي', progress: 50, remainingLessons: 1, lessons: [
        {
          title: 'مقدمة في رصد الأوبئة وتأثير الحرارة',
          content: 'يعد رصد الأوبئة من الركائز الأساسية في مواجهة الأزمات الصحية الطارئة. مع تسارع وتيرة الاحتباس الحراري، تتعرض بعض المناطق لموجات حرارية غير مسبوقة تزيد من حدة انتشار النواقل الحشرية المسؤولة عن نقل أمراض مثل حمى الضنك والملاريا.',
          quiz: [
            {
              text: 'ما هي النواقل الحشرية الأكثر تأثراً بالاحتباس الحراري في نقل الأوبئة؟',
              options: ['القراد والبعوض', 'القوارض', 'الذباب المنزلي', 'كل ما سبق'],
              correctAnswer: 0
            }
          ]
        },
        {
          title: 'إدارة مخلفات المستشفيات وأثرها الكربوني',
          content: 'تساهم إدارة النفايات الطبية غير الصحيحة بنسبة كبيرة في انبعاثات الغازات الدفيئة والملوثات السامة.',
          quiz: [
            {
              text: 'ما هي الطريقة الأفضل بيئياً للتخلص من النفايات الطبية غير الحادة مقارنة بالحرق؟',
              options: ['الدفن المباشر في التراب', 'التعقيم البخاري (الموصدة)', 'الإلقاء في مجاري المياه', 'الرمي العشوائي'],
              correctAnswer: 1
            }
          ]
        }
      ]
    }
  ]);
  const [completedCoursesList, setCompletedCoursesList] = useState([]);
  const [activeLearningCourse, setActiveLearningCourse] = useState(null);
  const [certRecipientCourse, setCertRecipientCourse] = useState(null);

  useEffect(() => {
    window.setSelectedCountry = (country) => {
      setSelectedCountryName(country);
    };
    return () => {
      delete window.setSelectedCountry;
    };
  }, []);

  useEffect(() => {
    const fetchCertificate = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verifyCert') === 'true') {
        const id = params.get('id');
        const fallbackObj = {
          id: id || 'CMX-TEMP-999',
          name: params.get('name') || 'مستخدم تجريبي',
          course: params.get('course') || 'مسار عام',
          email: params.get('email') || 'doctor.maryam@climamedix.org'
        };

        if (id) {
          try {
            const { data, error } = await supabase.from('certificates').select('*').eq('id', id).single();
            if (data && !error) {
              setVerificationResult(data);
              return;
            }
          } catch (e) {
            console.warn('Supabase query failed, falling back to URL parameters/localStorage:', e);
          }

          // LocalStorage fallback
          try {
            const localCerts = JSON.parse(localStorage.getItem('climamedix_certs') || '{}');
            if (localCerts[id]) {
              setVerificationResult(localCerts[id]);
              return;
            }
          } catch (e) { }
        }

        setVerificationResult(fallbackObj);
      }
    };
    fetchCertificate();
  }, []);

  const handleRegisterCalendarEvent = (eventId) => {
    setRegisteredEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleSelectCourse = (course) => {
    setActiveLearningCourse(course);
  };

  const handleLessonCompleted = (courseId, progressPct, remaining) => {
    setEnrolledCoursesList(prev => prev.map(c => {
      if (c.id === courseId) {
        const updated = { ...c, progress: progressPct, remainingLessons: remaining };
        if (progressPct === 100) {
          setCompletedCoursesList(old => {
            if (!old.some(o => o.id === courseId)) {
              return [...old, { ...updated, quizScore: '95%' }];
            }
            return old;
          });
        }
        return updated;
      }
      return c;
    }));
  };

  const handleOpenCertificateGenerator = (courseName) => {
    setCertRecipientCourse(courseName);
  };

  const handleEnrollFromProgram = (programId) => {
    if (!enrolledCoursesList.some(c => c.id === programId)) {
      const newCourse = {
        id: programId,
        title: selectedProgram.title,
        category: selectedProgram.category || 'طبي بيئي',
        progress: 0,
        remainingLessons: 2
      };
      setEnrolledCoursesList(prev => [...prev, newCourse]);
    }
    setSelectedProgram(null);
  };

  // State for Concept 16 (Healthcare Facility Carbon Calculator)
  const [electricityVal, setElectricityVal] = useState(1200);
  const [wasteVal, setWasteVal] = useState(350);
  const [anestheticVal, setAnestheticVal] = useState(45);
  const [calculatedEmissions, setCalculatedEmissions] = useState({ scope1: 0, scope2: 0, scope3: 0, total: 0 });
  const [calculatorRan, setCalculatorRan] = useState(false);

  // State for Concept 17 (i18n & Direction Alignment Swapper)
  const [layoutLang, setLayoutLang] = useState('ar');

  // State for Concept 18 (PWA Web Push Notification Simulator)
  const [activeNotification, setActiveNotification] = useState(null);

  // State for Concept 19 (Dynamic Accessibility & Article Reader)
  const [textSizeMultiplier, setTextSizeMultiplier] = useState(1);

  // State for Concept 20 (Offline Sync Manager)
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // State for Concept 21 (Multi-step Onboarding & OTP Flow)
  const [authStep, setAuthStep] = useState(1);

  // State for Concept 22 (Impact Statistics Counter)
  const [statsStarted, setStatsStarted] = useState(false);
  const [displayedStats, setDisplayedStats] = useState({ learners: 0, co2: 0, countries: 0 });

  // State for Concept 23 (About Us - Team Members Carousel)
  const [activeTeamMember, setActiveTeamMember] = useState(0);

  // State for Concept 24 (Programs - Interactive Curriculum Accordion)
  const [activeAccordion, setActiveAccordion] = useState(null);

  // State for Concept 25 (Contact Us - Floating Social Hub)
  const [socialHover, setSocialHover] = useState(null);

  // State for Concept 26 (Learning Hub - Progress Donut)
  const [donutProgress, setDonutProgress] = useState(0);

  // State for Concept 27 (Interactive Earth Map Hotspots)
  const [activeHotspot, setActiveHotspot] = useState(null);

  // State for Concept 28 (ClimaBot AI Assistant)
  const [botChat, setBotChat] = useState([{ sender: 'bot', text: 'أهلاً بك! كيف يمكنني مساعدتك في مجال المناخ والصحة؟' }]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // State for Concept 29 (Resource Library Download Center)
  const [downloadProgress, setDownloadProgress] = useState({ id: null, progress: 0 });

  // State for Concept 30 (Local Theme Swapper)
  const [localTheme, setLocalTheme] = useState('clinical'); // 'clinical' or 'eco'

  // State for Concept 31 (Geometric Course Carousel)
  const [activeCourseSlide, setActiveCourseSlide] = useState(0);
  const slideContainerRef = useRef(null);

  const coursesData = [
    {
      id: 1,
      title: 'زمالة طب الكوارث المناخية والبيئية',
      category: 'طبي بيئي',
      desc: 'دراسة متعمقة في كيفية تخطيط المستشفيات والمراكز الطبية للتعامل مع الفيضانات، موجات الحرارة الشديدة، والأوبئة البيئية الطارئة.',
      image: training1,
    },
    {
      id: 2,
      title: 'تلوث الهواء وتأثيره السريري المباشر',
      category: 'أبحاث تطبيقية',
      desc: 'تمكين الأطباء من تشخيص وتفسير الأعراض التنفسية والقلبية الحادة الناتجة عن ملوثات الهواء الدقيقة وتغير الغلاف الجوي.',
      image: training2,
    },
    {
      id: 3,
      title: 'القيادة الصحية للعمل البيئي العالمي',
      category: 'مهارات القيادة',
      desc: 'تأهيل الكوادر الطبية لتمثيل القطاع الصحي في صياغة السياسات الوطنية والاتفاقيات الدولية المعنية بالاحتباس الحراري والصحة العامة.',
      image: training3,
    }
  ];

  const handleNextCourse = () => {
    const nextSlide = (activeCourseSlide + 1) % coursesData.length;
    animateCourseTransition(nextSlide);
  };

  const handlePrevCourse = () => {
    const prevSlide = (activeCourseSlide - 1 + coursesData.length) % coursesData.length;
    animateCourseTransition(prevSlide);
  };

  const animateCourseTransition = (nextIndex) => {
    const slideOverlay = slideContainerRef.current.querySelector('.triangle-overlay');
    const slideBg = slideContainerRef.current.querySelector('.course-bg-img');

    gsap.timeline()
      .to(slideOverlay, { opacity: 0, x: layoutLang === 'ar' ? 50 : -50, duration: 0.3 })
      .to(slideBg, { scale: 1.05, opacity: 0.6, duration: 0.3 }, '-=0.3')
      .call(() => {
        setActiveCourseSlide(nextIndex);
      })
      .to(slideOverlay, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' })
      .to(slideBg, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.4');
  };

  // State for Concept 32: Minimalist Map Window Widget (using Mapbox Map API)
  const [mapPointsJson, setMapPointsJson] = useState(JSON.stringify({
    "excludedCountries": ["israel"],
    "points": [
      { "id": "loc1", "name": "القدس", "lat": 31.7683, "lng": 35.2137, "status": "critical", "country": "Palestine", "details": "العاصمة التاريخية والأثرية لفلسطين" },
      { "id": "loc2", "name": "عمان", "lat": 31.9522, "lng": 35.9331, "status": "warning", "country": "Jordan", "details": "تأثيرات الجفاف والتغير الحراري" },
      { "id": "loc3", "name": "الرياض", "lat": 24.7136, "lng": 46.6753, "status": "warning", "country": "Saudi Arabia", "details": "تصميم المستشفيات منخفضة الكربون" },
      { "id": "loc4", "name": "القاهرة", "lat": 30.0444, "lng": 31.2357, "status": "critical", "country": "Egypt", "details": "أثر الملوثات الحضرية ونمذجة النواقل" },
      { "id": "loc5", "name": "بيروت", "lat": 33.8938, "lng": 35.5018, "status": "warning", "country": "Lebanon", "details": "دراسة أثر الضغوط المناخية والكوارث" },
      { "id": "loc6", "name": "البصرة", "lat": 30.5081, "lng": 47.7835, "status": "critical", "country": "Iraq", "details": "أثر شح المياه على تفشي النزلات المعوية" }
    ]
  }, null, 2));

  const [activeMapPoint, setActiveMapPoint] = useState(null);
  const [jsonParseError, setJsonParseError] = useState(null);
  const [parsedMapPoints, setParsedMapPoints] = useState([]);
  const [excludedCountries, setExcludedCountries] = useState([]);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Live Map Theme Configuration State
  const [mapTheme, setMapTheme] = useState({
    water_layer: "#014C6D",
    land_layer: "#2FAD78",
    text_labels: "#EEF6FC",
    text_halo_shadows: "#08294A",
    borders_and_roads: "#014C6D",
    critical_markers: "#4dff82",
    safe_markers: "#EEF6FC"
  });

  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Sync and validate JSON on change
  useEffect(() => {
    try {
      const parsed = JSON.parse(mapPointsJson);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.points)) {
          setParsedMapPoints(parsed.points);
          setExcludedCountries(parsed.excludedCountries || []);
          setJsonParseError(null);
        } else {
          setJsonParseError('يجب أن تحتوي البيانات على مصفوفة points');
        }
      } else {
        setJsonParseError('يجب أن تكون البيانات عبارة عن كائن JSON Object');
      }
    } catch (err) {
      setJsonParseError('خطأ في تنسيق JSON: ' + err.message);
    }
  }, [mapPointsJson]);

  // Load Mapbox Script and CSS dynamically
  useEffect(() => {
    let link = document.querySelector('link[href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    if (window.mapboxgl) {
      setMapboxLoaded(true);
    } else {
      let script = document.querySelector('script[src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
        script.onload = () => setMapboxLoaded(true);
        document.head.appendChild(script);
      } else {
        const checkM = setInterval(() => {
          if (window.mapboxgl) {
            setMapboxLoaded(true);
            clearInterval(checkM);
          }
        }, 100);
        mapInstanceRef.current = { _checkInterval: checkM };
      }
    }

    return () => {
      if (mapInstanceRef.current?._checkInterval) {
        clearInterval(mapInstanceRef.current._checkInterval);
      }
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize Mapbox and Render Markers
  useEffect(() => {
    if (!mapboxLoaded) return;

    if (!mapInstanceRef.current) {
      window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

      mapInstanceRef.current = new window.mapboxgl.Map({
        container: 'mapbox-map-container',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [38.0, 28.0],
        zoom: 4,
        projection: 'mercator'
      });

      mapInstanceRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    }
  }, [mapboxLoaded]);

  // Apply Live Map Theme Configuration
  useEffect(() => {
    if (!mapInstanceRef.current || !mapboxLoaded) return;

    const applyColors = () => {
      const style = mapInstanceRef.current.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          if (layer.id.includes('water')) {
            if (layer.type === 'fill') {
              mapInstanceRef.current.setPaintProperty(layer.id, 'fill-color', mapTheme.water_layer);
              mapInstanceRef.current.setPaintProperty(layer.id, 'fill-opacity', 1);
            } else if (layer.type === 'line') {
              mapInstanceRef.current.setPaintProperty(layer.id, 'line-color', mapTheme.water_layer);
            }
          } else {
            if (layer.type === 'background') {
              mapInstanceRef.current.setPaintProperty(layer.id, 'background-color', mapTheme.land_layer);
              mapInstanceRef.current.setPaintProperty(layer.id, 'background-opacity', 1);
            } else if (layer.type === 'fill') {
              mapInstanceRef.current.setPaintProperty(layer.id, 'fill-color', mapTheme.land_layer);
              mapInstanceRef.current.setPaintProperty(layer.id, 'fill-opacity', 1);
            } else if (layer.type === 'hillshade' || layer.type === 'raster') {
              mapInstanceRef.current.setLayoutProperty(layer.id, 'visibility', 'none');
            } else if (layer.type === 'symbol') {
              if (layer.paint && layer.paint['text-color']) {
                mapInstanceRef.current.setPaintProperty(layer.id, 'text-color', mapTheme.text_labels);
              }
              if (layer.paint && layer.paint['text-halo-color']) {
                mapInstanceRef.current.setPaintProperty(layer.id, 'text-halo-color', mapTheme.text_halo_shadows);
                mapInstanceRef.current.setPaintProperty(layer.id, 'text-halo-width', 1.5);
              }
            } else if (layer.type === 'line' && (layer.id.includes('road') || layer.id.includes('boundary') || layer.id.includes('admin'))) {
              mapInstanceRef.current.setPaintProperty(layer.id, 'line-color', mapTheme.borders_and_roads);
              mapInstanceRef.current.setPaintProperty(layer.id, 'line-width', 1.5);
            }
          }
        });
      }
    };

    if (mapInstanceRef.current.isStyleLoaded()) {
      applyColors();
    } else {
      mapInstanceRef.current.once('style.load', applyColors);
    }
  }, [mapTheme, mapboxLoaded]);

  // Update Markers when points or theme changes
  useEffect(() => {
    if (!mapboxLoaded || !mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // Add new markers
    if (Array.isArray(parsedMapPoints)) {
      parsedMapPoints.forEach(pt => {
        if (typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          const markerColor = pt.status === 'critical' ? mapTheme.critical_markers : mapTheme.safe_markers;

          const el = document.createElement('div');
          el.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; cursor: pointer;">
              <div class="map-pulse-${pt.status || 'warning'}" style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: ${pt.status === 'critical' ? mapTheme.critical_markers.replace(')', ', 0.4)').replace('rgb', 'rgba') : mapTheme.safe_markers.replace(')', ', 0.4)').replace('rgb', 'rgba')}; animation: mapRingPulse 2s infinite; opacity: 0.4;"></div>
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${markerColor}; border: 2px solid ${pt.status === 'critical' ? '#fff' : mapTheme.land_layer}; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 10;"></div>
            </div>
          `;

          el.addEventListener('click', () => {
            setActiveMapPoint(pt);
            if (pt.country) {
              setSelectedCountryName(pt.country);
            }
          });

          const marker = new window.mapboxgl.Marker({ element: el })
            .setLngLat([pt.lng, pt.lat])
            .addTo(mapInstanceRef.current);

          markersRef.current.push(marker);
        }
      });
    }
  }, [mapboxLoaded, parsedMapPoints, mapTheme]);

  const teamMembers = [
    { name: 'د. ياسمين السيد', role: 'خبير الصحة العامة والمناخ', bio: 'باحثة دولية في تأثيرات الحرارة المرتفعة على صحة الأطفال.' },
    { name: 'م. طارق النجار', role: 'مهندس استدامة المستشفيات', bio: 'متخصص في تقليل الانبعاثات الكربونية في البيئة الطبية.' },
    { name: 'د. ليلى فهد', role: 'مستشار السياسات البيئية', bio: 'عملت مع منظمة الصحة العالمية لدمج المناخ في المناهج.' }
  ];

  const curriculumModules = [
    { id: 1, title: 'الوحدة الأولى: أساسيات المناخ والصحة', desc: 'مقدمة في مسببات التغير المناخي والغازات الدفيئة وعلاقتها المباشرة بتدهور جودة الهواء.' },
    { id: 2, title: 'الوحدة الثانية: الأمراض المنقولة بالنواقل', desc: 'تحليل دقيق لانتشار الملاريا وحمى الضنك مع ارتفاع درجات الحرارة والرطوبة.' },
    { id: 3, title: 'الوحدة الثالثة: بناء المستشفيات الخضراء', desc: 'إستراتيجيات تقليل استهلاك الطاقة وإدارة النفايات الطبية بشكل مستدام.' }
  ];

  const milestones = [
    { title: 'الأساسيات البيئية', desc: 'مقدمة في علوم الغلاف الجوي والتغير المناخي وتأثيرها الأولي على المجتمعات.', date: 'الأسبوع 1-2' },
    { title: 'الأوبئة والمناخ', desc: 'تحليل انتشار النواقل المسببة للأمراض كالملاريا وحمى الضنك بفعل ارتفاع الحرارة.', date: 'الأسبوع 3-4' },
    { title: 'الاستدامة الصحية', desc: 'بناء مستشفيات خضراء منخفضة الانبعاثات وإدارة الموارد الطبية بذكاء بيئي.', date: 'الأسبوع 5-6' },
    { title: 'مشروع التخرج', desc: 'تقديم دراسة ميدانية أو مقترح سياسة عامة تخدم القطاع الصحي المحلي.', date: 'الأسبوع 7-8' }
  ];

  const metricsData = {
    temp: { val: '+1.5 C', label: 'معدل الاحترار العالمي المتوقع بحلول 2030', color: '#ff4d4d', alert: 'تنبيه حرج: يتطلب استجابة صحية فورية' },
    co2: { val: '424 ppm', label: 'تركيز ثاني أكسيد الكربون في الغلاف الجوي', color: '#ff944d', alert: 'تنبيه مرتفع: زيادة في مشاكل الجهاز التنفسي' },
    water: { val: '-30%', label: 'تراجع حصة الفرد من المياه العذبة بالوطن العربي', color: '#4da6ff', alert: 'تنبيه مقلق: انتشار الأمراض المنقولة بالمياه' }
  };

  const countriesData = {
    Jordan: { name: 'المملكة الأردنية الهاشمية', reps: 12, project: 'تقييم درجات الحرارة في غور الأردن وعلاقتها بالإجهاد الحراري للمزارعين.' },
    Egypt: { name: 'جمهورية مصر العربية', reps: 24, project: 'تحليل أثر ارتفاع منسوب البحر في الدلتا على انتشار النزلات المعوية.' },
    Palestine: { name: 'دولة فلسطين', reps: 15, project: 'دراسة تلوث الهواء في المناطق المزدحمة وأثره على أمراض الصدر المزمنة.' },
    Saudi: { name: 'المملكة العربية السعودية', reps: 18, project: 'مبادرة تقييم جودة الهواء الداخلي في المنشآت الصحية بالمناطق الجافة.' }
  };

  const publications = [
    { title: 'ارتفاع الحرارة والسكتات القلبية في الخليج', cat: 'climate', author: 'د. خالد اليوسف', year: '2026' },
    { title: 'تأثير الغبار العالق على مرضى الربو في الشام', cat: 'health', author: 'د. ليلى حسن', year: '2025' },
    { title: 'دليل المستشفيات الخضراء المستدامة في مصر', cat: 'policy', author: 'م. أحمد شكري', year: '2026' }
  ];

  const opportunities = [
    { title: 'زمالة VSCHEF للأبحاث البيئية', type: 'زمالة دراسية', deadline: '15 يوليو 2026', desc: 'برنامج بحثي مكثف يهدف إلى تمكين الطاقم الطبي من كتابة مسودات علمية رصينة عن التغير البيئي.' },
    { title: 'منحة ماجستير الصحة العامة الخضراء', type: 'منحة تعليمية', deadline: '30 أغسطس 2026', desc: 'منحة دراسية كاملة لدراسة تأثيرات المناخ السلبية على النظم الطبية الحضرية.' },
    { title: 'مؤتمر المناخ الطبي العربي 2026', type: 'مؤتمر علمي', deadline: '10 سبتمبر 2026', desc: 'مشاركة دولية واسعة لعرض أبحاث وابتكارات الطاقة النظيفة في المستشفيات.' }
  ];

  const chartData = {
    week: [
      { label: 'الأحد', val: 120 }, { label: 'الإثنين', val: 180 }, { label: 'الثلاثاء', val: 290 },
      { label: 'الأربعاء', val: 150 }, { label: 'الخميس', val: 240 }, { label: 'الجمعة', val: 90 }, { label: 'السبت', val: 140 }
    ],
    month: [
      { label: 'الأسبوع 1', val: 450 }, { label: 'الأسبوع 2', val: 590 }, { label: 'الأسبوع 3', val: 780 },
      { label: 'الأسبوع 4', val: 620 }
    ]
  };

  const courseLessons = [
    { title: 'رصد الأوبئة وتأثير التغير الحراري', duration: '15 دقيقة', completed: true },
    { title: 'الانبعاثات الطبية وإدارة المخلفات السائلة', duration: '22 دقيقة', completed: false },
    { title: 'تغير المناخ ومعدلات انتشار الربو الشعبي', duration: '18 دقيقة', completed: false }
  ];

  const badges = [
    { title: 'حارس البيئة', desc: 'يُمنح لإتمام الدورة الأساسية للمناخ والصحة بنجاح.', level: 'مبتدئ' },
    { title: 'الباحث الطبي البيئي', desc: 'يُمنح لنشر ورقة علمية معتمدة على قاعدة بيانات الأبحاث.', level: 'متقدم' },
    { title: 'سفير الاستدامة الفخري', desc: 'يُمنح للمشاركين الأكثر تفاعلاً بالمنتدى وتوجيه الزملاء الجدد.', level: 'نخبة' }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in and slide up cards
      gsap.from('.debug-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // Pop in buttons
      gsap.from('.debug-btn-wrapper', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.3,
        ease: 'back.out(1.7)'
      });

      // Floating animation for SVGs
      gsap.to('.debug-floating-svg', {
        y: -30,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Pulse for active components
      gsap.to('.imagination-pulse', {
        scale: 1.03,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Map Ripple Animation
      gsap.to('.map-ripple', {
        scale: 2.5,
        opacity: 0,
        duration: 1.8,
        repeat: -1,
        ease: 'power1.out'
      });

      animateChart();
    }, containerRef);

    // Countdown Timer Simulation
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        clearInterval(timer);
        return prev;
      });
    }, 1000);

    return () => {
      ctx.revert();
      clearInterval(timer);
    };
  }, []);

  // GSAP animation for milestone description changes
  const handleMilestoneClick = (index) => {
    setSelectedMilestone(index);
    gsap.fromTo('.milestone-detail',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  };

  // GSAP animation for metrics tab changes
  const handleMetricTabClick = (key) => {
    setActiveMetric(key);
    gsap.fromTo('.metric-display',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }
    );
  };

  // GSAP animation for Map Click Info
  const handleCountryClick = (key) => {
    setSelectedCountry(key);
    gsap.fromTo('.map-info-box',
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
  };

  // Handle Quiz Submissions with animations
  const handleQuizAnswer = (isCorrect) => {
    setQuizAnswer(isCorrect);
    setQuizStatus(isCorrect ? 'correct' : 'incorrect');

    gsap.fromTo('.quiz-feedback-banner',
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }
    );
  };

  const handleEmailChange = async (email) => {
    setCertEmail(email);

    // 1. Search in mock profiles
    const mockRep = [
      { email: 'm.otaibi@climamedix.org', name: 'د. مريم العتيبي' },
      { email: 'k.jaber@climamedix.org', name: 'أ. د. خالد الجابر' },
      { email: 'y.sabry@climamedix.org', name: 'د. يوسف صبري' },
      { email: 'r.haddad@climamedix.org', name: 'د. رانيا الحداد' },
      { email: 'a.hussein@climamedix.org', name: 'د. علي حسين' }
    ].find(rep => rep.email.toLowerCase() === email.trim().toLowerCase());

    if (mockRep) {
      setCertName(mockRep.name);
      return;
    }

    // 2. Search in Supabase profiles
    if (email.includes('@') && email.length > 5) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, full_name, display_name')
          .eq('email', email.trim())
          .maybeSingle();

        if (data && !error) {
          const fetchedName = data.full_name || data.name || data.display_name;
          if (fetchedName) {
            setCertName(fetchedName);
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch name from profiles:', err);
      }
    }
  };

  // Holographic Certificate Generation Anim
  const handleGenerateCertificate = async () => {
    setCertGenerating(true);
    setCertGenerated(false);
    setVerificationLink('');

    const uniqueId = `CMX-${Math.floor(10000 + Math.random() * 90000)}-2026`;
    const certRecord = {
      id: uniqueId,
      name: certName,
      course: certCourse,
      email: certEmail,
      issued_at: new Date().toISOString()
    };

    // Storing in database
    try {
      const { error } = await supabase.from('certificates').insert([certRecord]);
      if (error) {
        console.warn('Database insert failed, using fallback persistence:', error.message);
      }
    } catch (e) {
      console.warn('Database error:', e);
    }

    // LocalStorage fallback for robustness/offline fallback validation
    try {
      const localCerts = JSON.parse(localStorage.getItem('climamedix_certs') || '{}');
      localCerts[uniqueId] = certRecord;
      localStorage.setItem('climamedix_certs', JSON.stringify(localCerts));
    } catch (e) { }

    setTimeout(() => {
      setCertGenerating(false);
      setCertGenerated(true);
      const url = `${window.location.origin}${window.location.pathname}?verifyCert=true&id=${uniqueId}&name=${encodeURIComponent(certName)}&course=${encodeURIComponent(certCourse)}&email=${encodeURIComponent(certEmail)}`;
      setVerificationLink(url);

      // Animate Certificate Paper and Holographic Stamp
      gsap.fromTo('.cert-paper-mock',
        { rotationX: -45, scale: 0.85, opacity: 0 },
        { rotationX: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
      );

      gsap.fromTo('.cert-stamp',
        { scale: 3, opacity: 0, rotation: -90 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, delay: 0.5, ease: 'bounce.out' }
      );
    }, 1200);
  };

  // Drawer Opening Anim
  const openOppDrawer = (opp) => {
    setSelectedOpp(opp);
    setIsOppDrawerOpen(true);
    gsap.fromTo('.opp-drawer',
      { x: '100%' },
      { x: '0%', duration: 0.5, ease: 'power3.out' }
    );
  };

  // Drawer Closing Anim
  const closeOppDrawer = () => {
    gsap.to('.opp-drawer', {
      x: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => setIsOppDrawerOpen(false)
    });
  };

  // SVG Chart Height transition using GSAP
  const handleChartFilterChange = (filter) => {
    setActiveChartFilter(filter);
    setTimeout(() => animateChart(), 50);
  };

  const animateChart = () => {
    gsap.fromTo('.chart-bar',
      { scaleY: 0 },
      { scaleY: 1, transformOrigin: 'bottom', duration: 0.8, stagger: 0.05, ease: 'power2.out' }
    );
  };

  // Concept 10: Event Registration
  const handleRegisterEvent = () => {
    setEventRegistered(true);
    gsap.fromTo('.event-ticket-mockup',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
    );
  };

  // Concept 11: Community Vote Up
  const handleCommunityVote = () => {
    if (hasVoted) {
      setVoteCount(prev => prev - 1);
      setHasVoted(false);
    } else {
      setVoteCount(prev => prev + 1);
      setHasVoted(true);
      gsap.fromTo('.vote-badge',
        { scale: 1.3 },
        { scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  };

  // Concept 11: Add Comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setComments(prev => [...prev, { author: 'المستخدم الحالي', text: newCommentText }]);
    setNewCommentText('');
    setTimeout(() => {
      gsap.fromTo('.comment-item:last-child',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }, 10);
  };

  // Concept 12: Admin Moderation Toggle Action
  const handleModerationAction = (id, action) => {
    gsap.to(`.mod-item-${id}`, {
      opacity: 0,
      x: action === 'approve' ? -80 : 80,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        setModerationItems(prev => prev.filter(item => item.id !== id));
      }
    });
  };

  // Concept 13: LMS Lesson Switch & Play Simulation
  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson.title);
    setIsVideoPlaying(false);
    gsap.fromTo('.video-player-container',
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );
  };

  const handlePlayToggle = () => {
    setIsVideoPlaying(prev => !prev);
    if (!isVideoPlaying) {
      gsap.to('.video-timeline-indicator', {
        width: '100%',
        duration: 120,
        ease: 'none'
      });
    } else {
      gsap.killTweensOf('.video-timeline-indicator');
    }
  };

  // Concept 14: Submitting Research Paper Mock
  const handleSubmitPaperSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('paperTitle');
    const author = formData.get('paperAuthor');
    const tag = formData.get('paperTag');

    if (!title || !author) return;

    const newPaper = {
      title,
      author,
      tag,
      year: '2026'
    };

    setResearchPapers(prev => [newPaper, ...prev]);
    setIsSubmitPaperOpen(false);

    setTimeout(() => {
      gsap.fromTo('.research-paper-item:first-child',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
      );
    }, 50);
  };

  // Concept 15: Badge Display Info
  const handleBadgeClick = (badge) => {
    setBadgeDetail(badge);
    gsap.fromTo('.badge-info-popup',
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.3)' }
    );
  };

  // Concept 16: Carbon Emissions Calculator logic
  const handleCalculateEmissions = () => {
    const scope1 = anestheticVal * 2.1;
    const scope2 = electricityVal * 0.47;
    const scope3 = wasteVal * 0.85;
    const total = scope1 + scope2 + scope3;

    setCalculatedEmissions({
      scope1: Math.round(scope1),
      scope2: Math.round(scope2),
      scope3: Math.round(scope3),
      total: Math.round(total)
    });
    setCalculatorRan(true);

    setTimeout(() => {
      gsap.fromTo('.carbon-bar',
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left', duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }, 50);
  };

  // Concept 17: Layout Swap alignment animation
  const handleLanguageSwap = (lang) => {
    setLayoutLang(lang);
    gsap.fromTo('.lang-sensitive-wrapper',
      { opacity: 0, x: lang === 'ar' ? 30 : -30 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }
    );
  };

  // Concept 18: Web Push Dispatcher Notification slide animation
  const handleDispatchNotification = (type) => {
    let title = '';
    let message = '';

    if (type === 'opp') {
      title = 'فرصة زمالة جديدة';
      message = 'أعلنت أكاديمية ClimaMedix عن فتح باب التسجيل لزمالة VSCHEF لعام 2026.';
    } else {
      title = 'تذكير بمحاضرة حية';
      message = 'تبدأ ندوة المستشفيات الخضراء بالشرق الأوسط بعد 15 دقيقة من الآن.';
    }

    setActiveNotification({ title, message });

    // GSAP notification entrance slide
    setTimeout(() => {
      gsap.fromTo('.pwa-push-banner',
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }
      );

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        gsap.to('.pwa-push-banner', {
          y: -100,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => setActiveNotification(null)
        });
      }, 5000);
    }, 50);
  };

  // Concept 19: Article Reader Font Size 
  const handleIncreaseFont = () => setTextSizeMultiplier(prev => Math.min(prev + 0.1, 1.5));
  const handleDecreaseFont = () => setTextSizeMultiplier(prev => Math.max(prev - 0.1, 0.8));

  // Concept 20: Offline Sync Manager
  const handleSyncToggle = () => {
    setIsOffline(prev => !prev);
    if (isOffline && syncQueue.length > 0) { // Going online
      setSyncStatusMsg('جاري مزامنة البيانات المؤجلة...');
      setTimeout(() => {
        gsap.to('.sync-queue-item', {
          x: 50, opacity: 0, duration: 0.4, stagger: 0.1,
          onComplete: () => {
            setSyncQueue([]);
            setSyncStatusMsg('تمت المزامنة بنجاح!');
            setTimeout(() => setSyncStatusMsg(''), 3000);
          }
        });
      }, 500);
    }
  };

  const handleOfflineAction = () => {
    if (isOffline) {
      setSyncQueue(prev => [...prev, { id: Date.now(), title: 'إرسال نموذج طلب' }]);
      gsap.fromTo('.sync-queue-container', { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out' });
    } else {
      setSyncStatusMsg('تم الإرسال فوراً (أنت متصل بالشبكة)');
      setTimeout(() => setSyncStatusMsg(''), 2000);
    }
  };

  // Concept 21: Auth Flow
  const handleNextAuthStep = () => {
    gsap.to('.auth-step-container', {
      opacity: 0, x: -30, duration: 0.3,
      onComplete: () => {
        setAuthStep(prev => Math.min(prev + 1, 3));
        gsap.fromTo('.auth-step-container', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.4 });
      }
    });
  };

  const handleResetAuth = () => {
    setAuthStep(1);
    gsap.fromTo('.auth-step-container', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
  };

  // Concept 22: Impact Counter
  const startImpactCounter = () => {
    if (statsStarted) return;
    setStatsStarted(true);

    const targetObj = { learners: 0, co2: 0, countries: 0 };
    gsap.to(targetObj, {
      learners: 5240,
      co2: 120,
      countries: 85,
      duration: 3,
      ease: 'power3.out',
      onUpdate: () => {
        setDisplayedStats({
          learners: Math.floor(targetObj.learners),
          co2: Math.floor(targetObj.co2),
          countries: Math.floor(targetObj.countries)
        });
      }
    });
  };

  // Concept 23: Team Carousel
  const handleTeamClick = (idx) => {
    setActiveTeamMember(idx);
    gsap.fromTo('.team-bio-box', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 });
  };

  // Concept 24: Accordion
  const handleAccordionClick = (id) => {
    setActiveAccordion(prev => prev === id ? null : id);
    setTimeout(() => {
      gsap.fromTo('.accordion-content', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 });
    }, 50);
  };

  // Concept 26: Donut Animation
  const animateDonut = () => {
    if (donutProgress === 0) {
      const targetObj = { val: 0 };
      gsap.to(targetObj, {
        val: 85,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          setDonutProgress(Math.floor(targetObj.val));
        }
      });
    }
  };

  // Concept 33: Slide-out Calendar Sidebar
  const [isCalendarSidebarOpen, setIsCalendarSidebarOpen] = useState(false);
  const [sidebarEvents, setSidebarEvents] = useState([]);
  const [isLoadingSidebarEvents, setIsLoadingSidebarEvents] = useState(false);

  useEffect(() => {
    const fetchRealEvents = async () => {
      setIsLoadingSidebarEvents(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
          
        if (data && !error) {
          const mapped = data.map(db => ({
            id: db.id,
            title: db.title_ar || db.title_en || 'بدون عنوان',
            date: db.event_date ? db.event_date.split('T')[0] : '', 
            time: db.time,
            type: db.type_ar || db.type_en || db.type || 'فعالية',
            desc: db.description_ar || db.description_en || '',
            link: db.registration_link || '#'
          }));
          setSidebarEvents(mapped);
        }
      } catch (e) {
        console.warn('Failed to fetch events:', e);
      }
      setIsLoadingSidebarEvents(false);
    };
    fetchRealEvents();
  }, []);

  return (
    <main ref={containerRef} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', padding: '160px 20px 80px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>

      {/* CSS Stylesheet Injector for Premium Aesthetics */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .imagination-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 16px 40px rgba(0, 76, 109, 0.08);
          border-radius: 24px;
          padding: 28px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          color: #0b2849;
          position: relative;
          overflow: hidden;
        }
        .imagination-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 50px rgba(0, 76, 109, 0.15);
          border-color: rgba(21, 180, 122, 0.5);
        }
        .imagination-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #15b47a, #004c6d);
          opacity: 0.7;
        }
        .glow-dot {
          width: 12px;
          height: 12px;
          background-color: #15b47a;
          border-radius: 50%;
          box-shadow: 0 0 12px #15b47a, 0 0 20px rgba(21, 180, 122, 0.5);
          display: inline-block;
        }
        .glow-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(21, 180, 122, 0.4), transparent);
          z-index: 0;
        }
        .tab-btn {
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(225, 239, 250, 0.5);
          color: #0b2849;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.25s ease;
        }
        .tab-btn.active {
          background: #004c6d;
          color: #ffffff;
          border-color: #004c6d;
          box-shadow: 0 6px 15px rgba(0, 76, 109, 0.2);
        }
        .milestone-node {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #004c6d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #004c6d;
          cursor: pointer;
          z-index: 1;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .milestone-node.active {
          background: #15b47a;
          border-color: #15b47a;
          color: #ffffff;
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(21, 180, 122, 0.6);
        }
        .visualizer-screen {
          background: linear-gradient(135deg, #0b2849 0%, #004c6d 100%);
          border-radius: 20px;
          padding: 30px;
          color: #ffffff;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.3), 0 15px 35px rgba(11, 40, 73, 0.15);
          position: relative;
        }
        .visualizer-screen::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(21, 180, 122, 0.15), transparent 60%);
          pointer-events: none;
        }
        
        /* Interactive Map Mockup Styles */
        .map-interactive-container {
          background: linear-gradient(135deg, #004c6d 0%, #0b2849 100%);
          border-radius: 20px;
          height: 320px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(11, 40, 73, 0.2);
        }
        .country-node {
          position: absolute;
          cursor: pointer;
          z-index: 2;
        }
        .country-node-dot {
          width: 14px;
          height: 14px;
          background-color: #15b47a;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px #15b47a;
          transition: transform 0.25s ease;
        }
        .country-node:hover .country-node-dot {
          transform: scale(1.3);
          background-color: #ffffff;
          box-shadow: 0 0 12px #ffffff;
        }
        .map-ripple {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid rgba(21, 180, 122, 0.6);
          border-radius: 50%;
          pointer-events: none;
          transform-origin: center;
          margin-top: -5px;
          margin-left: -5px;
        }

        /* Interactive Quiz Option */
        .quiz-option {
          background: rgba(255, 255, 255, 0.4);
          border: 2px solid rgba(11, 40, 73, 0.1);
          border-radius: 14px;
          padding: 15px 20px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: right;
          width: 100%;
          color: #0b2849;
        }
        .quiz-option:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #004c6d;
          transform: translateX(-4px);
        }
        
        /* 3D Flip Cards */
        .card-3d-scene {
          perspective: 1000px;
          height: 180px;
        }
        .card-3d-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }
        .card-3d-scene:hover .card-3d-inner {
          transform: rotateY(180deg);
        }
        .card-3d-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-3d-front {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .card-3d-back {
          background: linear-gradient(135deg, #0b2849 0%, #004c6d 100%);
          color: #ffffff;
          transform: rotateY(180deg);
        }

        /* Certificate Mockup Style */
        .cert-paper-mock {
          background: #fdfdf9;
          border: 12px double #e5d3b3;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 40px;
          position: relative;
          transform-style: preserve-3d;
          perspective: 600px;
        }
        .cert-stamp {
          position: absolute;
          bottom: 25px;
          left: 45px;
          width: 85px;
          height: 85px;
          border-radius: 50%;
          background: radial-gradient(circle, #e5d3b3 30%, #bca374 100%);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0b2849;
          font-size: 9px;
          font-weight: bold;
          box-shadow: 0 6px 15px rgba(188, 163, 116, 0.5);
          text-transform: uppercase;
        }

        /* Ticket Generator style */
        .event-ticket-mockup {
          background: radial-gradient(circle at 0 50%, transparent 15px, #ffffff 16px),
                      radial-gradient(circle at 100% 50%, transparent 15px, #ffffff 16px);
          background-position: left, right;
          background-size: 51% 100%;
          background-repeat: no-repeat;
          border-radius: 12px;
          border: 1px solid rgba(11, 40, 73, 0.15);
          padding: 24px;
          box-shadow: 0 8px 25px rgba(0, 76, 109, 0.1);
          position: relative;
        }

        /* LMS Player Mock */
        .video-player-container {
          background: #000000;
          aspect-ratio: 16/9;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
        }
        .lesson-nav-btn {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(11,40,73,0.1);
          padding: 10px 14px;
          border-radius: 10px;
          width: 100%;
          text-align: right;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #0b2849;
          font-weight: 500;
        }
        .lesson-nav-btn.active {
          background: #004c6d;
          color: #ffffff;
          border-color: #004c6d;
        }

        /* Research search tags */
        .search-filter-tag {
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(11, 40, 73, 0.15);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
          color: #0b2849;
        }
        .search-filter-tag.active {
          background: #15b47a;
          color: #ffffff;
          border-color: #15b47a;
        }

        /* Achievement badge item */
        .badge-element {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(11, 40, 73, 0.1);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .badge-element:hover {
          transform: scale(1.06);
          border-color: #15b47a;
          box-shadow: 0 10px 20px rgba(21, 180, 122, 0.12);
        }

        /* Push Notification Banner */
        .pwa-push-banner {
          position: fixed;
          top: 30px;
          left: 30px;
          width: 380px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(21, 180, 122, 0.4);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 76, 109, 0.15);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 5px;
          direction: rtl;
        }


        /* Global ID Hover Tooltips */
        .hover-id-container { position: relative !important; }
        .hover-id-container[id]:hover::after,
        .imagination-card[id]:hover::after,
        [id^="card-"]:hover::after,
        [id^="btn-"]:hover::after {
          content: "ID: " attr(id);
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(11, 40, 73, 0.95);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: monospace;
          white-space: nowrap;
          z-index: 1000;
          pointer-events: auto;
          user-select: all;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 1px solid rgba(21,180,122,0.8);
        }

        /* UI Library Styles */
        .btn-showcase {
          padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Tajawal', sans-serif; display: inline-flex; align-items: center; justify-content: center;
        }
        .btn-neon {
          background: transparent; border: 2px solid #15b47a; color: #15b47a; box-shadow: 0 0 10px rgba(21, 180, 122, 0.5), inset 0 0 10px rgba(21, 180, 122, 0.5); transition: all 0.3s;
        }
        .btn-neon:hover { background: #15b47a; color: #ffffff; box-shadow: 0 0 20px rgba(21, 180, 122, 0.8), inset 0 0 20px rgba(21, 180, 122, 0.8); }
        
        .btn-magnetic { background: linear-gradient(135deg, #0b2849, #004c6d); color: #fff; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(11, 40, 73, 0.3); border: none; }
        .btn-magnetic:hover { transform: scale(1.08) translateY(-5px); }

        .btn-glass-pulse { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.8); color: #0b2849; animation: pulseGlass 2s infinite; }
        @keyframes pulseGlass { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); } 70% { box-shadow: 0 0 0 15px rgba(255,255,255,0); } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } }

        .btn-3d-press { background: #ff4d4d; color: #fff; border: none; border-bottom: 6px solid #cc0000; transition: all 0.1s; border-radius: 12px; }
        .btn-3d-press:active { transform: translateY(6px); border-bottom: 0px solid #cc0000; margin-bottom: 6px; }

        .btn-elegant-outline { background: transparent; border: 2px solid #0b2849; color: #0b2849; transition: all 0.3s; position: relative; overflow: hidden; z-index: 1; }
        .btn-elegant-outline::before { content: ''; position: absolute; top: 0; left: 0; width: 0%; height: 100%; background: #0b2849; transition: all 0.3s; z-index: -1; }
        .btn-elegant-outline:hover::before { width: 100%; }
        .btn-elegant-outline:hover { color: #fff; }

        .library-label { 
          position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%) translateY(10px);
          font-size: 11px; background: rgba(11, 40, 73, 0.9); color: #fff; padding: 6px 12px; border-radius: 6px; 
          font-family: monospace; user-select: all; display: inline-block;
          opacity: 0; pointer-events: none; transition: all 0.3s; white-space: nowrap; z-index: 10;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 1px solid rgba(21,180,122,0.5);
        }
        .imagination-card:hover .library-label,
        .hover-id-container:hover .library-label {
          opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto;
        }

        /* Concept 31: Geometric Course Carousel Styles */
        .geometric-carousel {
          position: relative;
          width: 100%;
          height: 520px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .course-bg-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.95;
        }
        .triangle-overlay {
          position: absolute;
          top: 0;
          right: 0;
          width: 60%;
          height: 100%;
          background: linear-gradient(135deg, rgba(11, 40, 73, 0.98) 20%, rgba(21, 180, 122, 0.9) 100%);
          clip-path: polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 80px 40px 40px;
          color: #fff;
          z-index: 2;
          direction: rtl;
        }
        .carousel-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          font-size: 24px;
          font-family: Arial, sans-serif;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
          padding: 0 0 4px 0; /* subtle offset compensation for chevron alignment */
        }
        .carousel-nav-btn:hover {
          background: #15b47a;
          border-color: #15b47a;
          transform: translateY(-50%) scale(1.1);
        }
        .carousel-nav-btn.prev {
          left: 20px;
        }
        .carousel-nav-btn.next {
          right: 20px;
        }
        @media (max-width: 768px) {
          .triangle-overlay {
            width: 100%;
            clip-path: none;
            background: linear-gradient(0deg, rgba(11, 40, 73, 0.98) 50%, rgba(11, 40, 73, 0.7) 100%);
            padding: 30px;
          }
          .geometric-carousel {
            height: auto;
            min-height: 520px;
          }
          .carousel-nav-btn.prev {
            left: 10px;
          }
          .carousel-nav-btn.next {
            right: 10px;
          }
        }
        /* Concept 32: Map Widget Pulse Animations */
        @keyframes mapRingPulse {
          0% { transform: scale(0.4); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* PWA simulated Notification banner if active */}
      {activeNotification && (
        <div className="pwa-push-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold', textTransform: 'uppercase' }}>تنبيه فوري PWA</span>
            <button onClick={() => setActiveNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#0b2849' }}>x</button>
          </div>
          <strong style={{ fontSize: '15px', color: '#0b2849' }}>{activeNotification.title}</strong>
          <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.8)', lineHeight: '1.4' }}>{activeNotification.message}</span>
        </div>
      )}

      {/* Shared Background from the home page (bg_1.png) - repeating vertically to cover long scrollable page */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -2, pointerEvents: 'none' }}>
        <div style={{ backgroundImage: `url(${homeBg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'repeat-y', width: '100%', height: '100%' }} />
      </div>

      {/* Floating SVGs from the main page */}
      <img src={rightSvg} alt="" className="debug-floating-svg" style={{ position: 'absolute', top: '20%', right: 0, zIndex: -1, height: '300px', opacity: 0.8 }} />
      <img src={leftSvg} alt="" className="debug-floating-svg" style={{ position: 'absolute', top: '50%', left: 0, zIndex: -1, height: '300px', opacity: 0.8 }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ==========================================
            SECTION 0: UI ELEMENTS LIBRARY (NEW BUTTONS & CARDS)
            ========================================== */}
        <div id="section-0-ui-library" style={{ marginBottom: '80px', background: 'rgba(255,255,255,0.5)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(11,40,73,0.1)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مكتبة العناصر والأزرار (UI Reference Library)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            انسخ الـ ID المرفق لاستدعاء الستايل في أي صفحة أخرى.
          </p>

          <h3 style={{ color: '#004c6d', fontSize: '20px', borderBottom: '2px solid rgba(21,180,122,0.3)', paddingBottom: '10px', marginBottom: '20px' }}>
            1. أزرار تفاعلية جديدة (New Interactive Buttons)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>

            <div id="feature-card-30" className="imagination-card hover-id-container hover-id-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button id="btn-neon-primary" className="btn-showcase btn-neon">زر النيون الأخضر</button>
              <div className="library-label">id="btn-neon-primary"</div>
            </div>

            <div id="feature-card-31" className="imagination-card hover-id-container hover-id-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button id="btn-magnetic-hover" className="btn-showcase btn-magnetic">الزر المغناطيسي</button>
              <div className="library-label">id="btn-magnetic-hover"</div>
            </div>

            <div id="feature-card-32" className="imagination-card hover-id-container hover-id-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button id="btn-glass-pulse" className="btn-showcase btn-glass-pulse">زر النبض الزجاجي</button>
              <div className="library-label">id="btn-glass-pulse"</div>
            </div>

            <div id="feature-card-33" className="imagination-card hover-id-container hover-id-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button id="btn-3d-press" className="btn-showcase btn-3d-press">زر الضغط 3D</button>
              <div className="library-label">id="btn-3d-press"</div>
            </div>

            <div id="feature-card-34" className="imagination-card hover-id-container hover-id-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button id="btn-elegant-outline" className="btn-showcase btn-elegant-outline">الزر الكلاسيكي (Outline)</button>
              <div className="library-label">id="btn-elegant-outline"</div>
            </div>

          </div>

          <h3 style={{ color: '#004c6d', fontSize: '20px', borderBottom: '2px solid rgba(21,180,122,0.3)', paddingBottom: '10px', marginBottom: '20px' }}>
            2. أنماط البطاقات المرجعية (Card Variations)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            <div id="card-glassmorphism-base" className="hover-id-container" style={{ position: 'relative', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 32px rgba(0,76,109,0.1)' }}>
              <h4 style={{ color: '#0b2849', margin: '0 0 10px' }}>البطاقة الزجاجية الأساسية</h4>
              <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.7)', margin: 0 }}>تستخدم في الخلفيات المعقدة.</p>
              <div className="library-label">id="card-glassmorphism-base"</div>
            </div>

            <div id="card-gradient-premium" className="hover-id-container" style={{ position: 'relative', background: 'linear-gradient(135deg, #0b2849 0%, #004c6d 100%)', border: '1px solid rgba(21,180,122,0.3)', borderRadius: '16px', padding: '20px', boxShadow: '0 15px 35px rgba(11,40,73,0.2)' }}>
              <h4 style={{ color: '#ffffff', margin: '0 0 10px' }}>بطاقة التدرج الفاخرة</h4>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>تستخدم لإبراز الإحصائيات الهامة.</p>
              <div className="library-label">id="card-gradient-premium"</div>
            </div>

            <div id="card-eco-success" className="hover-id-container" style={{ position: 'relative', background: 'rgba(21, 180, 122, 0.1)', borderLeft: '4px solid #15b47a', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ color: '#0b2849', margin: '0 0 10px' }}>بطاقة الإشعار الإيجابي (Eco)</h4>
              <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.7)', margin: 0 }}>تستخدم للتأكيدات ونجاح العمليات.</p>
              <div className="library-label">id="card-eco-success"</div>
            </div>

          </div>
        </div>

        {/* ==========================================
            SECTION 1: STANDARD BLUEPRINT
            ========================================== */}
        <h1 id="blueprint-main-title" style={{ color: '#0b2849', fontSize: '42px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>مخطط التصميم (UI Blueprint)</h1>
        <p id="blueprint-main-desc" style={{ color: '#0b2849', fontSize: '18px', textAlign: 'center', marginBottom: '60px' }}>صفحة مخصصة لاختبار المكونات والأزرار والبطاقات مع حركات GSAP</p>

        <h2 style={{ color: '#0b2849', fontSize: '28px', borderBottom: '2px solid #15b47a', paddingBottom: '10px', marginBottom: '30px' }}>البطاقات (Cards)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '80px' }}>

          <GlassCard id="glass-card-1" className="hover-id-container" style={{ padding: '30px', textAlign: 'center' }}>
            <h3 style={{ color: '#0b2849', fontSize: '22px', marginBottom: '15px' }}>GlassCard (Default)</h3>
            <p style={{ color: '#0b2849', fontSize: '16px' }}>Component: <code>&lt;GlassCard&gt;</code></p>
            <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', marginTop: '10px' }}>بطاقة زجاجية شفافة تُستخدم لعرض المحتوى بشكل أنيق.</p>
          </GlassCard>

          <div className="debug-card figma-item-card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: '#0b2849', fontSize: '22px', marginBottom: '15px' }}>Item Card</h3>
            <p style={{ color: '#0b2849', fontSize: '16px' }}>Class: <code>.figma-item-card</code></p>
            <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', marginTop: '10px' }}>بطاقة صلبة مع خلفية بيضاء تُستخدم للدورات والأبحاث.</p>
          </div>

          <div className="debug-card figma-vision-card" style={{ padding: '30px', textAlign: 'center', borderRadius: '24px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '22px', marginBottom: '15px' }}>Vision Card</h3>
            <p style={{ color: '#e2effa', fontSize: '16px' }}>Class: <code>.figma-vision-card</code></p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginTop: '10px' }}>بطاقة ذات خلفية متدرجة داكنة لتمييز الرؤية والأهداف.</p>
          </div>

        </div>

        <h2 style={{ color: '#0b2849', fontSize: '28px', borderBottom: '2px solid #15b47a', paddingBottom: '10px', marginBottom: '30px' }}>الأزرار (Buttons)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'center', marginBottom: '100px' }}>

          <div className="debug-btn-wrapper" style={{ textAlign: 'center' }}>
            <Button variant="gradient">زر متدرج</Button>
            <p style={{ color: '#0b2849', fontSize: '14px', marginTop: '15px' }}><code>variant="gradient"</code></p>
          </div>

          <div className="debug-btn-wrapper" style={{ textAlign: 'center' }}>
            <Button variant="outline">زر محدد</Button>
            <p style={{ color: '#0b2849', fontSize: '14px', marginTop: '15px' }}><code>variant="outline"</code></p>
          </div>

          <div className="debug-btn-wrapper" style={{ textAlign: 'center' }}>
            <Button variant="text">زر نصي</Button>
            <p style={{ color: '#0b2849', fontSize: '14px', marginTop: '15px' }}><code>variant="text"</code></p>
          </div>

          <div className="debug-btn-wrapper" style={{ textAlign: 'center' }}>
            <Button variant="more">المزيد</Button>
            <p style={{ color: '#0b2849', fontSize: '14px', marginTop: '15px' }}><code>variant="more"</code></p>
          </div>

        </div>


        {/* ==========================================
            SECTION 2: IMAGINATION & CONCEPTS SHOWCASE
            ========================================== */}
        <div className="imagination-section" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            استوديو المفاهيم الإبداعية (Concepts Showcase - Part 1)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            مكونات متقدمة تفاعلية تجسد الرؤية المستقبلية للمنصة
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '60px' }}>

            {/* Concept 1: Interactive Learning Path */}
            <div id="feature-card-1" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="glow-dot"></span> خارطة طريق زمالة المناخ والصحة
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '30px' }}>
                مسار تفاعلي معزز بحركات انتقال سلسة للدروس والوحدات
              </p>

              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 10px', marginBottom: '30px' }}>
                <div className="glow-line"></div>
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className={`milestone-node ${selectedMilestone === idx ? 'active' : ''}`}
                    onClick={() => handleMilestoneClick(idx)}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              <div className="milestone-detail" style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(21, 180, 122, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#004c6d' }}>{milestones[selectedMilestone].title}</span>
                  <span style={{ fontSize: '13px', background: 'rgba(21, 180, 122, 0.12)', color: '#15b47a', padding: '2px 8px', borderRadius: '20px' }}>
                    {milestones[selectedMilestone].date}
                  </span>
                </div>
                <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0, color: 'rgba(11, 40, 73, 0.85)' }}>
                  {milestones[selectedMilestone].desc}
                </p>
              </div>
            </div>

            {/* Concept 2: Climate-Health Real-time Visualizer */}
            <div id="feature-card-2" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849', display: 'flex', alignItems: 'center', gap: '10px' }}>
                مؤشرات التأثير المناخي الصحي
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '25px' }}>
                شاشة عرض تفاعلية للبيانات الصحية والبيئية لتأهيل صناع القرار
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button
                  className={`tab-btn ${activeMetric === 'temp' ? 'active' : ''}`}
                  onClick={() => handleMetricTabClick('temp')}
                >
                  الحرارة
                </button>
                <button
                  className={`tab-btn ${activeMetric === 'co2' ? 'active' : ''}`}
                  onClick={() => handleMetricTabClick('co2')}
                >
                  الانبعاثات
                </button>
                <button
                  className={`tab-btn ${activeMetric === 'water' ? 'active' : ''}`}
                  onClick={() => handleMetricTabClick('water')}
                >
                  الموارد المائية
                </button>
              </div>

              <div className="visualizer-screen metric-display">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>البيانات المسجلة</span>
                  <span style={{ fontSize: '12px', background: '#ff4d4d', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    تنبيه حي
                  </span>
                </div>

                <div style={{ fontSize: '48px', fontWeight: 'bold', color: metricsData[activeMetric].color, marginBottom: '8px' }}>
                  {metricsData[activeMetric].val}
                </div>

                <div style={{ fontSize: '15px', opacity: 0.9, lineHeight: '1.4', marginBottom: '15px' }}>
                  {metricsData[activeMetric].label}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', fontSize: '13px', color: '#15b47a', fontWeight: 'bold' }}>
                  تحذير: {metricsData[activeMetric].alert}
                </div>
              </div>
            </div>

            {/* Concept 3: Micro-Interactive Eco Dashboard Alert */}
            <div id="feature-card-3" className="imagination-card hover-id-container" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: '1' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                    استشعار وتفاعل الاستدامة البيئية
                  </h3>
                  <p style={{ fontSize: '15px', color: 'rgba(11, 40, 73, 0.8)', lineHeight: '1.6', marginBottom: '20px' }}>
                    لوحة تفاعلية مصممة خصيصاً للباحثين لربط الأبحاث المنشورة محلياً بمؤشرات أداء الاستجابة. هذه اللوحة
                    تستخدم حركات ميكروية لتبسيط قراءة البيانات المعقدة للمستخدمين.
                  </p>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Button variant="gradient" className="imagination-pulse">تحميل التقرير الكامل</Button>
                    <Button variant="outline">عرض خريطة التلوث</Button>
                  </div>
                </div>

                <div style={{ width: '280px', background: 'rgba(21, 180, 122, 0.08)', border: '2px dashed #15b47a', borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d', marginBottom: '10px' }}>
                    حالة المشاركة البحثية
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15b47a', marginBottom: '5px' }}>
                    +34
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)', margin: 0 }}>
                    مساهمة علمية نشطة هذا الشهر في الوطن العربي
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* ==========================================================
            SECTION 3: MORE IMAGINATION (MAP, QUIZ, & PUBLICATIONS)
            ========================================================== */}
        <div className="imagination-section-2" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مفاهيم تفاعلية متقدمة (Advanced Interactive Concepts - Part 2)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            محاكاة لخارطة السفراء التفاعلية، والدروس المصغرة مع الاختبارات، ومكتبة المنشورات ثلاثية الأبعاد
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '60px' }}>

            {/* Concept 4: Arab Countries Map Hub Mockup */}
            <div id="feature-card-4" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  خريطة شبكة السفراء التفاعلية
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  انقر على الدول في الخريطة المصغرة لاستكشاف مشاريع التغير المناخي والبيئة الجارية
                </p>
              </div>

              <div className="map-interactive-container" style={{ marginBottom: '20px' }}>

                {/* Jordan Node */}
                <div className="country-node" style={{ top: '110px', right: '230px' }} onClick={() => handleCountryClick('Jordan')}>
                  <div className="country-node-dot"></div>
                  {selectedCountry === 'Jordan' && <div className="map-ripple"></div>}
                  <span style={{ fontSize: '11px', color: '#ffffff', marginRight: '8px', fontWeight: 'bold' }}>الأردن</span>
                </div>

                {/* Egypt Node */}
                <div className="country-node" style={{ top: '150px', right: '110px' }} onClick={() => handleCountryClick('Egypt')}>
                  <div className="country-node-dot"></div>
                  {selectedCountry === 'Egypt' && <div className="map-ripple"></div>}
                  <span style={{ fontSize: '11px', color: '#ffffff', marginRight: '8px', fontWeight: 'bold' }}>مصر</span>
                </div>

                {/* Palestine Node */}
                <div className="country-node" style={{ top: '90px', right: '190px' }} onClick={() => handleCountryClick('Palestine')}>
                  <div className="country-node-dot"></div>
                  {selectedCountry === 'Palestine' && <div className="map-ripple"></div>}
                  <span style={{ fontSize: '11px', color: '#ffffff', marginRight: '8px', fontWeight: 'bold' }}>فلسطين</span>
                </div>

                {/* Saudi Arabia Node */}
                <div className="country-node" style={{ top: '200px', right: '270px' }} onClick={() => handleCountryClick('Saudi')}>
                  <div className="country-node-dot"></div>
                  {selectedCountry === 'Saudi' && <div className="map-ripple"></div>}
                  <span style={{ fontSize: '11px', color: '#ffffff', marginRight: '8px', fontWeight: 'bold' }}>السعودية</span>
                </div>

                {/* Grid Overlay for Technical Aesthetics */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none' }}></div>
              </div>

              <div className="map-info-box" style={{ background: 'rgba(21, 180, 122, 0.08)', padding: '16px', borderRadius: '14px', borderRight: '4px solid #15b47a' }}>
                <div style={{ fontWeight: 'bold', color: '#0b2849', fontSize: '16px', marginBottom: '5px' }}>
                  {countriesData[selectedCountry].name}
                </div>
                <div style={{ fontSize: '13px', color: '#004c6d', marginBottom: '8px', fontWeight: 'bold' }}>
                  عدد الممثلين والسفراء: {countriesData[selectedCountry].reps} زميل نشط
                </div>
                <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', color: 'rgba(11, 40, 73, 0.85)' }}>
                  {countriesData[selectedCountry].project}
                </p>
              </div>
            </div>

            {/* Concept 5: LMS Lesson & Instant Quiz Validation */}
            <div id="feature-card-5" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  منصة التعليم والتحقق السريع (Quiz Checkpoint)
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  محاكاة لربط الدرس الطبي باختبار ذكي يتحقق من استيعاب المتدرب للدرس فورياً
                </p>
              </div>

              <div style={{ background: '#f0f6fa', padding: '18px', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#004c6d', fontWeight: 'bold', marginBottom: '8px' }}>
                  سؤال الدورة: ما هو العامل المناخي الأسرع تأثيراً على زيادة انتشار ناقلات الملاريا؟
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="quiz-option" onClick={() => handleQuizAnswer(false)}>
                    أ. ارتفاع مستويات الضوضاء في المدن
                  </button>
                  <button className="quiz-option" onClick={() => handleQuizAnswer(true)}>
                    ب. ارتفاع درجات الحرارة والرطوبة المصاصبة لتقلبات هطول المطر
                  </button>
                  <button className="quiz-option" onClick={() => handleQuizAnswer(false)}>
                    ج. زحف التربة والتصحر الجاف
                  </button>
                </div>
              </div>

              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {quizStatus === 'idle' && (
                  <span style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.5)', fontStyle: 'italic' }}>يرجى اختيار إجابة من الأعلى...</span>
                )}

                {quizStatus === 'correct' && (
                  <div className="quiz-feedback-banner" style={{ background: 'rgba(21, 180, 122, 0.12)', border: '1px solid #15b47a', color: '#15b47a', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
                    تم التحقق بنجاح من إجابتك وتسجيل تقدمك.
                  </div>
                )}

                {quizStatus === 'incorrect' && (
                  <div className="quiz-feedback-banner" style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
                    إجابة غير صحيحة. حاول مرة أخرى لفهم تأثير الرطوبة والحرارة على نواقل الملاريا.
                  </div>
                )}
              </div>
            </div>

            {/* Concept 6: 3D Flip Card Publications Library */}
            <div id="feature-card-6" className="imagination-card hover-id-container" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px', color: '#0b2849' }}>
                    مكتبة المنشورات ثلاثية الأبعاد (3D Publications Library)
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', margin: 0 }}>
                    مرر الماوس فوق أي دراسة بحثية لعرض تفاصيل إضافية عن الباحث وعام النشر بشكل ثلاثي الأبعاد
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>الكل</button>
                  <button className={`tab-btn ${activeCategory === 'climate' ? 'active' : ''}`} onClick={() => setActiveCategory('climate')}>المناخ</button>
                  <button className={`tab-btn ${activeCategory === 'health' ? 'active' : ''}`} onClick={() => setActiveCategory('health')}>الصحة</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {publications
                  .filter(p => activeCategory === 'all' || p.cat === activeCategory)
                  .map((pub, idx) => (
                    <div className="card-3d-scene" key={idx}>
                      <div className="card-3d-inner">

                        {/* Front Side */}
                        <div className="card-3d-face card-3d-front">
                          <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {pub.cat === 'climate' ? 'دراسة مناخية' : pub.cat === 'health' ? 'تقرير صحي' : 'ورقة سياسات'}
                          </span>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0b2849', margin: '10px 0', lineHeight: '1.4' }}>
                            {pub.title}
                          </h4>
                          <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)' }}>
                            مرر للاطلاع على الباحث
                          </span>
                        </div>

                        {/* Back Side */}
                        <div className="card-3d-face card-3d-back">
                          <div>
                            <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold' }}>المؤلف والباحث</span>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0' }}>{pub.author}</div>
                            <span style={{ fontSize: '13px', opacity: 0.8 }}>سنة الإصدار والاعتماد: {pub.year}</span>
                          </div>

                          <Button variant="gradient" style={{ padding: '8px 16px', fontSize: '12px', width: 'fit-content', alignSelf: 'flex-end' }}>
                            تحميل المسودة الطبية (PDF)
                          </Button>
                        </div>

                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>


        {/* ==========================================================
            SECTION 4: ULTIMATE IMAGINATION (CERT, DRAWER & ANALYTICS)
            ========================================================== */}
        <div className="imagination-section-3" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مفاهيم الجيل القادم التفاعلية (Next-Gen UI Engine Showcase - Part 3)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            نظام إصدار شهادات هولوغرافي، لوحة تحكم تفاعلية مع حركات سحب، ورسومات بيانية متحركة بالكامل
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '60px' }}>

            {/* Concept 7: Holographic Certificate Generator */}
            <div id="feature-card-7" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  مولد الشهادات التفاعلي ثنائي الأبعاد
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  أدخل اسمك لتجربة محاكاة إصدار وتوقيع شهادة الاعتماد الطبي المناخي
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                  <input
                    type="text"
                    value={certName}
                    onInput={(e) => setCertName(e.target.value)}
                    placeholder="اسم المتدرب..."
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(11, 40, 73, 0.15)', background: 'rgba(255,255,255,0.7)', fontFamily: "'Tajawal', sans-serif" }}
                  />
                  <input
                    type="email"
                    value={certEmail}
                    onInput={(e) => handleEmailChange(e.target.value)}
                    placeholder="البريد الإلكتروني..."
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(11, 40, 73, 0.15)', background: 'rgba(255,255,255,0.7)', fontFamily: "'Tajawal', sans-serif" }}
                  />
                  <Button variant="gradient" onClick={handleGenerateCertificate} disabled={certGenerating} style={{ width: '100%' }}>
                    {certGenerating ? 'جاري التوقيع...' : 'إصدار الشهادة وحفظها'}
                  </Button>
                </div>
              </div>

              {certGenerated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="cert-paper-mock">
                    <div style={{ textAlign: 'center', color: '#0b2849' }}>
                      <div style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold', color: '#15b47a', marginBottom: '15px' }}>
                        CLIMAMEDIX ACADIFICATE
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: "'Tajawal', sans-serif", marginBottom: '10px' }}>
                        شهادة كفاءة معتمدة
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)', marginBottom: '20px' }}>
                        تُمنح هذه الشهادة رسمياً إلى الممارس الصحي
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#004c6d', marginBottom: '15px', borderBottom: '1px solid #e5d3b3', display: 'inline-block', paddingBottom: '5px' }}>
                        {certName}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.8)' }}>
                        لاجتيازه بنجاح مسار: <br /><strong>{certCourse}</strong>
                      </div>
                    </div>

                    {/* Holographic Seal Stamp with bounce effect */}
                    <div className="cert-stamp">
                      ClimaMedix<br />Verified
                    </div>
                  </div>

                  {/* Verification Reference Link Display */}
                  {verificationLink && (
                    <div style={{ background: 'rgba(21, 180, 122, 0.06)', border: '1px dashed #15b47a', borderRadius: '12px', padding: '15px', marginTop: '10px', textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '6px' }}>
                        رابط التحقق المرجعي للشهادة:
                      </span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={verificationLink}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(11,40,73,0.15)', fontSize: '11px', background: '#fff', color: '#004c6d' }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(verificationLink);
                            alert('تم نسخ رابط التحقق المرجعي للشهادة!');
                          }}
                          style={{ background: '#004c6d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          نسخ
                        </button>
                        <a
                          href={verificationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: '#15b47a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}
                        >
                          فتح
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(11, 40, 73, 0.15)', borderRadius: '12px', background: 'rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '42px', marginBottom: '10px' }}>*</span>
                  <span style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.6)' }}>انقر على زر "إصدار" لمعاينة الشهادة</span>
                </div>
              )}
            </div>

            {/* Concept 8: Opportunities Board & Live Drawer Slider */}
            <div id="feature-card-8" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  قائمة الفرص والزمالات المتاحة
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  تصفح الفرص والمنح الطبية البيئية المنشورة بواسطة لوحة تحكم الإدارة
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {opportunities.map((opp, idx) => (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0b2849' }}>{opp.title}</div>
                        <div style={{ fontSize: '12px', color: '#15b47a', marginTop: '4px' }}>الموعد النهائي: {opp.deadline}</div>
                      </div>
                      <Button variant="more" onClick={() => openOppDrawer(opp)}>تقديم</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide-in Drawer Mockup */}
              {isOppDrawerOpen && (
                <div className="opp-drawer" style={{ position: 'fixed', top: 0, left: 0, width: '450px', height: '100vh', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(15px)', zIndex: 1000, boxShadow: '10px 0 35px rgba(0,0,0,0.15)', borderRight: '1px solid rgba(11, 40, 73, 0.15)', padding: '50px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'translateX(100%)', direction: 'rtl' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                      <span style={{ fontSize: '13px', background: 'rgba(21, 180, 122, 0.12)', color: '#15b47a', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                        {selectedOpp.type}
                      </span>
                      <button onClick={closeOppDrawer} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#0b2849' }}>x</button>
                    </div>

                    <h4 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0b2849', marginBottom: '15px' }}>{selectedOpp.title}</h4>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'rgba(11, 40, 73, 0.8)', marginBottom: '30px' }}>{selectedOpp.desc}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d' }}>الاسم الكامل</label>
                      <input type="text" style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d' }}>البريد الإلكتروني المعتمد</label>
                      <input type="email" style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Button variant="gradient" style={{ flex: 1 }} onClick={closeOppDrawer}>تأكيد وإرسال طلب الالتحاق</Button>
                    <Button variant="outline" onClick={closeOppDrawer}>إلغاء</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Concept 9: Animated SVG Analytics Dashboard Chart */}
            <div id="feature-card-9" className="imagination-card hover-id-container" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px', color: '#0b2849' }}>
                    لوحة تحليل تفاعل المنصة (SVG Analytics Engine)
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', margin: 0 }}>
                    مخطط بياني حي يعرض حجم الزيارات اليومية أو الأسبوعية للطلاب وصانعي السياسات مع حركات انتقال GSAP
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className={`tab-btn ${activeChartFilter === 'week' ? 'active' : ''}`} onClick={() => handleChartFilterChange('week')}>أسبوعي</button>
                  <button className={`tab-btn ${activeChartFilter === 'month' ? 'active' : ''}`} onClick={() => handleChartFilterChange('month')}>شهري</button>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ background: '#f5f8fa', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '18px', padding: '30px 20px 20px', height: '240px', position: 'relative' }}>
                <svg viewBox="0 0 700 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="700" y2="20" stroke="#e5edf2" strokeWidth="1" />
                  <line x1="0" y1="70" x2="700" y2="70" stroke="#e5edf2" strokeWidth="1" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#e5edf2" strokeWidth="1" />

                  {/* Rendering animated Bars */}
                  {chartData[activeChartFilter].map((d, idx) => {
                    const totalBars = chartData[activeChartFilter].length;
                    const barWidth = 40;
                    const space = (700 - (totalBars * barWidth)) / (totalBars + 1);
                    const x = space + idx * (barWidth + space);
                    const maxVal = activeChartFilter === 'week' ? 300 : 800;
                    const height = (d.val / maxVal) * 120;
                    const y = 140 - height;

                    return (
                      <g key={idx}>
                        {/* Interactive Bar */}
                        <rect
                          className="chart-bar"
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          fill="url(#barGradient)"
                          rx="6"
                          style={{ transition: 'all 0.5s ease-out' }}
                        />
                        {/* Text Label */}
                        <text
                          x={x + barWidth / 2}
                          y="155"
                          fill="rgba(11, 40, 73, 0.6)"
                          fontSize="10"
                          textAnchor="middle"
                          style={{ fontFamily: "'Tajawal', sans-serif" }}
                        >
                          {d.label}
                        </text>
                        {/* Value Hover Tooltip Mock */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          fill="#004c6d"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          style={{ fontFamily: "'Tajawal', sans-serif" }}
                        >
                          {d.val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Defs for gradients */}
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15b47a" />
                      <stop offset="100%" stopColor="#004c6d" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

          </div>
        </div>


        {/* ==========================================================
            SECTION 5: MORE IMAGINATION (EVENTS, COMMUNITY, ADMIN)
            ========================================================== */}
        <div className="imagination-section-4" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            أفكار إبداعية حيوية لمشروع ClimaMedix (Part 4)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            تسجيل الفعاليات مع التذاكر، لوحة نقاش مجتمعية حية، ومكتب إدارة المحتوى للمشرفين
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '60px' }}>

            {/* Concept 10: Event Countdown & Ticket Generator */}
            <div id="feature-card-10" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  مكتب تسجيل الفعاليات والندوات الحية
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  تابع العد التنازلي للندوة القادمة واحصل على تذكرتك الطبية المخصصة فوراً
                </p>

                {/* Countdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '25px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0, 76, 109, 0.08)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0b2849' }}>{timeLeft.days}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.6)', marginTop: '2px' }}>يوم</div>
                  </div>
                  <div style={{ background: 'rgba(0, 76, 109, 0.08)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0b2849' }}>{timeLeft.hours}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.6)', marginTop: '2px' }}>ساعة</div>
                  </div>
                  <div style={{ background: 'rgba(0, 76, 109, 0.08)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0b2849' }}>{timeLeft.mins}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.6)', marginTop: '2px' }}>دقيقة</div>
                  </div>
                  <div style={{ background: 'rgba(21, 180, 122, 0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(21, 180, 122, 0.3)' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15b47a' }}>{timeLeft.secs}</div>
                    <div style={{ fontSize: '11px', color: '#15b47a', marginTop: '2px' }}>ثانية</div>
                  </div>
                </div>
              </div>

              {eventRegistered ? (
                <div className="event-ticket-mockup">
                  <div style={{ borderRight: '3px solid #15b47a', paddingRight: '15px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(21, 180, 122, 0.12)', color: '#15b47a', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                      تذكرة حضور معتمدة
                    </span>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0b2849', margin: '10px 0 5px' }}>
                      ندوة: أثر التلوث الجوي على صحة الأطفال
                    </h4>
                    <p style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.6)', margin: 0 }}>
                      الرمز الفريد: CMX-EV-9021
                    </p>
                  </div>
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed rgba(11, 40, 73, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#004c6d', fontWeight: 'bold' }}>المكان: قاعة البث المباشر</span>
                    <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold' }}>الحالة: مسجل بنجاح</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0b2849', fontSize: '15px' }}>مستقبل المستشفيات الخضراء بالشرق الأوسط</div>
                    <div style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.6)', marginTop: '4px' }}>المتحدث: د. خالد البوريني</div>
                  </div>
                  <Button variant="gradient" style={{ width: '100%' }} onClick={handleRegisterEvent}>
                    تسجيل الحضور الفوري وتوليد التذكرة
                  </Button>
                </div>
              )}
            </div>

            {/* Concept 11: Community Discussion Thread */}
            <div id="feature-card-11" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  منتدى النقاش المجتمعي البيئي
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  اطرح الأسئلة وتفاعل مع منشورات زملائك وصوت للمقترحات المهمة
                </p>

                {/* Simulated Post Card */}
                <div style={{ background: '#ffffff', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#004c6d', fontSize: '14px' }}>أ. يمنى مراد</span>
                    <button
                      onClick={handleCommunityVote}
                      className="vote-badge"
                      style={{ background: hasVoted ? '#15b47a' : 'rgba(11, 40, 73, 0.05)', color: hasVoted ? '#ffffff' : '#0b2849', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s ease' }}
                    >
                      تأييد {voteCount}
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.85)', margin: 0, lineHeight: '1.5' }}>
                    كيف يمكننا إدراج موضوعات المناخ في الكليات الطبية المحلية بشكل مبسط للطلبة؟
                  </p>
                </div>

                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '100px', overflowY: 'auto', marginBottom: '20px', paddingLeft: '5px' }}>
                  {comments.map((comment, idx) => (
                    <div key={idx} className="comment-item" style={{ background: 'rgba(21, 180, 122, 0.05)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', borderLeft: '3px solid #15b47a' }}>
                      <strong style={{ color: '#004c6d', display: 'block', marginBottom: '3px' }}>{comment.author}</strong>
                      <span style={{ color: 'rgba(11, 40, 73, 0.8)' }}>{comment.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newCommentText}
                  onInput={(e) => setNewCommentText(e.target.value)}
                  placeholder="اكتب ردك ومساهمتك البيئية..."
                  style={{ flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(11, 40, 73, 0.15)', background: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: "'Tajawal', sans-serif" }}
                />
                <Button type="submit" variant="outline" style={{ padding: '10px 20px' }}>إرسال</Button>
              </form>
            </div>

            {/* Concept 12: Admin Content Moderation Panel */}
            <div id="feature-card-12" className="imagination-card hover-id-container" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px', color: '#0b2849' }}>
                    مكتب المشرف لإدارة وتدقيق طلبات النشر
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', margin: 0 }}>
                    لوحة تحكم إدارية لتدقيق وتمرير الأبحاث والمسودات الطبية المقترحة من قبل مجتمع المنصة
                  </p>
                </div>
                <span style={{ fontSize: '12px', background: '#0b2849', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  لوحة الإشراف
                </span>
              </div>

              {moderationItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {moderationItems.map((item) => (
                    <div
                      key={item.id}
                      className={`mod-item-${item.id}`}
                      style={{ background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '16px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', background: 'rgba(0, 76, 109, 0.08)', color: '#004c6d', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>بواسطة: {item.author}</span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0b2849', margin: '8px 0 0' }}>{item.title}</h4>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          variant="gradient"
                          style={{ padding: '8px 16px', fontSize: '13px', background: '#15b47a' }}
                          onClick={() => handleModerationAction(item.id, 'approve')}
                        >
                          اعتماد ونشر
                        </Button>
                        <Button
                          variant="outline"
                          style={{ padding: '8px 16px', fontSize: '13px', borderColor: '#ff4d4d', color: '#ff4d4d' }}
                          onClick={() => handleModerationAction(item.id, 'reject')}
                        >
                          رفض الطلب
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(21, 180, 122, 0.05)', borderRadius: '16px', border: '1px dashed #15b47a' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15b47a', marginBottom: '5px' }}>
                    قائمة المراجعة فارغة تماماً
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)', margin: 0 }}>
                    لقد قمت بتدقيق واعتماد كافة الملفات والطلبات المعلقة بنجاح.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>


        {/* ==========================================================
            SECTION 6: NEXT-GEN CONCEPTS (LMS SIDEBAR, RESEARCH, PROFILE)
            ========================================================== */}
        <div className="imagination-section-5" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            أدوات الكفاءة والتعليم المتقدمة لمشروع ClimaMedix (Part 5)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            مشغل دروس ذكي مع قائمة الدروس، مستعرض قاعدة بيانات الأبحاث مع النماذج، وملف تفاعلي للإنجازات والأوسمة
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '60px' }}>

            {/* Concept 13: LMS Lesson Player & Interactive Sidebar */}
            <div id="feature-card-13" className="imagination-card hover-id-container" style={{ gridColumn: 'span 2' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: '#0b2849' }}>
                مشغل المساقات ونظام متابعة المحاضرات الطبية
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '25px' }}>
                تصفح المحاضرات العلمية وتفاعل مع مشغل الفيديو والروابط التعليمية المصاحبة لكل درس
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Simulated Video Player */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="video-player-container">
                    {/* Simulated video playback screen */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ffffff', padding: '20px' }}>
                      <span style={{ fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px', marginBottom: '15px' }}>
                        {isVideoPlaying ? 'جاري العرض...' : 'متوقف مؤقتاً'}
                      </span>
                      <h4 style={{ fontSize: '18px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center' }}>
                        {currentLesson}
                      </h4>
                    </div>

                    {/* Timeline bar */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'rgba(255,255,255,0.2)' }}>
                      <div className="video-timeline-indicator" style={{ width: isVideoPlaying ? '45%' : '20%', height: '100%', background: '#15b47a', transition: 'width 0.5s ease' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button variant="gradient" onClick={handlePlayToggle}>
                      {isVideoPlaying ? 'إيقاف مؤقت' : 'تشغيل الدرس'}
                    </Button>
                    <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)' }}>مدة الدرس الكلية: 22 دقيقة</span>
                  </div>
                </div>

                {/* Lessons Sidebar list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d', marginBottom: '5px' }}>
                    محتويات وحدة المناخ والصحة (3 دروس)
                  </div>
                  {courseLessons.map((lesson, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`lesson-nav-btn ${currentLesson === lesson.title ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>{idx + 1}. {lesson.title}</span>
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{lesson.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Concept 14: Dynamic Research Database explorer */}
            <div id="feature-card-14" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px', color: '#0b2849' }}>
                      مستكشف قاعدة بيانات الأبحاث والمسودات
                    </h3>
                    <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', margin: 0 }}>
                      ابحث في الأبحاث والتقارير المعتمدة وقم بتصفيتها حسب المجال
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setIsSubmitPaperOpen(true)}>إضافة ورقة +</Button>
                </div>

                {/* Search box & filter tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onInput={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالعنوان أو الكاتب..."
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.15)', background: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: "'Tajawal', sans-serif" }}
                  />

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`search-filter-tag ${searchTag === 'all' ? 'active' : ''}`} onClick={() => setSearchTag('all')}>الكل</span>
                    <span className={`search-filter-tag ${searchTag === 'water' ? 'active' : ''}`} onClick={() => setSearchTag('water')}>المياه</span>
                    <span className={`search-filter-tag ${searchTag === 'carbon' ? 'active' : ''}`} onClick={() => setSearchTag('carbon')}>الكربون</span>
                    <span className={`search-filter-tag ${searchTag === 'health' ? 'active' : ''}`} onClick={() => setSearchTag('health')}>الأمراض</span>
                  </div>
                </div>

                {/* Research list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {researchPapers
                    .filter(p => searchTag === 'all' || p.tag === searchTag)
                    .filter(p => p.title.includes(searchQuery) || p.author.includes(searchQuery))
                    .map((paper, idx) => (
                      <div key={idx} className="research-paper-item" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(11,40,73,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b2849' }}>{paper.title}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.5)', marginTop: '2px' }}>المؤلف: {paper.author} | {paper.year}</div>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(21, 180, 122, 0.12)', color: '#15b47a', padding: '2px 8px', borderRadius: '10px' }}>
                          {paper.tag === 'water' ? 'مياه' : paper.tag === 'carbon' ? 'انبعاثات' : 'أوبئة'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Submission dialog mockup */}
              {isSubmitPaperOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 40, 73, 0.4)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '30px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0b2849', margin: 0 }}>تقديم ورقة بحثية جديدة للتقييم</h4>
                      <button onClick={() => setIsSubmitPaperOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#0b2849' }}>x</button>
                    </div>

                    <form onSubmit={handleSubmitPaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>عنوان البحث الطبي</label>
                        <input type="text" name="paperTitle" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>اسم الباحث الرئيسي</label>
                        <input type="text" name="paperAuthor" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>التصنيف والوسم</label>
                        <select name="paperTag" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }}>
                          <option value="water">مياه وصحة</option>
                          <option value="carbon">انبعاثات واستدامة</option>
                          <option value="health">أوبئة مناخية</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <Button type="submit" variant="gradient" style={{ flex: 1 }}>إرسال للتدقيق</Button>
                        <Button type="button" variant="outline" onClick={() => setIsSubmitPaperOpen(false)}>إلغاء</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Concept 15: Gamified User Profile & Achievement Dashboard */}
            <div id="feature-card-15" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  الملف الشخصي والتقدم الأكاديمي (Achievements Panel)
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  تابع تقدمك كعضو فاعل في مجتمع سفراء المناخ والصحة وتعرف على أوسمتك
                </p>

                {/* Progress bar rank */}
                <div style={{ background: 'rgba(0, 76, 109, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b2849' }}>سفير المناخ الفضي</span>
                    <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold' }}>75% للذهبي</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(11, 40, 73, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #15b47a, #004c6d)' }}></div>
                  </div>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004c6d', marginBottom: '10px' }}>
                  الأوسمة المتاحة (انقر للاستكشاف)
                </div>

                {/* Badge items */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {badges.map((badge, idx) => (
                    <div key={idx} className="badge-element" onClick={() => handleBadgeClick(badge)}>
                      <div style={{ fontSize: '28px', marginBottom: '5px' }}>*</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2849' }}>{badge.title}</div>
                      <div style={{ fontSize: '10px', color: '#15b47a', marginTop: '2px' }}>{badge.level}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge details section dynamic */}
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {badgeDetail ? (
                  <div className="badge-info-popup" style={{ background: 'rgba(21, 180, 122, 0.08)', border: '1px solid #15b47a', padding: '10px 15px', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
                    <strong>{badgeDetail.title}: </strong>
                    <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.8)' }}>{badgeDetail.desc}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.5)', fontStyle: 'italic' }}>اختر وساماً من الأعلى لعرض متطلبات الإنجاز...</span>
                )}
              </div>
            </div>

          </div>
        </div>


        {/* ==========================================================
            SECTION 7: FUTURE CONCEPTS (CARBON CALCULATOR, I18N SWAPPER, PUSH SIMULATOR)
            ========================================================== */}
        <div className="imagination-section-6" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مستقبل النظم البيئية المتقدمة (Part 6: Future Systems Blueprint)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            حاسبة البصمة الكربونية للمستشفيات، محاكي التوطين والترجمة ثنائي الاتجاه، وجهاز بث الإشعارات المدمج
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>

            {/* Concept 16: Interactive Healthcare Facility Carbon Calculator */}
            <div id="feature-card-16" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  حاسبة البصمة الكربونية للمستشفيات والعيادات
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  أدخل الاستهلاك الشهري لتقدير طن غازات ثاني أكسيد الكربون المنبعثة من منشأتك الصحية
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>الكهرباء (kWh)</label>
                    <input
                      type="number"
                      value={electricityVal}
                      onInput={(e) => setElectricityVal(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.15)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>نفايات طبية (kg)</label>
                    <input
                      type="number"
                      value={wasteVal}
                      onInput={(e) => setWasteVal(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.15)' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#004c6d', display: 'block', marginBottom: '5px' }}>مخدر طبي غازي مستهلك (لتر)</label>
                    <input
                      type="number"
                      value={anestheticVal}
                      onInput={(e) => setAnestheticVal(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.15)' }}
                    />
                  </div>
                </div>

                <Button variant="gradient" style={{ width: '100%', marginBottom: '20px' }} onClick={handleCalculateEmissions}>
                  احسب مؤشر الانبعاثات
                </Button>
              </div>

              {calculatorRan ? (
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(11, 40, 73, 0.1)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b2849', marginBottom: '10px', textAlign: 'center' }}>
                    مجموع الانبعاثات الكلي: {calculatedEmissions.total} كجم من مكافئ ثاني أكسيد الكربون
                  </div>

                  {/* Visual SVG chart breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#004c6d', marginBottom: '3px' }}>
                        <span>غازات التخدير (Scope 1)</span>
                        <strong>{calculatedEmissions.scope1} kg CO2e</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(11, 40, 73, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div className="carbon-bar" style={{ width: `${(calculatedEmissions.scope1 / (calculatedEmissions.total || 1)) * 100}%`, height: '100%', background: '#ff4d4d' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#004c6d', marginBottom: '3px' }}>
                        <span>استهلاك الطاقة الكهربية (Scope 2)</span>
                        <strong>{calculatedEmissions.scope2} kg CO2e</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(11, 40, 73, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div className="carbon-bar" style={{ width: `${(calculatedEmissions.scope2 / (calculatedEmissions.total || 1)) * 100}%`, height: '100%', background: '#ff944d' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#004c6d', marginBottom: '3px' }}>
                        <span>إدارة وتوريد النفايات (Scope 3)</span>
                        <strong>{calculatedEmissions.scope3} kg CO2e</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(11, 40, 73, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div className="carbon-bar" style={{ width: `${(calculatedEmissions.scope3 / (calculatedEmissions.total || 1)) * 100}%`, height: '100%', background: '#15b47a' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(11,40,73,0.15)', borderRadius: '12px', background: 'rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)', fontStyle: 'italic' }}>ادخل البيانات واضغط احسب لبدء المحاكاة...</span>
                </div>
              )}
            </div>

            {/* Concept 17: RTL & Localization Layout Swapper */}
            <div id="feature-card-17" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  محاكي الترجمة والاتجاهات ثنائي اللغة
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  اضغط على تبديل اللغة لمعاينة انسيابية تحويل الكلمات وانجاهات الصفحة فورياً
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  <button className={`tab-btn ${layoutLang === 'ar' ? 'active' : ''}`} onClick={() => handleLanguageSwap('ar')}>العربية (RTL)</button>
                  <button className={`tab-btn ${layoutLang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageSwap('en')}>English (LTR)</button>
                </div>

                <div className="lang-sensitive-wrapper" style={{ direction: layoutLang === 'ar' ? 'rtl' : 'ltr', background: 'rgba(255,255,255,0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', textAlign: layoutLang === 'ar' ? 'right' : 'left' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0b2849', marginBottom: '8px' }}>
                    {layoutLang === 'ar' ? 'تأثير البيئة على صحة الإنسان' : 'Environmental Impact on Human Health'}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.85)', lineHeight: '1.5', margin: 0 }}>
                    {layoutLang === 'ar' ?
                      'تساهم مستويات الحرارة المرتفعة وتلوث الغلاف الجوي بزيادة نسبة الحساسية والأمراض الصدرية المزمنة في دول الشرق الأوسط بشكل متسارع.' :
                      'Rising global temperatures and atmospheric pollution actively accelerate the rates of asthma and chronic respiratory diseases in Middle Eastern countries.'
                    }
                  </p>
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-start' }}>
                    <Button variant="more">
                      {layoutLang === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                    </Button>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold', textAlign: 'center', marginTop: '15px' }}>
                تلميح: يتم تبديل الهوامش تلقائياً دون تداخل البنية البرمجية للمشروع.
              </div>
            </div>

            {/* Concept 18: PWA Web Push Notification Simulator */}
            <div id="feature-card-18" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gridColumn: 'span 2' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  محاكي الإشعارات الفورية والتنبيهات الخلفية (PWA Push Center)
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '25px' }}>
                  اضغط على أي زر لإرسال تنبيه فوري يظهر أعلى نافذة المتصفح كإشعار ذكي
                </p>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="gradient" onClick={() => handleDispatchNotification('opp')}>
                    إطلاق تنبيه زمالة مناخية جديدة
                  </Button>
                  <Button variant="outline" onClick={() => handleDispatchNotification('live')}>
                    إطلاق تنبيه ندوة مستشفيات خضراء
                  </Button>
                </div>
              </div>

              <div style={{ background: 'rgba(21, 180, 122, 0.08)', padding: '16px', borderRadius: '12px', borderRight: '4px solid #15b47a', marginTop: '25px' }}>
                <div style={{ fontSize: '13px', color: '#004c6d', fontWeight: 'bold', marginBottom: '3px' }}>موثوقية البث الخلفي:</div>
                <p style={{ fontSize: '12px', color: 'rgba(11,40,73,0.8)', margin: 0, lineHeight: '1.4' }}>
                  تعتمد هذه التقنية على Service Workers و Push API لإعلام الزملاء والطلاب بالأحداث الهامة حتى في حال إغلاق المتصفح أو التطبيق بالكامل.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================================
            SECTION 8: ULTIMATE CLIMAMEDIX FEATURES (AUTH, OFFLINE, STATS)
            ========================================================== */}
        <div className="imagination-section-7" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مزايا حصرية نهائية (Part 7: Ultimate ClimaMedix Experience)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            بوابة تسجيل دخول متدرجة، إدارة المزامنة في غياب الشبكة، وإحصائيات التأثير المباشر
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>

            {/* Concept 19: Article Reader & Accessibility */}
            <div id="feature-card-19" className="imagination-card hover-id-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0b2849' }}>
                  قارئ المقالات الميسر
                </h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={handleIncreaseFont} style={{ background: 'rgba(21, 180, 122, 0.1)', border: '1px solid #15b47a', borderRadius: '8px', padding: '5px 12px', fontSize: '18px', color: '#15b47a', fontWeight: 'bold', cursor: 'pointer' }}>A+</button>
                  <button onClick={handleDecreaseFont} style={{ background: 'rgba(11, 40, 73, 0.1)', border: '1px solid #0b2849', borderRadius: '8px', padding: '5px 12px', fontSize: '18px', color: '#0b2849', fontWeight: 'bold', cursor: 'pointer' }}>A-</button>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                اختبر تجربة القراءة وتغيير حجم الخطوط لذوي الاحتياجات البصرية
              </p>

              <div style={{ background: 'rgba(255,255,255,0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', maxHeight: '180px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: (18 * textSizeMultiplier) + 'px', color: '#004c6d', marginBottom: '10px', transition: 'font-size 0.3s' }}>العلاقة بين التلوث وأمراض القلب</h4>
                <p style={{ fontSize: (14 * textSizeMultiplier) + 'px', color: '#0b2849', lineHeight: '1.8', transition: 'font-size 0.3s' }}>
                  أثبتت الدراسات الحديثة في الشرق الأوسط أن التعرض المستمر لجسيمات التلوث الدقيقة يزيد من احتمالية الإصابة بأمراض القلب والأوعية الدموية بشكل ملحوظ، مما يحتم ضرورة التحرك السريع لتقليل الانبعاثات الكربونية في البيئات الحضرية.
                </p>
              </div>
            </div>

            {/* Concept 20: Offline Sync Manager */}
            <div id="feature-card-20" className="imagination-card hover-id-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0b2849' }}>
                  مدير المزامنة في غياب الشبكة (Offline Mode)
                </h3>
                <button onClick={handleSyncToggle} style={{ background: isOffline ? '#ff4d4d' : '#15b47a', color: '#ffffff', border: 'none', borderRadius: '20px', padding: '6px 15px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}>
                  {isOffline ? 'مقطوع الاتصال (Offline)' : 'متصل بالشبكة (Online)'}
                </button>
              </div>

              <Button variant="outline" style={{ width: '100%', marginBottom: '15px' }} onClick={handleOfflineAction}>
                {isOffline ? 'إرسال طلب (سيتم حفظه محلياً)' : 'إرسال طلب'}
              </Button>

              {syncStatusMsg && (
                <div style={{ fontSize: '13px', color: '#004c6d', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>
                  {syncStatusMsg}
                </div>
              )}

              <div className="sync-queue-container" style={{ background: 'rgba(0, 76, 109, 0.05)', padding: '15px', borderRadius: '12px', border: '1px dashed rgba(11, 40, 73, 0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', marginBottom: '10px' }}>
                  قائمة الانتظار قيد المزامنة ({syncQueue.length}):
                </div>
                {syncQueue.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>لا يوجد طلبات معلقة.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {syncQueue.map((item, idx) => (
                      <div key={item.id} className="sync-queue-item" style={{ fontSize: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #ff944d' }}>
                        {idx + 1}. {item.title} (مؤجل للإرسال)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Concept 21: Multi-step Auth Flow */}
            <div id="feature-card-21" className="imagination-card hover-id-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0b2849' }}>
                  بوابة التسجيل التفاعلية
                </h3>
                {authStep === 3 && (
                  <button onClick={handleResetAuth} style={{ fontSize: '12px', background: 'none', border: 'none', color: '#15b47a', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>إعادة المحاكاة</button>
                )}
              </div>

              <div className="auth-step-container" style={{ background: 'rgba(255,255,255,0.8)', padding: '25px', borderRadius: '18px', border: '1px solid rgba(11, 40, 73, 0.1)', textAlign: 'center', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {authStep === 1 && (
                  <>
                    <h4 style={{ fontSize: '18px', color: '#0b2849', marginBottom: '15px' }}>أدخل بريدك الإلكتروني الأكاديمي</h4>
                    <input type="email" placeholder="example@university.edu" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(11, 40, 73, 0.2)', marginBottom: '15px', textAlign: 'center', direction: 'ltr' }} />
                    <Button variant="gradient" onClick={handleNextAuthStep}>المتابعة</Button>
                  </>
                )}
                {authStep === 2 && (
                  <>
                    <h4 style={{ fontSize: '18px', color: '#0b2849', marginBottom: '15px' }}>تأكيد الرمز السري OTP</h4>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', direction: 'ltr' }}>
                      {[1, 2, 3, 4].map(i => <input key={i} type="text" maxLength={1} style={{ width: '40px', height: '40px', textAlign: 'center', fontSize: '18px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />)}
                    </div>
                    <Button variant="gradient" onClick={handleNextAuthStep}>تأكيد الدخول</Button>
                  </>
                )}
                {authStep === 3 && (
                  <>
                    <div style={{ fontSize: '40px', color: '#15b47a', marginBottom: '10px' }}>✓</div>
                    <h4 style={{ fontSize: '18px', color: '#15b47a', fontWeight: 'bold' }}>تم تسجيل الدخول بنجاح!</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)', marginTop: '5px' }}>مرحباً بك في منصة كلايما ميدكس.</p>
                  </>
                )}
              </div>
            </div>

            {/* Concept 22: Impact Statistics Counter */}
            <div id="feature-card-22" className="imagination-card hover-id-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0b2849' }}>
                  عداد الأثر والتأثير البيئي الحي
                </h3>
                <Button variant="outline" onClick={startImpactCounter} disabled={statsStarted}>
                  بدء المؤشر
                </Button>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                أرقام إحصائية تتصاعد ديناميكياً لجذب الانتباه في الصفحة الرئيسية.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(21, 180, 122, 0.1)', padding: '20px 10px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15b47a' }}>{displayedStats.learners}+</div>
                  <div style={{ fontSize: '12px', color: '#004c6d', marginTop: '5px', fontWeight: 'bold' }}>طبيب وباحث</div>
                </div>
                <div style={{ background: 'rgba(0, 76, 109, 0.08)', padding: '20px 10px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0b2849' }}>{displayedStats.co2}T</div>
                  <div style={{ fontSize: '12px', color: '#0b2849', marginTop: '5px', fontWeight: 'bold' }}>توفير كربون</div>
                </div>
                <div style={{ background: 'rgba(255, 77, 77, 0.08)', padding: '20px 10px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4d4d' }}>{displayedStats.countries}</div>
                  <div style={{ fontSize: '12px', color: '#ff4d4d', marginTop: '5px', fontWeight: 'bold' }}>دولة مشاركة</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================================
            SECTION 9: MISSING README FEATURES (TEAM, CURRICULUM, SOCIAL, DONUT)
            ========================================================== */}
        <div className="imagination-section-8" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            تغطية كافة وظائف المنصة (Part 8: Full Coverage Engine)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            فريق العمل، منهج الأكاديمية التفاعلي، منصة التواصل الاجتماعي، ومؤشر إنجاز الطالب
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>

            {/* Concept 23: Team Members Carousel */}
            <div id="feature-card-23" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849' }}>
                دليل خبراء المناخ والصحة (فريق العمل)
              </h3>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {teamMembers.map((member, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTeamClick(idx)}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: activeTeamMember === idx ? '2px solid #15b47a' : '1px solid rgba(11,40,73,0.1)', background: activeTeamMember === idx ? 'rgba(21, 180, 122, 0.1)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>{member.name}</div>
                  </button>
                ))}
              </div>

              <div className="team-bio-box" style={{ background: '#ffffff', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '14px', padding: '20px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(0, 76, 109, 0.1)', color: '#004c6d', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                  {teamMembers[activeTeamMember].role}
                </span>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.8)', lineHeight: '1.6', marginTop: '10px', marginBottom: 0 }}>
                  {teamMembers[activeTeamMember].bio}
                </p>
              </div>
            </div>

            {/* Concept 24: Curriculum Accordion */}
            <div id="feature-card-24" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849' }}>
                المنهج الأكاديمي (Curriculum Accordion)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {curriculumModules.map((mod) => (
                  <div key={mod.id} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                    <button
                      onClick={() => handleAccordionClick(mod.id)}
                      style={{ width: '100%', padding: '15px', background: 'none', border: 'none', textAlign: 'right', fontWeight: 'bold', color: '#004c6d', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{mod.title}</span>
                      <span>{activeAccordion === mod.id ? '−' : '+'}</span>
                    </button>
                    {activeAccordion === mod.id && (
                      <div className="accordion-content" style={{ padding: '0 15px 15px', fontSize: '13px', color: 'rgba(11,40,73,0.8)', lineHeight: '1.6' }}>
                        {mod.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Concept 25: Contact Social Hub */}
            <div id="feature-card-25" className="imagination-card hover-id-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849', textAlign: 'center' }}>
                منصة التواصل السريع (Contact Hub)
              </h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px' }}>
                {['واتساب', 'لينكد إن', 'البريد الإلكتروني'].map((social, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setSocialHover(idx)}
                    onMouseLeave={() => setSocialHover(null)}
                    style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #15b47a, #004c6d)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.3s', transform: socialHover === idx ? 'translateY(-5px) scale(1.1)' : 'none', boxShadow: socialHover === idx ? '0 10px 20px rgba(0,76,109,0.2)' : 'none' }}
                  >
                    <span style={{ color: '#fff', fontSize: '20px' }}>{idx === 0 ? 'W' : idx === 1 ? 'in' : '@'}</span>
                    {socialHover === idx && (
                      <div style={{ position: 'absolute', top: '-35px', background: '#0b2849', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        {social}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(11,40,73,0.6)' }}>مرر المؤشر لاكتشاف قنوات التواصل الرسمية</div>
            </div>

            {/* Concept 26: Student Progress Donut */}
            <div id="feature-card-26" className="imagination-card hover-id-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0b2849' }}>
                  مؤشر إنجاز الطالب
                </h3>
                <Button variant="outline" onClick={animateDonut} disabled={donutProgress > 0}>
                  تحديث
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '140px' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(11,40,73,0.1)" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#15b47a"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="314.159"
                    strokeDashoffset={314.159 - (314.159 * donutProgress) / 100}
                    style={{ transition: 'stroke-dashoffset 0.1s' }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0b2849' }}>{donutProgress}%</div>
                  <div style={{ fontSize: '10px', color: 'rgba(11,40,73,0.6)' }}>مكتمل</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================================
            SECTION 10: ADVANCED ENGAGEMENT (MAP, BOT, LIBRARY, THEMES)
            ========================================================== */}
        <div className="imagination-section-9" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            المستويات المتقدمة للتفاعل (Part 9: Supreme Interactivity)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '60px' }}>
            خريطة النقاط الساخنة، المساعد الذكي، مركز التحميل، ومبدل المظاهر
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>

            {/* Concept 27: Interactive Hotspot Map */}
            <div id="feature-card-27" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849' }}>
                خريطة النقاط البيئية الساخنة (Hotspot Tracker)
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '15px' }}>
                انقر على المؤشرات لاستكشاف التحديات الصحية في دول المنطقة.
              </p>
              <div style={{ position: 'relative', background: 'rgba(0, 76, 109, 0.05)', borderRadius: '16px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid rgba(11,40,73,0.1)' }}>
                {/* Simulated Map Silhouette */}
                <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', opacity: 0.1 }}>
                  <path d="M50,100 Q100,50 200,100 T350,100" fill="none" stroke="#0b2849" strokeWidth="20" strokeLinecap="round" />
                </svg>

                {/* Hotspots */}
                <div style={{ position: 'absolute', top: '40%', left: '30%', cursor: 'pointer' }} onClick={() => handleHotspotClick('مصر')}>
                  <div style={{ width: '16px', height: '16px', background: '#ff4d4d', borderRadius: '50%', boxShadow: '0 0 10px #ff4d4d' }}></div>
                  {activeHotspot === 'مصر' && (
                    <div className="hotspot-tooltip" style={{ position: 'absolute', bottom: '25px', right: '-50px', background: '#ffffff', border: '1px solid #ff4d4d', padding: '10px', borderRadius: '8px', width: '150px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff4d4d' }}>دلتا مصر</div>
                      <div style={{ fontSize: '10px', color: '#0b2849' }}>تحذير: ارتفاع منسوب البحر وتلوث المياه الجوفية.</div>
                    </div>
                  )}
                </div>

                <div style={{ position: 'absolute', top: '60%', left: '60%', cursor: 'pointer' }} onClick={() => handleHotspotClick('السعودية')}>
                  <div style={{ width: '16px', height: '16px', background: '#ff944d', borderRadius: '50%', boxShadow: '0 0 10px #ff944d' }}></div>
                  {activeHotspot === 'السعودية' && (
                    <div className="hotspot-tooltip" style={{ position: 'absolute', bottom: '25px', right: '-50px', background: '#ffffff', border: '1px solid #ff944d', padding: '10px', borderRadius: '8px', width: '150px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff944d' }}>الرياض</div>
                      <div style={{ fontSize: '10px', color: '#0b2849' }}>تحدي: عواصف رملية متزايدة وحالات ربو تنفسي.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Concept 28: ClimaBot AI Assistant */}
            <div id="feature-card-28" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849' }}>
                المساعد الطبي الذكي (ClimaBot)
              </h3>
              <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(11,40,73,0.1)', borderRadius: '16px', height: '240px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {botChat.map((msg, i) => (
                    <div key={i} className={i === botChat.length - 1 && msg.sender === 'bot' ? 'bot-msg-new' : ''} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? 'linear-gradient(135deg, #15b47a, #004c6d)' : 'rgba(0, 76, 109, 0.08)', color: msg.sender === 'user' ? '#fff' : '#0b2849', padding: '10px 14px', borderRadius: msg.sender === 'user' ? '14px 14px 0 14px' : '14px 14px 14px 0', fontSize: '12px', maxWidth: '85%', lineHeight: '1.5' }}>
                      {msg.text}
                    </div>
                  ))}
                  {isBotTyping && (
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(0, 76, 109, 0.08)', padding: '10px 14px', borderRadius: '14px 14px 14px 0', fontSize: '12px', color: 'rgba(11,40,73,0.5)' }}>
                      يكتب الآن...
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px', borderTop: '1px solid rgba(11,40,73,0.05)', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleBotQuery('ما هو تأثير ثاني أكسيد الكربون؟')} style={{ flex: 1, fontSize: '11px', padding: '8px', borderRadius: '8px', border: '1px solid #15b47a', background: '#fff', color: '#15b47a', cursor: 'pointer' }}>تأثير CO2؟</button>
                  <button onClick={() => handleBotQuery('ما هي أهداف الأكاديمية؟')} style={{ flex: 1, fontSize: '11px', padding: '8px', borderRadius: '8px', border: '1px solid #004c6d', background: '#fff', color: '#004c6d', cursor: 'pointer' }}>أهداف الأكاديمية؟</button>
                </div>
              </div>
            </div>

            {/* Concept 29: Resource Library Download Center */}
            <div id="feature-card-29" className="imagination-card hover-id-container">
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#0b2849' }}>
                مركز تحميل الموارد (Download Center)
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '15px' }}>
                نموذج تفاعلي يعرض تقدم تحميل الملفات العلمية والإرشادات بصرياً.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[
                  { id: 'doc1', title: 'إرشادات المستشفيات الخضراء 2026', size: '2.4 MB' },
                  { id: 'doc2', title: 'تقرير أثر الجفاف على صحة الأطفال', size: '5.1 MB' }
                ].map(doc => (
                  <div key={doc.id} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '12px', padding: '15px', position: 'relative', overflow: 'hidden' }}>
                    {/* Progress Background */}
                    {downloadProgress.id === doc.id && (
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${downloadProgress.progress}%`, background: 'rgba(21, 180, 122, 0.1)', zIndex: 0, transition: 'width 0.1s' }}></div>
                    )}

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>{doc.title}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.5)', marginTop: '4px' }}>PDF Document • {doc.size}</div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        disabled={downloadProgress.id === doc.id}
                        style={{ background: downloadProgress.id === doc.id ? 'none' : downloadProgress.progress === 100 ? '#15b47a' : '#004c6d', color: downloadProgress.id === doc.id ? '#15b47a' : '#fff', border: downloadProgress.id === doc.id ? 'none' : 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {downloadProgress.id === doc.id
                          ? `${downloadProgress.progress}%`
                          : downloadProgress.progress === 100 ? 'تم التحميل' : 'تحميل'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concept 30: System Theme Swapper */}
            <div className={`imagination-card theme-card ${localTheme === 'eco' ? 'eco-mode' : ''}`} style={{ transition: 'all 0.5s', background: localTheme === 'eco' ? '#0b2849' : 'rgba(255, 255, 255, 0.45)', color: localTheme === 'eco' ? '#ffffff' : '#0b2849', border: localTheme === 'eco' ? '1px solid rgba(21, 180, 122, 0.3)' : '1px solid rgba(255, 255, 255, 0.4)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: localTheme === 'eco' ? '#15b47a' : '#0b2849' }}>
                مبدل المظهر الذكي (Theme Swapper)
              </h3>
              <p style={{ fontSize: '13px', color: localTheme === 'eco' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(11, 40, 73, 0.7)', marginBottom: '25px' }}>
                تجربة تحويل الألوان بين المظهر العيادي (Clinical) والمظهر البيئي (Eco/Dark).
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button
                  onClick={() => localTheme !== 'clinical' && toggleLocalTheme()}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: localTheme === 'clinical' ? '2px solid #004c6d' : '1px solid rgba(255,255,255,0.2)', background: localTheme === 'clinical' ? 'rgba(0, 76, 109, 0.1)' : 'transparent', color: localTheme === 'clinical' ? '#004c6d' : '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Clinical Mode
                </button>
                <button
                  onClick={() => localTheme !== 'eco' && toggleLocalTheme()}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: localTheme === 'eco' ? '2px solid #15b47a' : '1px solid rgba(11,40,73,0.2)', background: localTheme === 'eco' ? 'rgba(21, 180, 122, 0.1)' : 'transparent', color: localTheme === 'eco' ? '#15b47a' : '#0b2849', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Eco Mode (Dark)
                </button>
              </div>

              <div style={{ marginTop: '25px', padding: '15px', borderRadius: '12px', background: localTheme === 'eco' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: '1.6' }}>
                بفضل المتغيرات المتكيفة، تتغير خصائص الحاويات، الظلال، والنصوص فوراً دون الحاجة لإعادة تحميل الصفحة.
              </div>
            </div>

            {/* Concept 31: Geometric Course Carousel */}
            <div id="feature-card-31" className="imagination-card hover-id-container" style={{ gridColumn: '1 / -1', padding: 0, overflow: 'hidden' }}>
              <div ref={slideContainerRef} className="geometric-carousel">
                <img src={coursesData[activeCourseSlide].image} className="course-bg-img" alt={coursesData[activeCourseSlide].title} />

                {/* Triangular Effect Overlay */}
                <div className="triangle-overlay">
                  <span style={{ fontSize: '12px', background: 'rgba(21, 180, 122, 0.2)', border: '1px solid #15b47a', color: '#15b47a', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', marginBottom: '15px', width: 'fit-content' }}>
                    {coursesData[activeCourseSlide].category}
                  </span>
                  <h3 style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', marginBottom: '15px', lineHeight: '1.4', textAlign: 'right' }}>
                    {coursesData[activeCourseSlide].title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', marginBottom: '30px', maxWidth: '480px', textAlign: 'right' }}>
                    {coursesData[activeCourseSlide].desc}
                  </p>
                  <button
                    id="btn-join-course-31"
                    className="btn-showcase btn-neon"
                    onClick={() => setSelectedProgram(coursesData[activeCourseSlide])}
                    style={{ background: '#15b47a', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px #15b47a'}
                    onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                  >
                    سجل في المساق الآن
                  </button>
                </div>

                {/* Navigation Buttons */}
                <button className="carousel-nav-btn prev" onClick={handlePrevCourse}>&lt;</button>
                <button className="carousel-nav-btn next" onClick={handleNextCourse}>&gt;</button>
              </div>
            </div>

            {/* Concept 32: Minimalist Map Window Widget */}
            <GlassCard id="feature-card-32" className="imagination-card hover-id-container" style={{ gridColumn: '1 / -1', padding: '24px', color: '#0b2849' }}>

              {/* Window Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                  </div>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'rgba(11,40,73,0.6)', marginRight: '10px' }}>map_widget_service.json</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15b47a', boxShadow: '0 0 8px #15b47a' }}></span>
                  <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold', fontFamily: 'monospace' }}>API CONNECTED</span>
                </div>
              </div>

              {/* Window Content Layout */}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '20px', flexWrap: 'wrap' }}>

                {/* Left Side (Real Mapbox Map View) */}
                <div style={{ flex: '1.2', minWidth: '320px', position: 'relative', background: '#f4f8f7', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', height: '380px', overflow: 'hidden' }}>

                  {/* Mapbox Container */}
                  <div id="mapbox-map-container" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>

                  {/* Active Tooltip Details */}
                  {activeMapPoint && (
                    <div style={{ position: 'absolute', bottom: '15px', right: '15px', left: '15px', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #15b47a', borderRadius: '8px', padding: '12px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeInUp 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                      <div style={{ direction: 'rtl', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(11, 40, 73, 0.6)' }}>تفاصيل النقطة الجغرافية</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15b47a', marginTop: '2px' }}>{activeMapPoint.name} (LAT: {activeMapPoint.lat}, LNG: {activeMapPoint.lng})</div>
                        <div style={{ fontSize: '12px', color: '#0b2849', marginTop: '4px' }}>{activeMapPoint.details}</div>
                      </div>
                      <button onClick={() => setActiveMapPoint(null)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: '16px', cursor: 'pointer', padding: '5px' }}>&times;</button>
                    </div>
                  )}
                </div>

                {/* Right Side (JSON Editor Panel) */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.8)', fontWeight: 'bold' }}>بيانات الخريطة الجغرافية (JSON Input):</span>
                    {jsonParseError ? (
                      <span style={{ fontSize: '11px', color: '#ff4d4d', fontWeight: 'bold' }}>JSON غير صالح</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold' }}>JSON متطابق ✓</span>
                    )}
                  </div>
                  <textarea
                    value={mapPointsJson}
                    onInput={(e) => setMapPointsJson(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: '260px',
                      background: 'rgba(255,255,255,0.6)',
                      border: jsonParseError ? '1px solid #ff4d4d' : '1px solid rgba(11,40,73,0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#0b2849',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  {jsonParseError && (
                    <div style={{ fontSize: '11px', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,77,77,0.2)' }}>
                      {jsonParseError}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'rgba(11,40,73,0.6)', margin: 0 }}>
                    * عدل إحداثيات خطوط العرض والطول (lat, lng) للنقاط لتغيير مواقعها الجغرافية الحقيقية على الخريطة مباشرة.
                  </p>
                </div>
              </div>

              {/* Map Theme Configurator */}
              <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(11,40,73,0.1)', borderRadius: '12px', padding: '15px' }}>
                <h4 style={{ fontSize: '13px', color: '#0b2849', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '10px', direction: 'ltr', textAlign: 'left' }}>Live Theme Configurator</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', direction: 'ltr' }}>
                  {Object.entries(mapTheme).map(([key, value]) => {
                    let pickerHex = '#ffffff';
                    if (value.startsWith('#') && (value.length === 7 || value.length === 4)) {
                      pickerHex = value;
                    }
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '11px', color: '#15b47a', fontFamily: 'monospace', fontWeight: 'bold' }}>{key}</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={pickerHex}
                            onInput={(e) => setMapTheme(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{ width: '24px', height: '24px', border: '1px solid rgba(11,40,73,0.2)', background: 'none', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                          />
                          <input
                            type="text"
                            value={value}
                            onInput={(e) => setMapTheme(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(11,40,73,0.2)', color: '#0b2849', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </GlassCard>

          </div>
        </div>

        {/* ==========================================
            SECTION 10: OPPORTUNITIES DIRECTORY (AT BOTTOM)
            ========================================== */}
        <div id="section-opportunities-bottom" style={{ marginTop: '80px', marginBottom: '40px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            دليل الفرص والزمالات (Opportunities Directory)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            مكون شبكة الفرص مع الفلترة الحية (المرحلة الأولى من خريطة الطريق)
          </p>
          <OpportunitiesGrid opportunities={opportunities} />
        </div>

        {/* ==========================================
            SECTION 11: EVENTS CALENDAR
            ========================================== */}
        <div id="section-events-bottom" style={{ marginBottom: '40px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            تقويم الفعاليات والندوات (Events Calendar)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            تقويم تفاعلي يعرض الفعاليات والندوات الطبية البيئية
          </p>
          <EventsCalendar
            events={MOCK_EVENTS}
            onRegisterEvent={handleRegisterCalendarEvent}
            registeredEvents={registeredEvents}
          />
        </div>

        {/* ==========================================
            SECTION 12: NEWS FEED
            ========================================== */}
        <div id="section-news-bottom" style={{ marginBottom: '80px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            مركز الأخبار والمقالات (News & Articles Feed)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            آخر مقالات المناخ والصحة والأبحاث الطبية
          </p>
          <NewsFeed
            articles={MOCK_ARTICLES}
            onReadArticle={(art) => setSelectedArticle(art)}
          />
        </div>

        {/* Article Reader Modal */}
        {selectedArticle && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 12, 26, 0.5)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(11, 40, 73, 0.15)',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '30px',
              direction: 'rtl',
              textAlign: 'right',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#0b2849',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  zIndex: 10
                }}
              >
                &times;
              </button>

              <span style={{
                background: 'rgba(21, 180, 122, 0.1)',
                color: '#15b47a',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '15px'
              }}>
                {selectedArticle.category}
              </span>

              <h2 style={{ color: '#0b2849', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', marginTop: 0, lineHeight: '1.4' }}>
                {selectedArticle.title}
              </h2>

              <div style={{ display: 'flex', gap: '15px', color: 'rgba(11, 40, 73, 0.5)', fontSize: '13px', marginBottom: '25px' }}>
                <span>الكاتب: {selectedArticle.author}</span>
                <span>التاريخ: {selectedArticle.date}</span>
              </div>

              <div style={{ color: '#0b2849', fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {selectedArticle.content}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SECTION 13: COMMUNITY NETWORK DIRECTORY
            ========================================== */}
        <div id="section-network-bottom" style={{ marginBottom: '40px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            دليل سفراء وممثلي الدول (Network Directory)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            أعضاء الشبكة والمنسقين المحليين (المرحلة الثانية - متصل بالخريطة التفاعلية)
          </p>
          <NetworkDirectory selectedCountry={selectedCountryName} />
        </div>

        {/* ==========================================
            SECTION 14: LEARNING HUB & LMS DASHBOARD
            ========================================== */}
        <div id="section-lms-bottom" style={{ marginBottom: '40px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            لوحة تحكم التعليم والطلاب (LMS Dashboard)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            متابعة المساقات النشطة والشهادات المكتسبة مع اختبارات الدروس
          </p>
          <LMSDashboard
            enrolledCourses={enrolledCoursesList}
            completedCourses={completedCoursesList}
            onSelectCourse={handleSelectCourse}
            onGenerateCertificate={handleOpenCertificateGenerator}
          />
        </div>

        {/* ==========================================
            SECTION 15: ADMIN CRUD & ANALYTICS
            ========================================== */}
        <div id="section-admin-bottom" style={{ marginBottom: '80px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            لوحة الإشراف والإحصائيات (Admin Control & Analytics)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            إدارة المحتوى وقراءة إحصائيات التفاعل ونمو الطلاب (المرحلة الخامسة)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <AnalyticsDashboard />
            <AdminCRUD />
          </div>
        </div>

        {/* Program Detail Modal Overlay */}
        {selectedProgram && (
          <ProgramDetailModal
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
            onApply={handleEnrollFromProgram}
          />
        )}

        {/* Course LMS Reader Overlay */}
        {activeLearningCourse && (
          <CourseDetailModal
            course={activeLearningCourse}
            onClose={() => setActiveLearningCourse(null)}
            onLessonCompleted={handleLessonCompleted}
          />
        )}

        {/* Certificate Render Overlay */}
        {certRecipientCourse && (
          <CertificateGenerator
            courseTitle={certRecipientCourse}
            onClose={() => setCertRecipientCourse(null)}
          />
        )}

        {/* Certificate Verification Modal */}
        {verificationResult && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 12, 26, 0.6)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '28px',
              border: '2px solid #15b47a',
              maxWidth: '500px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              direction: 'rtl'
            }}>
              <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛡️</div>
              <h3 style={{ color: '#15b47a', fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>
                تم التحقق من صحة الشهادة بنجاح!
              </h3>
              <p style={{ color: 'rgba(11, 40, 73, 0.6)', fontSize: '13px', marginBottom: '20px' }}>
                تحمل هذه الشهادة الرقم المرجعي الموثق في قواعد بيانات كلايما ميدكس
              </p>

              <div style={{ background: 'rgba(21, 180, 122, 0.05)', borderRadius: '16px', padding: '20px', marginBottom: '25px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(21, 180, 122, 0.2)' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>الرقم المرجعي:</span>
                  <strong style={{ fontSize: '14px', color: '#004c6d', display: 'block', fontFamily: 'monospace' }}>{verificationResult.id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>اسم الخريج:</span>
                  <strong style={{ fontSize: '15px', color: '#0b2849', display: 'block' }}>{verificationResult.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>البريد الإلكتروني للمستلم:</span>
                  <strong style={{ fontSize: '14px', color: '#0b2849', display: 'block' }}>{verificationResult.email || 'غير متوفر'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>المسار التدريبي المنجز:</span>
                  <strong style={{ fontSize: '14px', color: '#0b2849', display: 'block' }}>{verificationResult.course}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.5)' }}>الحالة:</span>
                  <span style={{ fontSize: '12px', background: 'rgba(21,180,122,0.15)', color: '#15b47a', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block', marginTop: '4px' }}>✓ معتمد ونشط</span>
                </div>
              </div>

              <Button
                variant="gradient"
                onClick={() => {
                  setVerificationResult(null);
                  const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                  window.history.pushState({ path: cleanUrl }, '', cleanUrl);
                }}
                style={{ padding: '10px 30px', fontSize: '13.5px', width: '100%' }}
              >
                إغلاق النافذة
              </Button>
            </div>
          </div>
        )}


        {/* ===== Play Button Styles Showcase ===== */}
        <div id="section-play-buttons-bottom" style={{ marginBottom: '60px', padding: '40px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 16px 40px rgba(0, 76, 109, 0.08)' }}>
          <h2 style={{ color: '#0b2849', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            خيارات تصميم زر التشغيل (Play Button Styles)
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }}>
            مجموعة من التصاميم المقترحة لزر التشغيل في مشغل الفيديو
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', background: '#0b2849', padding: '50px', borderRadius: '20px', direction: 'ltr' }}>

            {/* Style 1: Premium Teal Gradient */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>Style 1: Gradient Circle</div>
              <button style={{
                width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #15b47a, #004c6d)',
                boxShadow: '0 10px 20px rgba(21, 180, 122, 0.3)',
                color: '#ffffff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(21, 180, 122, 0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(21, 180, 122, 0.3)'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

            {/* Style 2: Glassmorphism Frosted */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>Style 2: Glassmorphic</div>
              <button style={{
                width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                color: '#ffffff',
                transition: 'background 0.2s ease, transform 0.2s ease'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

            {/* Style 3: Neon Outline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>Style 3: Neon Glowing</div>
              <button style={{
                width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: '2px solid #15b47a',
                boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
                color: '#15b47a',
                transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

            {/* Style 4: Minimal Solid Flat */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>Style 4: Solid Modern</div>
              <button style={{
                width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                color: '#004c6d',
                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

          </div>
        </div>
        {/* ===== Audio Players Showcase ===== */}
        <div style={{ width: '100%', marginTop: '60px', padding: '40px', background: '#071829', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '40px', fontFamily: 'monospace' }}>Audio Player Designs (Neon Button Base)</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

            {/* Style 1: Horizontal Pill */}
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <div style={{ color: '#15b47a', fontSize: '14px', fontFamily: 'monospace', marginBottom: '10px' }}>Style 1: Sleek Horizontal Pill</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(21, 180, 122, 0.2)', borderRadius: '50px', padding: '10px 30px 10px 10px', gap: '20px', backdropFilter: 'blur(10px)' }}>
                {/* Neon Button */}
                <button style={{
                  flexShrink: 0, width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '2px solid #15b47a',
                  boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
                  color: '#15b47a', transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                </button>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px' }}>
                    <strong style={{ letterSpacing: '1px' }}>Audio_Track_01.mp3</strong>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>01:24 / 04:30</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '30%', height: '100%', background: '#15b47a', boxShadow: '0 0 10px #15b47a' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Style 2: Glassmorphic Card */}
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ color: '#15b47a', fontSize: '14px', fontFamily: 'monospace', marginBottom: '10px' }}>Style 2: Glassmorphic Stack</div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #15b47a, #004c6d)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(21, 180, 122, 0.3)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '18px' }}>Podcast Episode 12</h4>
                  <p style={{ color: '#15b47a', margin: 0, fontSize: '13px' }}>Climate & Health</p>
                </div>

                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>1:12</span>
                  <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ width: '45%', height: '100%', background: '#15b47a', borderRadius: '3px' }} />
                    <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '-3px', left: '45%', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(21,180,122,0.8)' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>3:45</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>

                  {/* Neon Button */}
                  <button style={{
                    width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '2px solid #15b47a',
                    boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
                    color: '#15b47a', transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                  </button>

                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                </div>
              </div>
            </div>

            {/* Style 3: Circular Ring */}
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <div style={{ color: '#15b47a', fontSize: '14px', fontFamily: 'monospace', marginBottom: '10px', textAlign: 'center' }}>Style 3: Circular Ring</div>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="60" cy="60" r="56" fill="none" stroke="#15b47a" strokeWidth="4" strokeDasharray="351.85" strokeDashoffset="140" style={{ filter: 'drop-shadow(0 0 4px #15b47a)', transition: 'stroke-dashoffset 0.3s ease' }} />
                </svg>

                {/* Neon Button */}
                <button style={{
                  width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '2px solid #15b47a',
                  boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
                  color: '#15b47a', transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease', position: 'relative', zIndex: 2
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
            </div>

            {/* Style 4: Minimal Line */}
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <div style={{ color: '#15b47a', fontSize: '14px', fontFamily: 'monospace', marginBottom: '10px' }}>Style 4: Functional Minimal Line</div>
              <CustomAudioPlayer src="/test-audio.m4a" title="Vance Joy - Riptide" />
            </div>

            {/* Style 5: Floating Action Player */}
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <div style={{ color: '#15b47a', fontSize: '14px', fontFamily: 'monospace', marginBottom: '10px' }}>Style 5: Floating Action Panel</div>
              <div style={{ background: 'linear-gradient(180deg, #0b2849, #071829)', borderRadius: '30px', padding: '10px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(21,180,122,0.3)', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
                {/* Neon Button */}
                <button style={{
                  flexShrink: 0, width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '2px solid #15b47a',
                  boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
                  color: '#15b47a', transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                </button>

                <div style={{ flexGrow: 1, paddingRight: '15px' }}>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Voice Note</div>
                  <div style={{ color: '#15b47a', fontSize: '12px' }}>Playing...</div>
                </div>

                <div style={{ position: 'relative', width: '30px', height: '30px', marginRight: '10px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                    <path style={{ fill: 'none', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 3 }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path style={{ fill: 'none', stroke: '#15b47a', strokeWidth: 3, strokeDasharray: '60, 100' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===== News Feed ===== */}
        <div style={{ width: '100%', marginTop: '60px', direction: 'rtl' }}>
          <NewsFeed articles={MOCK_ARTICLES} />
        </div>

      </div>

      {/* ===== Concept 33: Slide-out Calendar Sidebar ===== */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0b2849, #004c6d)',
          color: '#fff',
          padding: '12px 16px',
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px',
          cursor: 'pointer',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setIsCalendarSidebarOpen(true)}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
        <span style={{ writingMode: 'vertical-rl', padding: '10px 0', letterSpacing: '2px' }}>الفعاليات</span>
      </div>

      {/* Drawer Overlay */}
      {isCalendarSidebarOpen && (
        <div 
          onClick={() => setIsCalendarSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 12, 26, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Drawer Content */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isCalendarSidebarOpen ? 0 : '-450px',
        width: '450px',
        maxWidth: '90vw',
        height: '100vh',
        background: '#f8fafc',
        zIndex: 10001,
        boxShadow: '-5px 0 25px rgba(0,0,0,0.2)',
        transition: 'right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #15b47a, #004c6d)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            تقويم الفعاليات
          </h3>
          <button 
            onClick={() => setIsCalendarSidebarOpen(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '15px', flexGrow: 1, background: '#f8fafc', transform: 'scale(0.95)', transformOrigin: 'top center' }}>
          {isLoadingSidebarEvents ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#0b2849' }}>
              جاري تحميل الفعاليات...
            </div>
          ) : (
            <EventsCalendar 
              events={sidebarEvents} 
              isArabic={true} 
              canManageEvents={false}
            />
          )}
        </div>

        {/* Footer Link */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', background: '#fff' }}>
          <Button 
            variant="outline" 
            style={{ width: '100%', borderColor: '#004c6d', color: '#004c6d' }}
            onClick={() => {
              setIsCalendarSidebarOpen(false);
              window.history.pushState({}, '', '/events');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            عرض صفحة الفعاليات الكاملة
          </Button>
        </div>
      </div>
    </main>
  );
}
