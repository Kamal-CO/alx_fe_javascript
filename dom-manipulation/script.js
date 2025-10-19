// Add these missing functions and enhancements to the existing script.js

// Server simulation constants
const JSON_PLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL = 30000; // 30 seconds
let syncInterval;

/**
 * Step 1: Simulate Server Interaction
 * Setup server simulation using JSONPlaceholder
 */
async function simulateServerInteraction() {
    try {
        // Fetch data from JSONPlaceholder
        const response = await fetch(JSON_PLACEHOLDER_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        
        // Transform to quotes format for our application
        const serverQuotes = posts.slice(0, 5).map((post, index) => ({
            id: post.id,
            text: `${post.title}. ${post.body.substring(0, 100)}...`,
            category: ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success'][index % 5],
            version: 1,
            lastModified: Date.now() - Math.random() * 86400000,
            source: 'server'
        }));
        
        return serverQuotes;
    } catch (error) {
        console.error('Server simulation failed:', error);
        // Fallback to local mock data
        return generateMockServerQuotes();
    }
}

/**
 * Generate mock server quotes for fallback
 */
function generateMockServerQuotes() {
    return [
        {
            id: 101,
            text: "The server says: The only impossible journey is the one you never begin.",
            category: "Motivation",
            version: 1,
            lastModified: Date.now() - 3600000,
            source: 'mock-server'
        },
        {
            id: 102,
            text: "Server update: In the middle of every difficulty lies opportunity.",
            category: "Wisdom", 
            version: 1,
            lastModified: Date.now() - 7200000,
            source: 'mock-server'
        }
    ];
}

/**
 * Step 2: Implement Data Syncing with Conflict Resolution
 * Main sync function that periodically checks for new quotes
 */
async function syncQuotes() {
    try {
        updateSyncUI('syncing', 'Checking for updates from server...');
        
        // Fetch current server data
        const serverQuotes = await simulateServerInteraction();
        
        // Detect conflicts between local and server data
        const conflicts = detectDataConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            // Apply conflict resolution strategy (server takes precedence)
            await resolveConflictsWithServerPrecedence(conflicts, serverQuotes);
            showNotification(`${conflicts.length} conflicts resolved automatically`, 'info');
        } else {
            // No conflicts, merge data
            await mergeServerData(serverQuotes);
            showNotification('Data synced successfully', 'success');
        }
        
        updateSyncUI('success', 'Sync completed');
        updateLastSyncTime();
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncUI('error', `Sync failed: ${error.message}`);
        showNotification('Sync failed. Please try again.', 'error');
    }
}

/**
 * Detect conflicts between local and server data
 */
function detectDataConflicts(serverQuotes) {
    const conflicts = [];
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Check each local quote against server data
    quotes.forEach(localQuote => {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        
        if (serverQuote) {
            // Both have the same quote ID
            if (serverQuote.lastModified > localQuote.lastModified) {
                // Server has newer version
                if (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category) {
                    conflicts.push({
                        type: 'update',
                        local: localQuote,
                        server: serverQuote,
                        message: `Quote was modified on server: "${localQuote.text.substring(0, 50)}..."`
                    });
                }
            }
        }
    });
    
    // Check for quotes deleted on server but existing locally
    serverQuotes.forEach(serverQuote => {
        const localExists = quotes.some(q => q.id === serverQuote.id);
        if (!localExists) {
            conflicts.push({
                type: 'addition',
                server: serverQuote,
                message: `New quote from server: "${serverQuote.text.substring(0, 50)}..."`
            });
        }
    });
    
    return conflicts;
}

/**
 * Step 2: Conflict resolution with server precedence
 */
async function resolveConflictsWithServerPrecedence(conflicts, serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    let updatedQuotes = [...quotes];
    
    conflicts.forEach(conflict => {
        if (conflict.type === 'update') {
            // Server takes precedence - update local quote with server version
            const index = updatedQuotes.findIndex(q => q.id === conflict.server.id);
            if (index !== -1) {
                updatedQuotes[index] = { ...conflict.server };
            }
        } else if (conflict.type === 'addition') {
            // Add server quote that doesn't exist locally
            if (!updatedQuotes.some(q => q.id === conflict.server.id)) {
                updatedQuotes.push({ ...conflict.server });
            }
        }
    });
    
    // Update local data
    quotes = updatedQuotes;
    saveQuotesToStorage();
    updateUIAfterSync();
}

/**
 * Merge server data with local data (no conflicts)
 */
