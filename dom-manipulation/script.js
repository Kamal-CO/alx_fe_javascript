// Initial quotes array (fallback if no localStorage data)
const initialQuotes = [
    { id: generateId(), text: "The only way to do great work is to love what you do.", category: "Inspiration", timestamp: new Date('2024-01-01').getTime(), version: 1 },
    { id: generateId(), text: "Innovation distinguishes between a leader and a follower.", category: "Leadership", timestamp: new Date('2024-01-02').getTime(), version: 1 },
    { id: generateId(), text: "Life is what happens to you while you're busy making other plans.", category: "Life", timestamp: new Date('2024-01-03').getTime(), version: 1 },
    { id: generateId(), text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", timestamp: new Date('2024-01-04').getTime(), version: 1 },
    { id: generateId(), text: "Strive not to be a success, but rather to be of value.", category: "Success", timestamp: new Date('2024-01-05').getTime(), version: 1 },
    { id: generateId(), text: "The way to get started is to quit talking and begin doing.", category: "Action", timestamp: new Date('2024-01-06').getTime(), version: 1 },
    { id: generateId(), text: "Don't let yesterday take up too much of today.", category: "Wisdom", timestamp: new Date('2024-01-07').getTime(), version: 1 }
];

// Load quotes from localStorage or use initial quotes
let quotes = loadQuotesFromStorage();

// Server simulation (using localStorage as mock server)
const SERVER_STORAGE_KEY = 'quoteGeneratorServer';
const SYNC_INTERVAL = 30000; // 30 seconds

// Sync state
let syncState = {
    lastSync: null,
    pendingChanges: false,
    conflicts: [],
    isOnline: true,
    syncInterval: null
};

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const showAllBtn = document.getElementById('showAll');
const exportQuotesBtn = document.getElementById('exportQuotes');
const importQuotesBtn = document.getElementById('importQuotes');
const clearStorageBtn = document.getElementById('clearStorage');
const importFile = document.getElementById('importFile');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const clearFilterBtn = document.getElementById('clearFilter');
const sortSelect = document.getElementById('sortSelect');
const resultsInfo = document.getElementById('resultsInfo');
const syncStatus = document.getElementById('syncStatus');
const syncInfo = document.getElementById('syncInfo');
const manualSyncBtn = document.getElementById('manualSync');
const viewConflictsBtn = document.getElementById('viewConflicts');
const conflictModal = document.getElementById('conflictModal');
const conflictList = document.getElementById('conflictList');

// Current filter state
let currentFilter = {
    category: 'all',
    search: '',
    sort: 'newest'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCategories();
    loadFilterPreferences();
    filterQuotes();
    setupEventListeners();
    createAddQuoteForm();
    setupQuickCategories();
    displayStorageInfo();
    initializeSync();
    
    // Try to load last viewed quote from session storage
    loadLastViewedQuote();
});

// Generate unique ID for quotes
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize sync functionality
function initializeSync() {
    // Load server data
    loadServerData();
    
    // Start periodic sync
    syncState.syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);
    
    // Initial sync
    setTimeout(syncWithServer, 2000);
    
    updateSyncUI();
}

// Simulate server data storage
function loadServerData() {
    try {
        const serverData = localStorage.getItem(SERVER_STORAGE_KEY);
        if (!serverData) {
            // Initialize server with current quotes
            saveServerData(quotes);
        }
    } catch (error) {
        console.error('Error loading server data:', error);
    }
}

function saveServerData(data) {
    try {
        localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify({
            quotes: data,
            lastUpdated: Date.now(),
            version: '1.0'
        }));
    } catch (error) {
        console.error('Error saving server data:', error);
    }
}

function getServerData() {
    try {
        const serverData = localStorage.getItem(SERVER_STORAGE_KEY);
        return serverData ? JSON.parse(serverData) : null;
    } catch (error) {
        console.error('Error getting server data:', error);
        return null;
    }
}

