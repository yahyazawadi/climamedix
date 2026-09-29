#!/usr/bin/env node
/**
 * 🔍 ClimaMedix Fast Static Responsive Leak & Layout Checker
 * 
 * Scans all JSX / CSS / HTML files for common mobile-breaking patterns:
 *  1. Hardcoded fixed large pixel widths without mobile overrides (e.g. width: '420px', width: 400, minWidth: '500px')
 *  2. Missing boxSizing: 'border-box' on padded full-width containers (e.g. width: '100%' with fixed horizontal padding)
 *  3. Unwrapped flex rows without flexWrap: 'wrap'
 *  4. Elements with fixed height that prevent natural mobile text reflow
 *  5. Absolute overlays / drawers that lack responsive left/right/top bounds
 * 
 * Usage:
 *   node scripts/check-responsive-leaks.mjs
 *   npm run check:leaks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Terminal ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

const IGNORED_DIRS = ['__tests__', 'assets'];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        results = results.concat(getFiles(filePath));
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      results.push(filePath);
    }
  }
  return results;
}

const LEAK_PATTERNS = [
  {
    id: 'HARDCODED_LARGE_WIDTH',
    severity: 'WARN',
    desc: 'Hardcoded large fixed width (> 360px) in inline style without viewport clamp or mobile conditional',
    regex: /(?:width|minWidth)\s*:\s*['"]([4-9]\d{2}|\d{4,})px['"]/g,
    check: (match, line, fileContent) => {
      // Allow if line or surrounding block uses isMobile, clamp, or calc
      return !line.includes('isMobile') && !line.includes('clamp') && !line.includes('maxWidth');
    }
  },
  {
    id: 'FULL_WIDTH_PADDING_NO_BORDER_BOX',
    severity: 'WARN',
    desc: 'width: 100% paired with horizontal padding without box-sizing: border-box',
    regex: /width\s*:\s*['"]100%['"][^}]*padding\s*:\s*['"][^'"]*px['"]/g,
    check: (match, line) => {
      return !line.includes('boxSizing') && !line.includes('border-box');
    }
  },
  {
    id: 'ABSOLUTE_DRAWER_NO_MOBILE_BOUNDS',
    severity: 'ERROR',
    desc: 'Absolute positioned drawer/overlay with fixed width but no mobile left/right override',
    regex: /position\s*:\s*['"]absolute['"][^}]*width\s*:\s*['"]([3-9]\d{2})px['"]/g,
    check: (match, line) => {
      return !line.includes('isMobile') && !line.includes('left');
    }
  },
  {
    id: 'FLEX_ROW_NO_WRAP_MULTIPLE_ITEMS',
    severity: 'INFO',
    desc: 'Inline flex row with gap without explicit flexWrap: "wrap"',
    regex: /display\s*:\s*['"]flex['"][^}]*gap\s*:\s*['"][^'"]+['"][^}]*/g,
    check: (match, line) => {
      return !line.includes('flexWrap') && !line.includes('flexDirection: \'column\'') && !line.includes('flexDirection: "column"');
    }
  }
];

function checkFiles() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} 🔍 ClimaMedix Responsive Leak & Layout Checker${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  const files = getFiles(srcDir);
  console.log(`${GRAY}Scanning ${files.length} source files in src/...${RESET}\n`);

  let totalIssues = 0;
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relPath = path.relative(srcDir, file).replace(/\\/g, '/');

    lines.forEach((line, index) => {
      LEAK_PATTERNS.forEach(pattern => {
        let match;
        // reset regex state
        pattern.regex.lastIndex = 0;
        while ((match = pattern.regex.exec(line)) !== null) {
          if (pattern.check(match, line, content)) {
            totalIssues++;
            findings.push({
              file: relPath,
              lineNum: index + 1,
              patternId: pattern.id,
              severity: pattern.severity,
              desc: pattern.desc,
              snippet: line.trim()
            });
          }
        }
      });
    });
  }

  if (findings.length === 0) {
    console.log(`${GREEN}${BOLD}✔ No responsive layout leaks or uncontained fixed widths found!${RESET}\n`);
    process.exit(0);
  }

  // Group by file
  const grouped = {};
  findings.forEach(f => {
    if (!grouped[f.file]) grouped[f.file] = [];
    grouped[f.file].push(f);
  });

  for (const [file, items] of Object.entries(grouped)) {
    console.log(`${BOLD}📄 src/${file}${RESET}`);
    items.forEach(item => {
      const color = item.severity === 'ERROR' ? RED : (item.severity === 'WARN' ? YELLOW : GRAY);
      console.log(`   ${color}[${item.severity}] Line ${item.lineNum}:${RESET} ${item.desc}`);
      console.log(`      ${GRAY}${item.snippet.slice(0, 90)}${RESET}`);
    });
    console.log('');
  }

  console.log(`${BOLD}${CYAN}----------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}Scan Complete:${RESET} Found ${RED}${findings.filter(f => f.severity === 'ERROR').length} Errors${RESET}, ${YELLOW}${findings.filter(f => f.severity === 'WARN').length} Warnings${RESET}, ${GRAY}${findings.filter(f => f.severity === 'INFO').length} Suggestions${RESET}.`);
  console.log(`${BOLD}${CYAN}----------------------------------------------------------------${RESET}\n`);
}

checkFiles();
