// Authentication check for content scripts
// This must be injected before any other scripts

let isAuthenticated = false;
let extensionBlocked = true;
let scriptsInjected = false;

// Check authentication status
async function checkAuthentication() {
    return new Promise((resolve) => {
        chrome.storage.session.get(['authenticated'], function(result) {
            isAuthenticated = !!result.authenticated;
            extensionBlocked = !isAuthenticated;
            resolve(isAuthenticated);
        });
    });
}

// Inject main content script only when authenticated
// DEPRECATED: Injection is now handled by background script

// Initialize authentication check
(async function initAuth() {
    await checkAuthentication();
    if (!isAuthenticated) {
        console.log('❌ Batman ExamShield: Authentication required - all features blocked');
    } else {
        console.log('✅ Batman ExamShield: Authenticated - features enabled');
        // Scripts are injected by background.js
    }
})();

// Block all extension functionality until authenticated
async function ensureAuthenticated() {
    const authenticated = await checkAuthentication();
    
    if (!authenticated) {
        console.log('❌ Extension blocked: Authentication required');
        showAuthRequiredToast();
        return false;
    }
    
    console.log('✅ Extension authenticated');
    return true;
}

function showAuthRequiredToast() {
    // Remove any existing toast
    const existingToast = document.getElementById('batman-auth-required-toast');
    if (existingToast) return;
    
    const toast = document.createElement('div');
    toast.id = 'batman-auth-required-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
        color: #FFD700;
        padding: 16px 24px;
        border-radius: 8px;
        border: 2px solid #FFD700;
        font-family: monospace;
        font-weight: bold;
        z-index: 999999;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        animation: fadeIn 0.3s ease-in-out;
    `;
    toast.textContent = '🔒 Batman ExamShield: Please authenticate in extension popup to use features';
    
    // Add fadeIn animation
    if (!document.getElementById('batman-auth-toast-style')) {
        const style = document.createElement('style');
        style.id = 'batman-auth-toast-style';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Listen for authentication success
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authenticationSuccess') {
        isAuthenticated = true;
        extensionBlocked = false;
        console.log('✅ Authentication successful - enabling features');
        
        // Remove any auth required toasts
        const toast = document.getElementById('batman-auth-required-toast');
        if (toast) toast.remove();
        
        // Set global flag for other scripts
        window.BATMAN_AUTHENTICATED = true;
        
        // Dispatch custom event for scripts that need to know
        window.dispatchEvent(new CustomEvent('batmanAuthSuccess'));
    }
});

// Block keyboard shortcuts until authenticated
document.addEventListener('keydown', async function(e) {
    // Check current auth status
    await checkAuthentication();
    
    if (!isAuthenticated) {
        // Check for extension shortcuts
        if (e.altKey && e.shiftKey && ['X', 'Z', 'N', 'Q', 'T', 'A'].includes(e.key.toUpperCase())) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showAuthRequiredToast();
            return false;
        }
        if (e.altKey && ['C', 'O'].includes(e.key.toUpperCase())) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showAuthRequiredToast();
            return false;
        }
    }
}, true);

// Export for use in other scripts
window.ensureAuthenticated = ensureAuthenticated;
window.checkAuthentication = checkAuthentication;
window.isExtensionAuthenticated = () => isAuthenticated;
window.BATMAN_AUTHENTICATED = isAuthenticated;
