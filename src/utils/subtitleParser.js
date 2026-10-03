/**
 * Subtitle Parser Utility for SRT and WebVTT formats.
 * Normalizes timestamps to seconds (float) with millisecond precision
 * and provides binary search for fast active cue lookup.
 */

/**
 * Converts timestamp string (e.g. "00:01:23,456" or "01:23.456") to seconds.
 * Supports both SRT comma (,) and VTT dot (.) separators.
 * @param {string} timeStr
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hours * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(clean) || 0;
}

/**
 * Detects if a text block contains Arabic characters.
 * @param {string} text
 * @returns {boolean}
 */
export function isArabicText(text) {
  if (!text) return false;
  // Arabic Unicode blocks: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

/**
 * Universal subtitle parser supporting WebVTT (.vtt) and SubRip (.srt).
 * @param {string} content - Raw subtitle file text
 * @returns {Array<{ id: number|string, start: number, end: number, text: string, isRtl: boolean }>}
 */
export function parseSubtitles(content) {
  if (!content || typeof content !== 'string') return [];

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip WebVTT header if present
  let cleanContent = normalized;
  if (cleanContent.startsWith('WEBVTT')) {
    cleanContent = cleanContent.replace(/^WEBVTT[^\n]*\n+/i, '');
  }

  // Split into cue blocks separated by 2+ blank lines
  const blocks = cleanContent.split(/\n\s*\n/);
  const cues = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Check for comments or style blocks in VTT
    if (block.startsWith('NOTE') || block.startsWith('STYLE')) continue;

    const lines = block.split('\n');
    let timingLineIndex = -1;

    // Locate the line containing the '-->' arrow
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('-->')) {
        timingLineIndex = j;
        break;
      }
    }

    if (timingLineIndex === -1) continue;

    const timingLine = lines[timingLineIndex];
    const [startRaw, endRaw] = timingLine.split('-->');
    if (!startRaw || !endRaw) continue;

    // Clean timestamp by trimming any positioning settings (e.g. "line:0% position:50%")
    const startStr = startRaw.trim();
    const endStr = endRaw.trim().split(/\s+/)[0];

    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);

    if (isNaN(start) || isNaN(end) || end <= start) continue;

    // The text comprises all lines following the timing line
    const textLines = lines.slice(timingLineIndex + 1);
    // Strip simple HTML tags like <b>, <i>, <c>, <v Speaker>
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!text) continue;

    const cueId = timingLineIndex > 0 ? lines[0].trim() : String(cues.length + 1);
    const isRtl = isArabicText(text);

    const rawCue = {
      id: cueId,
      start,
      end,
      text,
      isRtl
    };

    const broadcastCues = splitCueIntoBroadcastLines(rawCue);
    cues.push(...broadcastCues);
  }

  // Ensure cues are sorted chronologically by start time
  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Splits monolithic long cues (>85 chars or >6s) into clean 1-2 line broadcast-safe sub-cues
 * with proportional timestamp distribution across natural phrase and sentence boundaries.
 * @param {object} cue
 * @param {number} maxChars
 * @param {number} maxDuration
 * @returns {Array<object>}
 */
export function splitCueIntoBroadcastLines(cue, maxChars = 85, maxDuration = 6.0) {
  const duration = cue.end - cue.start;
  if (!cue.text || (cue.text.length <= maxChars && duration <= maxDuration)) {
    return [cue];
  }

  // Split on sentence terminators: . ! ? ؟ or newlines
  const rawSentences = cue.text
    .split(/([.!?؟\n]+)/)
    .filter(Boolean);

  const sentences = [];
  for (let i = 0; i < rawSentences.length; i += 2) {
    const textPart = rawSentences[i] || '';
    const punctPart = rawSentences[i + 1] || '';
    const full = (textPart + punctPart).trim();
    if (full) sentences.push(full);
  }

  const rawParts = [];
  for (const s of (sentences.length > 0 ? sentences : [cue.text])) {
    if (s.length <= maxChars) {
      rawParts.push(s);
    } else {
      // Split by comma / semicolon clauses
      const clauses = s.split(/([,،;؛]+)/).filter(Boolean);
      let buf = '';
      for (let j = 0; j < clauses.length; j += 2) {
        const cText = clauses[j] || '';
        const cPunct = clauses[j + 1] || '';
        const chunk = (cText + cPunct).trim();
        if ((buf + ' ' + chunk).trim().length > maxChars && buf) {
          rawParts.push(buf.trim());
          buf = chunk;
        } else {
          buf = (buf + ' ' + chunk).trim();
        }
      }
      if (buf) {
        if (buf.length > maxChars) {
          const words = buf.split(/\s+/);
          let wordBuf = '';
          for (const w of words) {
            if ((wordBuf + ' ' + w).trim().length > maxChars && wordBuf) {
              rawParts.push(wordBuf.trim());
              wordBuf = w;
            } else {
              wordBuf = (wordBuf + ' ' + w).trim();
            }
          }
          if (wordBuf) rawParts.push(wordBuf.trim());
        } else {
          rawParts.push(buf);
        }
      }
    }
  }

  if (rawParts.length <= 1) {
    return [cue];
  }

  const totalChars = rawParts.reduce((acc, p) => acc + p.length, 0) || 1;
  const subCues = [];
  let currentStart = cue.start;

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    const partDuration = (part.length / totalChars) * duration;
    const partEnd = (i === rawParts.length - 1) ? cue.end : (currentStart + partDuration);

    subCues.push({
      id: `${cue.id}.${i + 1}`,
      start: parseFloat(currentStart.toFixed(3)),
      end: parseFloat(partEnd.toFixed(3)),
      text: part,
      isRtl: isArabicText(part)
    });

    currentStart = partEnd;
  }

  return subCues;
}

/**
 * Fast cue lookup using binary search / filtered search.
 * Returns the currently active cue for a given playback time in seconds.
 * @param {Array} cues
 * @param {number} currentTime
 * @returns {object|null}
 */
export function getActiveCue(cues, currentTime) {
  if (!Array.isArray(cues) || cues.length === 0 || typeof currentTime !== 'number') {
    return null;
  }

  // Binary search to narrow down closest start time
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];

    if (currentTime >= cue.start && currentTime <= cue.end) {
      return cue;
    }

    if (currentTime < cue.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return null;
}
