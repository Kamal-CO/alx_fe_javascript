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
    setupConflictResolution();
    
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

// Load quotes from localStorage
function loadQuotesFromStorage() {
    try {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            const parsedQuotes = JSON.parse(storedQuotes);
            console.log('Loaded quotes from localStorage:', parsedQuotes.length);
            return parsedQuotes;
        }
    } catch (error) {
        console.error('Error loading quotes from localStorage:', error);
    }
    
    console.log('Using initial quotes');
    return [...initialQuotes];
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    try {
        localStorage.setItem('quotes', JSON.stringify(quotes));
        console.log('Saved quotes to localStorage:', quotes.length);
        displayStorageInfo();
    } catch (error) {
        console.error('Error saving quotes to localStorage:', error);
        showNotification('Error saving quotes to storage!', 'error');
    }
}

// Save filter preferences to localStorage
function saveFilterPreferences() {
    try {
        localStorage.setItem('filterPreferences', JSON.stringify(currentFilter));
    } catch (error) {
        console.error('Error saving filter preferences:', error);
    }
}

// Load filter preferences from localStorage
function loadFilterPreferences() {
    try {
        const storedFilters = localStorage.getItem('filterPreferences');
        if (storedFilters) {
            currentFilter = JSON.parse(storedFilters);
            
            // Apply stored filters to UI
            categoryFilter.value = currentFilter.category;
            searchInput.value = currentFilter.search;
            sortSelect.value = currentFilter.sort;
            
            console.log('Loaded filter preferences:', currentFilter);
        }
    } catch (error) {
        console.error('Error loading filter preferences:', error);
    }
}

// Save last viewed quote to session storage
function saveLastViewedQuote(quote) {
    try {
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
    } catch (error) {
        console.error('Error saving to sessionStorage:', error);
    }
}

// Load last viewed quote from session storage
function loadLastViewedQuote() {
    try {
        const lastQuote = sessionStorage.getItem('lastViewedQuote');
        if (lastQuote) {
            const quote = JSON.parse(lastQuote);
            showNotification(`Welcome back! Last viewed: "${quote.text.substring(0, 50)}..."`);
        }
    } catch (error) {
        console.error('Error loading from sessionStorage:', error);
    }
}

