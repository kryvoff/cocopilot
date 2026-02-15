import { _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    timeout: 15000,
  })

  const page = await app.firstWindow({ timeout: 10000 })

  await page.waitForLoadState('domcontentloaded')
  // Give the React app + 3D scene time to render
  await page.waitForTimeout(3000)

  return { app, page }
}
