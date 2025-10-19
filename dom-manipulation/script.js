// script.js - Updated with enhanced sync and conflict resolution

// Constants
const JSON_PLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';
const SYNC_LOG_KEY = 'quoteGeneratorSyncLog';
const PENDING_CHANGES_KEY = 'quoteGeneratorPendingChanges';
const SYNC_INTERVAL = 30000; // 30 seconds

// Initial quotes array
let quotes = [
    { id: 1, text: "The only way to do great work is to love what you do.", category: "Inspiration", version: 1, lastModified: Date.now() },
    { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life", version: 1, lastModified: Date.now() },
    { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation", version: 1, lastModified: Date.now() },
    { id: 4, text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom", version: 1, lastModified: Date.now() },
    { id: 5, text: "Whoever is happy will make others happy too.", category: "Happiness", version: 1, lastModified: Date.now() }
];

// Global variables
let currentCategoryFilter = 'all';
let syncInterval;
let lastSyncTimestamp = null;
let pendingChanges = [];
let syncLog = [];

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Load data from storage
    loadQuotesFromStorage();
    loadPendingChanges();
    loadSyncLog();
    
    // Initialize server data
    initializeMockServer();
    
    // Create the add quote form
    createAddQuoteForm();
    
    // Populate categories
    populateCategories();
    
    // Update UI
    updateStats();
    showRandomQuote();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start periodic sync
    startPeriodicSync();
    
    // Update sync configuration
    updateSyncConfiguration();
    
    console.log('Application initialized successfully');
}

// ==================== ENHANCED SYNC FUNCTIONALITY ====================

// Load pending changes from localStorage
function loadPendingChanges() {
    const savedChanges = localStorage.getItem(PENDING_CHANGES_KEY);
    if (savedChanges) {
        try {
            pendingChanges = JSON.parse(savedChanges);
        } catch (error) {
            console.error('Error loading pending changes:', error);
            pendingChanges = [];
        }
    }
    updatePendingChangesUI();
}

// Save pending changes to localStorage
function savePendingChanges() {
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pendingChanges));
    updatePendingChangesUI();
}

// Load sync log from localStorage
function loadSyncLog() {
    const savedLog = localStorage.getItem(SYNC_LOG_KEY);
    if (savedLog) {
        try {
            syncLog = JSON.parse(savedLog);
        } catch (error) {
            console.error('Error loading sync log:', error);
            syncLog = [];
        }
    }
}

// Save sync log to localStorage
function saveSyncLog() {
    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(syncLog));
}

// Add entry to sync log
function addSyncLogEntry(message, type = 'info') {
    const entry = {
        timestamp: new Date().toISOString(),
        message: message,
        type: type
    };
    
    syncLog.unshift(entry); // Add to beginning
    if (syncLog.length > 50) { // Keep only last 50 entries
        syncLog = syncLog.slice(0, 50);
    }
    
    saveSyncLog();
    updateSyncLogUI();
    
    console.log(`Sync Log [${type}]:`, message);
}

// Update sync configuration based on UI
function updateSyncConfiguration() {
    const autoSyncCheckbox = document.getElementById('autoSync');
    const syncIntervalInput = document.getElementById('syncInterval');
    
    if (autoSyncCheckbox && autoSyncCheckbox.checked) {
        const interval = parseInt(syncIntervalInput.value) * 1000 || SYNC_INTERVAL;
        startPeriodicSync(interval);
    } else {
        stopPeriodicSync();
    }
}

// Start periodic synchronization
function startPeriodicSync(interval = SYNC_INTERVAL) {
    console.log('Starting periodic sync...');
    
    // Clear any existing interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Start new interval
    syncInterval = setInterval(() => {
        console.log('Periodic sync triggered');
        if (pendingChanges.length > 0 || shouldCheckForServerUpdates()) {
            syncQuotes();
        }
    }, interval);
    
    addSyncLogEntry(`Auto-sync enabled (every ${interval/1000}s)`, 'info');
    updateSyncUI('success', 'Auto-sync enabled');
}