// Main sync function
async function syncWithServer() {
    if (!syncState.isOnline) {
        updateSyncUI();
        return;
    }
    
    setSyncStatus('syncing', 'Syncing with server...');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const serverData = getServerData();
        if (!serverData) {
            throw new Error('Server unavailable');
        }
        
        const serverQuotes = serverData.quotes || [];
        const conflicts = detectConflicts(quotes, serverQuotes);
        
        if (conflicts.length > 0) {
            syncState.conflicts = conflicts;
            showConflictResolution(conflicts);
            setSyncStatus('error', `${conflicts.length} conflicts detected`);
        } else {
            // No conflicts, merge data
            const mergedQuotes = mergeQuotes(quotes, serverQuotes);
            quotes = mergedQuotes;
            saveQuotesToStorage();
            saveServerData(mergedQuotes);
            
            syncState.lastSync = new Date();
            syncState.pendingChanges = false;
            setSyncStatus('online', `Synced ${new Date().toLocaleTimeString()}`);
            
            // Update UI
            populateCategories();
            filterQuotes();
            displayStorageInfo();
            
            showNotification(`Synced successfully! ${mergedQuotes.length} quotes in sync.`);
        }
        
    } catch (error) {
        console.error('Sync failed:', error);
        setSyncStatus('error', 'Sync failed: ' + error.message);
        showNotification('Sync failed: ' + error.message, 'error');
    }
}

// Detect conflicts between local and server data
function detectConflicts(localQuotes, serverQuotes) {
    const conflicts = [];
    
    // Create maps for easy lookup
    const localMap = new Map(localQuotes.map(q => [q.id, q]));
    const serverMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Check for conflicts in common quotes
    for (const [id, localQuote] of localMap) {
        const serverQuote = serverMap.get(id);
        if (serverQuote && 
            (localQuote.text !== serverQuote.text || 
             localQuote.category !== serverQuote.category ||
             localQuote.version !== serverQuote.version)) {
            conflicts.push({
                id: id,
                local: localQuote,
                server: serverQuote,
                type: 'update'
            });
        }
    }
    
    // Check for deleted quotes
    for (const [id, serverQuote] of serverMap) {
        if (!localMap.has(id)) {
            conflicts.push({
                id: id,
                local: null,
                server: serverQuote,
                type: 'deletion'
            });
        }
    }
    
    return conflicts;
}

// Merge quotes (server takes precedence in case of conflicts)
function mergeQuotes(localQuotes, serverQuotes) {
    const mergedMap = new Map();
    
    // Add all server quotes (server takes precedence)
    serverQuotes.forEach(quote => {
        mergedMap.set(quote.id, { ...quote });
    });
    
    // Add local quotes that don't exist on server
    localQuotes.forEach(quote => {
        if (!mergedMap.has(quote.id)) {
            mergedMap.set(quote.id, { ...quote });
        }
    });
    
    return Array.from(mergedMap.values());
}

// Show conflict resolution modal
function showConflictResolution(conflicts) {
    let conflictsHTML = `
        <p>Found ${conflicts.length} conflict(s) between local and server data:</p>
    `;
    
    conflicts.forEach((conflict, index) => {
        conflictsHTML += `
            <div class="conflict-item">
                <div class="conflict-header">Conflict ${index + 1} - ${conflict.type}</div>
                <div class="conflict-versions">
                    <div class="conflict-version server">
                        <h4>Server Version:</h4>
                        ${conflict.server ? `
                            <p>"${conflict.server.text}"</p>
                            <small>Category: ${conflict.server.category} | Version: ${conflict.server.version || 1}</small>
                        ` : '<p>Deleted on server</p>'}
                    </div>
                    <div class="conflict-version local">
                        <h4>Local Version:</h4>
                        ${conflict.local ? `
                            <p>"${conflict.local.text}"</p>
                            <small>Category: ${conflict.local.category} | Version: ${conflict.local.version || 1}</small>
                        ` : '<p>Deleted locally</p>'}
                    </div>
                </div>
            </div>
        `;
    });
    
    conflictList.innerHTML = conflictsHTML;
    conflictModal.style.display = 'flex';
    viewConflictsBtn.style.display = 'inline-block';
}

