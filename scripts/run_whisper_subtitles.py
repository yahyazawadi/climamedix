import sys
import os

# Prevent local coverage directory from shadowing the coverage module in python stdlib/site-packages
sys.path = [p for p in sys.path if p and not p.endswith('climamedix-pwa')]

import argparse
import time
import torch
import whisper
from whisper.utils import get_writer

def main():
    parser = argparse.ArgumentParser(description="Run Whisper with word timestamps and max line constraints on CUDA")
    parser.add_argument("--video", required=True, help="Path to video or audio file")
    parser.add_argument("--output-dir", default="scripts/whisper_output", help="Directory to save output subtitles")
    parser.add_argument("--model", default="large-v3", help="Whisper model to use")
    parser.add_argument("--max-width", type=int, default=40, help="Maximum characters per subtitle line")
    parser.add_argument("--max-lines", type=int, default=2, help="Maximum lines per subtitle cue")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    video_path = args.video
    if not os.path.exists(video_path):
        print(f"Error: file not found: {video_path}")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Whisper] Device: {device} ({torch.cuda.get_device_name(0) if device == 'cuda' else 'CPU'})")
    print(f"[Whisper] Loading model '{args.model}'...")
    t0 = time.time()
    model = whisper.load_model(args.model, device=device)
    print(f"[Whisper] Model loaded in {time.time() - t0:.1f}s")

    print(f"[Whisper] Transcribing {os.path.basename(video_path)} with word_timestamps=True (Arabic)...")
    t_start = time.time()
    result = model.transcribe(
        video_path,
        language="ar",
        task="transcribe",
        word_timestamps=True,
        verbose=False,
        fp16=(device == "cuda")
    )
    t_transcribe = time.time() - t_start
    print(f"[Whisper] Transcription completed in {t_transcribe:.1f}s")

    # Write VTT with line constraints
    vtt_writer = get_writer("vtt", args.output_dir)
    srt_writer = get_writer("srt", args.output_dir)

    writer_options = {
        "max_line_width": args.max_width,
        "max_line_count": args.max_lines,
        "highlight_words": False
    }

    base_name = os.path.splitext(os.path.basename(video_path))[0]
    
    # Write VTT
    vtt_path = os.path.join(args.output_dir, f"{base_name}.vtt")
    with open(vtt_path, "w", encoding="utf-8") as f:
        vtt_writer.write_result(result, f, writer_options)
    print(f"[Whisper] Saved VTT: {vtt_path}")

    # Write SRT
    srt_path = os.path.join(args.output_dir, f"{base_name}.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        srt_writer.write_result(result, f, writer_options)
    print(f"[Whisper] Saved SRT: {srt_path}")

if __name__ == "__main__":
    main()