// Stop periodic synchronization
function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    addSyncLogEntry('Auto-sync disabled', 'warning');
    updateSyncUI('warning', 'Auto-sync disabled');
}

// Check if we should check for server updates
function shouldCheckForServerUpdates() {
    const lastServerUpdate = localStorage.getItem(SERVER_TIMESTAMP_KEY);
    if (!lastServerUpdate) return true;
    
    const timeSinceLastUpdate = Date.now() - parseInt(lastServerUpdate);
    return timeSinceLastUpdate > 60000; // Check if more than 1 minute
}

// Enhanced manual sync trigger
function manualSync() {
    console.log('Manual sync triggered');
    addSyncLogEntry('Manual sync initiated by user', 'info');
    syncQuotes();
}

// Enhanced main sync function
async function syncQuotes() {
    try {
        updateSyncUI('syncing', 'Syncing with server...');
        
        // Step 1: Push local changes to server
        if (pendingChanges.length > 0) {
            await pushLocalChanges();
        }
        
        // Step 2: Fetch quotes from server
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.error);
        }
        
        const serverQuotes = serverResponse.quotes;
        console.log(`Fetched ${serverQuotes.length} quotes from server`);
        
        // Step 3: Detect and handle conflicts
        const conflicts = detectDataConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            console.log(`Found ${conflicts.length} conflicts`);
            addSyncLogEntry(`Found ${conflicts.length} data conflicts`, 'conflict');
            
            const strategy = document.getElementById('conflictStrategy').value;
            
            if (strategy === 'manual') {
                await showManualConflictResolution(conflicts, serverQuotes);
            } else {
                await resolveConflictsAutomatically(conflicts, serverQuotes, strategy);
                showNotification(`${conflicts.length} conflicts resolved automatically`, 'info');
            }
        } else {
            await mergeServerData(serverQuotes);
        }
        
        // Step 4: Clear pending changes after successful sync
        if (pendingChanges.length > 0) {
            pendingChanges = [];
            savePendingChanges();
        }
        
        // Step 5: Update sync state
        lastSyncTimestamp = Date.now();
        localStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.toString());
        updateStats();
        updateSyncUI('success', 'Sync completed successfully');
        showNotification('Quotes synchronized successfully', 'success');
        addSyncLogEntry('Sync completed successfully', 'success');
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncUI('error', 'Sync failed: ' + error.message);
        showNotification('Sync failed. Please try again.', 'error');
        addSyncLogEntry(`Sync failed: ${error.message}`, 'error');
    }
}

// Push local changes to server
async function pushLocalChanges() {
    console.log(`Pushing ${pendingChanges.length} local changes to server`);
    addSyncLogEntry(`Pushing ${pendingChanges.length} local changes to server`, 'info');
    
    // In a real application, this would be actual API calls
    // For simulation, we'll just update our mock server storage
    
    const serverData = JSON.parse(localStorage.getItem(SERVER_KEY) || '{"quotes":[]}');
    
    pendingChanges.forEach(change => {
        if (change.type === 'add') {
            serverData.quotes.push(change.data);
        } else if (change.type === 'update') {
            const index = serverData.quotes.findIndex(q => q.id === change.data.id);
            if (index !== -1) {
                serverData.quotes[index] = change.data;
            } else {
                serverData.quotes.push(change.data);
            }
        } else if (change.type === 'delete') {
            serverData.quotes = serverData.quotes.filter(q => q.id !== change.data.id);
        }
    });
    
    serverData.lastUpdated = Date.now();
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
    
    console.log('Local changes pushed to server simulation');
}

