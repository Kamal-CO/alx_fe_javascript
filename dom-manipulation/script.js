// Initial quotes array
let quotes = [
    { id: 1, text: "The only way to do great work is to love what you do.", category: "Inspiration", version: 1, lastModified: Date.now() },
    { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life", version: 1, lastModified: Date.now() },
    { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation", version: 1, lastModified: Date.now() },
    { id: 4, text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom", version: 1, lastModified: Date.now() },
    { id: 5, text: "Whoever is happy will make others happy too.", category: "Happiness", version: 1, lastModified: Date.now() },
    { id: 6, text: "You only live once, but if you do it right, once is enough.", category: "Life", version: 1, lastModified: Date.now() },
    { id: 7, text: "Be the change that you wish to see in the world.", category: "Inspiration", version: 1, lastModified: Date.now() }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const formContainer = document.getElementById('formContainer');
const categoryFilter = document.getElementById('categoryFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const activeFilter = document.getElementById('activeFilter');
const currentFilter = document.getElementById('currentFilter');
const totalQuotesSpan = document.getElementById('totalQuotes');
const totalCategoriesSpan = document.getElementById('totalCategories');
const lastSyncTime = document.getElementById('lastSyncTime');
const pendingChangesSpan = document.getElementById('pendingChanges');
const syncStatus = document.getElementById('syncStatus');
const syncIndicator = document.getElementById('syncIndicator');
const syncMessage = document.getElementById('syncMessage');
const manualSyncBtn = document.getElementById('manualSync');
const viewSyncLogBtn = document.getElementById('viewSyncLog');
const conflictModal = document.getElementById('conflictModal');
const conflictMessage = document.getElementById('conflictMessage');
const conflictsList = document.getElementById('conflictsList');
const resolveConflictBtn = document.getElementById('resolveConflict');
const cancelResolutionBtn = document.getElementById('cancelResolution');
const syncLogModal = document.getElementById('syncLogModal');
const syncLog = document.getElementById('syncLog');
const clearSyncLogBtn = document.getElementById('clearSyncLog');
const closeSyncLogBtn = document.getElementById('closeSyncLog');
const syncNotification = document.getElementById('syncNotification');
const notificationMessage = document.getElementById('notificationMessage');
const closeNotificationBtn = document.getElementById('closeNotification');
const syncIntervalInput = document.getElementById('syncInterval');
const autoSyncCheckbox = document.getElementById('autoSync');
const conflictStrategySelect = document.getElementById('conflictStrategy');

// Form elements (will be created dynamically)
let addQuoteForm, newQuoteText, newQuoteCategory, addQuoteBtn;

// Current filter state
let currentCategoryFilter = 'all';

// Sync configuration
let SYNC_INTERVAL = 30000; // 30 seconds
let syncInterval;
let lastSyncTimestamp = null;
let pendingChanges = false;
let syncLogEntries = [];

// Server simulation (using localStorage as mock server)
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';
const SYNC_LOG_KEY = 'quoteGeneratorSyncLog';

// Initialize the application
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
    
    // Start periodic sync if enabled
    if (autoSyncCheckbox.checked) {
        startPeriodicSync();
    }
    
    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
    clearFilterBtn.addEventListener('click', clearFilter);
    categoryFilter.addEventListener('change', filterQuotes);
    manualSyncBtn.addEventListener('click', manualSync);
    viewSyncLogBtn.addEventListener('click', showSyncLog);
    resolveConflictBtn.addEventListener('click', resolveConflict);
    cancelResolutionBtn.addEventListener('click', cancelResolution);
    clearSyncLogBtn.addEventListener('click', clearSyncLog);
    closeSyncLogBtn.addEventListener('click', hideSyncLog);
    closeNotificationBtn.addEventListener('click', hideNotification);
    syncIntervalInput.addEventListener('change', updateSyncConfiguration);
    autoSyncCheckbox.addEventListener('change', toggleAutoSync);
    conflictStrategySelect.addEventListener('change', updateSyncConfiguration);
    
    // Set up beforeunload to detect pending changes
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Add initial sync log entry
    addSyncLogEntry('Application initialized', 'info');
}

// Load sync configuration from localStorage
function loadSyncConfiguration() {
    const config = localStorage.getItem('syncConfig');
    if (config) {
        const parsedConfig = JSON.parse(config);
        SYNC_INTERVAL = parsedConfig.syncInterval || 30000;
        syncIntervalInput.value = SYNC_INTERVAL / 1000;
        autoSyncCheckbox.checked = parsedConfig.autoSync !== false;
        conflictStrategySelect.value = parsedConfig.conflictStrategy || 'server';
    }
}

// Save sync configuration to localStorage
function saveSyncConfiguration() {
    const config = {
        syncInterval: SYNC_INTERVAL,
        autoSync: autoSyncCheckbox.checked,
        conflictStrategy: conflictStrategySelect.value
    };
    localStorage.setItem('syncConfig', JSON.stringify(config));
}

// Update sync configuration
function updateSyncConfiguration() {
    SYNC_INTERVAL = parseInt(syncIntervalInput.value) * 1000;
    saveSyncConfiguration();
    
    // Restart periodic sync if enabled
    if (autoSyncCheckbox.checked) {
        stopPeriodicSync();
        startPeriodicSync();
    }
    
    addSyncLogEntry('Sync configuration updated', 'info');
}

// Toggle auto sync
function toggleAutoSync() {
    if (autoSyncCheckbox.checked) {
        startPeriodicSync();
        addSyncLogEntry('Auto sync enabled', 'info');
    } else {
        stopPeriodicSync();
        addSyncLogEntry('Auto sync disabled', 'info');
    }
    saveSyncConfiguration();
}

// Initialize mock server data
function initializeMockServer() {
    if (!localStorage.getItem(SERVER_KEY)) {
        const serverData = {
            quotes: quotes.map(quote => ({ 
                ...quote, 
                lastModified: Date.now() 
            })),
            lastUpdated: Date.now()
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
    }
}

// Fetch quotes from server simulation
async function fetchQuotesFromServer() {
    updateSyncStatus('syncing', 'Fetching quotes from server...');
    
    try {
        // Simulate API call with network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const serverData = localStorage.getItem(SERVER_KEY);
        
        if (!serverData) {
            throw new Error('No server data available');
        }
        
        const parsedData = JSON.parse(serverData);
        
        // Simulate random server updates (30% chance)
        if (Math.random() > 0.7) {
            simulateServerUpdates(parsedData.quotes);
        }
        
        addSyncLogEntry('Successfully fetched quotes from server', 'success');
        return {
            success: true,
            quotes: parsedData.quotes,
            timestamp: parseInt(localStorage.getItem(SERVER_TIMESTAMP_KEY) || Date.now().toString())
        };
        
    } catch (error) {
        console.error('Failed to fetch quotes from server:', error);
        addSyncLogEntry(`Failed to fetch quotes: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate server-side updates
function simulateServerUpdates(serverQuotes) {
    const actions = [];
    
    // Occasionally add a new quote (20% chance)
    if (Math.random() > 0.8) {
        const newQuote = {
            id: Math.max(...serverQuotes.map(q => q.id)) + 1,
            text: "Server update: The only limit to our realization of tomorrow is our doubts of today.",
            category: "Motivation",
            version: 1,
            lastModified: Date.now(),
            source: "server"
        };
        serverQuotes.push(newQuote);
        actions.push('added new quote');
    }
    
    // Occasionally update an existing quote (15% chance)
    if (Math.random() > 0.85 && serverQuotes.length > 2) {
        const randomIndex = Math.floor(Math.random() * serverQuotes.length);
        serverQuotes[randomIndex].version += 1;
        serverQuotes[randomIndex].lastModified = Date.now();
        serverQuotes[randomIndex].text += " [Server Updated]";
        actions.push('updated existing quote');
    }
    
    // Update server storage if changes were made
    if (actions.length > 0) {
        const serverData = {
            quotes: serverQuotes,
            lastUpdated: Date.now()
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
        addSyncLogEntry(`Server performed: ${actions.join(', ')}`, 'info');
    }
}

// Post quotes to server
async function postToServer(data) {
    updateSyncStatus('syncing', 'Sending changes to server...');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
        
        const serverData = {
            quotes: data,
            lastUpdated: Date.now()
        };
        
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
        
        addSyncLogEntry('Successfully posted changes to server', 'success');
        return { success: true };
        
    } catch (error) {
        console.error('Failed to post to server:', error);
        addSyncLogEntry(`Failed to post changes: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Start periodic synchronization
function startPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    syncInterval = setInterval(() => {
        if (hasLocalChanges()) {
            syncWithServer();
        }
    }, SYNC_INTERVAL);
    updateSyncStatus('idle', `Auto-sync enabled (every ${SYNC_INTERVAL/1000}s)`);
}

// Stop periodic synchronization
function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    updateSyncStatus('idle', 'Auto-sync disabled');
}

// Manual sync trigger
function manualSync() {
    syncWithServer();
}

// Main sync function
async function syncWithServer() {
    try {
        updateSyncStatus('syncing', 'Starting synchronization...');
        
        // Fetch latest data from server
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.error);
        }
        
        const serverQuotes = serverResponse.quotes;
        const serverTimestamp = serverResponse.timestamp;
        
        // Check if we have local changes
        const localChanges = hasLocalChanges();
        
        // Detect conflicts
        const conflicts = detectConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            // Handle conflicts based on strategy
            const strategy = conflictStrategySelect.value;
            
            if (strategy === 'manual') {
                // Show conflict resolution modal
                showConflictModal(conflicts, serverQuotes);
                updateSyncStatus('conflict', `${conflicts.length} conflict(s) detected`);
                addSyncLogEntry(`${conflicts.length} conflicts detected - awaiting manual resolution`, 'conflict');
                return;
            } else {
                // Auto-resolve conflicts
                await autoResolveConflicts(conflicts, serverQuotes, strategy);
            }
        }
        
        if (localChanges && conflicts.length === 0) {
            // Push local changes to server
            await postToServer(quotes);
            showNotification('Changes synced to server successfully', 'success');
        } else if (!localChanges && conflicts.length === 0) {
            // Pull server changes
            quotes = serverQuotes;
            saveQuotesToStorage();
            updateUIAfterSync();
            showNotification('Data updated from server', 'success');
        }
        
        lastSyncTimestamp = Date.now();
        updateLastSyncTime();
        pendingChanges = false;
        updatePendingChanges();
        
        updateSyncStatus('success', 'Synchronization completed');
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncStatus('error', `Sync failed: ${error.message}`);
        showNotification(`Sync failed: ${error.message}`, 'error');
    }
}

// Detect conflicts between local and server data
function detectConflicts(serverQuotes) {
    const conflicts = [];
    
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    const localQuoteMap = new Map(quotes.map(q => [q.id, q]));
    
    // Check for update conflicts
    for (const localQuote of quotes) {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        
        if (serverQuote && serverQuote.lastModified > localQuote.lastModified) {
            // Both have the quote, but server has a newer version
            if (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category) {
                conflicts.push({
                    id: localQuote.id,
                    type: 'update',
                    local: localQuote,
                    server: serverQuote,
                    message: `Quote "${localQuote.text.substring(0, 50)}..." was modified on both client and server`
                });
            }
        }
    }
    
    // Check for deletion conflicts
    for (const serverQuote of serverQuotes) {
        if (!localQuoteMap.has(serverQuote.id)) {
            conflicts.push({
                id: serverQuote.id,
                type: 'deletion',
                local: null,
                server: serverQuote,
                message: `Quote was deleted locally but exists on server: "${serverQuote.text.substring(0, 50)}..."`
            });
        }
    }
    
    for (const localQuote of quotes) {
        if (!serverQuoteMap.has(localQuote.id)) {
            conflicts.push({
                id: localQuote.id,
                type: 'deletion',
                local: localQuote,
                server: null,
                message: `Quote was deleted on server but exists locally: "${localQuote.text.substring(0, 50)}..."`
            });
        }
    }
    
    return conflicts;
}

// Auto-resolve conflicts
async function autoResolveConflicts(conflicts, serverQuotes, strategy) {
    let resolvedQuotes = [...quotes];
    
    for (const conflict of conflicts) {
        if (strategy === 'server') {
            // Server wins - use server data
            if (conflict.type === 'update') {
                const index = resolvedQuotes.findIndex(q => q.id === conflict.id);
                if (index !== -1) {
                    resolvedQuotes[index] = { ...conflict.server };
                }
            } else if (conflict.type === 'deletion') {
                if (conflict.server) {
                    // Server has the quote, local doesn't - add it back
                    resolvedQuotes.push({ ...conflict.server });
                } else {
                    // Server deleted the quote - remove it locally
                    resolvedQuotes = resolvedQuotes.filter(q => q.id !== conflict.id);
                }
            }
        } else if (strategy === 'client') {
            // Client wins - keep local data
            if (conflict.type === 'deletion' && conflict.server) {
                // Server has a quote we deleted - keep it deleted
                resolvedQuotes = resolvedQuotes.filter(q => q.id !== conflict.id);
            }
            // For updates, we keep local version, so no changes needed
        }
    }
    
    // Update both local and server with resolved data
    quotes = resolvedQuotes;
    await postToServer(resolvedQuotes);
    saveQuotesToStorage();
    updateUIAfterSync();
    
    addSyncLogEntry(`Auto-resolved ${conflicts.length} conflicts using ${strategy} strategy`, 'warning');
    showNotification(`Auto-resolved ${conflicts.length} conflicts`, 'warning');
}

// Show conflict resolution modal
function showConflictModal(conflicts, serverQuotes) {
    conflictMessage.textContent = `Found ${conflicts.length} conflict(s) between your local data and the server.`;
    
    // Populate conflicts list
    conflictsList.innerHTML = '';
    conflicts.forEach(conflict => {
        const conflictItem = document.createElement('div');
        conflictItem.className = 'conflict-item';
        
        let details = '';
        if (conflict.type === 'update') {
            details = `
                <div class="conflict-quote"><strong>Local:</strong> "${conflict.local.text}"</div>
                <div class="conflict-quote"><strong>Server:</strong> "${conflict.server.text}"</div>
            `;
        } else if (conflict.type === 'deletion') {
            if (conflict.local) {
                details = `<div class="conflict-quote">Quote exists locally but was deleted on server: "${conflict.local.text}"</div>`;
            } else {
                details = `<div class="conflict-quote">Quote exists on server but was deleted locally: "${conflict.server.text}"</div>`;
            }
        }
        
        conflictItem.innerHTML = `
            ${details}
            <div class="conflict-details">Type: ${conflict.type} | ID: ${conflict.id}</div>
        `;
        conflictsList.appendChild(conflictItem);
    });
    
    conflictModal.style.display = 'flex';
}

// Resolve conflicts based on user selection
async function resolveConflict() {
    const resolution = document.querySelector('input[name="resolution"]:checked').value;
    const serverQuotes = JSON.parse(localStorage.getItem(SERVER_KEY)).quotes;
    
    let resolvedQuotes = [...quotes];
    
    const conflicts = detectConflicts(serverQuotes);
    
    switch (resolution) {
        case 'server':
            // Use server data
            resolvedQuotes = serverQuotes;
            break;
        case 'client':
            // Keep local data (no changes needed)
            break;
        case 'merge':
            // Merge data intelligently
            resolvedQuotes = mergeData(quotes, serverQuotes);
            break;
    }
    
    // Update data
    quotes = resolvedQuotes;
    await postToServer(resolvedQuotes);
    saveQuotesToStorage();
    updateUIAfterSync();
    
    hideConflictModal();
    updateSyncStatus('success', 'Conflicts resolved and data synced');
    pendingChanges = false;
    updatePendingChanges();
    lastSyncTimestamp = Date.now();
    updateLastSyncTime();
    
    addSyncLogEntry(`Manually resolved ${conflicts.length} conflicts using ${resolution} strategy`, 'success');
    showNotification(`Successfully resolved ${conflicts.length} conflicts`, 'success');
}

// Merge local and server data
function mergeData(localQuotes, serverQuotes) {
    const merged = [];
    const usedIds = new Set();
    
    const localMap = new Map(localQuotes.map(q => [q.id, q]));
    const serverMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Add all server quotes (prioritize server for conflicts)
    for (const serverQuote of serverQuotes) {
        merged.push({ ...serverQuote });
        usedIds.add(serverQuote.id);
    }
    
    // Add local quotes that don't exist on server or have newer modifications
    for (const localQuote of localQuotes) {
        const serverQuote = serverMap.get(localQuote.id);
        if (!serverQuote) {
            // Local-only quote
            const newId = Math.max(...merged.map(q => q.id), 0) + 1;
            merged.push({
                ...localQuote,
                id: newId
            });
            usedIds.add(newId);
        } else if (localQuote.lastModified > serverQuote.lastModified) {
            // Local has newer version - update the merged quote
            const index = merged.findIndex(q => q.id === localQuote.id);
            if (index !== -1) {
                merged[index] = { ...localQuote };
            }
        }
    }
    
    return merged;
}

// Cancel conflict resolution
function cancelResolution() {
    hideConflictModal();
    updateSyncStatus('idle', 'Sync cancelled due to conflicts');
    addSyncLogEntry('Sync cancelled by user due to conflicts', 'warning');
}

// Hide conflict modal
function hideConflictModal() {
    conflictModal.style.display = 'none';
}

// Show sync log
function showSyncLog() {
    syncLogModal.style.display = 'flex';
}

// Hide sync log
function hideSyncLog() {
    syncLogModal.style.display = 'none';
}

// Clear sync log
function clearSyncLog() {
    syncLogEntries = [];
    syncLog.innerHTML = '';
    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(syncLogEntries));
    addSyncLogEntry('Sync log cleared', 'info');
}

// Add entry to sync log
function addSyncLogEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
        timestamp,
        message,
        type
    };
    
    syncLogEntries.unshift(entry); // Add to beginning
    if (syncLogEntries.length > 100) {
        syncLogEntries = syncLogEntries.slice(0, 100); // Keep only last 100 entries
    }
    
    // Save to localStorage
    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(syncLogEntries));
    
    // Update UI if log is visible
    if (syncLogModal.style.display === 'flex') {
        updateSyncLogDisplay();
    }
}