// Display storage information
function displayStorageInfo() {
    // Remove existing storage info if any
    const existingInfo = document.querySelector('.storage-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const quotesCount = quotes.length;
    const categoriesCount = new Set(quotes.map(quote => quote.category)).size;
    const storageInfo = document.createElement('div');
    storageInfo.className = 'storage-info';
    storageInfo.innerHTML = `
        <strong>Storage Info:</strong> 
        ${quotesCount} quotes in ${categoriesCount} categories | 
        Filter: ${currentFilter.category === 'all' ? 'All' : currentFilter.category} | 
        Last updated: ${new Date().toLocaleTimeString()}
    `;
    
    // Insert after the controls panel
    const controlsPanel = document.querySelector('.controls-panel');
    controlsPanel.parentNode.insertBefore(storageInfo, controlsPanel.nextSibling);
}

// Populate categories dynamically
function populateCategories() {
    const categories = ['all', ...new Set(quotes.map(quote => quote.category).sort())];
    let categoriesHTML = '';
    
    categories.forEach(category => {
        const displayName = category === 'all' ? 'All Categories' : category;
        const selected = category === currentFilter.category ? 'selected' : '';
        categoriesHTML += `<option value="${category}" ${selected}>${displayName}</option>`;
    });
    
    categoryFilter.innerHTML = categoriesHTML;
}

// Initialize categories (alias for populateCategories for backward compatibility)
function initializeCategories() {
    populateCategories();
}

// Filter quotes based on current filters
function filterQuotes() {
    let filteredQuotes = [...quotes];
    
    // Apply category filter
    if (currentFilter.category !== 'all') {
        filteredQuotes = filteredQuotes.filter(quote => 
            quote.category.toLowerCase() === currentFilter.category.toLowerCase()
        );
    }
    
    // Apply search filter
    if (currentFilter.search) {
        const searchTerm = currentFilter.search.toLowerCase();
        filteredQuotes = filteredQuotes.filter(quote => 
            quote.text.toLowerCase().includes(searchTerm) ||
            quote.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    filteredQuotes = sortQuotes(filteredQuotes, currentFilter.sort);
    
    // Display results
    displayFilteredQuotes(filteredQuotes);
    
    // Save filter preferences
    saveFilterPreferences();
    
    // Update results info
    updateResultsInfo(filteredQuotes.length);
}

// Sort quotes based on selected criteria
function sortQuotes(quotesArray, sortBy) {
    switch (sortBy) {
        case 'newest':
            return quotesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        case 'oldest':
            return quotesArray.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        case 'category':
            return quotesArray.sort((a, b) => a.category.localeCompare(b.category));
        case 'text':
            return quotesArray.sort((a, b) => a.text.localeCompare(b.text));
        default:
            return quotesArray;
    }
}

// Display filtered quotes
function displayFilteredQuotes(filteredQuotes) {
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = `
            <div class="no-results">
                <h3>No quotes found</h3>
                <p>Try changing your search criteria or adding new quotes.</p>
            </div>
        `;
        return;
    }
    
    let quotesHTML = '';
    
    filteredQuotes.forEach((quote, index) => {
        quotesHTML += `
            <div class="quote-card">
                <p>"${quote.text}"</p>
                <div class="quote-meta">
                    <span class="category-badge">${quote.category}</span>
                    <small>Added: ${new Date(quote.timestamp).toLocaleDateString()}</small>
                </div>
            </div>
        `;
    });
    
    quoteDisplay.innerHTML = quotesHTML;
}

// Update results information
function updateResultsInfo(count) {
    let infoText = `Showing ${count} quote${count !== 1 ? 's' : ''}`;
    
    if (currentFilter.category !== 'all') {
        infoText += ` in category "${currentFilter.category}"`;
    }
    
    if (currentFilter.search) {
        infoText += ` matching "${currentFilter.search}"`;
    }
    
    resultsInfo.textContent = infoText;
    resultsInfo.style.display = count === 0 ? 'none' : 'block';
}

// Set up all event listeners
function setupEventListeners() {
    document.getElementById('fetchFromServer').addEventListener('click', fetchFromServer);
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
}

// Handle category change
function handleCategoryChange(event) {
    currentFilter.category = event.target.value;
    filterQuotes();
}

// Handle search input
function handleSearchInput(event) {
    currentFilter.search = event.target.value;
    filterQuotes();
}

// Handle sort change
function handleSortChange(event) {
    currentFilter.sort = event.target.value;
    filterQuotes();
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    currentFilter.search = '';
    filterQuotes();
}

// Clear all filters
function clearAllFilters() {
    categoryFilter.value = 'all';
    searchInput.value = '';
    sortSelect.value = 'newest';
    
    currentFilter = {
        category: 'all',
        search: '',
        sort: 'newest'
    };
    
    filterQuotes();
    showNotification('All filters cleared');
}

// Show all quotes (alias for clearAllFilters)
function showAllQuotes() {
    clearAllFilters();
}

// Set up quick categories
function setupQuickCategories() {
    const quickCategoryButtons = document.querySelectorAll('.category-tag');
    quickCategoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            newQuoteCategory.value = category;
            newQuoteCategory.focus();
        });
    });
}

// Create and manage the add quote form functionality
function createAddQuoteForm() {
    addQuoteBtn.addEventListener('click', addQuote);
    
    // Allow adding quote with Enter key
    newQuoteText.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addQuote();
    });
    
    newQuoteCategory.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addQuote();
    });
}

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