// Enhanced conflict detection
function detectDataConflicts(serverQuotes) {
    const conflicts = [];
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Check for update conflicts (same quote modified both locally and on server)
    quotes.forEach(localQuote => {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        if (serverQuote) {
            // If both versions have been modified and are different
            const localModified = localQuote.lastModified;
            const serverModified = serverQuote.lastModified;
            const timeDiff = Math.abs(localModified - serverModified);
            
            // Consider it a conflict if both were modified around the same time and content differs
            if (timeDiff < 300000 && // Within 5 minutes
                (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category)) {
                conflicts.push({
                    type: 'update',
                    quoteId: localQuote.id,
                    local: { ...localQuote },
                    server: { ...serverQuote },
                    description: `Quote "${localQuote.text.substring(0, 30)}..." was modified locally and on server`
                });
            }
        }
    });
    
    // Check for delete conflicts (quote deleted on server but modified locally)
    const localQuoteIds = new Set(quotes.map(q => q.id));
    serverQuotes.forEach(serverQuote => {
        if (!localQuoteIds.has(serverQuote.id)) {
            // This quote exists on server but not locally - potential conflict if we have pending changes
            const pendingChange = pendingChanges.find(change => 
                change.data.id === serverQuote.id && change.type !== 'delete');
            
            if (pendingChange) {
                conflicts.push({
                    type: 'delete',
                    quoteId: serverQuote.id,
                    server: { ...serverQuote },
                    description: `Quote was deleted on server but has local modifications`
                });
            }
        }
    });
    
    return conflicts;
}

// Automatic conflict resolution
async function resolveConflictsAutomatically(conflicts, serverQuotes, strategy) {
    console.log(`Resolving ${conflicts.length} conflicts automatically with strategy: ${strategy}`);
    
    if (strategy === 'server') {
        await resolveWithServerPrecedence(conflicts, serverQuotes);
    } else if (strategy === 'client') {
        await resolveWithClientPrecedence(conflicts, serverQuotes);
    }
    
    addSyncLogEntry(`Automatically resolved ${conflicts.length} conflicts (${strategy} wins)`, 'info');
}

