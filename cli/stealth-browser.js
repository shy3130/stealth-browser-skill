#!/usr/bin/env node
/**
 * Stealth Browser CLI
 * Command-line interface for browser automation
 */

import { launchChrome, stopChrome, getChromeWsUrl } from '../lib/chrome-launcher.js'
import { BrowserSession } from '../lib/browser-session.js'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DEFAULT_PORT = 18792
const STATE_FILE = path.join(process.env.HOME, '.stealth-browser', 'state.json')

async function detectCdpUrl(port) {
    const candidates = [`http://127.0.0.1:${port}`, `http://[::1]:${port}`, `http://localhost:${port}`]

    for (const baseUrl of candidates) {
        try {
            const res = await fetch(`${baseUrl}/json/version`)
            if (res.ok) return baseUrl
        } catch {
            // ignore
        }
    }

    return null
}

function profileLocked(profile) {
    try {
        const lockPath = path.join(os.homedir(), '.stealth-browser', 'profiles', profile, 'SingletonLock')
        fs.lstatSync(lockPath)
        return true
    } catch {
        return false
    }
}

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
    } catch {
        return null
    }
}

function saveState(state) {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function clearState() {
    try {
        fs.unlinkSync(STATE_FILE)
    } catch {
        // ignore
    }
}

const commands = {
    /**
     * Start browser
     */
    async start(args) {
        const profile = args[0] || 'default'
        const headless = args.includes('--headless')

        console.log(`Starting Chrome with profile: ${profile}`)

        if (profileLocked(profile)) {
            const cdpUrl = await detectCdpUrl(DEFAULT_PORT)
            if (cdpUrl) {
                saveState({
                    pid: null,
                    port: DEFAULT_PORT,
                    cdpUrl,
                    profile
                })

                console.log(`✓ Chrome already running on port ${DEFAULT_PORT}`)
                console.log(`  CDP URL: ${cdpUrl}`)
                return { pid: null, port: DEFAULT_PORT, cdpUrl, profile }
            }
        }

        const chrome = await launchChrome({
            port: DEFAULT_PORT,
            profileName: profile,
            headless
        })

        saveState({
            pid: chrome.pid,
            port: chrome.port,
            cdpUrl: chrome.cdpUrl,
            profile
        })

        console.log(`✓ Chrome started on port ${chrome.port}`)
        console.log(`  CDP URL: ${chrome.cdpUrl}`)
        console.log(`  Profile: ${chrome.userDataDir}`)

        return chrome
    },

    /**
     * Stop browser
     */
    async stop() {
        const state = loadState()
        if (!state) {
            console.log('No running browser found')
            return
        }

        console.log(`Stopping Chrome on port ${state.port}...`)

        try {
            const session = new BrowserSession()
            await session.connect(state.cdpUrl)
            await session.close()
        } catch {
            // ignore
        }

        clearState()
        console.log('✓ Chrome stopped')
    },

    /**
     * Open URL
     */
    async open(args) {
        const url = args[0]
        if (!url) {
            console.error('Usage: stealth-browser open <url>')
            process.exit(1)
        }

        let state = loadState()

        // Start browser if not running
        if (!state) {
            console.log('Browser not running, starting...')
            await commands.start(['default'])
            state = loadState()
        }

        const session = new BrowserSession()
        await session.connect(state.cdpUrl)

        console.log(`Opening ${url}...`)
        const result = await session.navigate(url)

        console.log(`✓ Opened: ${result.title}`)
        console.log(`  URL: ${result.url}`)

        await session.close()
    },

    /**
     * Get page snapshot
     */
    async snapshot() {
        const state = loadState()
        if (!state) {
            console.error('Browser not running. Run: stealth-browser start')
            process.exit(1)
        }

        const session = new BrowserSession()
        await session.connect(state.cdpUrl)

        const snapshot = await session.snapshot()

        console.log(`URL: ${snapshot.url}`)
        console.log(`Title: ${snapshot.title}`)
        console.log('\nElements:')

        for (const el of snapshot.elements) {
            const type = el.type || el.tag
            const text = el.text || el.placeholder || el.name || ''
            console.log(`  @${el.ref} [${type}] ${text.slice(0, 40)}`)
        }

        await session.close()
    },

    /**
     * Click element
     */
    async click(args) {
        const ref = args[0]
        if (!ref) {
            console.error('Usage: stealth-browser click <ref>')
            process.exit(1)
        }

        const state = loadState()
        if (!state) {
            console.error('Browser not running')
            process.exit(1)
        }

        const session = new BrowserSession()
        await session.connect(state.cdpUrl)

        await session.click(ref)
        console.log(`✓ Clicked ${ref}`)

        await session.close()
    },

    /**
     * Fill input
     */
    async fill(args) {
        const ref = args[0]
        const text = args[1]

        if (!ref || !text) {
            console.error('Usage: stealth-browser fill <ref> <text>')
            process.exit(1)
        }

        const state = loadState()
        if (!state) {
            console.error('Browser not running')
            process.exit(1)
        }

        const session = new BrowserSession()
        await session.connect(state.cdpUrl)

        await session.fill(ref, text)
        console.log(`✓ Filled ${ref} with "${text}"`)

        await session.close()
    },

    /**
     * Take screenshot
     */
    async screenshot(args) {
        const outputPath = args[0] || 'screenshot.png'
        const fullPage = args.includes('--full')

        const state = loadState()
        if (!state) {
            console.error('Browser not running')
            process.exit(1)
        }

        const session = new BrowserSession()
        await session.connect(state.cdpUrl)

        await session.screenshot({ path: outputPath, fullPage })
        console.log(`✓ Screenshot saved to ${outputPath}`)

        await session.close()
    },

    /**
     * Show help
     */
    help() {
        console.log(`
Stealth Browser CLI

Commands:
  start [profile] [--headless]   Start Chrome browser
  stop                           Stop Chrome browser
  open <url>                     Open URL in browser
  snapshot                       Get page snapshot with element refs
  click <ref>                    Click element (e.g., @e1)
  fill <ref> <text>              Fill input field
  screenshot [path] [--full]     Take screenshot
  help                           Show this help

Examples:
  stealth-browser start
  stealth-browser open https://example.com
  stealth-browser snapshot
  stealth-browser click @e1
  stealth-browser fill @e2 "hello"
  stealth-browser screenshot --full
`)
    }
}

// Main
async function main() {
    const [cmd, ...args] = process.argv.slice(2)

    if (!cmd || cmd === 'help') {
        commands.help()
        return
    }

    const command = commands[cmd]
    if (!command) {
        console.error(`Unknown command: ${cmd}`)
        commands.help()
        process.exit(1)
    }

    try {
        await command(args)
    } catch (err) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
    }
}

main()
