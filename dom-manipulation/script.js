// Initial quotes array
let quotes = [
    { id: 1, text: "The only way to do great work is to love what you do.", category: "Inspiration", version: 1 },
    { id: 2, text: "Life is what happens to you while you're busy making other plans.", category: "Life", version: 1 },
    { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation", version: 1 },
    { id: 4, text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom", version: 1 },
    { id: 5, text: "Whoever is happy will make others happy too.", category: "Happiness", version: 1 },
    { id: 6, text: "You only live once, but if you do it right, once is enough.", category: "Life", version: 1 },
    { id: 7, text: "Be the change that you wish to see in the world.", category: "Inspiration", version: 1 }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const exportQuotesBtn = document.getElementById('exportQuotes');
const formContainer = document.getElementById('formContainer');
const categoryFilter = document.getElementById('categoryFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const activeFilter = document.getElementById('activeFilter');
const currentFilter = document.getElementById('currentFilter');
const quotesListSection = document.getElementById('quotesListSection');
const quotesContainer = document.getElementById('quotesContainer');
const quotesCount = document.getElementById('quotesCount');
const totalQuotesSpan = document.getElementById('totalQuotes');
const totalCategoriesSpan = document.getElementById('totalCategories');
const currentFilterStat = document.getElementById('currentFilterStat');
const lastSyncTime = document.getElementById('lastSyncTime');
const syncStatus = document.getElementById('syncStatus');
const syncIndicator = document.getElementById('syncIndicator');
const syncMessage = document.getElementById('syncMessage');
const manualSyncBtn = document.getElementById('manualSync');
const conflictModal = document.getElementById('conflictModal');
const conflictMessage = document.getElementById('conflictMessage');
const resolveConflictBtn = document.getElementById('resolveConflict');
const cancelResolutionBtn = document.getElementById('cancelResolution');
const importFileInput = document.getElementById('importFile');
const importQuotesBtn = document.getElementById('importQuotes');
const exportAllQuotesBtn = document.getElementById('exportAllQuotes');
const exportFilteredQuotesBtn = document.getElementById('exportFilteredQuotes');
const includeMetadataCheckbox = document.getElementById('includeMetadata');
const prettyPrintCheckbox = document.getElementById('prettyPrint');

// Form elements (will be created dynamically)
let addQuoteForm, newQuoteText, newQuoteCategory, addQuoteBtn;

// Current filter state
let currentCategoryFilter = 'all';

// Sync configuration
const SYNC_INTERVAL = 30000; // 30 seconds
let syncInterval;
let lastSyncTimestamp = null;
let pendingChanges = false;

// Server simulation (using localStorage as mock server)
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';

// Initialize the application
function init() {
    // Initialize mock server data
    initializeMockServer();
    
    // Load quotes from localStorage if available
    loadQuotesFromStorage();
    
    // Load last selected filter from localStorage
    loadLastFilter();
    
    // Create the add quote form dynamically
    createAddQuoteForm();
    
    // Populate categories dropdown
    populateCategories();
    
    updateStats();
    showRandomQuote();
    
    // Start periodic sync
    startPeriodicSync();
    
    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
    exportQuotesBtn.addEventListener('click', showExportSection);
    clearFilterBtn.addEventListener('click', clearFilter);
    categoryFilter.addEventListener('change', filterQuotes);
    manualSyncBtn.addEventListener('click', manualSync);
    resolveConflictBtn.addEventListener('click', resolveConflict);
    cancelResolutionBtn.addEventListener('click', cancelResolution);
    importQuotesBtn.addEventListener('click', importQuotes);
    exportAllQuotesBtn.addEventListener('click', exportAllQuotes);
    exportFilteredQuotesBtn.addEventListener('click', exportFilteredQuotes);
    
    // Set up beforeunload to detect pending changes
    window.addEventListener('beforeunload', handleBeforeUnload);
}

// Show export section (scroll to it)
function showExportSection() {
    document.querySelector('.import-export-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Export all quotes to JSON file
function exportAllQuotes() {
    const includeMetadata = includeMetadataCheckbox.checked;
    const prettyPrint = prettyPrintCheckbox.checked;
    
    const exportData = prepareExportData(quotes, includeMetadata);
    downloadJSON(exportData, 'all_quotes.json', prettyPrint);
    
    alert(`Exported ${quotes.length} quotes to JSON file!`);
}

// Export filtered quotes to JSON file
function exportFilteredQuotes() {
    const filteredQuotes = getFilteredQuotes();
    const includeMetadata = includeMetadataCheckbox.checked;
    const prettyPrint = prettyPrintCheckbox.checked;
    
    if (filteredQuotes.length === 0) {
        alert('No quotes to export with the current filter.');
        return;
    }
    
    const exportData = prepareExportData(filteredQuotes, includeMetadata);
    const filename = currentCategoryFilter === 'all' ? 'all_quotes.json' : `quotes_${currentCategoryFilter}.json`;
    
    downloadJSON(exportData, filename, prettyPrint);
    
    alert(`Exported ${filteredQuotes.length} filtered quotes to JSON file!`);
}

// Prepare data for export
function prepareExportData(quotesToExport, includeMetadata) {
    if (includeMetadata) {
        return {
            quotes: quotesToExport,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                totalQuotes: quotesToExport.length,
                categories: [...new Set(quotesToExport.map(q => q.category))],
                version: '1.0'
            }
        };
    } else {
        // Export only text and category
        return quotesToExport.map(quote => ({
            text: quote.text,
            category: quote.category
        }));
    }
}

// Download JSON file
function downloadJSON(data, filename, prettyPrint) {
    const jsonString = prettyPrint ? 
        JSON.stringify(data, null, 2) : 
        JSON.stringify(data);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importQuotes() {
    const file = importFileInput.files[0];
    
    if (!file) {
        alert('Please select a JSON file to import.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const importedQuotes = parseImportedData(importedData);
            
            if (importedQuotes.length === 0) {
                alert('No valid quotes found in the selected file.');
                return;
            }
            
            // Show import confirmation
            showImportConfirmation(importedQuotes);
            
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file.');
    };
    
    reader.readAsText(file);
}

// Parse imported data (handle different formats)
function parseImportedData(data) {
    let quotesArray = [];
    
    // Handle different possible formats
    if (Array.isArray(data)) {
        // Direct array of quotes
        quotesArray = data;
    } else if (data.quotes && Array.isArray(data.quotes)) {
        // Object with quotes property
        quotesArray = data.quotes;
    } else {
        throw new Error('Invalid format: Expected array of quotes or object with "quotes" array');
    }
    
    // Validate and transform quotes
    return quotesArray.map((quote, index) => {
        if (!quote.text || !quote.category) {
            throw new Error(`Quote at index ${index} is missing required fields (text and category)`);
        }
        
        return {
            id: quote.id || Math.max(...quotes.map(q => q.id), 0) + index + 1,
            text: quote.text,
            category: quote.category,
            version: quote.version || 1
        };
    });
}

// Show import confirmation dialog
function showImportConfirmation(importedQuotes) {
    const confirmed = confirm(
        `Found ${importedQuotes.length} quotes to import.\n\n` +
        `This will ${quotes.length > 0 ? 'merge with' : 'replace'} your current quotes.\n\n` +
        `Do you want to proceed?`
    );
    
    if (confirmed) {
        // Merge imported quotes with existing ones
        const existingIds = new Set(quotes.map(q => q.id));
        const newQuotes = importedQuotes.filter(quote => !existingIds.has(quote.id));
        
        // Add new quotes (avoiding duplicates by ID)
        quotes.push(...newQuotes);
        
        // Save to storage
        saveQuotesToStorage();
        
        // Update UI
        populateCategories();
        updateStats();
        showRandomQuote();
        displayFilteredQuotes();
        
        alert(`Successfully imported ${newQuotes.length} new quotes!`);
        
        // Clear file input
        importFileInput.value = '';
    }
}

// Initialize mock server data
function initializeMockServer() {
    if (!localStorage.getItem(SERVER_KEY)) {
        const serverData = {
            quotes: quotes.map(quote => ({ ...quote })),
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
        // Simulate API call to JSONPlaceholder or similar service
        // Since we're using localStorage as mock server, we'll simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        // For simulation, we'll use our localStorage as the "server"
        const serverData = localStorage.getItem(SERVER_KEY);
        
        if (!serverData) {
            throw new Error('No server data available');
        }
        
        const parsedData = JSON.parse(serverData);
        
        // Simulate random server updates occasionally
        if (Math.random() > 0.7) {
            // 30% chance to simulate server-side updates
            simulateServerUpdates(parsedData.quotes);
        }
        
        updateSyncStatus('success', 'Quotes fetched successfully from server');
        return {
            success: true,
            quotes: parsedData.quotes,
            timestamp: parseInt(localStorage.getItem(SERVER_TIMESTAMP_KEY) || Date.now().toString())
        };
        
    } catch (error) {
        console.error('Failed to fetch quotes from server:', error);
        updateSyncStatus('error', `Failed to fetch: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate server-side updates for testing
function simulateServerUpdates(serverQuotes) {
    // Occasionally add a new quote on the server side
    if (Math.random() > 0.5 && serverQuotes.length > 0) {
        const newServerQuote = {
            id: Math.max(...serverQuotes.map(q => q.id)) + 1,
            text: "Server-generated quote: The best way to predict the future is to create it.",
            category: "Wisdom",
            version: 1,
            source: "server"
        };
        serverQuotes.push(newServerQuote);
        
        // Update server storage
        const serverData = {
            quotes: serverQuotes,
            lastUpdated: Date.now()
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
    }
    
    // Occasionally update an existing quote
    if (Math.random() > 0.7 && serverQuotes.length > 2) {
        const randomIndex = Math.floor(Math.random() * serverQuotes.length);
        serverQuotes[randomIndex].version += 1;
        serverQuotes[randomIndex].text += " (updated on server)";
        
        // Update server storage
        const serverData = {
            quotes: serverQuotes,
            lastUpdated: Date.now()
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
    }
}

// Simulate server fetch (general data fetch)
async function fetchFromServer() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    try {
        const serverData = localStorage.getItem(SERVER_KEY);
        const serverTimestamp = localStorage.getItem(SERVER_TIMESTAMP_KEY);
        
        if (serverData && serverTimestamp) {
            return {
                success: true,
                data: JSON.parse(serverData),
                timestamp: parseInt(serverTimestamp)
            };
        }
        
        return { success: false, error: 'No server data found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Simulate server post
async function postToServer(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    try {
        const serverData = {
            quotes: data,
            lastUpdated: Date.now()
        };
        
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Start periodic synchronization
function startPeriodicSync() {
    syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);
    updateSyncStatus('idle', 'Auto-sync enabled (every 30s)');
}

// Manual sync trigger
function manualSync() {
    updateSyncStatus('syncing', 'Syncing with server...');
    syncWithServer();
}

// Main sync function
async function syncWithServer() {
    try {
        updateSyncStatus('syncing', 'Syncing with server...');
        
        // Fetch latest data from server using the required function
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
        
        if (conflicts.length > 0 && localChanges) {
            // Show conflict resolution modal
            showConflictModal(conflicts, serverQuotes);
            updateSyncStatus('error', 'Sync conflicts detected');
            return;
        }
        
        if (localChanges && conflicts.length === 0) {
            // Push local changes to server
            await postToServer(quotes);
            updateSyncStatus('success', 'Changes synced to server');
        } else if (!localChanges) {
            // Pull server changes
            quotes = serverQuotes;
            saveQuotesToStorage();
            updateUIAfterSync();
            updateSyncStatus('success', 'Data updated from server');
        }
        
        lastSyncTimestamp = Date.now();
        updateLastSyncTime();
        pendingChanges = false;
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncStatus('error', `Sync failed: ${error.message}`);
    }
}

// Detect conflicts between local and server data
function detectConflicts(serverQuotes) {
    const conflicts = [];
    
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    const localQuoteMap = new Map(quotes.map(q => [q.id, q]));
    
    // Check for conflicts in existing quotes
    for (const localQuote of quotes) {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        
        if (serverQuote && serverQuote.version > localQuote.version) {
            // Quote was modified on server and locally
            if (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category) {
                conflicts.push({
                    id: localQuote.id,
                    local: localQuote,
                    server: serverQuote,
                    type: 'update'
                });
            }
        }
    }
    
    // Check for deleted quotes
    for (const serverQuote of serverQuotes) {
        if (!localQuoteMap.has(serverQuote.id)) {
            conflicts.push({
                id: serverQuote.id,
                local: null,
                server: serverQuote,
                type: 'deletion'
            });
        }
    }
    
    return conflicts;
}

// Show conflict resolution modal
function showConflictModal(conflicts, serverQuotes) {
    conflictMessage.textContent = `Found ${conflicts.length} conflict(s) between your local data and the server.`;
    conflictModal.style.display = 'flex';
}

// Resolve conflicts based on user selection
function resolveConflict() {
    const resolution = document.querySelector('input[name="resolution"]:checked').value;
    const serverQuotes = JSON.parse(localStorage.getItem(SERVER_KEY)).quotes;
    
    switch (resolution) {
        case 'server':
            // Use server data (discard local changes)
            quotes = serverQuotes;
            break;
        case 'local':
            // Keep local data (push to server)
            postToServer(quotes);
            break;
        case 'merge':
            // Merge data (intelligent combination)
            quotes = mergeData(quotes, serverQuotes);
            postToServer(quotes);
            break;
    }
    
    saveQuotesToStorage();
    updateUIAfterSync();
    hideConflictModal();
    updateSyncStatus('success', 'Conflicts resolved and data synced');
    pendingChanges = false;
    lastSyncTimestamp = Date.now();
    updateLastSyncTime();
}

// Merge local and server data intelligently
function mergeData(localQuotes, serverQuotes) {
    const merged = [];
    const usedIds = new Set();
    
    // Create maps for easy lookup
    const localMap = new Map(localQuotes.map(q => [q.id, q]));
    const serverMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Add all server quotes (they have higher priority)
    for (const serverQuote of serverQuotes) {
        merged.push({ ...serverQuote });
        usedIds.add(serverQuote.id);
    }
    
    // Add local quotes that don't exist on server
    for (const localQuote of localQuotes) {
        if (!usedIds.has(localQuote.id)) {
            // Generate new ID for local-only quotes
            const newId = Math.max(...merged.map(q => q.id), ...serverQuotes.map(q => q.id)) + 1;
            merged.push({
                ...localQuote,
                id: newId,
                version: 1
            });
            usedIds.add(newId);
        }
    }
    
    return merged;
}

// Cancel conflict resolution
function cancelResolution() {
    hideConflictModal();
    updateSyncStatus('idle', 'Sync cancelled by user');
}

// Hide conflict modal
function hideConflictModal() {
    conflictModal.style.display = 'none';
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
    displayFilteredQuotes();
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
    
    // Update quotes count
    quotesCount.textContent = filteredQuotes.length;
    
    // Clear existing quotes
    quotesContainer.innerHTML = '';
    
    if (filteredQuotes.length === 0) {
        const noQuotesMessage = document.createElement('p');
        noQuotesMessage.textContent = 'No quotes found in this category.';
        noQuotesMessage.style.textAlign = 'center';
        noQuotesMessage.style.color = '#666';
        quotesContainer.appendChild(noQuotesMessage);
        quotesListSection.style.display = 'block';
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
    
    // Show the quotes list section
    quotesListSection.style.display = 'block';
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
        version: 1 
    };
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
    // Mark pending changes
    pendingChanges = true;
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
    displayFilteredQuotes();
    
    // Show confirmation
    alert('Quote added successfully!');
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('quotesLastUpdated', Date.now().toString());
}

// Update statistics
function updateStats() {
    totalQuotesSpan.textContent = quotes.length;
    
    // Count unique categories
    const categories = getUniqueCategories();
    totalCategoriesSpan.textContent = categories.length;
    
    // Update current filter stat
    currentFilterStat.textContent = currentCategoryFilter === 'all' ? 'All' : currentCategoryFilter;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);