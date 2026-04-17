// Content Script Wrapper - Blocks execution until authenticated
(async function() {
    'use strict';
    
    // Check authentication before doing anything
    const checkAuth = async () => {
        return new Promise((resolve) => {
            chrome.storage.session.get(['authenticated'], function(result) {
                resolve(!!result.authenticated);
            });
        });
    };
    
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        console.log('🔒 Batman ExamShield: Blocked - Authentication required');
        
        // Block all keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.shiftKey && ['X', 'Z', 'N', 'Q', 'T', 'A'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
            if (e.altKey && ['C', 'O'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);
        
        // Don't inject any scripts
        return;
    }
    
    console.log('✅ Batman ExamShield: Authenticated - Loading features');
    
    // Only inject scripts if authenticated
    function injectScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(src);
            script.onload = () => {
                script.remove();
                resolve();
            };
            script.onerror = reject;
            (document.head || document.documentElement).appendChild(script);
        });
    }
    
    // Inject the actual content scripts only if authenticated
    try {
        await injectScript('data/inject/xPIU7lVB5aBMCrz.js');
        await injectScript('data/inject/QXUjFOs2zO59cpm.js');
    } catch (error) {
        console.error('Failed to inject scripts:', error);
    }
    
})();
