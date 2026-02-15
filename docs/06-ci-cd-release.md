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
  build-and-release:
    strategy:
      matrix:
        include:
          - os: macos-latest
            targets: dmg,zip
          - os: ubuntu-latest
            targets: AppImage,deb
          - os: windows-latest
            targets: nsis,portable
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - name: Build Electron packages
        run: npx electron-builder --${{ matrix.targets }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*
          draft: true
```

## Build Targets

| Platform | Format | Architecture |
|----------|--------|-------------|
| macOS | `.dmg`, `.zip` | x64, arm64 (universal) |
| Linux | `.AppImage`, `.deb` | x64, arm64 |
| Windows | `.exe` (NSIS), portable | x64 |

## electron-builder Configuration

```yaml
# electron-builder.yml
appId: com.cocopilot.app
productName: Cocopilot
directories:
  output: dist
  buildResources: build
files:
  - out/**/*
  - '!external/**'
  - '!docs/**'
  - '!test/**'
mac:
  category: public.app-category.developer-tools
  target:
    - target: dmg
      arch: [universal]
    - target: zip
      arch: [universal]
linux:
  target:
    - target: AppImage
      arch: [x64, arm64]
    - target: deb
      arch: [x64, arm64]
  category: Development
win:
  target:
    - target: nsis
      arch: [x64]
    - target: portable
      arch: [x64]
```

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
