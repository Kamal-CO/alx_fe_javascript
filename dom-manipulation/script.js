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

// Server simulation (using JSONPlaceholder API and localStorage as backup)
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';
const SYNC_LOG_KEY = 'quoteGeneratorSyncLog';
const JSON_PLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';

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

// Initialize mock server data using JSONPlaceholder
async function initializeMockServer() {
    if (!localStorage.getItem(SERVER_KEY)) {
        addSyncLogEntry('Initializing server data from JSONPlaceholder API', 'info');
        
        try {
            // Fetch initial data from JSONPlaceholder API
            const response = await fetch(JSON_PLACEHOLDER_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            
            // Transform posts to quotes format
            const initialQuotes = posts.slice(0, 10).map((post, index) => ({
                id: post.id,
                text: post.title + (post.body ? '. ' + post.body.substring(0, 100) + '...' : ''),
                category: ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success'][index % 5],
                version: 1,
                lastModified: Date.now() - Math.random() * 86400000, // Random time in last 24 hours
                source: 'jsonplaceholder'
            }));
            
            const serverData = {
                quotes: initialQuotes,
                lastUpdated: Date.now(),
                source: 'jsonplaceholder'
            };
            
            localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
            localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
            
            addSyncLogEntry(`Successfully initialized ${initialQuotes.length} quotes from JSONPlaceholder API`, 'success');
            
        } catch (error) {
            console.error('Failed to fetch from JSONPlaceholder:', error);
            
            // Fallback: Use default quotes if API fails
            const serverData = {
                quotes: quotes.map(quote => ({ 
                    ...quote, 
                    lastModified: Date.now() 
                })),
                lastUpdated: Date.now(),
                source: 'fallback'
            };
            
            localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
            localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
            
            addSyncLogEntry(`Using fallback data: ${error.message}`, 'warning');
        }
    }
}

// Fetch quotes from JSONPlaceholder API (simulated server)
async function fetchQuotesFromServer() {
    updateSyncStatus('syncing', 'Fetching quotes from JSONPlaceholder API...');
    
    try {
        // Simulate API call to JSONPlaceholder with actual fetch
        const response = await fetch(JSON_PLACEHOLDER_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        // Get current server data from localStorage
        const serverDataJson = localStorage.getItem(SERVER_KEY);
        if (!serverDataJson) {
            throw new Error('No server data available');
        }
        
        const serverData = JSON.parse(serverDataJson);
        
        // Simulate random server updates (20% chance) using JSONPlaceholder data
        if (Math.random() > 0.8) {
            await simulateServerUpdates(serverData.quotes, posts);
        }
        
        addSyncLogEntry('Successfully fetched and processed data from JSONPlaceholder API', 'success');
        return {
            success: true,
            quotes: serverData.quotes,
            timestamp: parseInt(localStorage.getItem(SERVER_TIMESTAMP_KEY) || Date.now().toString())
        };
        
    } catch (error) {
        console.error('Failed to fetch quotes from server:', error);
        
        // Fallback to localStorage server data
        try {
            const serverDataJson = localStorage.getItem(SERVER_KEY);
            if (serverDataJson) {
                const serverData = JSON.parse(serverDataJson);
                addSyncLogEntry('Using cached server data due to API failure', 'warning');
                return {
                    success: true,
                    quotes: serverData.quotes,
                    timestamp: parseInt(localStorage.getItem(SERVER_TIMESTAMP_KEY) || Date.now().toString())
                };
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
        
        addSyncLogEntry(`Failed to fetch quotes: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate server-side updates using JSONPlaceholder data
async function simulateServerUpdates(serverQuotes, posts) {
    const actions = [];
    
    // Occasionally add a new quote from JSONPlaceholder (15% chance)
    if (Math.random() > 0.85 && posts.length > serverQuotes.length) {
        const unusedPosts = posts.filter(post => 
            !serverQuotes.some(quote => quote.source === 'jsonplaceholder' && quote.id === post.id)
        );
        
        if (unusedPosts.length > 0) {
            const randomPost = unusedPosts[Math.floor(Math.random() * unusedPosts.length)];
            const newQuote = {
                id: randomPost.id,
                text: randomPost.title + (randomPost.body ? '. ' + randomPost.body.substring(0, 100) + '...' : ''),
                category: ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success'][Math.floor(Math.random() * 5)],
                version: 1,
                lastModified: Date.now(),
                source: 'jsonplaceholder'
            };
            serverQuotes.push(newQuote);
            actions.push('added new quote from JSONPlaceholder');
        }
    }
    
    // Occasionally update an existing quote (10% chance)
    if (Math.random() > 0.9 && serverQuotes.length > 2) {
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
            lastUpdated: Date.now(),
            source: 'jsonplaceholder'
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
        addSyncLogEntry(`Server performed: ${actions.join(', ')}`, 'info');
    }
}

// Post quotes to JSONPlaceholder API (simulated server)
async function postToServer(data) {
    updateSyncStatus('syncing', 'Sending changes to JSONPlaceholder API...');
    
    try {
        // First, try to post to JSONPlaceholder API (simulated)
        const postResponse = await postToJsonPlaceholder(data);
        
        if (postResponse.success) {
            // Also update local server simulation
            const serverData = {
                quotes: data,
                lastUpdated: Date.now(),
                source: 'jsonplaceholder'
            };
            
            localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
            localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
            
            addSyncLogEntry('Successfully posted changes to JSONPlaceholder API and local server', 'success');
            return { success: true };
        } else {
            throw new Error(postResponse.error);
        }
        
    } catch (error) {
        console.error('Failed to post to server:', error);
        
        // Fallback: Update only local server simulation
        try {
            const serverData = {
                quotes: data,
                lastUpdated: Date.now(),
                source: 'local'
            };
            
            localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
            localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
            
            addSyncLogEntry('Posted to local server (API unavailable)', 'warning');
            return { success: true };
            
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            addSyncLogEntry(`Failed to post changes: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
}

// POST data to JSONPlaceholder API with proper headers and method
async function postToJsonPlaceholder(data) {
    try {
        // Convert our quotes data to JSONPlaceholder post format
        const postsToCreate = data.slice(0, 5).map((quote, index) => ({
            title: `Quote: ${quote.text.substring(0, 50)}...`,
            body: `Category: ${quote.category}\nFull Text: ${quote.text}\nID: ${quote.id}\nVersion: ${quote.version}`,
            userId: 1
        }));

        // Make POST requests for each post
        const postPromises = postsToCreate.map(async (post) => {
            const response = await fetch(JSON_PLACEHOLDER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(post)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        });

        const results = await Promise.all(postPromises);
        
        addSyncLogEntry(`Successfully posted ${results.length} quotes to JSONPlaceholder API`, 'success');
        return { 
            success: true, 
            message: `Posted ${results.length} items to API`,
            results: results 
        };

    } catch (error) {
        console.error('Failed to post to JSONPlaceholder:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// POST individual quote to JSONPlaceholder
async function postSingleQuoteToServer(quote) {
    try {
        const postData = {
            title: `Quote: ${quote.text.substring(0, 50)}...`,
            body: `Category: ${quote.category}\nFull Text: ${quote.text}\nID: ${quote.id}\nVersion: ${quote.version}`,
            userId: 1
        };

        const response = await fetch(JSON_PLACEHOLDER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        addSyncLogEntry(`Posted quote "${quote.text.substring(0, 30)}..." to JSONPlaceholder API`, 'success');
        return { success: true, data: result };

    } catch (error) {
        console.error('Failed to post single quote:', error);
        return { success: false, error: error.message };
    }
}

// Export quotes to JSON file
function exportQuotesToJson() {
    const exportData = {
        quotes: quotes,
        exportInfo: {
            exportedAt: new Date().toISOString(),
            totalQuotes: quotes.length,
            categories: [...new Set(quotes.map(q => q.category))],
            version: '1.0',
            source: 'Dynamic Quote Generator'
        }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    addSyncLogEntry(`Exported ${quotes.length} quotes to JSON file`, 'success');
    showNotification(`Successfully exported ${quotes.length} quotes to JSON file`, 'success');
}

// Import quotes from JSON file
function importQuotesFromJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate JSON structure
                if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
                    throw new Error('Invalid JSON format: Expected "quotes" array');
                }
                
                const importedQuotes = importedData.quotes.map(quote => {
                    if (!quote.text || !quote.category) {
                        throw new Error('Invalid quote: Missing text or category');
                    }
                    
                    return {
                        id: quote.id || Math.max(...quotes.map(q => q.id), 0) + 1,
                        text: quote.text,
                        category: quote.category,
                        version: quote.version || 1,
                        lastModified: quote.lastModified || Date.now()
                    };
                });
                
                resolve(importedQuotes);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
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
        updateSyncStatus('syncing', 'Starting synchronization with JSONPlaceholder API...');
        
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
            // Push local changes to server using POST method
            const postResult = await postToServer(quotes);
            
            if (postResult.success) {
                showNotification('Changes synced to JSONPlaceholder API successfully', 'success');
            } else {
                showNotification('Changes saved locally (API unavailable)', 'warning');
            }
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
    
    // Update both local and server with resolved data using POST
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
    
    // Update data and POST to server
    quotes = resolvedQuotes;
    const postResult = await postToServer(resolvedQuotes);
    saveQuotesToStorage();
    updateUIAfterSync();
    
    hideConflictModal();
    updateSyncStatus('success', 'Conflicts resolved and data synced');
    pendingChanges = false;
    updatePendingChanges();
    lastSyncTimestamp = Date.now();
    updateLastSyncTime();
    
    addSyncLogEntry(`Manually resolved ${conflicts.length} conflicts using ${resolution} strategy`, 'success');
    
    if (postResult.success) {
        showNotification(`Successfully resolved ${conflicts.length} conflicts and synced to API`, 'success');
    } else {
        showNotification(`Resolved ${conflicts.length} conflicts (saved locally)`, 'warning');
    }
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

// Load last selected filter from localStorage
function loadLastFilter() {
    const savedFilter = localStorage.getItem('lastCategoryFilter');
    if (savedFilter) {
        currentCategoryFilter = savedFilter;
        categoryFilter.value = savedFilter;
        currentFilter.textContent = savedFilter === 'all' ? 'All Categories' : savedFilter;
        currentFilterStat.textContent = savedFilter === 'all' ? 'All' : savedFilter;
    }
}

// Save current filter to localStorage
function saveCurrentFilter() {
    localStorage.setItem('lastCategoryFilter', currentCategoryFilter);
}

// Create the add quote form using createElement and appendChild
function createAddQuoteForm() {
    // Create form section element
    addQuoteForm = document.createElement('section');
    addQuoteForm.className = 'form-section';
    addQuoteForm.id = 'addQuoteForm';
    addQuoteForm.style.display = 'none';
    
    // Create form title
    const formTitle = document.createElement('h2');
    formTitle.textContent = 'Add Your Own Quote';
    addQuoteForm.appendChild(formTitle);
    
    // Create quote text input group
    const textGroup = document.createElement('div');
    textGroup.className = 'form-group';
    
    const textLabel = document.createElement('label');
    textLabel.setAttribute('for', 'newQuoteText');
    textLabel.textContent = 'Quote Text';
    textGroup.appendChild(textLabel);
    
    newQuoteText = document.createElement('input');
    newQuoteText.type = 'text';
    newQuoteText.id = 'newQuoteText';
    newQuoteText.placeholder = 'Enter a meaningful quote';
    textGroup.appendChild(newQuoteText);
    
    addQuoteForm.appendChild(textGroup);
    
    // Create category select group
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.setAttribute('for', 'newQuoteCategory');
    categoryLabel.textContent = 'Category';
    categoryGroup.appendChild(categoryLabel);
    
    newQuoteCategory = document.createElement('select');
    newQuoteCategory.id = 'newQuoteCategory';
    
    // Populate category options
    populateCategorySelect(newQuoteCategory);
    
    categoryGroup.appendChild(newQuoteCategory);
    addQuoteForm.appendChild(categoryGroup);
    
    // Create add quote button
    addQuoteBtn = document.createElement('button');
    addQuoteBtn.id = 'addQuote';
    addQuoteBtn.textContent = 'Add Quote';
    addQuoteBtn.addEventListener('click', addQuote);
    addQuoteForm.appendChild(addQuoteBtn);
    
    // Append the form to the container
    formContainer.appendChild(addQuoteForm);
}

// Populate categories dropdown dynamically
function populateCategories() {
    // Clear existing options except "All Categories"
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    
    // Get unique categories
    const categories = getUniqueCategories();
    
    // Create and append option elements
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Populate category select for the add form
function populateCategorySelect(selectElement) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Get unique categories
    const categories = getUniqueCategories();
    
    // Create and append option elements
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });
    
    // Add "Other" option for new categories
    const otherOption = document.createElement('option');
    otherOption.value = 'Other';
    otherOption.textContent = 'Other (add new category)';
    selectElement.appendChild(otherOption);
}

// Get unique categories from quotes
function getUniqueCategories() {
    const categories = [...new Set(quotes.map(quote => quote.category))];
    return categories.sort();
}

// Show a random quote
function showRandomQuote() {
    const filteredQuotes = getFilteredQuotes();
    
    if (filteredQuotes.length === 0) {
        // Clear existing content
        quoteDisplay.innerHTML = '';
        
        // Create new elements dynamically
        const noQuoteText = document.createElement('p');
        noQuoteText.className = 'quote-text';
        noQuoteText.textContent = 'No quotes available in this category.';
        quoteDisplay.appendChild(noQuoteText);
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    
    // Clear existing content
    quoteDisplay.innerHTML = '';
    
    // Create quote text element
    const quoteText = document.createElement('p');
    quoteText.className = 'quote-text';
    quoteText.textContent = `"${quote.text}"`;
    quoteDisplay.appendChild(quoteText);
    
    // Create category element
    const quoteCategory = document.createElement('span');
    quoteCategory.className = 'quote-category';
    quoteCategory.textContent = quote.category;
    quoteDisplay.appendChild(quoteCategory);
}

// Filter quotes based on selected category
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    currentCategoryFilter = selectedCategory;
    
    // Save filter preference
    saveCurrentFilter();
    
    // Update UI
    updateFilterDisplay();
    showRandomQuote();
    displayFilteredQuotes();
    updateStats();
}

// Update filter display
function updateFilterDisplay() {
    if (currentCategoryFilter === 'all') {
        activeFilter.style.display = 'none';
        currentFilter.textContent = 'All Categories';
        currentFilterStat.textContent = 'All';
    } else {
        activeFilter.style.display = 'block';
        currentFilter.textContent = currentCategoryFilter;
        currentFilterStat.textContent = currentCategoryFilter;
    }
}

// Display all filtered quotes in a list
function displayFilteredQuotes() {
    const filteredQuotes = getFilteredQuotes();
    
    // Clear existing quotes
    quotesContainer.innerHTML = '';
    
    if (filteredQuotes.length === 0) {
        const noQuotesMessage = document.createElement('p');
        noQuotesMessage.textContent = 'No quotes found in this category.';
        noQuotesMessage.style.textAlign = 'center';
        noQuotesMessage.style.color = '#666';
        quotesContainer.appendChild(noQuotesMessage);
        return;
    }
    
    // Create quote items
    filteredQuotes.forEach(quote => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        
        const quoteText = document.createElement('p');
        quoteText.className = 'quote-item-text';
        quoteText.textContent = `"${quote.text}"`;
        
        const quoteCategory = document.createElement('span');
        quoteCategory.className = 'quote-item-category';
        quoteCategory.textContent = quote.category;
        
        quoteItem.appendChild(quoteText);
        quoteItem.appendChild(quoteCategory);
        quotesContainer.appendChild(quoteItem);
    });
}

// Clear current filter
function clearFilter() {
    categoryFilter.value = 'all';
    filterQuotes();
}

// Get quotes filtered by selected category
function getFilteredQuotes() {
    if (currentCategoryFilter === 'all') {
        return quotes;
    }
    
    return quotes.filter(quote => quote.category === currentCategoryFilter);
}

// Toggle the add quote form visibility
function toggleAddQuoteForm() {
    if (addQuoteForm.style.display === 'block') {
        addQuoteForm.style.display = 'none';
        showFormBtn.textContent = 'Add New Quote';
    } else {
        addQuoteForm.style.display = 'block';
        showFormBtn.textContent = 'Hide Form';
        newQuoteText.focus();
    }
}

// Add a new quote
function addQuote() {
    const text = newQuoteText.value.trim();
    let category = newQuoteCategory.value.trim();
    
    if (!text) {
        alert('Please enter a quote text.');
        return;
    }
    
    if (!category || category === 'Other') {
        // Prompt for new category
        category = prompt('Please enter a new category name:');
        if (!category) {
            alert('Category is required.');
            return;
        }
        category = category.trim();
    }
    
    // Generate new ID and version
    const newId = Math.max(...quotes.map(q => q.id), 0) + 1;
    
    const newQuote = { 
        id: newId, 
        text, 
        category, 
        version: 1,
        lastModified: Date.now()
    };
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
    // Mark pending changes
    pendingChanges = true;
    updatePendingChanges();
    updateSyncStatus('idle', 'Local changes pending sync');
    
    // Update categories dropdown
    populateCategories();
    populateCategorySelect(newQuoteCategory);
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = 'Inspiration';
    
    // Update UI
    updateStats();
    showRandomQuote();
    
    // Show confirmation
    alert('Quote added successfully!');
    addSyncLogEntry('Added new quote: ' + text.substring(0, 50) + '...', 'info');
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('quotesLastUpdated', Date.now().toString());
    updatePendingChanges();
}

// Update statistics
function updateStats() {
    totalQuotesSpan.textContent = quotes.length;
    
    // Count unique categories
    const categories = getUniqueCategories();
    totalCategoriesSpan.textContent = categories.length;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);