async function mergeServerData(serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    let mergedQuotes = [...quotes];
    
    // Add server quotes that don't exist locally
    serverQuotes.forEach(serverQuote => {
        if (!mergedQuotes.some(q => q.id === serverQuote.id)) {
            mergedQuotes.push({ ...serverQuote });
        }
    });
    
    // Update local data
    quotes = mergedQuotes;
    saveQuotesToStorage();
    updateUIAfterSync();
}

/**
 * Step 3: Enhanced UI elements for conflict resolution
 */
function setupConflictResolutionUI() {
    // Create conflict resolution modal if it doesn't exist
    if (!document.getElementById('conflictResolutionModal')) {
        const modalHTML = `
            <div class="modal" id="conflictResolutionModal" style="display: none;">
                <div class="modal-content">
                    <h2>Data Sync Conflicts Detected</h2>
                    <div id="conflictsList">
                        <!-- Conflicts will be listed here -->
                    </div>
                    <div class="conflict-actions">
                        <h3>Resolution Options:</h3>
                        <button id="useServerData" class="btn btn-primary">Use Server Data</button>
                        <button id="keepLocalData" class="btn btn-secondary">Keep Local Data</button>
                        <button id="manualResolve" class="btn btn-warning">Resolve Manually</button>
                    </div>
                    <div class="modal-footer">
                        <button id="cancelSync" class="btn btn-danger">Cancel Sync</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        document.getElementById('useServerData').addEventListener('click', () => {
            resolveAllConflicts('server');
            hideConflictModal();
        });
        
        document.getElementById('keepLocalData').addEventListener('click', () => {
            resolveAllConflicts('client');
            hideConflictModal();
        });
        
        document.getElementById('manualResolve').addEventListener('click', () => {
            showManualConflictResolution();
        });
        
        document.getElementById('cancelSync').addEventListener('click', () => {
            hideConflictModal();
            updateSyncUI('idle', 'Sync cancelled by user');
        });
    }
}

/**
 * Show manual conflict resolution interface
 */
function showManualConflictResolution() {
    // Implementation for manual conflict-by-conflict resolution
    const conflicts = JSON.parse(localStorage.getItem('pendingConflicts') || '[]');
    if (conflicts.length === 0) return;
    
    const currentConflict = conflicts[0];
    const modalHTML = `
        <div class="modal" id="manualResolutionModal">
            <div class="modal-content">
                <h2>Resolve Conflict</h2>
                <div class="conflict-comparison">
                    <div class="version local-version">
                        <h3>Your Version:</h3>
                        <p class="quote-text">"${currentConflict.local.text}"</p>
                        <span class="category">${currentConflict.local.category}</span>
                    </div>
                    <div class="version server-version">
                        <h3>Server Version:</h3>
                        <p class="quote-text">"${currentConflict.server.text}"</p>
                        <span class="category">${currentConflict.server.category}</span>
                    </div>
                </div>
                <div class="resolution-options">
                    <button class="btn-use-local" data-action="local">Use My Version</button>
                    <button class="btn-use-server" data-action="server">Use Server Version</button>
                    <button class="btn-keep-both" data-action="both">Keep Both</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners for resolution buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            resolveSingleConflict(currentConflict, action);
            document.getElementById('manualResolutionModal').remove();
            
            // Process next conflict or finish
            const remainingConflicts = conflicts.slice(1);
            if (remainingConflicts.length > 0) {
                localStorage.setItem('pendingConflicts', JSON.stringify(remainingConflicts));
                showManualConflictResolution();
            } else {
                localStorage.removeItem('pendingConflicts');
                hideConflictModal();
                showNotification('All conflicts resolved manually', 'success');
            }
        });
    });
}

/**
 * Step 3: Notification system for data updates
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.getElementById('syncNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'syncNotification';
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notificationStyles')) {
        const styles = `
            <style id="notificationStyles">
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                }
                .notification-info { background-color: #17a2b8; }
                .notification-success { background-color: #28a745; }
                .notification-warning { background-color: #ffc107; color: #212529; }
                .notification-error { background-color: #dc3545; }
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * Update sync status UI
 */
