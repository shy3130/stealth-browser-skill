/**
 * Chrome Launcher - Based on OpenClaw's chrome.ts
 * Launches Chrome with anti-detection parameters
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_PORT = 18792;
const CONFIG_DIR = path.join(os.homedir(), '.stealth-browser');

/**
 * Find Chrome executable for the current platform
 */
export function findChromeExecutable() {
  const platform = process.platform;
  
  const possiblePaths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/chromium',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
  };
  
  const paths = possiblePaths[platform] || [];
  
  for (const chromePath of paths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  // Try to find in PATH
  try {
    const { execSync } = await import('node:child_process');
    const result = execSync('which google-chrome || which chromium || which chromium-browser', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const found = result.trim();
    if (found) return found;
  } catch {
    // ignore
  }
  
  throw new Error('Chrome not found. Please install Google Chrome or Chromium.');
}

/**
 * Get user data directory for a profile
 */
export function getUserDataDir(profileName = 'default') {
  const userDataDir = path.join(CONFIG_DIR, 'profiles', profileName);
  fs.mkdirSync(userDataDir, { recursive: true });
  return userDataDir;
}

/**
 * Launch Chrome with anti-detection parameters
 */
export async function launchChrome(options = {}) {
  const {
    port = DEFAULT_PORT,
    profileName = 'default',
    headless = false,
    noSandbox = false,
    extraArgs = [],
  } = options;
  
  const executablePath = await findChromeExecutable();
  const userDataDir = getUserDataDir(profileName);
  
  // Anti-detection arguments (from OpenClaw)
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-features=Translate,MediaRouter',
    '--disable-session-crashed-bubble',
    '--hide-crash-restore-bubble',
    '--password-store=basic',
    // Additional anti-detection
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
  ];
  
  if (headless) {
    args.push('--headless=new');
    args.push('--disable-gpu');
  }
  
  if (noSandbox) {
    args.push('--no-sandbox');
    args.push('--disable-setuid-sandbox');
  }
  
  if (process.platform === 'linux') {
    args.push('--disable-dev-shm-usage');
  }
  
  args.push(...extraArgs);
  args.push('about:blank');
  
  console.log(`Launching Chrome on port ${port}...`);
  console.log(`Profile: ${userDataDir}`);
  
  const proc = spawn(executablePath, args, {
    stdio: 'pipe',
    detached: false,
  });
  
  // Wait for Chrome to be ready
  await waitForChrome(port);
  
  return {
    pid: proc.pid,
    port,
    userDataDir,
    cdpUrl: `http://127.0.0.1:${port}`,
    process: proc,
  };
}

/**
 * Wait for Chrome CDP to be ready
 */
async function waitForChrome(port, timeoutMs = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        console.log('Chrome is ready!');
        return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  throw new Error(`Chrome failed to start within ${timeoutMs}ms`);
}

/**
 * Stop Chrome
 */
export function stopChrome(proc) {
  if (proc && !proc.killed) {
    proc.kill('SIGTERM');
  }
}

/**
 * Get Chrome WebSocket URL
 */
export async function getChromeWsUrl(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  const data = await response.json();
  return data.webSocketDebuggerUrl;
}
