# ClimaMedix LMS — Video Subtitles & Translations Reference

This document serves as the single source of truth for all course subtitles, translations, and transcription pipelines across the ClimaMedix LMS. Refer to this document rather than loading individual `.vtt` files into context.

---

## 1. File Organization & Storage Architecture

| Asset Type | Local / Repo Path | Cloudflare R2 Key Pattern | Content-Type |
| :--- | :--- | :--- | :--- |
| **Arabic Subtitles** | `scripts/subtitles_ar/{code}.vtt` | `subtitles/ar/{code}.vtt` | `text/vtt; charset=utf-8` |
| **English Subtitles** | `scripts/subtitles_en/{code}.vtt` | `subtitles/en/{code}.vtt` | `text/vtt; charset=utf-8` |
| **Whisper Output** | `scripts/whisper_output/ar/{code}.[json\|srt\|vtt]` | — (Local archive) | — |
| **Course Videos** | Source downloads / transcode | `course_videos/{code}.mp4` | `video/mp4` |

---

## 2. Master Curriculum & Video Catalog (30 Lessons)

**Course:** `زمالة إعداد المثقف الصحي: التغير المناخي وصحة المجتمع` (`0509ec71-4043-43d4-9865-b3bca0510458`)

### Module 1: أسس التثقيف الصحي والتغير المناخي
**Module ID:** `66666666-6666-6666-6666-666666666601` | **Total Lessons:** 5

| Code | Seq | Lesson Title (AR) | Lesson Title (EN) | Duration | R2 Subtitle Key |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `m1v1` | 1 | رسم خارطة الأثر الصحي المجتمعي | Mapping Community Health Impact | 04:36 | `subtitles/ar/m1v1.vtt` |
| `m1v2` | 2 | سيكولوجية السلوك وتحديات الإجهاد الحراري | Behavioral Psychology & Heat Stress Challenges | 08:02 | `subtitles/ar/m1v2.vtt` |
| `m1v3` | 3 | استراتيجيات التواصل الفعال ونقل الرسالة الصحية | Effective Health Communication Strategies | 05:55 | `subtitles/ar/m1v3.vtt` |
| `m1v4` | 4 | تفكيك مبادئ الاتصال التفاعلي وصناعة التغيير | Interactive Communication & Behavior Change | 05:25 | `subtitles/ar/m1v4.vtt` |
| `m1v5` | 5 | أخلاقيات التثقيف الصحي والمسؤولية المجتمعية | Ethics in Health Education & Professional Responsibility | 05:44 | `subtitles/ar/m1v5.vtt` |

---

### Module 2: المحددات الاجتماعية والعدالة الصحية
**Module ID:** `66666666-6666-6666-6666-666666666602` | **Total Lessons:** 9

| Code | Seq | Lesson Title (AR) | Lesson Title (EN) | Duration | R2 Subtitle Key |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `m2v1` | 1 | التحول من الرعاية السريرية إلى صحة المجتمع | Transitioning from Clinical Care to Population Health | 05:32 | `subtitles/ar/m2v1.vtt` |
| `m2v2` | 2 | المحددات الاجتماعية والبيئية للصحة | Social & Environmental Determinants of Health | 06:18 | `subtitles/ar/m2v2.vtt` |
| `m2v3` | 3 | تكافؤ الفرص وتفاوت مستويات الرعاية الصحية | Equal Opportunity & Healthcare Disparities | 05:07 | `subtitles/ar/m2v3.vtt` |
| `m2v4` | 4 | الفرق الجوهري بين المساواة والإنصاف الصحي | Equality vs Health Equity | 05:43 | `subtitles/ar/m2v4.vtt` |
| `m2v5` | 5 | استعارة النهر: التفكير الوقائي الاستباقي | Upstream Prevention: The River Metaphor | 06:17 | `subtitles/ar/m2v5.vtt` |
| `m2v6` | 6 | هندسة التدخلات الصحية المجتمعية وتطبيقها | Designing Community Health Interventions | 05:57 | `subtitles/ar/m2v6.vtt` |
| `m2v7` | 7 | البعد الإنساني للتغير المناخي وكسر الصور النمطية | The Human Face of Climate Change Beyond Stereotypes | 06:33 | `subtitles/ar/m2v7.vtt` |
| `m2v8` | 8 | الأثر الفردي وصناعة القيادة المجتمعية في المناخ | Individual Agency & Climate Health Leadership | 05:35 | `subtitles/ar/m2v8.vtt` |
| `m2v9` | 9 | المنظور الوبائي والتحليل السببي للأمراض | The Epidemiological Lens & Causal Disease Analysis | 07:44 | `subtitles/ar/m2v9.vtt` |

---

### Module 3: التغير المناخي والأمراض والبيئة
**Module ID:** `66666666-6666-6666-6666-666666666603` | **Total Lessons:** 7

