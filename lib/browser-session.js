/**
 * Browser Session - Playwright-based browser control
 * Based on OpenClaw's pw-session.ts
 */

import { chromium } from 'playwright-core';

export class BrowserSession {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.cdpUrl = null;
  }

  /**
   * Connect to Chrome via CDP
   */
  async connect(cdpUrl) {
    this.cdpUrl = cdpUrl;
    
    // Connect to existing Chrome
    this.browser = await chromium.connectOverCDP(cdpUrl);
    
    // Get or create context
    const contexts = this.browser.contexts();
    if (contexts.length > 0) {
      this.context = contexts[0];
    } else {
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
    }
    
    // Get or create page
    const pages = this.context.pages();
    if (pages.length > 0) {
      this.page = pages[0];
    } else {
      this.page = await this.context.newPage();
    }
    
    // Inject stealth scripts
    await this.injectStealthScripts();
    
    console.log('Connected to Chrome');
    return this;
  }

  /**
   * Inject anti-detection scripts
   */
  async injectStealthScripts() {
    await this.page.addInitScript(() => {
      // Remove webdriver flag
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Remove automation flags
      delete window.__playwright;
      delete window.__pw_manual;
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en'],
      });
      
      // Hide automation
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );
    });
  }

  /**
   * Navigate to URL
   */
  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
    return { url: this.page.url(), title: await this.page.title() };
  }

  /**
   * Get page snapshot
   */
  async snapshot() {
    const elements = await this.page.locator('button, input, a, select, textarea').evaluateAll(els => {
      return els.map((el, i) => ({
        ref: `e${i + 1}`,
        tag: el.tagName.toLowerCase(),
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        text: el.textContent?.trim().slice(0, 50),
        role: el.getAttribute('role'),
      }));
    });
    
    return {
      url: this.page.url(),
      title: await this.page.title(),
      elements,
    };
  }

  /**
   * Click element
   */
  async click(ref) {
    const index = parseInt(ref.replace('e', '')) - 1;
    const elements = await this.page.locator('button, input, a, select, textarea').all();
    if (index >= 0 && index < elements.length) {
      await elements[index].click();
      return { success: true };
    }
    throw new Error(`Element ${ref} not found`);
  }

  /**
   * Fill input
   */
  async fill(ref, text) {
    const index = parseInt(ref.replace('e', '')) - 1;
    const elements = await this.page.locator('input, textarea, select').all();
    if (index >= 0 && index < elements.length) {
      await elements[index].fill(text);
      return { success: true };
    }
    throw new Error(`Element ${ref} not found`);
  }

  /**
   * Take screenshot
   */
  async screenshot(options = {}) {
    const { path, fullPage = false } = options;
    return await this.page.screenshot({
      path,
      fullPage,
    });
  }

  /**
   * Get page content
   */
  async getContent() {
    return await this.page.content();
  }

  /**
   * Evaluate JavaScript
   */
  async evaluate(fn) {
    return await this.page.evaluate(fn);
  }

  /**
   * Close session
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default BrowserSession;
