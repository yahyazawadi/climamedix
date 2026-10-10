import sys
import os
import json
import time

# Prevent local workspace module collision (especially 'coverage' directory with numba)
sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import torch
import whisper

# Master conditioning prompt distilled from dialect feedback
MASTER_PROMPT = (
    "مرحباً بكم في زمالة التثقيف الصحي وتغير المناخ. "
    "التثقيف الصحي هندسة سلوك وبناء جسور وليس مجرد صف حكي أو نصائح فوقية. "
    "بدنا نفهم المتلقي واحتياجات مجتمعنا بدقة، ونكسر خرافة الرسالة الوحدة اللي بتناسب الكل. "
    "نحول الأرقام والبيانات المعقدة والمجعلكة لعادات يومية ملموسة بيطبقوها الناس عن جد. "
    "راكي على عصاة، عمال البناء تحت شمس الظهر على الإسفلت، ورشة بناء، استراحة في الظل. "
    "مثلث محددات السلوك والضلع الأخطر، بالتساوي الرياضي الساذج، الإنصاف الصحي وفئات الهشاشة. "
    "يا أبطال، يا والدي خلي المي قريبة منك، دوخة وتقل بالراس، عيادات الرعاية الأولية ومخيمات النزوح. "
    "هادول إلهم شفرة تواصل خاصة، رح نلاقي، هدول، شو بدي أقول، كيف ممكن نعمل مع بعض."
)

# Target list: Module 3 (m3v1 - m3v7) and Module 4 (m4v1 - m4v9)
TARGETS = [
    # Module 3
    "m3v1", "m3v2", "m3v3", "m3v4", "m3v5", "m3v6", "m3v7",
    # Module 4
    "m4v1", "m4v2", "m4v3", "m4v4", "m4v5", "m4v6", "m4v7", "m4v8", "m4v9"
]

VIDEO_SEARCH_DIRS = [
    "C:/Users/CLICK/Downloads/videos of modules/videos_h264_1080p",
    "C:/Users/CLICK/Downloads/videos of modules/m3_source/m3",
    "C:/Users/CLICK/Downloads/videos of modules/m4_source/m4",
    "C:/Users/CLICK/Downloads/videos of modules/all_source_videos"
]

def find_video(code):
    for d in VIDEO_SEARCH_DIRS:
        p = os.path.join(d, f"{code}.mp4")
        if os.path.exists(p):
            return p
    return None

def to_vtt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def to_srt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def transcribe_file(code, video_path, model):
    file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"[CUDA Whisper] Transcribing {code} ({os.path.basename(video_path)} - {file_size_mb:.1f} MB)...")
    print(f"=======================================================")
    t_start = time.time()
    
    res = model.transcribe(
        video_path,
        language="ar",
        task="transcribe",
        initial_prompt=MASTER_PROMPT,
        temperature=0.0,
        beam_size=5,
        best_of=5,
        condition_on_previous_text=False,
        word_timestamps=True,
        verbose=False,
        fp16=True
    )
    
    elapsed = time.time() - t_start
    segments = res.get("segments", [])
    print(f"[CUDA Whisper] {code} finished in {elapsed:.1f}s. Total cues: {len(segments)}")

    # Ensure output directories exist
    os.makedirs("scripts/whisper_output/ar", exist_ok=True)
    os.makedirs("scripts/subtitles_ar", exist_ok=True)
    os.makedirs("C:/Users/CLICK/Downloads/videos of modules/subtitles", exist_ok=True)

    # 1. Save JSON
    json_path = f"scripts/whisper_output/ar/{code}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)

    # 2. Save VTT to repo & Downloads
    vtt_destinations = [
        f"scripts/whisper_output/ar/{code}.vtt",
        f"scripts/subtitles_ar/{code}.vtt",
        f"C:/Users/CLICK/Downloads/videos of modules/subtitles/{code}.vtt"
    ]
    for vtt_path in vtt_destinations:
        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write("WEBVTT\n\n")
            for idx, s in enumerate(segments, 1):
                f.write(f"{idx}\n")
                f.write(f"{to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}\n")
                f.write(f"{s['text'].strip()}\n\n")

    # 3. Save SRT
    srt_path = f"scripts/whisper_output/ar/{code}.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, s in enumerate(segments, 1):
            f.write(f"{idx}\n")
            f.write(f"{to_srt_time(s['start'])} --> {to_srt_time(s['end'])}\n")
            f.write(f"{s['text'].strip()}\n\n")

    print(f"[CUDA Whisper] Successfully saved {code}.vtt across destinations.")
    if segments:
        print(f"[CUDA Whisper] Sample cue: {segments[0]['text'].strip()}")

def main():
    if not torch.cuda.is_available():
        print("[ERROR] CUDA is not available! Aborting.")
        sys.exit(1)

    device = "cuda"
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    print("=======================================================")
    print("  CLIMAMEDIX BATCH TRANSCRIBER (CUDA WHISPER LARGE-V3) ")
    print("=======================================================")
    print(f"Device      : {device} ({gpu_name})")
    print(f"VRAM        : {vram_gb:.2f} GB")
    print(f"Prompt Mode : Palestinian / Levantine Dialect Master Prompt")
    print("-------------------------------------------------------\n")

    print("[CUDA Whisper] Loading Whisper 'large-v3' model into VRAM...")
    t_load = time.time()
    model = whisper.load_model("large-v3", device=device)
    print(f"[CUDA Whisper] Model loaded in {time.time() - t_load:.1f}s!\n")

    # Support single item or all
    cli_arg = sys.argv[1].lower() if len(sys.argv) > 1 else None
    targets_to_run = [cli_arg] if cli_arg and cli_arg in TARGETS else TARGETS

    total_start = time.time()
    completed_count = 0

    for code in targets_to_run:
        video_path = find_video(code)
        if not video_path:
            print(f"[CUDA Whisper] WARNING: Video not found for {code}. Skipping.")
            continue
        transcribe_file(code, video_path, model)
        completed_count += 1

    total_time = time.time() - total_start
    print("\n=======================================================")
    print(f" COMPLETED {completed_count} LESSONS TRANSCRIBED IN {total_time:.1f}s ")
    print("=======================================================")

if __name__ == '__main__':
    main()
