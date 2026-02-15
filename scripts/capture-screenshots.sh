#!/bin/bash
# Captures sharp Retina screenshots of all 4 app modes for docs.
# Uses Playwright to launch the app at native resolution (2x on Retina).
#
# Usage: bash scripts/capture-screenshots.sh
# Prerequisites: npm run build (app must be built first)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Capturing screenshots at native Retina resolution..."

cd "$PROJECT_DIR"

# Build the app first
npx electron-rebuild -f --quiet 2>/dev/null
npx electron-vite build 2>/dev/null

node -e "
const { _electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const MODES = ['vanilla', 'island', 'learn', 'ocean'];
const SCREENSHOT_DIR = path.join('${PROJECT_DIR}', 'docs', 'screenshots');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

(async () => {
  const app = await _electron.launch({
    args: [path.join('${PROJECT_DIR}', 'out/main/index.js')],
    env: { ...process.env, NODE_ENV: 'test' },
    timeout: 15000,
  });

  const page = await app.firstWindow({ timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');

  // Set window size (Retina will render at 2x automatically)
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { win.setSize(1200, 800); win.center(); }
  });

  await page.waitForTimeout(3000);

  for (const mode of MODES) {
    const btn = page.locator('.mode-button', { hasText: new RegExp(mode, 'i') });
    await btn.click();
    // Extra wait for 3D scenes
    const wait = (mode === 'island' || mode === 'ocean') ? 3000 : 1000;
    await page.waitForTimeout(wait);

    const outPath = path.join(SCREENSHOT_DIR, mode + '-mode.png');
    await page.screenshot({ path: outPath });
    const stat = fs.statSync(outPath);
    console.log('  ✅ ' + mode + '-mode.png (' + Math.round(stat.size/1024) + 'KB)');
  }

  await app.close();
  console.log('Done! Screenshots saved to docs/screenshots/');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
"
