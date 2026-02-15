import { _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'

// Fixed size for deterministic screenshots across machines
const WINDOW_WIDTH = 1200
const WINDOW_HEIGHT = 800

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [
      path.join(__dirname, '../../out/main/index.js'),
      '--force-device-scale-factor=1',
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    timeout: 15000,
  })

  const page = await app.firstWindow({ timeout: 10000 })

  await page.waitForLoadState('domcontentloaded')

  // Force consistent window size for deterministic screenshots
  await app.evaluate(({ BrowserWindow }, { w, h }) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.setSize(w, h)
      win.center()
    }
  }, { w: WINDOW_WIDTH, h: WINDOW_HEIGHT })

  // Give the React app + 3D scene time to render after resize
  await page.waitForTimeout(3000)

  return { app, page }
}
