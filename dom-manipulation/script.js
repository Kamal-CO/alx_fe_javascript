// Add these functions to the existing script.js file

/**
 * Start periodic synchronization using setInterval
 * This implements periodic data fetching from the server
 */
function startPeriodicSync() {
    // Clear any existing interval first
    stopPeriodicSync();
    
    // Start new interval for periodic sync
    syncInterval = setInterval(() => {
        console.log('Periodic sync triggered by setInterval');
        addSyncLogEntry('Auto-sync triggered by setInterval', 'info');
        
        // Check if we should sync (has changes or auto-sync is enabled)
        if (hasLocalChanges() || autoSyncCheckbox.checked) {
            syncQuotes();
        } else {
            addSyncLogEntry('Auto-sync skipped: no local changes', 'info');
        }
    }, SYNC_INTERVAL);
    
    updateSyncUI('idle', `Auto-sync enabled (every ${SYNC_INTERVAL/1000}s)`);
    addSyncLogEntry(`Periodic sync started with setInterval (${SYNC_INTERVAL/1000} seconds)`, 'success');
    
    // Do initial sync immediately
    setTimeout(() => {
        syncQuotes();
    }, 2000);
}

/**
 * Stop periodic synchronization
 */
function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        addSyncLogEntry('Periodic sync stopped', 'info');
    }
}

/**
 * Initialize periodic sync with setInterval
 */
function initializePeriodicSync() {
    // Set up sync interval based on user preference
    if (autoSyncCheckbox.checked) {
        startPeriodicSync();
    } else {
        updateSyncUI('idle', 'Auto-sync disabled');
    }
    
    // Add event listener for auto-sync toggle
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', function() {
            if (this.checked) {
                startPeriodicSync();
            } else {
                stopPeriodicSync();
                updateSyncUI('idle', 'Auto-sync disabled');
            }
        });
    }
}

/**
 * Enhanced sync function that works with setInterval
 */
async function syncQuotes() {
    try {
        // Don't sync if already syncing
        if (window.isSyncing) {
            addSyncLogEntry('Sync skipped: already in progress', 'info');
            return;
        }
        
        window.isSyncing = true;
        updateSyncUI('syncing', 'Fetching updates from server...');
        
        // Fetch from JSONPlaceholder API
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.error);
        }
        
        const serverQuotes = serverResponse.quotes;
        addSyncLogEntry(`Retrieved ${serverQuotes.length} quotes via setInterval sync`, 'info');
        
        // Detect conflicts
        const conflicts = detectDataConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            await handleSyncConflicts(conflicts, serverQuotes);
        } else {
            await mergeServerData(serverQuotes);
        }
        
        // Update sync state
        completeSyncProcess();
        
    } catch (error) {
        handleSyncError(error);
    } finally {
        window.isSyncing = false;
    }
}

/**
 * Set up multiple intervals for different sync features
 */
function setupAllIntervals() {
    // Main sync interval
    initializePeriodicSync();
    
    // UI update interval (every 5 seconds)
    setInterval(() => {
        updateLastSyncTime();
        updatePendingChanges();
    }, 5000);
    
    // Sync status check interval (every 10 seconds)
    setInterval(() => {
        checkSyncHealth();
    }, 10000);
    
    addSyncLogEntry('All setInterval timers initialized', 'success');
}

/**
 * Check sync system health
 */
function checkSyncHealth() {
    const now = Date.now();
    const lastSync = lastSyncTimestamp || 0;
    const timeSinceLastSync = now - lastSync;
    
    // Alert if no successful sync in last 2 minutes
    if (timeSinceLastSync > 120000 && autoSyncCheckbox.checked) {
        updateSyncUI('error', 'No successful sync in 2 minutes');
        addSyncLogEntry('Sync health check: No recent successful syncs', 'warning');
    }
}

/**
 * Update last sync time display
 */
function updateLastSyncTime() {
    const lastSyncElement = document.getElementById('lastSyncTime');
    if (lastSyncElement && lastSyncTimestamp) {
        const timeDiff = Date.now() - lastSyncTimestamp;
        const minutes = Math.floor(timeDiff / 60000);
        
        if (minutes < 1) {
            lastSyncElement.textContent = 'Just now';
        } else if (minutes === 1) {
            lastSyncElement.textContent = '1 minute ago';
        } else {
            lastSyncElement.textContent = `${minutes} minutes ago`;
        }
    } else if (lastSyncElement) {
        lastSyncElement.textContent = 'Never';
    }
}

/**
 * Update pending changes display
 */
function updatePendingChanges() {
    const pendingElement = document.getElementById('pendingChanges');
    if (pendingElement) {
        const changes = hasLocalChanges() ? 1 : 0;
        pendingElement.textContent = changes;
        pendingChanges = changes > 0;
    }
}

/**
 * Demo function showing different setInterval use cases
 */