// Conflict resolution handlers
function setupConflictResolution() {
    // Close modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        conflictModal.style.display = 'none';
    });
    
    // Use server data
    document.getElementById('useServerData').addEventListener('click', () => {
        resolveConflicts('server');
    });
    
    // Use local data
    document.getElementById('useLocalData').addEventListener('click', () => {
        resolveConflicts('local');
    });
    
    // Merge data (keep both versions)
    document.getElementById('mergeData').addEventListener('click', () => {
        resolveConflicts('merge');
    });
    
    // Close modal when clicking outside
    conflictModal.addEventListener('click', (e) => {
        if (e.target === conflictModal) {
            conflictModal.style.display = 'none';
        }
    });
}

function resolveConflicts(strategy) {
    const serverData = getServerData();
    let resolvedQuotes = [...quotes];
    
    syncState.conflicts.forEach(conflict => {
        switch (strategy) {
            case 'server':
                // Remove local version, use server version
                resolvedQuotes = resolvedQuotes.filter(q => q.id !== conflict.id);
                if (conflict.server) {
                    resolvedQuotes.push(conflict.server);
                }
                break;
                
            case 'local':
                // Keep local version, ignore server changes
                if (conflict.local) {
                    resolvedQuotes = resolvedQuotes.filter(q => q.id !== conflict.id);
                    resolvedQuotes.push(conflict.local);
                }
                break;
                
            case 'merge':
                // Keep both versions (modify local version)
                if (conflict.local && conflict.server) {
                    const mergedQuote = {
                        ...conflict.local,
                        text: conflict.local.text + " [Conflict Resolved]",
                        version: Math.max(conflict.local.version || 1, conflict.server.version || 1) + 1
                    };
                    resolvedQuotes = resolvedQuotes.filter(q => q.id !== conflict.id);
                    resolvedQuotes.push(mergedQuote);
                    resolvedQuotes.push(conflict.server);
                }
                break;
        }
    });
    
    quotes = resolvedQuotes;
    saveQuotesToStorage();
    saveServerData(resolvedQuotes);
    
    syncState.conflicts = [];
    syncState.lastSync = new Date();
    syncState.pendingChanges = false;
    
    conflictModal.style.display = 'none';
    viewConflictsBtn.style.display = 'none';
    
    // Update UI
    populateCategories();
    filterQuotes();
    displayStorageInfo();
    
    showNotification(`Conflicts resolved using ${strategy} strategy`);
    setSyncStatus('online', `Synced ${new Date().toLocaleTimeString()}`);
}

// Update sync UI
function setSyncStatus(status, message) {
    const statusElement = document.getElementById('syncStatus');
    const syncStatusContainer = document.querySelector('.sync-status');
    
    syncStatusContainer.className = 'sync-status ' + status;
    statusElement.textContent = `Sync: ${message}`;
    
    if (status === 'online') {
        syncInfo.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
    } else if (status === 'syncing') {
        syncInfo.textContent = 'Synchronizing with server...';
    } else if (status === 'error') {
        syncInfo.textContent = 'Click "Sync Now" to retry';
    }
}

function updateSyncUI() {
    if (syncState.pendingChanges) {
        setSyncStatus('syncing', 'Pending changes...');
    } else if (syncState.lastSync) {
        setSyncStatus('online', `Last sync: ${syncState.lastSync.toLocaleTimeString()}`);
    }
}

// Manual sync
function manualSync() {
    syncWithServer();
}

// Mark changes as pending (called when user makes changes)
function markChangesPending() {
    syncState.pendingChanges = true;
    updateSyncUI();
}

