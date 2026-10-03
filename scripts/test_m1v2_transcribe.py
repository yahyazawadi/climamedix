import sys
import os
import time

sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import whisper

video_path = "C:/Users/CLICK/Downloads/videos of modules/all_source_videos/m1v2.mp4"
print(f"Loading large-v3 on CUDA for {video_path}...")
model = whisper.load_model("large-v3", device="cuda")

t0 = time.time()
print("Starting transcribe...")
res = model.transcribe(video_path, language="ar", word_timestamps=False, verbose=False)
print(f"Finished in {time.time() - t0:.1f}s. Total segments: {len(res['segments'])}")

print("\n--- First 10 segments ---")
for s in res['segments'][:10]:
    print(f"{s['start']:.2f}s -> {s['end']:.2f}s: {s['text'].strip()}")
