import sys
import os
import json
import time

sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import whisper

video_path = "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v2.mp4"
output_dir = "scripts/whisper_output"
os.makedirs(output_dir, exist_ok=True)

print(f"Loading large-v3 on CUDA...")
model = whisper.load_model("large-v3", device="cuda")

t0 = time.time()
print(f"Transcribing {video_path}...")
res = model.transcribe(video_path, language="ar", word_timestamps=False, verbose=False)
print(f"Finished in {time.time() - t0:.1f}s. Segments: {len(res['segments'])}")

# Save JSON
json_path = os.path.join(output_dir, "m1v2.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(res['segments'], f, ensure_ascii=False, indent=2)

# Helper to format seconds into VTT timestamp (00:00:00.000)
def to_vtt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

# Save VTT
vtt_path = os.path.join(output_dir, "m1v2_clean_ar.vtt")
with open(vtt_path, "w", encoding="utf-8") as f:
    f.write("WEBVTT\n\n")
    for idx, s in enumerate(res['segments'], 1):
        f.write(f"{idx}\n")
        f.write(f"{to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}\n")
        f.write(f"{s['text'].strip()}\n\n")

print(f"Saved: {vtt_path}")

# Print first 10
print("\n--- First 10 Clean Segments ---")
for idx, s in enumerate(res['segments'][:10], 1):
    print(f"[{idx}] {to_vtt_time(s['start'])} --> {to_vtt_time(s['end'])}: {s['text'].strip()}")