// Load sync log from localStorage
function loadSyncLog() {
    const savedLog = localStorage.getItem(SYNC_LOG_KEY);
    if (savedLog) {
        syncLogEntries = JSON.parse(savedLog);
    }
    updateSyncLogDisplay();
}

// Update sync log display
function updateSyncLogDisplay() {
    syncLog.innerHTML = '';
    syncLogEntries.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${entry.type}`;
        logEntry.innerHTML = `
            <div class="log-time">${entry.timestamp}</div>
            <div class="log-message">${entry.message}</div>
        `;
        syncLog.appendChild(logEntry);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    syncNotification.className = `notification ${type}`;
    syncNotification.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    syncNotification.style.display = 'none';
}

// Check if there are local changes not synced to server
function hasLocalChanges() {
    const lastLocalUpdate = localStorage.getItem('quotesLastUpdated');
    const lastServerUpdate = localStorage.getItem(SERVER_TIMESTAMP_KEY);
    
    if (!lastLocalUpdate || !lastServerUpdate) return true;
    
    return parseInt(lastLocalUpdate) > parseInt(lastServerUpdate);
}

// Update sync status UI
function updateSyncStatus(status, message) {
    syncIndicator.className = 'sync-indicator';
    syncIndicator.classList.add(status);
    syncMessage.textContent = message;
}

// Update last sync time display
function updateLastSyncTime() {
    if (lastSyncTimestamp) {
        const timeString = new Date(lastSyncTimestamp).toLocaleTimeString();
        lastSyncTime.textContent = timeString;
    } else {
        lastSyncTime.textContent = 'Never';
    }
}

// Update pending changes count
function updatePendingChanges() {
    const changes = hasLocalChanges() ? 1 : 0;
    pendingChangesSpan.textContent = changes;
    pendingChanges = changes > 0;
}

// Handle beforeunload event
function handleBeforeUnload(event) {
    if (pendingChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
    }
}

// Update UI after sync
function updateUIAfterSync() {
    populateCategories();
    updateStats();
    showRandomQuote();
    updatePendingChanges();
}

// [Rest of the existing functions remain the same - createAddQuoteForm, populateCategories, showRandomQuote, etc.]
// ... (Previous functions like createAddQuoteForm, populateCategories, showRandomQuote, addQuote, etc. remain unchanged)

// Load quotes from localStorage
function loadQuotesFromStorage() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        try {
            quotes = JSON.parse(savedQuotes);
        } catch (error) {
            console.error('Error parsing saved quotes:', error);
        }
    }
    updatePendingChanges();
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('quotesLastUpdated', Date.now().toString());
    updatePendingChanges();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);