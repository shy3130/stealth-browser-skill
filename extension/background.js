/**
 * Stealth Browser Extension - Background Script
 * Based on OpenClaw's extension
 */

const DEFAULT_PORT = 18792;
const RELAY_AUTH_HEADER = 'x-stealth-browser-token';

let relayWs = null;
let relayPort = DEFAULT_PORT;
let nextSession = 1;
const tabs = new Map();
const tabBySession = new Map();
const pending = new Map();

/**
 * Get relay port from storage
 */
async function getRelayPort() {
  const stored = await chrome.storage.local.get(['relayPort']);
  const port = parseInt(stored.relayPort, 10);
  return port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}

/**
 * Build WebSocket URL
 */
function buildRelayWsUrl(port) {
  return `ws://127.0.0.1:${port}`;
}

/**
 * Connect to relay server
 */
async function connectRelay() {
  if (relayWs?.readyState === WebSocket.OPEN) {
    return;
  }
  
  relayPort = await getRelayPort();
  const wsUrl = buildRelayWsUrl(relayPort);
  
  console.log(`Connecting to relay at ${wsUrl}...`);
  
  relayWs = new WebSocket(wsUrl);
  
  relayWs.onopen = () => {
    console.log('Connected to relay');
    sendToRelay({ method: 'ping' });
  };
  
  relayWs.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleRelayMessage(message);
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  };
  
  relayWs.onclose = () => {
    console.log('Relay connection closed');
    relayWs = null;
    // Reconnect after delay
    setTimeout(connectRelay, 3000);
  };
  
  relayWs.onerror = (err) => {
    console.error('Relay error:', err);
  };
}

/**
 * Send message to relay
 */
function sendToRelay(message) {
  if (relayWs?.readyState === WebSocket.OPEN) {
    relayWs.send(JSON.stringify(message));
  }
}

/**
 * Handle relay message
 */
async function handleRelayMessage(message) {
  const { id, method, params } = message;
  
  if (method === 'pong') {
    return;
  }
  
  if (method === 'forwardCDPCommand') {
    const { method: cdpMethod, params: cdpParams, sessionId } = params;
    await handleCDPCommand(id, cdpMethod, cdpParams, sessionId);
  }
}

/**
 * Handle CDP command
 */
async function handleCDPCommand(id, method, params, sessionId) {
  const tabId = tabBySession.get(sessionId);
  if (!tabId) {
    sendToRelay({ id, error: 'Session not found' });
    return;
  }
  
  try {
    // Execute CDP command
    const result = await chrome.debugger.sendCommand(
      { tabId },
      method,
      params
    );
    
    sendToRelay({ id, result });
  } catch (err) {
    sendToRelay({ id, error: err.message });
  }
}

/**
 * Attach to tab
 */
async function attachToTab(tabId) {
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    
    const sessionId = `session-${nextSession++}`;
    tabs.set(tabId, { sessionId, state: 'connected' });
    tabBySession.set(sessionId, tabId);
    
    // Listen for debugger events
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (source.tabId === tabId) {
        const session = tabs.get(tabId)?.sessionId;
        if (session) {
          sendToRelay({
            method: 'forwardCDPEvent',
            params: { method, params, sessionId: session },
          });
        }
      }
    });
    
    // Enable domains
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable');
    await chrome.debugger.sendCommand({ tabId }, 'DOM.enable');
    
    console.log(`Attached to tab ${tabId}, session ${sessionId}`);
    
    // Notify relay
    sendToRelay({
      method: 'attached',
      params: { sessionId, tabId },
    });
    
    return sessionId;
  } catch (err) {
    console.error(`Failed to attach to tab ${tabId}:`, err);
    throw err;
  }
}

/**
 * Detach from tab
 */
async function detachFromTab(tabId) {
  try {
    await chrome.debugger.detach({ tabId });
    
    const tab = tabs.get(tabId);
    if (tab) {
      tabBySession.delete(tab.sessionId);
      tabs.delete(tabId);
    }
    
    console.log(`Detached from tab ${tabId}`);
  } catch (err) {
    console.error(`Failed to detach from tab ${tabId}:`, err);
  }
}

/**
 * Inject stealth scripts
 */
async function injectStealthScripts(tabId) {
  try {
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
      expression: `
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Remove automation flags
        delete window.__playwright;
        delete window.__pw_manual;
        delete window.__selenium;
        delete window.callPhantom;
        delete window._phantom;
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
            { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll' },
          ],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh', 'en-US', 'en'],
        });
        
        // Hide automation
        const originalQuery = window.navigator.permissions?.query;
        if (originalQuery) {
          window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications'
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery(parameters)
          );
        }
        
        // Override permissions
        Object.defineProperty(navigator, 'permissions', {
          value: {
            query: () => Promise.resolve({ state: 'prompt' }),
          },
        });
        
        console.log('Stealth scripts injected');
      `,
    });
  } catch (err) {
    console.error('Failed to inject stealth scripts:', err);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabs.has(tabId)) {
    injectStealthScripts(tabId);
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabs.has(tabId)) {
    detachFromTab(tabId);
  }
});

// Initialize
console.log('Stealth Browser Extension loaded');
connectRelay();
