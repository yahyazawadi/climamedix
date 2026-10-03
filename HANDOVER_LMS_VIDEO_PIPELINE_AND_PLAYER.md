# Master Handover: ClimaMedix LMS Video Pipeline & Player Integration

**Project**: ClimaMedix PWA (`yahyazawadi/climamedix`)  
**Date**: October 3, 2026  
**Target Course**: `0509ec71-4043-43d4-9865-b3bca0510458` (الماجستير المصغر في التغير المناخي والصحة العامة / Mini-Masterclass: Climate Change & Public Health)  
**Production / Test Environment**: Dev server running on `http://localhost:9090`

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Storage ["Cloudflare R2 Bucket (climamedix)"]
        V[course_videos/m{X}v{Y}.mp4<br/>14x 4K HEVC + FastStart]
        SAR[subtitles/ar/m{X}v{Y}.vtt<br/>14x Arabic WebVTT]
        SEN[subtitles/en/m{X}v{Y}.vtt<br/>14x English WebVTT]
    end

    subgraph Database ["Supabase PostgreSQL"]
        C[courses table<br/>0509ec71-4043-43d4-9865-b3bca0510458]
        M[modules table<br/>Module 1: 5 lessons<br/>Module 2: 9 lessons]
        L[lessons table<br/>video_url, duration, sequence_order,<br/>content_ar, content_en]
        WM[lesson_watch_metrics<br/>furthestSecond, maxPercentage, actualPlayDuration]
        C --> M --> L
    end

    subgraph Frontend ["React / Preact Client"]
        CDM[CourseDetailModal.jsx]
        CVP[CustomVideoPlayer.jsx<br/>(Rendered at top of lesson)]
        RTR[RichTextRenderer.jsx<br/>(Rendered below video player)]
        SP[subtitleParser.js<br/>(Bilingual RTL/LTR cue display)]
        
        CDM --> CVP
        CDM --> RTR
        CVP --> SP
    end

    V -.->|HTTPS Byte-Range Streaming| CVP
    SAR -.->|Fetch .vtt| SP
    SEN -.->|Fetch .vtt| SP
    L -.->|fetchCourseSyllabus| CDM
    CVP -.->|Telemetry flush| WM
