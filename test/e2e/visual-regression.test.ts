import { test, expect } from '@playwright/test'
import { launchApp } from './electron-app'
import type { ElectronApplication, Page } from '@playwright/test'

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  const result = await launchApp()
  app = result.app
  page = result.page
})

test.afterAll(async () => {
  await app?.close()
})

async function waitForSceneRender(page: Page, ms = 3000) {
  await page.waitForTimeout(ms)
}

test('vanilla mode screenshot', async () => {
  await page.locator('.mode-button', { hasText: 'Vanilla' }).click()
  await page.waitForTimeout(1000)
  await expect(page).toHaveScreenshot('vanilla-mode.png', {
    maxDiffPixelRatio: 0.05,
  })
})

test('island mode screenshot', async () => {
  await page.locator('.mode-button', { hasText: 'Island' }).click()
  await waitForSceneRender(page)
  await expect(page).toHaveScreenshot('island-mode.png', {
    maxDiffPixelRatio: 0.1,
  })
})

test('learn mode screenshot', async () => {
  await page.locator('.mode-button', { hasText: 'Learn' }).click()
  await page.waitForTimeout(1000)
  await expect(page).toHaveScreenshot('learn-mode.png', {
    maxDiffPixelRatio: 0.05,
  })
})

test('ocean mode screenshot', async () => {
  await page.locator('.mode-button', { hasText: 'Ocean' }).click()
  await waitForSceneRender(page)
  await expect(page).toHaveScreenshot('ocean-mode.png', {
    maxDiffPixelRatio: 0.1,
  })
})
