import { describe, it, expect } from 'vitest';
import { formatArticleContent, extractSnippet } from '../utils/contentFormatter';

describe('formatArticleContent Utility', () => {
  it('returns empty string for null or undefined input', () => {
    expect(formatArticleContent(null)).toBe('');
    expect(formatArticleContent(undefined)).toBe('');
    expect(formatArticleContent('')).toBe('');
  });

  it('converts literal \\n escaped sequences and markdown to HTML', () => {
    const raw = '## ملخص الدراسة\\n\\nتشير النماذج إلى ارتفاع الحرارة.\\n\\n### التوصيات\\n* عنصر 1\\n* عنصر 2';
    const html = formatArticleContent(raw);

    expect(html).toContain('<h2>ملخص الدراسة</h2>');
    expect(html).toContain('<p>تشير النماذج إلى ارتفاع الحرارة.</p>');
    expect(html).toContain('<h3>التوصيات</h3>');
    expect(html).toContain('<ul><li>عنصر 1</li><li>عنصر 2</li></ul>');
    expect(html).not.toContain('\\n');
  });

  it('converts numbered lists properly', () => {
    const raw = '### الخطوات\n1. الخطوة الأولى\n2. الخطوة الثانية';
    const html = formatArticleContent(raw);

    expect(html).toContain('<h3>الخطوات</h3>');
    expect(html).toContain('<ol><li>الخطوة الأولى</li><li>الخطوة الثانية</li></ol>');
  });

  it('formats inline bold, italic, and links', () => {
    const raw = 'هذا نص **عريض** وهذا *مائل* وهذا [رابط](https://example.com)';
    const html = formatArticleContent(raw);

    expect(html).toContain('<strong>عريض</strong>');
    expect(html).toContain('<em>مائل</em>');
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">رابط</a>');
  });

  it('preserves existing HTML without mangling tags', () => {
    const raw = '<h2>عنوان موجود</h2><p>فقرة عادية</p><ul><li>عنصر</li></ul>';
    const html = formatArticleContent(raw);

    expect(html).toBe(raw);
  });
});

describe('extractSnippet Utility', () => {
  it('cleans markdown symbols, html tags, and unescapes newlines', () => {
    const raw = '## ملخص الدراسة\\n\\nتشير النماذج المناخية الإقليمية إلى أن درجات الحرارة الصيفية تفوق المتوسط العالمي.';
    const snippet = extractSnippet(raw, 50);

    expect(snippet).not.toContain('#');
    expect(snippet).not.toContain('\\n');
    expect(snippet.endsWith('...')).toBe(true);
    expect(snippet).toContain('ملخص الدراسة تشير النماذج');
  });

  it('returns empty string for falsy input', () => {
    expect(extractSnippet(null)).toBe('');
    expect(extractSnippet(undefined)).toBe('');
  });
});
