# Handover & Master Translation Tracker: Bilingual Subtitles (AR / EN)

**Date**: 2026-10-03  
**Workspace**: `c:\Users\CLICK\Desktop\climamedix-pwa`  
**Target Course**: `0509ec71-4043-43d4-9865-b3bca0510458` (زمالة إعداد المثقف الصحي: التغير المناخي وصحة المجتمع / Community Health Educator Fellowship: Climate Change & Population Health)  
**Arabic Subtitles Directory**: [`scripts/subtitles_ar/`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar)  
**English Subtitles Directory**: [`scripts/subtitles_en/`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_en)  

---

## 1. Executive Summary & Purpose

This handover document tracks the line-by-line verification, linguistic review, and bilingual synchronization of all 14 course video lessons in the LMS.

* **Source Audio**: Studio Arabic recorded lectures.
* **Target Subtitle Formats**: WebVTT (`.vtt`) compliant with the custom player engine in [`src/features/learning-hub/components/player/CustomVideoPlayer.jsx`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/learning-hub/components/player/CustomVideoPlayer.jsx) and [`src/utils/subtitleParser.js`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/utils/subtitleParser.js).
* **Current Status**:
  - **`m1v1.vtt`**: 100% verified by user and synced with English translation in Git commit `0b9fc0f`.
  - **`m1v2.vtt`**: Currently active — user is actively verifying Arabic lines (at line ~85).
  - **`m1v3` – `m2v9`**: Initial CUDA Whisper transcripts generated and ready in queue for human review.

---

## 2. All Subtitle Tracks Status Matrix

| Module | Lesson ID | File Name | AR Lines | AR Size | Verification Status | English Sync Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Module 1** | Lesson 1 | [`m1v1.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v1.vtt) | 147 | 7.8 KB | ✅ **Verified by User** | ✅ Synced (`0b9fc0f`) |
| | Lesson 2 | [`m1v2.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v2.vtt) | 394 | 15.3 KB | 🟡 **In Progress (Active)** | ⏳ Pending User Completion |
| | Lesson 3 | [`m1v3.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v3.vtt) | 367 | 11.3 KB | ✅ **Verified by User** | ⏳ Ready to Sync |
| | Lesson 4 | [`m1v4.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v4.vtt) | 415 | 12.4 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 5 | [`m1v5.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v5.vtt) | 175 | 10.0 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| **Module 2** | Lesson 1 | [`m2v1.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v1.vtt) | 153 | 9.5 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 2 | [`m2v2.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v2.vtt) | 328 | 12.0 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 3 | [`m2v3.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v3.vtt) | 153 | 9.3 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 4 | [`m2v4.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v4.vtt) | 151 | 10.6 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 5 | [`m2v5.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v5.vtt) | 221 | 12.2 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 6 | [`m2v6.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v6.vtt) | 159 | 10.0 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 7 | [`m2v7.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v7.vtt) | 385 | 14.3 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 8 | [`m2v8.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v8.vtt) | 177 | 10.1 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| | Lesson 9 | [`m2v9.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m2v9.vtt) | 225 | 14.3 KB | ⚪ In Queue | ⚪ Initial Draft Ready |
| **Total** | **14 Lessons** | | **3,230 lines** | **157 KB** | **1 / 14 Complete** | **1 / 14 Complete** |

---

## 3. Git-Powered Verification & Translation Protocol

To make verification effortless and fast:

### Step 1: User Edits Arabic Subtitles in VS Code
Open the target `.vtt` file from [`scripts/subtitles_ar/`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar) (e.g. `m1v2.vtt`). Edit any words, correct mistranscriptions, or adjust punctuation directly in the Arabic text. Do not modify timecodes unless a cue boundary is misaligned.

### Step 2: AI Automated Diff Extraction
When you finish reviewing a file (or a section), simply tell the assistant:
> *"I finished editing m1v2.vtt, sync the English translations"*

The assistant runs:
```bash
git diff scripts/subtitles_ar/m1v2.vtt
```
Git pinpoints the **exact lines changed**, identifying:
* Old transcription vs. user-corrected phrase.
* Corresponding timestamp / cue index.

### Step 3: Targeted English Re-translation
Instead of wiping out or retranslating the whole file, the assistant translates **only the modified cues** with high medical and climate precision, keeping all unaffected lines untouched.

### Step 4: Verification & Git Commit
The synchronized changes are committed to Git with a clean commit message (e.g. `feat(subtitles): verify m1v2 Arabic and sync English CC`), ensuring a complete audit history.

---

## 4. Solving Arabic / RTL Editing in VS Code

Editing Arabic in code editors is notoriously painful due to BiDi (Bidirectional) text reordering and mixed Latin numbers/timecodes. Here are the best ways to fix it:

### Recommended Extensions:
1. **`vsc-rtl` / RTL Text Direction Support**:
   * ID: `shevach.vsc-rtl` or `vsc-rtl`
   * Shortcut: Toggle RTL with `Alt + Ctrl + R` or command palette `> Toggle RTL`.
2. **`Arabic & Hebrew RTL Support`**:
   * Provides correct right-to-left line rendering for markdown and text files.
3. **`Subtitle Edit Online` or Web Editor (Alternative)**:
   * If VS Code's cursor cursor jumps around timecodes like `00:01:23.456 --> 00:01:27.890`, opening the `.vtt` in [Subtitle Edit Web](https://www.nikse.dk/subtitleedit/online) or Aegisub provides dedicated RTL subtitle text boxes with wave audio sync.

### Recommended VS Code `settings.json` Tweaks:
Add these to `.vscode/settings.json` to improve Arabic cursor handling:
```json
{
  "editor.unicodeHighlight.allowedLocales": {
    "ar": true
  },
  "editor.fontFamily": "'Segoe UI', 'Cairo', 'IBM Plex Sans Arabic', 'Consolas', monospace",
  "editor.fontSize": 14,
  "editor.renderControlCharacters": false
}
```

---

## 5. Next Steps

1. **Continue review of [`scripts/subtitles_ar/m1v2.vtt`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/scripts/subtitles_ar/m1v2.vtt)** (from line 85 to 394).
2. Ping the assistant once `m1v2.vtt` is ready to sync English.
3. Proceed sequentially through `m1v3` to `m1v5`, then Module 2 (`m2v1` to `m2v9`).
4. Once all 14 files are verified, run `node scripts/upload-modules-and-sync-supabase.mjs` to push the final pristine CC files to Cloudflare R2 and Supabase.
