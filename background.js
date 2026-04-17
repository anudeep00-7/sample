// Background service worker for Batman ExamShield

const SCRIPT_ID = 'batman-main-script';
const SCRIPT_FILE = 'contentScript.js';

// Initialize: Ensure clean state on startup
chrome.runtime.onStartup.addListener(async () => {
    await resetState();
});

chrome.runtime.onInstalled.addListener(async () => {
    await resetState();
});

async function resetState() {
    // Clear session storage
    await chrome.storage.session.clear();
    
    // Unregister content scripts if they exist
    try {
        await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    } catch (e) {
        // Ignore error if script wasn't registered
    }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authenticationSuccess') {
        handleAuthentication();
    }
});

async function handleAuthentication() {
    try {
        // 1. Register content script for future navigations
        // Check if already registered to avoid error
        const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
        if (existing.length === 0) {
            await chrome.scripting.registerContentScripts([{
                id: SCRIPT_ID,
                js: [SCRIPT_FILE],
                matches: ['<all_urls>'],
                runAt: 'document_start',
                allFrames: true
            }]);
            console.log('? Content script registered successfully');
        }

        // 2. Inject into currently open tabs
        const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
        for (const tab of tabs) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    files: [SCRIPT_FILE]
                });
            } catch (e) {
                // Ignore errors for restricted tabs
            }
        }
    } catch (e) {
        console.error('Failed to enable extension:', e);
    }
}