function updateSyncUI(status, message) {
    const syncStatus = document.getElementById('syncStatus');
    const syncIndicator = document.getElementById('syncIndicator');
    const syncMessage = document.getElementById('syncMessage');
    
    if (syncStatus && syncIndicator && syncMessage) {
        syncIndicator.className = `sync-indicator sync-${status}`;
        syncMessage.textContent = message;
        
        // Add styles for sync indicator
        if (!document.querySelector('#syncIndicatorStyles')) {
            const styles = `
                <style id="syncIndicatorStyles">
                    .sync-indicator {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        display: inline-block;
                        margin-right: 8px;
                    }
                    .sync-syncing { background-color: #ffc107; animation: pulse 1s infinite; }
                    .sync-success { background-color: #28a745; }
                    .sync-error { background-color: #dc3545; }
                    .sync-idle { background-color: #6c757d; }
                    .sync-conflict { background-color: #fd7e14; animation: pulse 0.5s infinite; }
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }
}

/**
 * Start periodic sync
 */
function startPeriodicSync() {
    // Clear existing interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Start new interval
    syncInterval = setInterval(() => {
        syncQuotes();
    }, SYNC_INTERVAL);
    
    // Do initial sync
    syncQuotes();
    
    updateSyncUI('idle', `Auto-sync enabled (every ${SYNC_INTERVAL/1000}s)`);
}

/**
 * Stop periodic sync
 */
function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    updateSyncUI('idle', 'Auto-sync disabled');
}

/**
 * Manual sync trigger
 */
function triggerManualSync() {
    syncQuotes();
}

/**
 * Step 4: Testing and verification helpers
 */
function setupTestUtilities() {
    // Add test buttons to the UI
    const testControls = document.createElement('div');
    testControls.className = 'test-controls';
    testControls.innerHTML = `
        <h3>Testing Utilities</h3>
        <button id="simulateServerUpdate" class="btn btn-test">Simulate Server Update</button>
        <button id="createConflict" class="btn btn-test">Create Test Conflict</button>
        <button id="resetTestData" class="btn btn-test">Reset Test Data</button>
    `;
    
    document.querySelector('.main-content').appendChild(testControls);
    
    // Test event listeners
    document.getElementById('simulateServerUpdate').addEventListener('click', simulateServerUpdate);
    document.getElementById('createConflict').addEventListener('click', createTestConflict);
    document.getElementById('resetTestData').addEventListener('click', resetTestData);
}

/**
 * Simulate server-side update for testing
 */
function simulateServerUpdate() {
    const testQuote = {
        id: 999,
        text: "Test server update: This quote was modified on the server",
        category: "Testing",
        version: 2,
        lastModified: Date.now(),
        source: 'test-server'
    };
    
    // Save to server simulation
    const serverData = JSON.parse(localStorage.getItem(SERVER_KEY) || '{"quotes":[]}');
    const existingIndex = serverData.quotes.findIndex(q => q.id === 999);
    
    if (existingIndex !== -1) {
        serverData.quotes[existingIndex] = testQuote;
    } else {
        serverData.quotes.push(testQuote);
    }
    
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    showNotification('Server update simulated', 'info');
}

/**
 * Create test conflict for verification
 */
function createTestConflict() {
    // Create a quote that exists both locally and on server with different versions
    const conflictQuote = {
        id: 888,
        text: "Local version of conflicted quote",
        category: "Conflict",
        version: 1,
        lastModified: Date.now() - 10000, // Older than server
        source: 'local'
    };
    
    // Add to local quotes
    if (!quotes.some(q => q.id === 888)) {
        quotes.push(conflictQuote);
        saveQuotesToStorage();
    }
    
    // Create server version with newer timestamp
    const serverQuote = {
        ...conflictQuote,
        text: "Server version of conflicted quote",
        lastModified: Date.now(), // Newer than local
        source: 'server'
    };
    
    const serverData = JSON.parse(localStorage.getItem(SERVER_KEY) || '{"quotes":[]}');
    const existingIndex = serverData.quotes.findIndex(q => q.id === 888);
    
    if (existingIndex !== -1) {
        serverData.quotes[existingIndex] = serverQuote;
    } else {
        serverData.quotes.push(serverQuote);
    }
    
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    showNotification('Test conflict created', 'warning');
}

/**
 * Reset test data
 */
function resetTestData() {
    // Remove test quotes
    quotes = quotes.filter(q => q.id !== 888 && q.id !== 999);
    saveQuotesToStorage();
    
    // Clear server test data
    const serverData = JSON.parse(localStorage.getItem(SERVER_KEY) || '{"quotes":[]}');
    serverData.quotes = serverData.quotes.filter(q => q.id !== 888 && q.id !== 999);
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    
    showNotification('Test data reset', 'success');
}

// Initialize sync system when app loads
function initializeSyncSystem() {
    setupConflictResolutionUI();
    setupTestUtilities();
    startPeriodicSync();
}

// Call this in your main init function
// initializeSyncSystem();