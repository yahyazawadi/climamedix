# ClimaMedix LMS Video Streaming & Media Format Specification

**Target Platform**: ClimaMedix PWA & LMS Web Application  
**Applies to**: All Course Modules, Master Lectures, Media Ingestion Pipelines, and Cloudflare R2 Assets.

---

## 1. Golden Media Specification (Strict Standard)

All course video assets uploaded to Cloudflare R2 (`course_videos/m{X}v{Y}.mp4`) **MUST** strictly adhere to the following universal container and stream parameters:

| Component | Standard Specification | Notes & Critical Requirements |
| :--- | :--- | :--- |
| **Container** | **`MP4`** (`.mp4`) | Must have `-movflags +faststart` applied (places `moov` atom at byte 0 for zero-buffer streaming). |
| **Video Codec** | **`H.264 / AVC`** (`avc1`) | Profile: **High** or **Main**, Level 4.1 or 4.0. |
| **Pixel Format** | **`yuv420p`** | 8-bit 4:2:0 planar chroma subsampling (100% universal browser hardware decode). |
| **Resolution** | **`1920 × 1080` (1080p FHD)** | Optimal sweet spot for web/mobile streaming bandwidth, thermal efficiency, and sharp typography. |
| **Framerate** | **`25 fps`** or **`30 fps`** (Progressive) | Constant framerate. |
| **Rate Control** | **`CQ 24`** (or CRF 22–24) | VBR with high-quality tuning. Average bitrate: ~400–700 kbps for slide/talking head lectures (~15–25 MB per 5 min). |
| **Audio Codec** | **`AAC`** (`mp4a` / LC) | Stereo (2 channels), 44.1 kHz or 48.0 kHz. Bitrate: 192–256 kbps. Stream-copy original master audio without re-encoding loss. |
| **Subtitles** | **WebVTT (`.vtt`)** UTF-8 | Served as independent tracks via `<track>` or custom CC engine; **never burned into video frames**. |

---

## 2. Strictly Prohibited Formats & Why

### ❌ Prohibited: H.265 / HEVC (`hevc`, `h265`, `hev1`)
* **The Problem**: Web browsers on standard laptops (Windows without paid HEVC Microsoft Store extension), Firefox, and many mobile browsers (Chrome / Brave on Android) **lack native HEVC playback**.
* **Symptoms**:
  - The browser successfully decodes the AAC audio, but cannot decode the video frames: **"Audio plays with a black screen"**.
  - In web applications, the HTML5 media element fires `MEDIA_ERR_SRC_NOT_SUPPORTED` (`code 4`), triggering error overlays like *"الفيديو غير متوفر أو تعذر تحميله"*.

### ❌ Prohibited: WebM (`.webm`, VP9 / VP8)
* **The Problem**: Very poor, flaky, or non-existent hardware decoding across Apple devices (iOS Safari, iPadOS, macOS Safari, and iOS PWA webviews), as well as in-app social browsers (WhatsApp, Instagram, Telegram).
* **Symptoms**: Freezing, audio-video desync, dropped frames, and total playback failure on iPhones.

---

## 3. Official FFmpeg Transcoding Commands

### A. CUDA Hardware Accelerated (NVIDIA RTX / NVENC)
```bash
ffmpeg -hwaccel cuda -hwaccel_output_format cuda \
  -i input.mp4 \
  -vf "scale_cuda=1920:1080" \
  -c:v h264_nvenc -preset p4 -tune hq -cq 24 -b:v 0 \
  -c:a copy \
  -movflags +faststart \
  -y output.mp4
```

### B. Standard CPU Transcoding (Fallback / GitHub Actions / Linux Servers)
```bash
ffmpeg -i input.mp4 \
  -vf "scale=1920:1080" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  -y output.mp4
```

---

## 4. Verification Checklist (Before Uploading to Cloudflare R2)

Run `ffprobe` on every output video:
```bash
ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt -of default=noprint_wrappers=1 video.mp4
```

Must verify:
- [x] `codec_name=h264`
- [x] `pix_fmt=yuv420p`
- [x] `width=1920` and `height=1080`
- [x] `codec_name=aac`