| Code | Seq | Lesson Title (AR) | Lesson Title (EN) | Duration | R2 Subtitle Key |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `m3v1` | 1 | مقدمة في الأمراض المنقولة بالنواقل والمناخ | Vector-Borne Diseases & Climate Intro | 04:54 | `subtitles/ar/m3v1.vtt` |
| `m3v2` | 2 | التغير البيئي وتكاثر النواقل الحشرية | Environmental Shifts & Vector Breeding | 05:58 | `subtitles/ar/m3v2.vtt` |
| `m3v3` | 3 | الأمراض المنقولة بالمياه وتلوث المصادر | Waterborne Diseases & Source Contamination | 05:50 | `subtitles/ar/m3v3.vtt` |
| `m3v4` | 4 | جودة الهواء والأمراض الصدرية المزمنة | Air Quality & Chronic Respiratory Illness | 05:54 | `subtitles/ar/m3v4.vtt` |
| `m3v5` | 5 | تأثير درجات الحرارة على سلامة الغذاء | Thermal Extremes & Food Safety | 05:09 | `subtitles/ar/m3v5.vtt` |
| `m3v6` | 6 | حماية الفئات الأكثر عرضة للمخاطر | Protecting High-Risk Vulnerable Groups | 04:52 | `subtitles/ar/m3v6.vtt` |
| `m3v7` | 7 | خطط التدخل والتوعية الميدانية للوقاية | Field Intervention & Prevention Roadmaps | 05:16 | `subtitles/ar/m3v7.vtt` |

---

### Module 4: بناء الصمود والاستجابة الصحية الميدانية
**Module ID:** `66666666-6666-6666-6666-666666666604` | **Total Lessons:** 9

| Code | Seq | Lesson Title (AR) | Lesson Title (EN) | Duration | R2 Subtitle Key |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `m4v1` | 1 | مبادئ الصمود المجتمعي في الأزمات المناخية | Community Resilience in Climate Emergencies | 06:23 | `subtitles/ar/m4v1.vtt` |
| `m4v2` | 2 | تقييم جاهزية المراكز الصحية الأولية | Primary Health Facility Readiness Assessment | 06:35 | `subtitles/ar/m4v2.vtt` |
| `m4v3` | 3 | أنظمة الإنذار المبكر والتنبؤ بالمخاطر | Early Warning Systems & Risk Forecasting | 06:13 | `subtitles/ar/m4v3.vtt` |
| `m4v4` | 4 | إدارة الطوارئ الحرارية والكوارث البيئية | Thermal Emergency & Disaster Management | 05:57 | `subtitles/ar/m4v4.vtt` |
| `m4v5` | 5 | التنسيق بين الفرق الصحية والجهات المحلية | Cross-Sector Collaboration & Local Authority Action | 05:36 | `subtitles/ar/m4v5.vtt` |
| `m4v6` | 6 | استراتيجيات التواصل في أوقات الأزمات | Crisis Communication Strategies | 05:24 | `subtitles/ar/m4v6.vtt` |
| `m4v7` | 7 | الدعم النفسي والاجتماعي للمتضررين | Psychosocial Support for Affected Communities | 06:04 | `subtitles/ar/m4v7.vtt` |
| `m4v8` | 8 | توثيق وتقييم الأثر الميداني للتدخلات | Documenting & Measuring Field Impact | 06:29 | `subtitles/ar/m4v8.vtt` |
| `m4v9` | 9 | خطة العمل المستقبلية والقيادة الصحية | Future Action Planning & Health Leadership | 05:41 | `subtitles/ar/m4v9.vtt` |

---

## 3. Transcription & Ingestion Workflow

1. **Model:** OpenAI Whisper `large-v3` running with PyTorch CUDA (NVIDIA GeForce RTX 3060 12GB GDDR6).
2. **Dialect Conditioning:** The master conditioning prompt preserves conversational Levantine/Palestinian dialect phrasing (e.g., `بدنا نفهم المتلقي`, `ورشة بناء`, `مثلث محددات السلوك`).
3. **Format Standard:** Strict WebVTT (`.vtt`) format:
   ```vtt
   WEBVTT

   1
   00:00:01.200 --> 00:00:04.500
   مرحباً بكم في زمالة التثقيف الصحي وتغير المناخ.
   ```
4. **Cloudflare R2 Ingestion:**
   - Uploaded to Cloudflare R2 bucket (`climamedix`).
   - Prefix: `subtitles/ar/{code}.vtt`.
   - Headers: `ContentType: 'text/vtt; charset=utf-8'`, `CacheControl: 'no-cache, max-age=0'`.

---

## 4. Frontend Web Player Integration

- **Component:** `src/features/learning-hub/components/player/CustomVideoPlayer.jsx`.
- **Parser:** `src/utils/subtitleParser.js` (`parseSubtitles(vttText)` & `getActiveCue(cues, currentTime)`).
- **User Preference:** Stored in browser `localStorage.getItem('lms_cc_pref')` (`'ar'`, `'en'`, or `'off'`).
