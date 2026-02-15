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

test('app launches and shows window', async () => {
  const title = await page.title()
  expect(title).toContain('Cocopilot')
})

test('status bar is visible', async () => {
  const statusBar = page.locator('.status-bar')
  await expect(statusBar).toBeVisible()
})

test('activity bar is visible', async () => {
  const activityBar = page.locator('div').filter({ hasText: /events\/min/ }).first()
  await expect(activityBar).toBeVisible()
})

test('default mode is island', async () => {
  const islandButton = page.locator('.mode-button.active', { hasText: 'Island' })
  await expect(islandButton).toBeVisible()
})

test('can switch to vanilla mode', async () => {
  await page.locator('.mode-button', { hasText: 'Vanilla' }).click()
  await page.waitForTimeout(500)
  const vanillaButton = page.locator('.mode-button.active', { hasText: 'Vanilla' })
  await expect(vanillaButton).toBeVisible()
})

test('can switch to learn mode', async () => {
  await page.locator('.mode-button', { hasText: 'Learn' }).click()
  await page.waitForTimeout(500)
  const learnButton = page.locator('.mode-button.active', { hasText: 'Learn' })
  await expect(learnButton).toBeVisible()
})

test('can switch to ocean mode', async () => {
  await page.locator('.mode-button', { hasText: 'Ocean' }).click()
  await page.waitForTimeout(500)
  const oceanButton = page.locator('.mode-button.active', { hasText: 'Ocean' })
  await expect(oceanButton).toBeVisible()
})
