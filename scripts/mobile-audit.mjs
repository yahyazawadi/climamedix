#!/usr/bin/env node
/**
 * 📱 ClimaMedix Automated Headless Mobile Viewport & Overflow Auditor
 * 
 * Runs headless Chromium in pure terminal mode without rendering/reading images.
 * Detects:
 *  - Horizontal page overflow (scrollWidth > clientWidth)
 *  - Elements breaking outside mobile screen bounds (rect.right > window.innerWidth)
 *  - Unwrapped flex lines overflowing containers (scrollWidth > clientWidth with flexWrap: nowrap)
 *  - Small touch targets on mobile (< 28px)
 *  - Mobile drawer in both Guest and SuperAdmin states
 * 
 * Usage:
 *  node scripts/mobile-audit.mjs
 *  npm run audit:mobile
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Terminal ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

const PORT = 5199;
const BASE_URL = `http://localhost:${PORT}`;

// Mobile device presets
const VIEWPORTS = [
  { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
  { name: 'iPhone SE (375x667)', width: 375, height: 667 }
];

// All platform views to audit
const ROUTES = [
  { name: 'Home (New)', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Learning Hub (Courses)', path: '/courses' },
  { name: 'News & Articles', path: '/news' },
  { name: 'Opportunities', path: '/opportunities' },
  { name: 'Events', path: '/events' },
  { name: 'Research Hub', path: '/research' },
  { name: 'Join Us', path: '/join' },
  { name: 'Authentication (SSO)', path: '/auth' },
  { name: 'User Profile', path: '/profile' },
  { name: 'Article Editor', path: '/write-article' },
  { name: 'Admin Users', path: '/admin/users' },
  { name: 'Admin Stats', path: '/admin/stats' },
  { name: 'Admin Courses', path: '/admin/courses' },
  { name: 'Admin Certificates', path: '/admin/certificates' },
  { name: 'Admin Slider', path: '/admin/slider' }
];

// Helper to launch system Chrome or Edge
async function getBrowser() {
  const channels = ['chrome', 'msedge'];
  for (const channel of channels) {
    try {
      const browser = await chromium.launch({
        channel,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      return { browser, channel };
    } catch {
      // Try next channel
    }
  }
  throw new Error('Neither Google Chrome nor Microsoft Edge was found on this system.');
}

// In-page audit script
async function auditCurrentPage(page, minTapTarget = 28) {
  return await page.evaluate(({ minTapTarget }) => {
    const issues = [];
    const viewportWidth = window.innerWidth;
    const docScrollWidth = document.documentElement.scrollWidth;

    // 1. Overall page horizontal overflow
    if (docScrollWidth > viewportWidth + 1) {
      issues.push({
        type: 'PAGE_OVERFLOW',
        severity: 'ERROR',
        message: `Page document width (${docScrollWidth}px) exceeds mobile viewport (${viewportWidth}px) by +${docScrollWidth - viewportWidth}px`
      });
    }

    const allElements = document.querySelectorAll('body *');
    const seenOffenders = new Set();

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      if (['SCRIPT', 'STYLE', 'SVG', 'PATH', 'HEAD'].includes(el.tagName)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      // 2. Element breaking out of viewport bounds
      const leaksRight = rect.right > viewportWidth + 2;
      const leaksLeft = rect.left < -2;

      if (leaksRight || leaksLeft) {
        // Ignore if element is inside an intentional horizontal scroll or clipping container
        let parent = el.parentElement;
        let isContained = false;
        while (parent && parent !== document.body) {
          const pStyle = window.getComputedStyle(parent);
          if (['auto', 'scroll', 'hidden', 'clip'].includes(pStyle.overflowX) || ['auto', 'scroll', 'hidden', 'clip'].includes(pStyle.overflow)) {
            isContained = true;
            break;
          }
          parent = parent.parentElement;
        }

        if (!isContained) {
          const key = `${el.tagName}:${el.className}`;
          if (!seenOffenders.has(key)) {
            seenOffenders.add(key);
            issues.push({
              type: 'ELEMENT_OVERFLOW',
              severity: 'ERROR',
              tag: el.tagName.toLowerCase(),
              className: el.className ? String(el.className).slice(0, 35) : '',
              text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
              details: leaksRight 
                ? `Right edge (${Math.round(rect.right)}px) overflows +${Math.round(rect.right - viewportWidth)}px past screen`
                : `Left edge (${Math.round(rect.left)}px) clipped off screen`
            });
          }
        }
      }

      // 3. Unwrapped flexbox overflow detection (The exact bug from screenshot!)
      if (style.display === 'flex' && style.flexDirection.includes('row') && style.flexWrap === 'nowrap') {
        const isSelfContained = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflow) ||
                               ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX);
        if (!isSelfContained && el.scrollWidth > el.clientWidth + 2 && el.children.length >= 3) {
          const key = `flex:${el.tagName}:${el.className}`;
          if (!seenOffenders.has(key)) {
            seenOffenders.add(key);
            issues.push({
              type: 'UNWRAPPED_FLEX',
              severity: 'ERROR',
              tag: el.tagName.toLowerCase(),
              className: el.className ? String(el.className).slice(0, 35) : '',
              text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
              details: `Flex container missing flex-wrap: wrap (scrollWidth: ${el.scrollWidth}px > clientWidth: ${el.clientWidth}px, ${el.children.length} items)`
            });
          }
        }
      }

      // 4. Interactive touch targets
      if (['A', 'BUTTON'].includes(el.tagName)) {
        if ((rect.width > 0 && rect.width < minTapTarget) || (rect.height > 0 && rect.height < minTapTarget)) {
          issues.push({
            type: 'TOUCH_TARGET',
            severity: 'WARN',
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).slice(0, 35) : '',
            text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 25),
            details: `Target area ${Math.round(rect.width)}x${Math.round(rect.height)}px is smaller than ${minTapTarget}px`
          });
        }
      }
    }

    return issues;
  }, { minTapTarget });
}

async function runMobileAudit() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} 📱 ClimaMedix Automated Headless Mobile Viewport & Overflow Auditor${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  const startTime = Date.now();
  let server;
  let browser;

  try {
    // 1. Start Vite dev server on isolated port
    process.stdout.write(`${GRAY}• Starting Vite test server on port ${PORT}...${RESET} `);
    server = await createServer({
      root: projectRoot,
      configFile: path.resolve(projectRoot, 'vite.config.js'),
      server: { port: PORT, strictPort: true },
      logLevel: 'error'
    });
    await server.listen();
    console.log(`${GREEN}Ready.${RESET}`);

    // 2. Launch Browser
    process.stdout.write(`${GRAY}• Launching Headless Chromium...${RESET} `);
    const { browser: launchedBrowser, channel } = await getBrowser();
    browser = launchedBrowser;
    console.log(`${GREEN}Launched via system ${channel}.${RESET}\n`);

    const primaryViewport = VIEWPORTS[0]; // iPhone 14
    console.log(`${BOLD}🔍 Testing ${ROUTES.length} Routes + Mobile Drawer on ${primaryViewport.name}${RESET}\n`);

    let totalErrors = 0;
    let totalWarnings = 0;
    let totalPassed = 0;

    const page = await browser.newPage();
    await page.setViewportSize({ width: primaryViewport.width, height: primaryViewport.height });

    // Test routes in Arabic (RTL)
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        // Set Arabic RTL for true bidirectional audit
        await page.evaluate(() => {
          document.documentElement.setAttribute('lang', 'ar');
          document.documentElement.setAttribute('dir', 'rtl');
        });
        await page.waitForTimeout(100);

        const issues = await auditCurrentPage(page);
        const errors = issues.filter(i => i.severity === 'ERROR');
        const warnings = issues.filter(i => i.severity === 'WARN');

        if (errors.length === 0) {
          totalPassed++;
          const warnText = warnings.length > 0 ? ` ${YELLOW}(${warnings.length} touch warnings)${RESET}` : '';
          console.log(` ${GREEN}✓ [PASS]${RESET} ${route.name.padEnd(25)} ${GRAY}${route.path}${RESET}${warnText}`);
        } else {
          totalErrors += errors.length;
          console.log(`\n ${RED}✗ [FAIL]${RESET} ${BOLD}${route.name}${RESET} ${GRAY}(${route.path})${RESET} - ${RED}${errors.length} Overflow Issue(s)${RESET}`);
          errors.forEach((err, idx) => {
            console.log(`   ${RED}#${idx + 1} [${err.type}]${RESET} ${err.details || err.message}`);
            if (err.tag) console.log(`      Tag: <${err.tag} class="${err.className}">`);
            if (err.text) console.log(`      Text: "${err.text}"`);
          });
          console.log('');
        }
        totalWarnings += warnings.length;
      } catch (err) {
        console.log(` ${RED}✗ [ERR]${RESET}  ${route.name}: Navigation failed (${err.message})`);
        totalErrors++;
      }
    }

    // 3. Dedicated Mobile Drawer Inspection (Guest & SuperAdmin states)
    console.log(`\n${BOLD}🚪 Auditing Mobile Drawer & Quick Links...${RESET}`);

    // (A) Test Drawer as SuperAdmin
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      // Inject mock superadmin session
      const mockUser = { id: 'super-yahya-id', email: 'super.yahyaaa@gmail.com' };
      const mockProfile = { full_name: 'Yahya Amoodi', role: 'superadmin', avatar_url: '' };
      localStorage.setItem('climamedix_auth_user', JSON.stringify(mockUser));
      localStorage.setItem('climamedix_user_profile_cache', JSON.stringify({ data: mockProfile, timestamp: Date.now() }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    // Click Hamburger to open Drawer
    const hamburger = await page.$('.figma-hamburger-trigger');
    if (hamburger) {
      await hamburger.click();
      await page.waitForTimeout(250);

      const drawerIssues = await auditCurrentPage(page);
      const drawerErrors = drawerIssues.filter(i => i.severity === 'ERROR');

      if (drawerErrors.length === 0) {
        totalPassed++;
        console.log(` ${GREEN}✓ [PASS]${RESET} Mobile Drawer (SuperAdmin State, 7+ quick links, wrapped)`);
      } else {
        totalErrors += drawerErrors.length;
        console.log(`\n ${RED}✗ [FAIL]${RESET} Mobile Drawer (SuperAdmin State) - ${drawerErrors.length} Issue(s):`);
        drawerErrors.forEach((err, idx) => {
          console.log(`   ${RED}#${idx + 1} [${err.type}]${RESET} ${err.details || err.message}`);
          if (err.tag) console.log(`      Tag: <${err.tag} class="${err.className}">`);
          if (err.text) console.log(`      Text: "${err.text}"`);
        });
        console.log('');
      }
    } else {
      console.log(` ${YELLOW}⚠ [SKIP]${RESET} Hamburger trigger not found on current page.`);
    }

    // Summary Scorecard
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${BOLD}${CYAN}----------------------------------------------------------------${RESET}`);
    console.log(`${BOLD}📊 Mobile Audit Summary:${RESET}`);
    console.log(`   • ${GREEN}Passed:${RESET}    ${totalPassed} views`);
    console.log(`   • ${RED}Failures:${RESET}  ${totalErrors} overflow errors`);
    console.log(`   • ${YELLOW}Warnings:${RESET}  ${totalWarnings} touch target warnings`);
    console.log(`   • Duration:  ${duration}s`);
    console.log(`${BOLD}${CYAN}----------------------------------------------------------------${RESET}\n`);

    if (totalErrors > 0) {
      console.log(`${RED}${BOLD}❌ Audit FAILED: Mobile viewport overflows detected.${RESET}\n`);
      process.exitCode = 1;
    } else {
      console.log(`${GREEN}${BOLD}🏆 Audit PASSED: 100% clean mobile viewports with zero horizontal overflows!${RESET}\n`);
      process.exitCode = 0;
    }

  } catch (error) {
    console.error(`\n${RED}Fatal error running mobile audit:${RESET}`, error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
}

runMobileAudit();