```

---

## 2. Media Asset Ingestion & Cloudflare R2

All 14 master course lessons have been processed, optimized with hardware-accelerated H.265/HEVC encoding, containerized with FastStart flags, and uploaded to Cloudflare R2 along with 28 WebVTT subtitle files.

* **Cloudflare R2 Bucket**: `climamedix`
* **Public CDN URL**: `https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev`
* **Direct Access Pattern**:
  * Videos: `${VITE_R2_PUBLIC_URL}/course_videos/m{X}v{Y}.mp4`
  * Arabic Subtitles: `${VITE_R2_PUBLIC_URL}/subtitles/ar/m{X}v{Y}.vtt`
  * English Subtitles: `${VITE_R2_PUBLIC_URL}/subtitles/en/m{X}v{Y}.vtt`

### Verified Media Inventory

| Module & Lesson | Video Key (`course_videos/`) | Probed Duration | Arabic CC | English CC | Status on R2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1-L1** | `m1v1.mp4` | 04:36 (276s) | `subtitles/ar/m1v1.vtt` | `subtitles/en/m1v1.vtt` | `Uploaded (200 OK)` |
| **M1-L2** | `m1v2.mp4` | 08:02 (482s) | `subtitles/ar/m1v2.vtt` | `subtitles/en/m1v2.vtt` | `Uploaded (200 OK)` |
| **M1-L3** | `m1v3.mp4` | 05:55 (355s) | `subtitles/ar/m1v3.vtt` | `subtitles/en/m1v3.vtt` | `Uploaded (200 OK)` |
| **M1-L4** | `m1v4.mp4` | 05:25 (325s) | `subtitles/ar/m1v4.vtt` | `subtitles/en/m1v4.vtt` | `Uploaded (200 OK)` |
| **M1-L5** | `m1v5.mp4` | 05:20 (320s) | `subtitles/ar/m1v5.vtt` | `subtitles/en/m1v5.vtt` | `Uploaded (200 OK)` |
| **M2-L1** | `m2v1.mp4` | 05:03 (303s) | `subtitles/ar/m2v1.vtt` | `subtitles/en/m2v1.vtt` | `Uploaded (200 OK)` |
| **M2-L2** | `m2v2.mp4` | 05:19 (319s) | `subtitles/ar/m2v2.vtt` | `subtitles/en/m2v2.vtt` | `Uploaded (200 OK)` |
| **M2-L3** | `m2v3.mp4` | 04:53 (293s) | `subtitles/ar/m2v3.vtt` | `subtitles/en/m2v3.vtt` | `Uploaded (200 OK)` |
| **M2-L4** | `m2v4.mp4` | 05:32 (332s) | `subtitles/ar/m2v4.vtt` | `subtitles/en/m2v4.vtt` | `Uploaded (200 OK)` |
| **M2-L5** | `m2v5.mp4` | 06:19 (379s) | `subtitles/ar/m2v5.vtt` | `subtitles/en/m2v5.vtt` | `Uploaded (200 OK)` |
| **M2-L6** | `m2v6.mp4` | 05:27 (327s) | `subtitles/ar/m2v6.vtt` | `subtitles/en/m2v6.vtt` | `Uploaded (200 OK)` |
| **M2-L7** | `m2v7.mp4` | 06:55 (415s) | `subtitles/ar/m2v7.vtt` | `subtitles/en/m2v7.vtt` | `Uploaded (200 OK)` |
| **M2-L8** | `m2v8.mp4` | 05:31 (331s) | `subtitles/ar/m2v8.vtt` | `subtitles/en/m2v8.vtt` | `Uploaded (200 OK)` |
| **M2-L9** | `m2v9.mp4` | 08:18 (498s) | `subtitles/ar/m2v9.vtt` | `subtitles/en/m2v9.vtt` | `Uploaded (200 OK)` |

---

## 3. Supabase Database Synchronization

The curriculum structure is fully synchronized in Supabase:

* **Course**: `0509ec71-4043-43d4-9865-b3bca0510458`
  * `title_ar`: الماجستير المصغر في التغير المناخي والصحة العامة
  * `title_en`: Mini-Masterclass: Climate Change & Public Health
* **Module 1**: `66666666-6666-6666-6666-666666666601`
  * `sequence_order`: 1
  * 5 Lessons (`77777777-7777-7777-7777-777777770101` to `0105`)
* **Module 2**: `66666666-6666-6666-6666-666666666602`
  * `sequence_order`: 2
  * 9 Lessons (`77777777-7777-7777-7777-777777770201` to `0209`)

### Rich Text Content Integration
Each lesson is populated with structured Arabic (`content_ar`) and English (`content_en`) markdown content, featuring:
* **نظرة عامة على الدرس / Lesson Overview**: Educational objectives and theoretical basis.
* **المحاور والمفاهيم الجوهرية / Core Concepts**: Structured key takeaways.
* **خلاصة التطبيق الميداني / Field Application Summary**: Actionable clinical and community health guidance.

---

## 4. Frontend UX & Video Player Placement

### Top-of-Lesson Video Positioning
In [CourseDetailModal.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/learning-hub/components/student/CourseDetailModal.jsx), the view hierarchy was restructured:
1. **Video Player Container (Top)**: Placed as the first element inside the active lesson pane, above the title and body text.
2. **Direct R2 Public Key Resolution**: Resolves relative paths (e.g., `course_videos/m1v1.mp4`) directly using `import.meta.env.VITE_R2_PUBLIC_URL`, bypassing edge function lookups and RLS restrictions on guest sessions.
3. **Automatic Subtitle Track Construction**: Analyzes lesson video code (`m{X}v{Y}`) and auto-mounts both Arabic (`العربية`) and English (`English`) WebVTT tracks.
4. **Lesson Metadata & Title**: Displayed immediately below the video player.
5. **Interactive Controls**: Lesson completion toggle, quiz launcher, and rich text curriculum content follow naturally underneath.

### Player Capabilities in [CustomVideoPlayer.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/learning-hub/components/player/CustomVideoPlayer.jsx)
* **Custom Playhead & Scrubbing**: Smooth real-time seeking with buffered progress indicators.
* **Variable Playback Speed**: 0.5x to 2.0x speeds with quick-reset double-click.
* **Volume & Mute Control**: Hover-activated slider with persistent volume memory.
* **Closed Captions (CC)**: Dynamic modal picker with live subtitle rendering, supporting Arabic RTL (`unicode-bidi: plaintext`) and English LTR.
* **Picture-in-Picture (PiP)**: Native picture-in-picture mode for multitasking.
* **Frame Snapshot / Copy**: Instant clipboard capture of current 4K video frame.
* **Telemetry**: Automated background sync to `lesson_watch_metrics` tracking furthest timestamp reached, completion percentage, and actual play duration.

---

## 5. Management & Re-ingestion Script

The CLI ingestion and sync script is located at:  
[scripts/upload-modules-and-sync-supabase.mjs](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/upload-modules-and-sync-supabase.mjs)

### Available CLI Flags
```bash
# Full sync (check & upload missing files, update Supabase records)
node scripts/upload-modules-and-sync-supabase.mjs

# Dry run mode (simulate operations without modifying R2 or Supabase)
node scripts/upload-modules-and-sync-supabase.mjs --dry-run

# Force re-upload all media files even if they already exist on R2
node scripts/upload-modules-and-sync-supabase.mjs --force

# Sync database records only (skip media upload)
node scripts/upload-modules-and-sync-supabase.mjs --skip-upload

# Upload media files to R2 only (skip Supabase database update)
node scripts/upload-modules-and-sync-supabase.mjs --skip-db

# Target a specific module only
node scripts/upload-modules-and-sync-supabase.mjs --module 1
```

---

## 6. Environment Configuration Reference

The following environment variables in `.env` govern media delivery and database access:

```env
# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
VITE_R2_BUCKET_NAME=climamedix
VITE_R2_PUBLIC_URL=https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev

# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 7. Verification & Testing

* **Direct Course URL**:  
  `http://localhost:9090/courses?course=0509ec71-4043-43d4-9865-b3bca0510458`
* **Test Checklist**:
  1. Open the course URL in the browser.
  2. The custom video player renders at the **very top** of the active lesson view.
  3. Play video — video streams seamlessly with fast start (no initial freeze).
  4. Toggle CC button in player toolbar — select `العربية` or `English` and verify subtitle synchronization.
  5. Select any other lesson in Module 1 or Module 2 from the syllabus sidebar — the player reloads the corresponding video key and subtitle tracks instantly.
