# ClimaMedix — M3 & M4 Subtitle Refinement Progress Tracker
**Course:** زمالة إعداد المثقف الصحي: التغير المناخي وصحة المجتمع (`0509ec71-4043-43d4-9865-b3bca0510458`)  
**Standard:** Easy MSA (فصحى ميسرة فصيحة ودافئة) — Eliminating Whisper hallucinations & colloquial Levant slang while maintaining exact cues and timings.  
**Pipeline Standard:** 4 iterative refinement passes per lesson ➔ Upload immediately to Cloudflare R2 (`subtitles/ar/{code}.vtt`).

---

## Reusable Upload Pipeline
* **Script Location:** `scripts/upload_single_to_r2.mjs` (present on both local and remote `desktop`)
* **Execution:**
  ```bash
  # Sync refined file to remote PC
  scp .\subtitles_ar\<code\>.vtt desktop:C:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/<code\>.vtt
  
  # Upload directly to Cloudflare R2
  ssh desktop "cd C:\Users\CLICK\Desktop\climamedix-pwa && node scripts/upload_single_to_r2.mjs <code\>"
  ```
* **R2 Target Key:** `subtitles/ar/{code}.vtt`
* **Headers:** `ContentType: text/vtt; charset=utf-8`, `CacheControl: no-cache, max-age=0`
* **Public URL Base:** `https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/{code}.vtt`

---

## Module 3: التغير المناخي والأمراض والبيئة (7 Lessons)
| Code | Title (AR) | Duration | Status | Cloudflare R2 Public Link |
| :---: | :--- | :---: | :---: | :--- |
| `m3v1` | مقدمة في علوم المناخ (الفرق بين الطقس والمناخ) | 04:54 | 🟢 Completed & Uploaded | [m3v1.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v1.vtt) |
| `m3v2` | نظام المناخ وميزانية طاقة الأرض وحلقات التغذية الراجعة | 05:58 | 🟢 Completed & Uploaded | [m3v2.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v2.vtt) |
| `m3v3` | ظاهرة الاحتباس الحراري الطبيعي والمعزز | 05:50 | 🟢 Completed & Uploaded | [m3v3.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v3.vtt) |
| `m3v4` | كيمياء الغلاف الجوي وغازات الدفيئة الأربعة الكبرى | 05:54 | 🟢 Completed & Uploaded | [m3v4.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v4.vtt) |
| `m3v5` | القطاعات المسؤولة عن الانبعاثات وأثرها الصحي | 05:09 | 🟢 Completed & Uploaded | [m3v5.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v5.vtt) |
| `m3v6` | الأدلة الفيزيائية والرصدية لتغير المناخ | 04:52 | 🟢 Completed & Uploaded | [m3v6.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v6.vtt) |
| `m3v7` | تفاعل أغلفة الأرض وأثرها المتسلسل على صحة المجتمع | 05:16 | 🟢 Completed & Uploaded | [m3v7.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m3v7.vtt) |

---

## Module 4: بناء الصمود والاستجابة الصحية الميدانية (9 Lessons)
| Code | Title (AR) | Duration | Status | Cloudflare R2 Public Link |
| :---: | :--- | :---: | :---: | :--- |
| `m4v1` | مدخل إلى الأثر الصحي: من تغير الكوكب إلى صحة الإنسان | 06:23 | 🟢 Completed & Uploaded | [m4v1.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v1.vtt) |
| `m4v2` | الأثر الفسيولوجي لارتفاع درجات الحرارة وموجات الحر | 06:35 | 🟢 Completed & Uploaded | [m4v2.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v2.vtt) |
| `m4v3` | تلوث الهواء والجسيمات الدقيقة وأثرها القلبي الرئوي | 06:13 | 🟢 Completed & Uploaded | [m4v3.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v3.vtt) |
| `m4v4` | الأوبئة والأمراض المعدية الحساسة للمناخ ومنظور الصحة الواحدة | 05:57 | 🟢 Completed & Uploaded | [m4v4.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v4.vtt) |
| `m4v5` | المياه والإصحاح البيئي والنظافة الصحية (WASH) في الأزمات المناخية | 05:36 | 🟢 Completed & Uploaded | [m4v5.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v5.vtt) |
| `m4v6` | الأمن الغذائي والتغذية وتداعيات المناخ على صحة الأطفال | 05:24 | 🟢 Completed & Uploaded | [m4v6.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v6.vtt) |
| `m4v7` | الصحة النفسية وتداعيات المناخ: القلق المناخي والسولستالجيا | 06:04 | 🟢 Completed & Uploaded | [m4v7.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v7.vtt) |
| `m4v8` | صحة الأمهات والأطفال وحديثي الولادة في مواجهة الصدمات المناخية | 06:29 | 🟢 Completed & Uploaded | [m4v8.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v8.vtt) |
| `m4v9` | دمج المناخ في الممارسة الميدانية والأنظمة الصحية المرنة | 05:41 | 🟢 Completed & Uploaded | [m4v9.vtt](https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev/subtitles/ar/m4v9.vtt) |
