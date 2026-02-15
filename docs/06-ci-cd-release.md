# CI/CD & Release Pipeline

## GitHub Actions Workflows

### 1. CI (`ci.yml`) - On every PR and push to main

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build

  e2e-tests:
    needs: build
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
        env:
          DISPLAY: ':99'  # For Linux headless
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-results-${{ matrix.os }}
          path: test-results/
```

### 2. Release (`release.yml`) - On version tags

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: mac
          - os: ubuntu-latest
            platform: linux
          - os: windows-latest
            platform: win
    runs-on: ${{ matrix.os }}
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Build distributable
        run: npx electron-builder --${{ matrix.platform }} --publish never
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_IDENTITY_AUTO_DISCOVERY: false
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.platform }}
          path: |
            dist/*.dmg
            dist/*.AppImage
            dist/*.exe
            dist/*.zip
          if-no-files-found: ignore
      - name: Create GitHub Release
        if: matrix.platform == 'mac'
        uses: softprops/action-gh-release@v2
        with:
          draft: true
          generate_release_notes: true
          files: dist/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Build Targets

| Platform | Format | Architecture |
|----------|--------|-------------|
| macOS | `.dmg` | universal (x64 + arm64) |
| Linux | `.AppImage` | x64 |
| Windows | `.exe` (NSIS) | x64 |

## electron-builder Configuration

```yaml
# electron-builder.yml
appId: com.cocopilot.app
productName: Cocopilot
directories:
  buildResources: resources
  output: dist
files:
  - out/**/*
  - '!external/**'
  - '!docs/**'
  - '!test/**'
asar: true
asarUnpack:
  - '**/*.node'
mac:
  category: public.app-category.developer-tools
  identity: null
  target:
    - target: dmg
      arch: [universal]
linux:
  target:
    - target: AppImage
      arch: [x64]
  category: Development
win:
  target:
    - target: nsis
      arch: [x64]
npmRebuild: true
```

## Code Signing

No code signing is configured for now:
- macOS: `identity: null` in electron-builder config + `CSC_IDENTITY_AUTO_DISCOVERY=false` in CI
- Windows: No signing config
- `forceCodeSigning: false` (default)

## Version Management

Use `npm version` for versioning:
```bash
npm version patch   # 0.1.1
npm version minor   # 0.2.0
npm version major   # 1.0.0
```

Then push the tag to trigger a release:
```bash
git push origin --tags
```