// Display a random quote
function showRandomQuote() {
    const selectedCategory = currentFilter.category;
    let availableQuotes = quotes;
    
    if (selectedCategory !== 'all') {
        availableQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    if (availableQuotes.length === 0) {
        showNotification('No quotes available for the current filter!', 'error');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const randomQuote = availableQuotes[randomIndex];
    
    // Display just the random quote
    quoteDisplay.innerHTML = `
        <div class="quote-card">
            <p>"${randomQuote.text}"</p>
            <div class="quote-meta">
                <span class="category-badge">${randomQuote.category}</span>
                <small>Added: ${new Date(randomQuote.timestamp).toLocaleDateString()}</small>
            </div>
        </div>
    `;
    
    // Update results info
    resultsInfo.textContent = `Showing 1 random quote from ${availableQuotes.length} available`;
    resultsInfo.style.display = 'block';
    
    // Save to session storage
    saveLastViewedQuote(randomQuote);
}

// Export quotes functionality - FIXED: Now properly uses Blob and application/json
function exportQuotes() {
    let quotesToExport = quotes;
    
    // Apply current filters for export
    if (currentFilter.category !== 'all') {
        quotesToExport = quotes.filter(quote => quote.category === currentFilter.category);
    }
    
    if (currentFilter.search) {
        const searchTerm = currentFilter.search.toLowerCase();
        quotesToExport = quotesToExport.filter(quote => 
            quote.text.toLowerCase().includes(searchTerm) ||
            quote.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (quotesToExport.length === 0) {
        showNotification('No quotes to export with current filters!', 'error');
        return;
    }
    
    // Create JSON string
    const quotesJSON = JSON.stringify(quotesToExport, null, 2);
    
    // Create blob with application/json type - FIXED: Proper Blob usage
    const blob = new Blob([quotesJSON], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let filename = 'quotes';
    if (currentFilter.category !== 'all') filename += `-${currentFilter.category}`;
    if (currentFilter.search) filename += `-search-${currentFilter.search}`;
    filename += `-${new Date().toISOString().split('T')[0]}.json`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${quotesToExport.length} quotes successfully!`);
}

// Trigger file import
function triggerImport() {
    importFile.click();
}

// Import quotes from JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    // Check if file is JSON type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showNotification('Please select a JSON file', 'error');
        event.target.value = '';
        return;
    }
    
    const fileReader = new FileReader();
    
    fileReader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid format: Expected an array of quotes');
            }
            
            // Validate and enhance each quote object
            const validQuotes = importedQuotes.filter(quote => {
                return quote && typeof quote.text === 'string' && typeof quote.category === 'string';
            }).map(quote => ({
                ...quote,
                id: quote.id || generateId(),
                timestamp: quote.timestamp || Date.now(),
                version: quote.version || 1
            }));
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in the file');
            }
            
            // Add imported quotes
            quotes.push(...validQuotes);
            
            // Save to localStorage
            saveQuotesToStorage();
            
            // Mark changes as pending for sync
            markChangesPending();
            
            // Update categories
            populateCategories();
            
            // Reset file input
            event.target.value = '';
            
            showNotification(`Successfully imported ${validQuotes.length} quotes!`);
            filterQuotes();
            
        } catch (error) {
            console.error('Error importing quotes:', error);
            showNotification(`Import failed: ${error.message}`, 'error');
            event.target.value = '';
        }
    };
    
    fileReader.onerror = function() {
        showNotification('Error reading file', 'error');
        event.target.value = '';
    };
    
    fileReader.readAsText(file);
}

// Clear all data from storage
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
            syncState.lastSync = null;
            viewConflictsBtn.style.display = 'none';
            
            // Update UI
            populateCategories();
            displayStorageInfo();
            setSyncStatus('online', 'Data reset complete');
            
            showNotification('All data cleared and reset to initial quotes!');
            
        } catch (error) {
            console.error('Error clearing storage:', error);
            showNotification('Error clearing storage', 'error');
        }
    }
}

// Show notification message using innerHTML
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notificationHTML = `
        <div class="notification ${type}" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        ">
            ${message}
        </div>
    `;
    
    document.body.innerHTML += notificationHTML;
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Add CSS animations for notifications using innerHTML
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

async function fetchQuotesFromServer() {
    try {
        const response = await fetch('/api/quotes');
        if (!response.ok) {
            throw new Error('Failed to fetch quotes');
        }
        const quotes = await response.json();
        return quotes;
    } catch (error) {
        console.error('Error fetching quotes:', error);
        // Fallback to local quotes if server fails
        return [
            { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill" }
        ];
    }
}

// Mock API configuration
const MOCK_API_URL = 'https://jsonplaceholder.typicode.com/posts';
const QUOTES_API_URL = 'https://jsonplaceholder.typicode.com/posts'; // Using posts as quotes

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
    try {
        console.log('Fetching quotes from server...');
        
        const response = await fetch(QUOTES_API_URL);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const posts = await response.json();
        
        // Convert posts to quote format
        const serverQuotes = posts.slice(0, 10).map((post, index) => ({
            id: `server-${post.id}`,
            text: post.title.charAt(0).toUpperCase() + post.title.slice(1) + '.',
            category: getCategoryFromId(post.userId),
            timestamp: Date.now() - (index * 86400000), // Stagger timestamps
            version: 1,
            source: 'server'
        }));
        
        console.log(`Fetched ${serverQuotes.length} quotes from server`);
        return serverQuotes;
        
    } catch (error) {
        console.error('Error fetching quotes from server:', error);
        showNotification('Failed to fetch from server. Using local data.', 'error');
        return []; // Return empty array on error
    }
}

// Helper function to assign categories based on user ID
function getCategoryFromId(userId) {
    const categories = ['Inspiration', 'Motivation', 'Wisdom', 'Life', 'Success', 'Philosophy', 'Leadership'];
    return categories[userId % categories.length];
}

// Enhanced sync function to fetch from server
async function syncWithServer() {
    if (!syncState.isOnline) {
        updateSyncUI();
        return;
    }
    
    setSyncStatus('syncing', 'Syncing with server...');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Fetch fresh data from server
        const serverQuotes = await fetchQuotesFromServer();
        const localQuotes = quotes;
        
        const conflicts = detectConflicts(localQuotes, serverQuotes);
        
        if (conflicts.length > 0) {
            syncState.conflicts = conflicts;
            showConflictResolution(conflicts);
            setSyncStatus('error', `${conflicts.length} conflicts detected`);
        } else {
            // No conflicts, merge data (server takes precedence for common items)
            const mergedQuotes = mergeQuotes(localQuotes, serverQuotes);
            quotes = mergedQuotes;
            saveQuotesToStorage();
            
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

// Enhanced merge function to handle server data
function mergeQuotes(localQuotes, serverQuotes) {
    const mergedMap = new Map();
    
    // Add all server quotes (server takes precedence)
    serverQuotes.forEach(quote => {
        mergedMap.set(quote.id, { ...quote });
    });
    
    // Add local quotes that don't exist on server
    localQuotes.forEach(quote => {
        if (!mergedMap.has(quote.id) && !quote.id.startsWith('server-')) {
            mergedMap.set(quote.id, { ...quote });
        }
    });
    
    return Array.from(mergedMap.values());
}

// Function to manually fetch from server
async function fetchFromServer() {
    try {
        setSyncStatus('syncing', 'Fetching from server...');
        const serverQuotes = await fetchQuotesFromServer();
        
        if (serverQuotes.length > 0) {
            // Add server quotes to local collection
            quotes.push(...serverQuotes);
            saveQuotesToStorage();
            populateCategories();
            filterQuotes();
            
            showNotification(`Added ${serverQuotes.length} quotes from server!`);
            setSyncStatus('online', `Fetched ${serverQuotes.length} quotes`);
        } else {
            showNotification('No new quotes found on server', 'error');
            setSyncStatus('online', 'Server fetch complete');
        }
        
    } catch (error) {
        console.error('Fetch failed:', error);
        setSyncStatus('error', 'Fetch failed');
        showNotification('Failed to fetch from server', 'error');
    }
}

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
    
    return conflicts;
}