// Manual conflict resolution UI
async function showManualConflictResolution(conflicts, serverQuotes) {
    return new Promise((resolve) => {
        const modal = document.getElementById('conflictModal');
        const conflictsList = document.getElementById('conflictsList');
        const resolveBtn = document.getElementById('resolveConflict');
        const cancelBtn = document.getElementById('cancelResolution');
        
        // Populate conflicts list
        conflictsList.innerHTML = '';
        conflicts.forEach((conflict, index) => {
            const conflictItem = document.createElement('div');
            conflictItem.className = 'conflict-item';
            conflictItem.innerHTML = `
                <div class="conflict-description">${conflict.description}</div>
                ${conflict.type === 'update' ? `
                    <div class="conflict-versions">
                        <div class="version local">
                            <strong>Local Version:</strong>
                            <div class="quote-text">"${conflict.local.text}"</div>
                            <div class="quote-category">${conflict.local.category}</div>
                        </div>
                        <div class="version server">
                            <strong>Server Version:</strong>
                            <div class="quote-text">"${conflict.server.text}"</div>
                            <div class="quote-category">${conflict.server.category}</div>
                        </div>
                    </div>
                    <div class="conflict-choice">
                        <label>
                            <input type="radio" name="resolution-${index}" value="local" checked>
                            Use local version
                        </label>
                        <label>
                            <input type="radio" name="resolution-${index}" value="server">
                            Use server version
                        </label>
                        <label>
                            <input type="radio" name="resolution-${index}" value="merge">
                            Keep both (create duplicate)
                        </label>
                    </div>
                ` : `
                    <div class="conflict-choice">
                        <label>
                            <input type="radio" name="resolution-${index}" value="keep" checked>
                            Keep server version (undo local changes)
                        </label>
                        <label>
                            <input type="radio" name="resolution-${index}" value="discard">
                            Discard server version (keep local changes)
                        </label>
                    </div>
                `}
            `;
            conflictsList.appendChild(conflictItem);
        });
        
        // Show modal
        modal.style.display = 'flex';
        
        // Set up event listeners
        const onResolve = () => {
            const resolutions = [];
            
            conflicts.forEach((conflict, index) => {
                const selected = document.querySelector(`input[name="resolution-${index}"]:checked`);
                if (selected) {
                    resolutions.push({
                        conflict: conflict,
                        resolution: selected.value
                    });
                }
            });
            
            applyManualResolutions(resolutions, serverQuotes);
            modal.style.display = 'none';
            resolve();
            
            // Clean up event listeners
            resolveBtn.removeEventListener('click', onResolve);
            cancelBtn.removeEventListener('click', onCancel);
        };
        
        const onCancel = () => {
            modal.style.display = 'none';
            // Cancel the sync
            updateSyncUI('error', 'Sync canceled by user');
            showNotification('Sync was canceled', 'warning');
            resolve();
            
            // Clean up event listeners
            resolveBtn.removeEventListener('click', onResolve);
            cancelBtn.removeEventListener('click', onCancel);
        };
        
        resolveBtn.addEventListener('click', onResolve);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// Apply manual conflict resolutions
function applyManualResolutions(resolutions, serverQuotes) {
    resolutions.forEach(({ conflict, resolution }) => {
        if (conflict.type === 'update') {
            if (resolution === 'local') {
                // Keep local version - no action needed as local is already correct
            } else if (resolution === 'server') {
                // Use server version
                const index = quotes.findIndex(q => q.id === conflict.quoteId);
                if (index !== -1) {
                    quotes[index] = { ...conflict.server };
                }
            } else if (resolution === 'merge') {
                // Keep both - create a copy of local version with new ID
                const newQuote = {
                    ...conflict.local,
                    id: Math.max(...quotes.map(q => q.id), ...serverQuotes.map(q => q.id)) + 1,
                    text: conflict.local.text + " (Conflict Resolved)"
                };
                quotes.push(newQuote);
            }
        } else if (conflict.type === 'delete') {
            if (resolution === 'keep') {
                // Keep server version - add it back to local quotes
                quotes.push({ ...conflict.server });
            }
            // If discard, do nothing (keep local state)
        }
    });
    
    saveQuotesToStorage();
    updateUIAfterSync();
    addSyncLogEntry(`Manually resolved ${resolutions.length} conflicts`, 'info');
}

// Server precedence conflict resolution
async function resolveWithServerPrecedence(conflicts, serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    conflicts.forEach(conflict => {
        if (conflict.type === 'update') {
            const index = quotes.findIndex(q => q.id === conflict.quoteId);
            if (index !== -1) {
                quotes[index] = { ...conflict.server };
            }
        } else if (conflict.type === 'delete') {
            // Remove any pending changes for this quote
            pendingChanges = pendingChanges.filter(change => change.data.id !== conflict.quoteId);
        }
    });
    
    saveQuotesToStorage();
    savePendingChanges();
    updateUIAfterSync();
}

// Client precedence conflict resolution
async function resolveWithClientPrecedence(conflicts, serverQuotes) {
    // For client precedence, we keep local versions as they are
    // No action needed for update conflicts
    
    conflicts.forEach(conflict => {
        if (conflict.type === 'delete') {
            // For delete conflicts, we keep the local state (ignore server deletion)
            // No action needed
        }
    });
    
    // Still merge non-conflicting server data
    await mergeServerData(serverQuotes);
}

// Enhanced UI update functions
function updateSyncUI(status, message) {
    const syncIndicator = document.getElementById('syncIndicator');
    const syncMessage = document.getElementById('syncMessage');
    
    if (syncIndicator) {
        syncIndicator.className = 'sync-indicator ' + status;
    }
    if (syncMessage) {
        syncMessage.textContent = message;
    }
}

function updatePendingChangesUI() {
    const pendingChangesSpan = document.getElementById('pendingChanges');
    if (pendingChangesSpan) {
        pendingChangesSpan.textContent = pendingChanges.length;
    }
}

function updateSyncLogUI() {
    const syncLogElement = document.getElementById('syncLog');
    if (!syncLogElement) return;
    
    syncLogElement.innerHTML = '';
    
    syncLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${entry.type}`;
        logEntry.innerHTML = `
            <div class="log-time">${new Date(entry.timestamp).toLocaleString()}</div>
            <div class="log-message">${entry.message}</div>
        `;
        syncLogElement.appendChild(logEntry);
    });
}

// Show sync log modal
function showSyncLogModal() {
    const modal = document.getElementById('syncLogModal');
    updateSyncLogUI();
    modal.style.display = 'flex';
}

// Clear sync log
function clearSyncLog() {
    syncLog = [];
    saveSyncLog();
    updateSyncLogUI();
}

// Enhanced event listeners setup
function setupEventListeners() {
    const newQuoteBtn = document.getElementById('newQuote');
    const showFormBtn = document.getElementById('showForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const manualSyncBtn = document.getElementById('manualSync');
    const viewSyncLogBtn = document.getElementById('viewSyncLog');
    const clearSyncLogBtn = document.getElementById('clearSyncLog');
    const closeSyncLogBtn = document.getElementById('closeSyncLog');
    const closeNotificationBtn = document.getElementById('closeNotification');
    const syncIntervalInput = document.getElementById('syncInterval');
    const autoSyncCheckbox = document.getElementById('autoSync');
    const conflictStrategySelect = document.getElementById('conflictStrategy');
    
    // Existing event listeners
    if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);
    if (showFormBtn) showFormBtn.addEventListener('click', toggleAddQuoteForm);
    if (categoryFilter) categoryFilter.addEventListener('change', filterQuotes);
    if (clearFilterBtn) clearFilterBtn.addEventListener('click', clearFilter);
    if (manualSyncBtn) manualSyncBtn.addEventListener('click', manualSync);
    
    // New sync-related event listeners
    if (viewSyncLogBtn) viewSyncLogBtn.addEventListener('click', showSyncLogModal);
    if (clearSyncLogBtn) clearSyncLogBtn.addEventListener('click', clearSyncLog);
    if (closeSyncLogBtn) closeSyncLogBtn.addEventListener('click', () => {
        document.getElementById('syncLogModal').style.display = 'none';
    });
    if (closeNotificationBtn) closeNotificationBtn.addEventListener('click', () => {
        document.getElementById('syncNotification').style.display = 'none';
    });
    
    // Sync configuration event listeners
    if (syncIntervalInput) syncIntervalInput.addEventListener('change', updateSyncConfiguration);
    if (autoSyncCheckbox) autoSyncCheckbox.addEventListener('change', updateSyncConfiguration);
    if (conflictStrategySelect) conflictStrategySelect.addEventListener('change', () => {
        addSyncLogEntry(`Conflict strategy changed to: ${conflictStrategySelect.value}`, 'info');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const syncLogModal = document.getElementById('syncLogModal');
        const conflictModal = document.getElementById('conflictModal');
        
        if (event.target === syncLogModal) {
            syncLogModal.style.display = 'none';
        }
        if (event.target === conflictModal) {
            conflictModal.style.display = 'none';
        }
    });
}

// Enhanced add quote function to track pending changes
function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categorySelect = document.getElementById('newQuoteCategory');
    
    if (!textInput || !categorySelect) return;

    const text = textInput.value.trim();
    let category = categorySelect.value;

    if (!text) {
        alert('Please enter a quote text.');
        return;
    }

    if (category === 'Other') {
        category = prompt('Enter new category name:') || 'Other';
        if (!category.trim()) {
            alert('Category is required.');
            return;
        }
    }

    const newQuote = {
        id: Math.max(...quotes.map(q => q.id), 0) + 1,
        text: text,
        category: category,
        version: 1,
        lastModified: Date.now()
    };

    quotes.push(newQuote);
    saveQuotesToStorage();
    
    // Add to pending changes
    pendingChanges.push({
        type: 'add',
        data: newQuote,
        timestamp: Date.now()
    });
    savePendingChanges();
    
    // Update UI
    populateCategories();
    updateStats();
    showRandomQuote();
    
    // Clear form
    textInput.value = '';
    categorySelect.value = 'Inspiration';
    
    // Hide form
    toggleAddQuoteForm();
    
    showNotification('Quote added successfully! Will be synced to server.', 'success');
    addSyncLogEntry('New quote added locally', 'info');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);