function setupSyncDemoIntervals() {
    // Demo: Simulate server changes every 45 seconds
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance
            simulateServerChange();
        }
    }, 45000);
    
    // Demo: Rotate sync status messages every 15 seconds
    setInterval(() => {
        rotateStatusMessages();
    }, 15000);
    
    // Demo: Auto-save local changes every 20 seconds
    setInterval(() => {
        if (hasLocalChanges()) {
            autoSaveChanges();
        }
    }, 20000);
}

/**
 * Simulate server changes for testing
 */
function simulateServerChange() {
    const serverData = JSON.parse(localStorage.getItem(SERVER_KEY) || '{"quotes":[]}');
    if (serverData.quotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * serverData.quotes.length);
        serverData.quotes[randomIndex].lastModified = Date.now();
        serverData.quotes[randomIndex].version += 1;
        serverData.lastUpdated = Date.now();
        
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        addSyncLogEntry('Demo: Simulated server change via setInterval', 'info');
    }
}

/**
 * Rotate status messages
 */
function rotateStatusMessages() {
    const messages = [
        'Monitoring for changes...',
        'Connected to JSONPlaceholder API',
        'Ready to sync',
        'Watching for server updates'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    if (!window.isSyncing) {
        updateSyncUI('idle', randomMessage);
    }
}

/**
 * Auto-save changes
 */
function autoSaveChanges() {
    addSyncLogEntry('Auto-save: Saving local changes', 'info');
    saveQuotesToStorage();
}

/**
 * Manual sync trigger with setInterval cleanup
 */
function triggerManualSync() {
    // Clear any pending syncs and do immediate sync
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    syncQuotes();
    
    // Restart periodic sync after manual sync
    setTimeout(() => {
        if (autoSyncCheckbox.checked) {
            startPeriodicSync();
        }
    }, 5000);
}

/**
 * Dynamic interval adjustment based on network conditions
 */
function setupAdaptiveSyncIntervals() {
    let currentInterval = SYNC_INTERVAL;
    
    setInterval(() => {
        checkNetworkConditions().then(conditions => {
            if (conditions.isSlow) {
                // Use longer interval for slow networks
                const slowInterval = SYNC_INTERVAL * 2;
                if (currentInterval !== slowInterval) {
                    currentInterval = slowInterval;
                    restartSyncWithNewInterval(slowInterval);
                }
            } else {
                // Use normal interval for good networks
                if (currentInterval !== SYNC_INTERVAL) {
                    currentInterval = SYNC_INTERVAL;
                    restartSyncWithNewInterval(SYNC_INTERVAL);
                }
            }
        });
    }, 30000); // Check network every 30 seconds
}

/**
 * Check network conditions
 */
async function checkNetworkConditions() {
    try {
        const startTime = Date.now();
        await fetch('https://jsonplaceholder.typicode.com/posts/1');
        const responseTime = Date.now() - startTime;
        
        return {
            isSlow: responseTime > 1000,
            responseTime: responseTime
        };
    } catch (error) {
        return {
            isSlow: true,
            responseTime: null
        };
    }
}

/**
 * Restart sync with new interval
 */
function restartSyncWithNewInterval(newInterval) {
    stopPeriodicSync();
    SYNC_INTERVAL = newInterval;
    
    if (autoSyncCheckbox.checked) {
        startPeriodicSync();
    }
    
    addSyncLogEntry(`Sync interval adjusted to ${newInterval/1000} seconds`, 'info');
}

/**
 * Initialize all interval-based functionality
 */
function initializeAllIntervals() {
    setupAllIntervals();
    setupSyncDemoIntervals();
    setupAdaptiveSyncIntervals();
    
    addSyncLogEntry('All setInterval-based systems initialized', 'success');
}

// Call this in your main init function
// initializeAllIntervals();

/**
 * Enhanced main initialization function
 */
function init() {
    // Load configuration
    loadSyncConfiguration();
    
    // Initialize mock server data
    initializeMockServer();
    
    // Load quotes from localStorage if available
    loadQuotesFromStorage();
    
    // Load last selected filter from localStorage
    loadLastFilter();
    
    // Load sync log
    loadSyncLog();
    
    // Create the add quote form dynamically
    createAddQuoteForm();
    
    // Populate categories dropdown
    populateCategories();
    
    updateStats();
    showRandomQuote();
    
    // Initialize all interval-based systems
    initializeAllIntervals();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add initial sync log entry
    addSyncLogEntry('Application initialized with setInterval sync system', 'info');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
    clearFilterBtn.addEventListener('click', clearFilter);
    categoryFilter.addEventListener('change', filterQuotes);
    manualSyncBtn.addEventListener('click', triggerManualSync);
    // ... other event listeners
}

// Make sure to update the autoSyncCheckbox event listener
if (autoSyncCheckbox) {
    autoSyncCheckbox.addEventListener('change', function() {
        if (this.checked) {
            startPeriodicSync();
        } else {
            stopPeriodicSync();
            updateSyncUI('idle', 'Auto-sync disabled');
        }
    });
}