// ... (Previous functions remain the same until addQuote)

// Add a new quote to the collection
function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    if (!text) {
        alert('Please enter a quote');
        newQuoteText.focus();
        return;
    }
    
    if (!category) {
        alert('Please enter a category');
        newQuoteCategory.focus();
        return;
    }
    
    const newQuote = { 
        id: generateId(),
        text: text.charAt(0).toUpperCase() + text.slice(1),
        category: category.charAt(0).toUpperCase() + category.slice(1),
        timestamp: Date.now(),
        version: 1
    };
    
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
    // Mark changes as pending for sync
    markChangesPending();
    
    // Update categories dropdown
    populateCategories();
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    // Show confirmation
    showNotification('Quote added successfully!');
    
    // Auto-filter to show the new quote
    currentFilter.category = newQuote.category;
    categoryFilter.value = newQuote.category;
    filterQuotes();
}

// Set up all event listeners (updated)
function setupEventListeners() {
    newQuoteBtn.addEventListener('click', showRandomQuote);
    categoryFilter.addEventListener('change', handleCategoryChange);
    showAllBtn.addEventListener('click', showAllQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotes);
    importQuotesBtn.addEventListener('click', triggerImport);
    clearStorageBtn.addEventListener('click', clearAllData);
    importFile.addEventListener('change', importFromJsonFile);
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    clearFilterBtn.addEventListener('click', clearAllFilters);
    sortSelect.addEventListener('change', handleSortChange);
    manualSyncBtn.addEventListener('click', manualSync);
    viewConflictsBtn.addEventListener('click', () => showConflictResolution(syncState.conflicts));
    
    // Setup conflict resolution
    setupConflictResolution();
}

// ... (Rest of the previous functions remain the same, but ensure they call markChangesPending when making changes)

// Clear all data from storage (updated)
function clearAllData() {
    if (confirm('Are you sure you want to clear all quotes and reset to initial data?')) {
        try {
            // Clear localStorage
            localStorage.removeItem('quotes');
            localStorage.removeItem('filterPreferences');
            
            // Clear server data
            localStorage.removeItem(SERVER_STORAGE_KEY);
            
            // Clear sessionStorage
            sessionStorage.removeItem('lastViewedQuote');
            
            // Reset quotes to initial data
            quotes = [...initialQuotes];
            
            // Reset server data
            saveServerData(initialQuotes);
            
            // Reset filters
            clearAllFilters();
            
            // Reset sync state
            syncState.conflicts = [];
            syncState.pendingChanges = false;
            viewConflictsBtn.style.display = 'none';
            
            // Update UI
            populateCategories();
            displayStorageInfo();
            
            showNotification('All data cleared and reset to initial quotes!');
            setSyncStatus('online', 'Data reset complete');
            
        } catch (error) {
            console.error('Error clearing storage:', error);
            showNotification('Error clearing storage', 'error');
        }
    }
}

// Display storage information (updated)
function displayStorageInfo() {
    // Remove existing storage info if any
    const existingInfo = document.querySelector('.storage-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const quotesCount = quotes.length;
    const categoriesCount = new Set(quotes.map(quote => quote.category)).size;
    const syncInfoText = syncState.lastSync 
        ? `Last sync: ${syncState.lastSync.toLocaleTimeString()}`
        : 'Not synced yet';
    
    const storageInfo = document.createElement('div');
    storageInfo.className = 'storage-info';
    storageInfo.innerHTML = `
        <strong>Storage Info:</strong> 
        ${quotesCount} quotes in ${categoriesCount} categories | 
        ${syncInfoText} |
        ${syncState.pendingChanges ? 'Pending sync' : 'In sync'}
    `;
    
    // Insert after the controls panel
    const controlsPanel = document.querySelector('.controls-panel');
    controlsPanel.parentNode.insertBefore(storageInfo, controlsPanel.nextSibling);
}

// ... (Keep all other existing functions the same)