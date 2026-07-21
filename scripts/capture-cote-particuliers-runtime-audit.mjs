import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = Number(process.env.AUDIT_PORT || 4191)
const baseUrl = `http://127.0.0.1:${port}`
const route = '/golden/cote-particuliers-tarbes'
const outputRoot = join(root, 'docs/runtime-renderer-audit/cote-particuliers')
const chromeUserDataDir = join(root, `.tmp-chrome-runtime-audit-${Date.now()}`)
const distRoot = join(root, 'dist')
const debugPort = Number(process.env.AUDIT_CHROME_DEBUG_PORT || 9227)

if (!existsSync(chromePath)) throw new Error(`Chrome introuvable: ${chromePath}`)
if (!existsSync(join(distRoot, 'index.html'))) throw new Error('dist/index.html absent. Lancez npm run build avant la capture.')

mkdirSync(outputRoot, { recursive: true })

const server = createStaticServer()
let browser

try {
  await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen))
  await waitForServer(`${baseUrl}/`)
  browser = await launchChrome()
  writeCssCascadeInventory()

  for (const mode of ['source-originale', 'images-locales-audit']) {
    await captureMode(mode)
  }

  const local1440 = readJson(join(outputRoot, 'images-locales-audit/dom-1440.json'))
  writeFileSync(
    join(outputRoot, 'render-contract-snapshot.json'),
    `${JSON.stringify(local1440.renderContract, null, 2)}\n`,
  )
  writeConsumptionMatrix(local1440)
} finally {
  if (browser) browser.kill()
  server.close()
  await delay(500)
  try {
    rmSync(chromeUserDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 })
  } catch {
    // Chrome can keep Crashpad handles briefly on Windows; the audit artifacts are already written.
  }
}

async function captureMode(mode) {
  const modeDir = join(outputRoot, mode)
  mkdirSync(modeDir, { recursive: true })

  const dom1440 = await dumpAuditJson(mode, 1440, 1000)
  const dom390 = await dumpAuditJson(mode, 390, 1000)
  writeFileSync(join(modeDir, 'dom-1440.json'), `${JSON.stringify(dom1440, null, 2)}\n`)
  writeFileSync(join(modeDir, 'dom-390.json'), `${JSON.stringify(dom390, null, 2)}\n`)

  if (mode === 'images-locales-audit') {
    writeFileSync(join(outputRoot, 'dom-1440.json'), `${JSON.stringify(dom1440, null, 2)}\n`)
    writeFileSync(join(outputRoot, 'dom-390.json'), `${JSON.stringify(dom390, null, 2)}\n`)
  }

  const shots = [
    ['desktop-1440-hero.png', 1440, 900, '', false],
    ['desktop-1440-properties.png', 1440, 900, '#properties-selection', false],
    ['desktop-1440-full.png', 1440, 1200, '', true],
    ['mobile-390-navigation.png', 390, 760, '', false],
    ['mobile-390-hero.png', 390, 900, '', false],
    ['mobile-390-properties.png', 390, 900, '#properties-selection', false],
    ['mobile-390-full.png', 390, 1200, '', true],
  ]

  for (const [name, width, height, hash, fullPage] of shots) {
    await captureScreenshot(`${baseUrl}${route}?auditImages=${mode === 'images-locales-audit' ? 'local' : 'source'}${hash}`, width, height, join(modeDir, name), Boolean(fullPage))
  }
}

async function dumpAuditJson(mode, width, height) {
  const client = await openPage(`${baseUrl}${route}?auditImages=${mode === 'images-locales-audit' ? 'local' : 'source'}&auditProbe=1`, width, height)
  try {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const result = await client.send('Runtime.evaluate', {
        expression: 'document.getElementById("runtime-audit-json")?.textContent || ""',
        returnByValue: true,
      })
      const value = result.result?.value
      if (value) return JSON.parse(value)
      await delay(250)
    }
    const html = await client.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    })
    writeFileSync(join(outputRoot, `${mode}-dump-${width}.html`), html.result?.value ?? '')
    throw new Error(`Snapshot DOM introuvable pour ${mode} ${width}px`)
  } finally {
    client.close()
  }
}

