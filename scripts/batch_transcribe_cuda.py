import sys
import os
import json
import time
import torch

# Prevent local workspace module collision
sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import whisper

# Master conditioning prompt distilled from verified M1V1, M1V2, M1V3 feedback
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

TARGET_FILES = [
    ("m1v2", "C:/Users/CLICK/Downloads/videos of modules/videos_nvenc_hevc/m1v2.mp4", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v2.mp4"),
    ("m1v4", "C:/Users/CLICK/Downloads/videos of modules/videos_nvenc_hevc/m1v4.mp4", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v4.mp4"),
    ("m2v2", "C:/Users/CLICK/Downloads/videos of modules/videos_nvenc_hevc/m2v2.mp4", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m2v2.mp4"),
    ("m2v7", "C:/Users/CLICK/Downloads/videos of modules/videos_nvenc_hevc/m2v7.mp4", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m2v7.mp4"),
]

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
    print(f"\n==========================================")
    print(f"[CUDA Whisper] Processing {code} ({os.path.basename(video_path)} - {os.path.getsize(video_path)/(1024*1024):.1f} MB)...")
    print(f"==========================================")
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
        verbose=False
    )
    
    elapsed = time.time() - t_start
    segments = res["segments"]
    print(f"[CUDA Whisper] {code} finished in {elapsed:.1f}s. Total segments: {len(segments)}")

    # Ensure output directories exist
    os.makedirs("scripts/whisper_output/ar", exist_ok=True)
    os.makedirs("scripts/subtitles_ar", exist_ok=True)

    # 1. Save JSON
    json_path = f"scripts/whisper_output/ar/{code}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)

    # 2. Save VTT in both raw whisper_output and editable subtitles_ar
    for vtt_path in [f"scripts/whisper_output/ar/{code}.vtt", f"scripts/subtitles_ar/{code}.vtt"]:
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

    print(f"[CUDA Whisper] Saved {code}.vtt ({len(segments)} cues)")
    print(f"[CUDA Whisper] First 3 cues of {code}:")
    for s in segments[:3]:
        print(f"   [{to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}] {s['text'].strip()[:65]}")

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[CUDA Whisper] Device: {device}")
    if device == "cuda":
        print(f"[CUDA Whisper] GPU: {torch.cuda.get_device_name(0)}")
        print(f"[CUDA Whisper] Total VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")

    print("[CUDA Whisper] Loading Whisper large-v3 into GPU VRAM...")
    t_load = time.time()
    model = whisper.load_model("large-v3", device=device)
    print(f"[CUDA Whisper] Model loaded in {time.time() - t_load:.1f}s")

    # Check CLI argument for single-file run (e.g. `python batch_transcribe_cuda.py m1v4`)
    requested_code = sys.argv[1].lower() if len(sys.argv) > 1 else None

    for code, compressed_path, fallback_path in TARGET_FILES:
        if requested_code and code != requested_code:
            continue

        video_path = compressed_path if os.path.exists(compressed_path) else fallback_path
        if not os.path.exists(video_path):
            print(f"[CUDA Whisper] SKIP: File not found for {code}")
            continue

        transcribe_file(code, video_path, model)

    print("\n[CUDA Whisper] PROCESSING COMPLETE!")

if __name__ == '__main__':
    main()
