/**
 * Content Formatter Utility
 * Handles unescaping raw newline strings, converting Markdown syntax (headings,
 * lists, bold, italics) into semantic HTML, and stripping formatting for card previews.
 */

export function formatArticleContent(raw) {
  if (!raw) return '';
  let str = String(raw).replace(/\\n/g, '\n');

  // If already structured with HTML block tags, return unescaped HTML directly
  if (/<(p|h[1-6]|ul|ol|div|blockquote|table|section|article)[\s>]/i.test(str)) {
    return str;
  }

  const lines = str.split('\n');
  const result = [];
  let inUl = false;
  let inOl = false;

  const inlineFormat = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      continue;
    }

    if (line.startsWith('#### ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<h4>' + inlineFormat(line.slice(5)) + '</h4>');
    } else if (line.startsWith('### ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<h3>' + inlineFormat(line.slice(4)) + '</h3>');
    } else if (line.startsWith('## ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<h2>' + inlineFormat(line.slice(3)) + '</h2>');
    } else if (line.startsWith('# ')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<h1>' + inlineFormat(line.slice(2)) + '</h1>');
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push('<li>' + inlineFormat(line.slice(2)) + '</li>');
    } else if (/^\d+\.\s/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push('<li>' + inlineFormat(line.replace(/^\d+\.\s/, '')) + '</li>');
    } else {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push('<p>' + inlineFormat(line) + '</p>');
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('');
}

export function extractSnippet(raw, maxLength = 120) {
  if (!raw) return '';
  return String(raw)
    .replace(/\\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*_`>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength) + '...';
}