function writeConsumptionMatrix(snapshot) {
  const contract = snapshot.renderContract
  const dom = snapshot.dom
  const matrix = [
    row('hero.layout', contract.hero.layout, '.od-hero', dom.hero?.className, '--od-render-hero-height', true, false),
    row('hero.section.variant', 'editorial-split', '.od-hero', dom.hero?.className, 'od-public-page-hero-variant-editorial-split', String(dom.hero?.className ?? '').includes('editorial-split'), false),
    row('hero.imageRole', snapshot.publicPage.imageRoles.hero, '.od-hero-image', dom.heroImage?.currentSrc, 'src', Boolean(dom.heroImage?.naturalWidth), Boolean(dom.heroImage?.broken)),
    row('hero.title', snapshot.publicPage.sections.find((section) => section.type === 'hero')?.title, '.od-hero-content h1', dom.heroTitle?.textContent, 'text node', Boolean(dom.heroTitle?.textContent), false),
    row('navigation.surface', contract.navigation.surface, '.od-public-nav', dom.navigation?.className, '--od-render-nav-background', true, false),
    row('typography.heading', contract.typography.headingFontFamily, 'h1/h2', dom.heroTitle?.computed?.fontFamily, '--od-render-heading-font', String(dom.heroTitle?.computed?.fontFamily ?? '').includes('Cormorant'), false),
    row('layout.sectionOrder', snapshot.publicPage.desktopOrder.join(','), '.od-public-section', dom.sections?.map((section) => section.id).join(','), 'order', true, false),
    row('propertyCards.variant', contract.propertyCards.variant, '.od-property-card', dom.cards?.[0]?.className, 'od-property-card-*', true, false),
    row('propertyCards.imageRatio', contract.propertyCards.imageRatio, '.od-property-card img', dom.cards?.[0]?.image?.computed?.aspectRatio, 'aspect-ratio', Boolean(dom.cards?.[0]?.image?.present), false),
    row('footer.layout', contract.footer.layout, '.od-agency-footer', dom.footer?.computed?.display, '--od-render-footer-columns', Boolean(dom.footer?.present), false),
  ]
  writeFileSync(join(outputRoot, 'consumption-matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`)
}

function row(decision, resolved, component, applied, token, appliedOk, overwritten) {
  return {
    decision,
    resolved,
    component,
    propClassStyle: applied,
    token,
    applied: Boolean(appliedOk),
    overwritten: Boolean(overwritten),
    fallbackUsed: !resolved,
  }
}

function writeCssCascadeInventory() {
  const cssPath = join(root, 'src/components/demo-template-immobilier/opus-domus-template.css')
  const lines = readFileSync(cssPath, 'utf8').split(/\r?\n/)
  const selectors = [
    '.od-hero',
    '.od-hero-image',
    '.od-hero-content',
    '.od-public-nav',
    '.od-public-page-hero-variant-editorial-split',
    '.od-public-page-properties--featured-first',
    '.od-property-card',
    '.od-agency-footer',
    '@media',
  ]
  const inventory = selectors.map((selector) => ({
    selector,
    matches: lines
      .map((line, index) => ({ line: index + 1, text: line.trim() }))
      .filter((entry) => entry.text.includes(selector))
      .slice(0, 40),
  }))
  writeFileSync(join(outputRoot, 'css-cascade-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function waitForServer(url) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // wait
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500))
  }
  throw new Error(`Serveur statique non joignable: ${url}`)
}

async function launchChrome() {
  const child = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeUserDataDir}`,
    'about:blank',
  ], {
    stdio: 'ignore',
  })
  await waitForServer(`http://127.0.0.1:${debugPort}/json/version`)
  return child
}

async function openPage(url, width, height) {
  const target = await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  const client = await createCdpClient(target.webSocketDebuggerUrl)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
  const loaded = client.waitFor('Page.loadEventFired', 15_000)
  await client.send('Page.navigate', { url })
  await loaded.catch(() => undefined)
  await delay(1000)
  return client
}

async function captureScreenshot(url, width, height, path, fullPage) {
  const client = await openPage(url, width, height)
  try {
    const hash = new URL(url).hash.slice(1)
    if (hash) {
      await client.send('Runtime.evaluate', {
        expression: `document.getElementById(${JSON.stringify(hash)})?.scrollIntoView({ block: 'start' })`,
        returnByValue: true,
      })
      await delay(750)
    }
    const result = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: fullPage,
      fromSurface: true,
    })
    writeFileSync(path, Buffer.from(result.data, 'base64'))
  } finally {
    client.close()
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return response.json()
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl)
  let nextId = 1
  const pending = new Map()
  const waiters = new Map()

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve: resolvePending, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else resolvePending(message.result)
      return
    }
    const waiting = waiters.get(message.method)
    if (waiting) {
      waiters.delete(message.method)
      waiting(message.params)
    }
  })

  return new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', () => {
      resolveOpen({
        send(method, params = {}) {
          const id = nextId
          nextId += 1
          socket.send(JSON.stringify({ id, method, params }))
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolve: resolveSend, reject: rejectSend })
          })
        },
        waitFor(method, timeoutMs) {
          return new Promise((resolveWait, rejectWait) => {
            const timeout = setTimeout(() => {
              waiters.delete(method)
              rejectWait(new Error(`Timeout CDP ${method}`))
            }, timeoutMs)
            waiters.set(method, (params) => {
              clearTimeout(timeout)
              resolveWait(params)
            })
          })
        },
        close() {
          socket.close()
        },
      })
    }, { once: true })
    socket.addEventListener('error', rejectOpen, { once: true })
  })
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function createStaticServer() {
  return createServer((request, response) => {
    const rawPath = decodeURIComponent((request.url ?? '/').split('?')[0].split('#')[0])
    const normalizedPath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '')
    const requestedPath = join(distRoot, normalizedPath === '/' ? 'index.html' : normalizedPath)
    const filePath = requestedPath.startsWith(distRoot) && existsSync(requestedPath) && statSync(requestedPath).isFile()
      ? requestedPath
      : join(distRoot, 'index.html')

    response.writeHead(200, { 'Content-Type': contentType(filePath) })
    response.end(readFileSync(filePath))
  })
}

function contentType(path) {
  const extension = extname(path)
  if (extension === '.html') return 'text/html; charset=utf-8'
  if (extension === '.js') return 'text/javascript; charset=utf-8'
  if (extension === '.css') return 'text/css; charset=utf-8'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}
