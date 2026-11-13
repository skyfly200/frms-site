#!/usr/bin/env node
// Regression guard for the site nav. Run with `npm test`.
// Fails if any page:
//  - has a hamburger (#menu-toggle) that is an icon-font <i> (blank when the icon CDN is slow or blocked), or
//  - lacks the inline pre-Tailwind nav rules that keep the nav from flashing or vanishing.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const problems = [];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');

  const toggle = html.match(/<button[^>]*id="menu-toggle"[^>]*>([\s\S]*?)<\/button>/);
  if (!toggle) {
    problems.push(`${page}: no #menu-toggle button`);
  } else if (!/<svg[\s>]/.test(toggle[1]) || /data-feather/.test(toggle[1])) {
    problems.push(`${page}: #menu-toggle must use an inline <svg>, not an icon-font <i> (blank if the icon CDN fails)`);
  }

  if (!/\.md\\:hidden\s*\{\s*display:\s*none;?\s*\}/.test(html) || !/\.hidden\s*\{\s*display:\s*none;?\s*\}/.test(html)) {
    problems.push(`${page}: missing inline pre-Tailwind nav rules (.hidden / .md\\:hidden / .md\\:flex)`);
  }
}

if (problems.length) {
  console.error('Nav check failed:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`Nav check passed for ${pages.length} pages.`);
