import sys
import os
import json
import time

sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import whisper

TARGET_FILES = [
    ("m1v2", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v2.mp4"),
    ("m1v4", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v4.mp4"),
    ("m2v2", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m2v2.mp4"),
    ("m2v7", "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m2v7.mp4"),
]

output_dir = "scripts/whisper_output/ar"
os.makedirs(output_dir, exist_ok=True)

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

print("[CUDA Batch] Loading Whisper large-v3 into GPU VRAM...")
t_load = time.time()
model = whisper.load_model("large-v3", device="cuda")
print(f"[CUDA Batch] Model loaded in {time.time() - t_load:.1f}s")

for code, video_path in TARGET_FILES:
    if not os.path.exists(video_path):
        print(f"[CUDA Batch] SKIP: File not found: {video_path}")
        continue

    print(f"\n==========================================")
    print(f"[CUDA Batch] Processing {code} ({os.path.basename(video_path)})...")
    print(f"==========================================")
    t_start = time.time()
    
    res = model.transcribe(
        video_path,
        language="ar",
        task="transcribe",
        word_timestamps=False,
        verbose=False
    )
    
    elapsed = time.time() - t_start
    segments = res["segments"]
    print(f"[CUDA Batch] {code} finished in {elapsed:.1f}s. Total segments: {len(segments)}")

    # 1. Save JSON
    json_path = os.path.join(output_dir, f"{code}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)

    # 2. Save VTT
    vtt_path = os.path.join(output_dir, f"{code}.vtt")
    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for idx, s in enumerate(segments, 1):
            f.write(f"{idx}\n")
            f.write(f"{to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}\n")
            f.write(f"{s['text'].strip()}\n\n")

    # 3. Save SRT
    srt_path = os.path.join(output_dir, f"{code}.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, s in enumerate(segments, 1):
            f.write(f"{idx}\n")
            f.write(f"{to_srt_time(s['start'])} --> {to_srt_time(s['end'])}\n")
            f.write(f"{s['text'].strip()}\n\n")

    print(f"[CUDA Batch] Saved {code}.vtt ({len(segments)} cues)")
    print(f"[CUDA Batch] First 3 cues of {code}:")
    for s in segments[:3]:
        print(f"   [{to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}] {s['text'].strip()[:60]}...")

print("\n[CUDA Batch] ALL 4 TARGET LESSONS PROCESSED SUCCESSFULLY!")
