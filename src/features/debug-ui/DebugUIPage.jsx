import { useEffect, useRef, useState } from 'preact/hooks';
import gsap from 'gsap';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';
import leftSvg from '../../assets/left-svg.svg';
import rightSvg from '../../assets/right-svg.svg';
import homeBg from '../../assets/bg_1.png';
import training1 from '../../assets/training_1.png';
import training2 from '../../assets/training_2.png';
import training3 from '../../assets/training_3.png';
import training4 from '../../assets/training_4.png';

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
  const [certCourse, setCertCourse] = useState('زمالة VSCHEF للمناخ والصحة');
  const [certGenerating, setCertGenerating] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);

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
  const [botChat, setBotChat] = useState([ { sender: 'bot', text: 'أهلاً بك! كيف يمكنني مساعدتك في مجال المناخ والصحة؟' } ]);
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

  // State for Concept 32: Minimalist Map Window Widget (using Leaflet Map API)
  const [mapPointsJson, setMapPointsJson] = useState(JSON.stringify({
    "excludedCountries": ["israel"],
    "points": [
      { "id": "loc1", "name": "القدس", "lat": 31.7683, "lng": 35.2137, "status": "critical", "details": "العاصمة التاريخية والأثرية لفلسطين" },
      { "id": "loc2", "name": "غزة", "lat": 31.5016, "lng": 34.4668, "status": "critical", "details": "شح مائي حاد وأضرار بيئية في البنية التحتية" },
      { "id": "loc3", "name": "رام الله", "lat": 31.9029, "lng": 35.2062, "status": "warning", "details": "تراجع منسوب المياه الجوفية والزراعية" },
      { "id": "loc4", "name": "حيفا", "lat": 32.7940, "lng": 34.9896, "status": "warning", "details": "تلوث الهواء الصناعي الساحلي" }
    ]
  }, null, 2));

  const [activeMapPoint, setActiveMapPoint] = useState(null);
  const [jsonParseError, setJsonParseError] = useState(null);
  const [parsedMapPoints, setParsedMapPoints] = useState([]);
  const [excludedCountries, setExcludedCountries] = useState([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

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

  // Load Leaflet Script and CSS dynamically
  useEffect(() => {
    let link = document.querySelector('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (window.L) {
      setLeafletLoaded(true);
    } else {
      let script = document.querySelector('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => setLeafletLoaded(true);
        document.head.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if (window.L) {
            setLeafletLoaded(true);
            clearInterval(checkL);
          }
        }, 100);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize Map and Render Markers & Masks
  useEffect(() => {
    if (!leafletLoaded) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map('leaflet-map-container', { zoomControl: false }).setView([28.0, 38.0], 5);
      
      // CartoDB Dark Matter Tile Layer (Premium Minimalist Dark Map)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);

      // Re-add Zoom control to top-right
      window.L.control.zoom({ position: 'topright' }).addTo(mapInstanceRef.current);
    }

    // Clear old markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];



    // Add new markers
    if (Array.isArray(parsedMapPoints)) {
      parsedMapPoints.forEach(pt => {
        if (typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          const markerColor = pt.status === 'critical' ? '#ff4d4d' : '#15b47a';
          
          // DivIcon with pulse effect
          const customIcon = window.L.divIcon({
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
                <div class="map-pulse-${pt.status || 'warning'}" style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: ${pt.status === 'critical' ? 'rgba(255, 77, 77, 0.4)' : 'rgba(21, 180, 122, 0.4)'}; animation: mapRingPulse 2s infinite;"></div>
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${markerColor}; border: 2px solid #fff; box-shadow: 0 0 10px ${markerColor}; z-index: 10;"></div>
              </div>
            `,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = window.L.marker([pt.lat, pt.lng], { icon: customIcon })
            .addTo(mapInstanceRef.current);

          marker.on('click', () => {
            setActiveMapPoint(pt);
          });

          markersRef.current.push(marker);
        }
      });
    }
  }, [leafletLoaded, parsedMapPoints, excludedCountries]);

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

  // Holographic Certificate Generation Anim
  const handleGenerateCertificate = () => {
    setCertGenerating(true);
    setCertGenerated(false);

    setTimeout(() => {
      setCertGenerating(false);
      setCertGenerated(true);

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

  return (
    <main ref={containerRef} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', padding: '160px 20px 80px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      
      {/* CSS Stylesheet Injector for Premium Aesthetics */}
      <style dangerouslySetInnerHTML={{__html: `
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
          
          <GlassCard id="glass-card-1" className="hover-id-container" className="debug-card" style={{ padding: '30px', textAlign: 'center' }}>
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

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  <input 
                    type="text" 
                    value={certName}
                    onInput={(e) => setCertName(e.target.value)}
                    placeholder="اسم المتدرب..."
                    style={{ flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(11, 40, 73, 0.15)', background: 'rgba(255,255,255,0.7)', fontFamily: "'Tajawal', sans-serif" }}
                  />
                  <Button variant="gradient" onClick={handleGenerateCertificate} disabled={certGenerating}>
                    {certGenerating ? 'جاري التوقيع...' : 'إصدار'}
                  </Button>
                </div>
              </div>

              {certGenerated ? (
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
                      {[1,2,3,4].map(i => <input key={i} type="text" maxLength={1} style={{ width: '40px', height: '40px', textAlign: 'center', fontSize: '18px', borderRadius: '8px', border: '1px solid rgba(11, 40, 73, 0.2)' }} />)}
                    </div>
                    <Button variant="gradient" onClick={handleNextAuthStep}>تأكيد الدخول</Button>
                  </>
                )}
                {authStep === 3 && (
                  <>
                    <div style={{ fontSize: '40px', color: '#15b47a', marginBottom: '10px' }}>✓</div>
                    <h4 style={{ fontSize: '18px', color: '#15b47a', fontWeight: 'bold' }}>تم تسجيل الدخول بنجاح!</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.7)', marginTop: '5px' }}>مرحباً بك في منصة كليما ميديكس.</p>
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
                  <button id="btn-join-course-31" className="btn-showcase btn-neon" style={{ background: '#15b47a', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px #15b47a'} onMouseLeave={(e) => e.target.style.boxShadow = 'none'}>
                    سجل في المساق الآن
                  </button>
                </div>

                {/* Navigation Buttons */}
                <button className="carousel-nav-btn prev" onClick={handlePrevCourse}>&lt;</button>
                <button className="carousel-nav-btn next" onClick={handleNextCourse}>&gt;</button>
              </div>
            </div>

            {/* Concept 32: Minimalist Map Window Widget */}
            <div id="feature-card-32" className="imagination-card hover-id-container" style={{ gridColumn: '1 / -1', background: 'rgba(10, 25, 47, 0.95)', border: '1px solid rgba(21, 180, 122, 0.3)', color: '#fff', padding: '24px' }}>
              
              {/* Window Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                  </div>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', marginRight: '10px' }}>map_widget_service.json</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15b47a', boxShadow: '0 0 8px #15b47a' }}></span>
                  <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold', fontFamily: 'monospace' }}>API CONNECTED</span>
                </div>
              </div>

              {/* Window Content Layout */}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* Left Side (Real Leaflet Map View) */}
                <div style={{ flex: '1.2', minWidth: '320px', position: 'relative', background: '#0a192f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', height: '380px', overflow: 'hidden' }}>
                  
                  {/* Leaflet Container */}
                  <div id="leaflet-map-container" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>

                  {/* Active Tooltip Details */}
                  {activeMapPoint && (
                    <div style={{ position: 'absolute', bottom: '15px', right: '15px', left: '15px', background: 'rgba(10, 25, 47, 0.95)', border: '1px solid #15b47a', borderRadius: '8px', padding: '12px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeInUp 0.3s' }}>
                      <div style={{ direction: 'rtl', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>تفاصيل النقطة الجغرافية</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15b47a', marginTop: '2px' }}>{activeMapPoint.name} (LAT: {activeMapPoint.lat}, LNG: {activeMapPoint.lng})</div>
                        <div style={{ fontSize: '12px', color: '#fff', marginTop: '4px' }}>{activeMapPoint.details}</div>
                      </div>
                      <button onClick={() => setActiveMapPoint(null)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: '16px', cursor: 'pointer', padding: '5px' }}>&times;</button>
                    </div>
                  )}
                </div>

                {/* Right Side (JSON Editor Panel) */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>بيانات الخريطة الجغرافية (JSON Input):</span>
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
                      background: 'rgba(0,0,0,0.3)', 
                      border: jsonParseError ? '1px solid #ff4d4d' : '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      padding: '12px', 
                      color: '#00ffcc', 
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
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    * عدل إحداثيات خطوط العرض والطول (lat, lng) للنقاط لتغيير مواقعها الجغرافية الحقيقية على الخريطة مباشرة.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
