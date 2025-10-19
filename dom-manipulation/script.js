// Constants
const JSON_PLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';
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

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Initialize server data
    initializeMockServer();
    
    // Load quotes from localStorage
    loadQuotesFromStorage();
    
    // Create the add quote form
    createAddQuoteForm();
    
    // Populate categories
    populateCategories();
    
    // Update UI
    updateStats();
    showRandomQuote();
    
    // Start periodic sync
    startPeriodicSync();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Application initialized successfully');
}

// Initialize mock server data
function initializeMockServer() {
    if (!localStorage.getItem(SERVER_KEY)) {
        const serverData = {
            quotes: [
                { id: 101, text: "Server: The best way to predict the future is to create it.", category: "Inspiration", version: 1, lastModified: Date.now() - 3600000 },
                { id: 102, text: "Server: Don't watch the clock; do what it does. Keep going.", category: "Motivation", version: 1, lastModified: Date.now() - 7200000 },
                { id: 103, text: "Server: The only limit to our realization of tomorrow is our doubts of today.", category: "Wisdom", version: 1, lastModified: Date.now() - 10800000 }
            ],
            lastUpdated: Date.now()
        };
        localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
        localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
    }
}

// Load quotes from localStorage
function loadQuotesFromStorage() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        try {
            const parsedQuotes = JSON.parse(savedQuotes);
            quotes = parsedQuotes;
        } catch (error) {
            console.error('Error loading quotes from storage:', error);
        }
    }
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    localStorage.setItem('quotesLastUpdated', Date.now().toString());
}

// Create add quote form dynamically
function createAddQuoteForm() {
    const formContainer = document.getElementById('formContainer');
    if (!formContainer) return;

    const formSection = document.createElement('section');
    formSection.className = 'form-section';
    formSection.id = 'addQuoteForm';
    formSection.style.display = 'none';

    formSection.innerHTML = `
        <h2>Add Your Own Quote</h2>
        <div class="form-group">
            <label for="newQuoteText">Quote Text</label>
            <input type="text" id="newQuoteText" placeholder="Enter a meaningful quote">
        </div>
        <div class="form-group">
            <label for="newQuoteCategory">Category</label>
            <select id="newQuoteCategory">
                <option value="Inspiration">Inspiration</option>
                <option value="Motivation">Motivation</option>
                <option value="Wisdom">Wisdom</option>
                <option value="Life">Life</option>
                <option value="Success">Success</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <button id="addQuote">Add Quote</button>
    `;

    formContainer.appendChild(formSection);

    // Add event listener for the add quote button
    document.getElementById('addQuote').addEventListener('click', addQuote);
}

// Populate categories dropdown
function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    // Clear existing options except "All Categories"
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }

    // Get unique categories
    const categories = getUniqueCategories();
    
    // Add categories to dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Get unique categories
function getUniqueCategories() {
    const categories = [...new Set(quotes.map(quote => quote.category))];
    return categories.sort();
}

// Show random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    if (!quoteDisplay) return;

    const filteredQuotes = getFilteredQuotes();
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<p class="quote-text">No quotes available in this category.</p>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    
    quoteDisplay.innerHTML = `
        <p class="quote-text">"${quote.text}"</p>
        <span class="quote-category">${quote.category}</span>
    `;
}

// Get filtered quotes based on current category
function getFilteredQuotes() {
    if (currentCategoryFilter === 'all') {
        return quotes;
    }
    return quotes.filter(quote => quote.category === currentCategoryFilter);
}

// Update statistics
function updateStats() {
    const totalQuotesSpan = document.getElementById('totalQuotes');
    const totalCategoriesSpan = document.getElementById('totalCategories');
    const lastSyncTime = document.getElementById('lastSyncTime');

    if (totalQuotesSpan) totalQuotesSpan.textContent = quotes.length;
    if (totalCategoriesSpan) totalCategoriesSpan.textContent = getUniqueCategories().length;
    if (lastSyncTime) {
        lastSyncTime.textContent = lastSyncTimestamp ? 
            new Date(lastSyncTimestamp).toLocaleTimeString() : 'Never';
    }
}

// Setup event listeners
function setupEventListeners() {
    const newQuoteBtn = document.getElementById('newQuote');
    const showFormBtn = document.getElementById('showForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const manualSyncBtn = document.getElementById('manualSync');

    if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);
    if (showFormBtn) showFormBtn.addEventListener('click', toggleAddQuoteForm);
    if (categoryFilter) categoryFilter.addEventListener('change', filterQuotes);
    if (clearFilterBtn) clearFilterBtn.addEventListener('click', clearFilter);
    if (manualSyncBtn) manualSyncBtn.addEventListener('click', manualSync);
}

// Toggle add quote form visibility
function toggleAddQuoteForm() {
    const form = document.getElementById('addQuoteForm');
    const showFormBtn = document.getElementById('showForm');
    
    if (form && showFormBtn) {
        if (form.style.display === 'block') {
            form.style.display = 'none';
            showFormBtn.textContent = 'Add New Quote';
        } else {
            form.style.display = 'block';
            showFormBtn.textContent = 'Hide Form';
            document.getElementById('newQuoteText').focus();
        }
    }
}

// Add new quote
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
    
    // Update UI
    populateCategories();
    updateStats();
    showRandomQuote();
    
    // Clear form
    textInput.value = '';
    categorySelect.value = 'Inspiration';
    
    // Hide form
    toggleAddQuoteForm();
    
    alert('Quote added successfully!');
}

// Filter quotes by category
function filterQuotes() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        currentCategoryFilter = categoryFilter.value;
        showRandomQuote();
    }
}

// Clear filter
function clearFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = 'all';
        currentCategoryFilter = 'all';
        showRandomQuote();
    }
}

// ==================== SYNC FUNCTIONALITY ====================

// Start periodic synchronization using setInterval
function startPeriodicSync() {
    console.log('Starting periodic sync with setInterval...');
    
    // Clear any existing interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Start new interval - this is the key setInterval usage
    syncInterval = setInterval(() => {
        console.log('setInterval: Checking for server updates...');
        syncQuotes();
    }, SYNC_INTERVAL);
    
    updateSyncUI('Auto-sync enabled (every 30s)');
    
    // Do initial sync
    setTimeout(() => {
        syncQuotes();
    }, 2000);
}

// Manual sync trigger
function manualSync() {
    console.log('Manual sync triggered');
    syncQuotes();
}

// Main sync function
async function syncQuotes() {
    try {
        updateSyncUI('Syncing with server...');
        
        // Step 1: Fetch quotes from server
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.error);
        }
        
        const serverQuotes = serverResponse.quotes;
        console.log(`Fetched ${serverQuotes.length} quotes from server`);
        
        // Step 2: Detect and resolve conflicts
        const conflicts = detectDataConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            console.log(`Found ${conflicts.length} conflicts, resolving...`);
            await resolveConflictsWithServerPrecedence(conflicts, serverQuotes);
            showNotification(`${conflicts.length} conflicts resolved automatically`, 'info');
        } else {
            await mergeServerData(serverQuotes);
        }
        
        // Step 3: Update sync state
        lastSyncTimestamp = Date.now();
        updateStats();
        updateSyncUI('Sync completed successfully');
        showNotification('Quotes synchronized successfully', 'success');
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncUI('Sync failed: ' + error.message);
        showNotification('Sync failed. Please try again.', 'error');
    }
}

// Fetch quotes from JSONPlaceholder API
async function fetchQuotesFromServer() {
    try {
        console.log('Fetching from JSONPlaceholder API...');
        
        // Make actual API call to JSONPlaceholder
        const response = await fetch(JSON_PLACEHOLDER_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        console.log(`Received ${posts.length} posts from API`);
        
        // Transform posts to quotes
        const serverQuotes = transformPostsToQuotes(posts);
        
        // Update server storage
        updateServerStorage(serverQuotes);
        
        return {
            success: true,
            quotes: serverQuotes,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.error('API fetch failed:', error);
        
        // Fallback to cached data
        try {
            const cachedData = localStorage.getItem(SERVER_KEY);
            if (cachedData) {
                const serverData = JSON.parse(cachedData);
                return {
                    success: true,
                    quotes: serverData.quotes || [],
                    timestamp: serverData.lastUpdated || Date.now()
                };
            }
        } catch (cacheError) {
            console.error('Cache fallback failed:', cacheError);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Transform JSONPlaceholder posts to quotes
function transformPostsToQuotes(posts) {
    const categories = ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success'];
    
    return posts.slice(0, 5).map((post, index) => ({
        id: post.id + 1000,
        text: post.title.length > 50 ? post.title : `${post.title}. ${post.body.substring(0, 50)}...`,
        category: categories[index % categories.length],
        version: 1,
        lastModified: Date.now() - Math.floor(Math.random() * 86400000),
        source: 'jsonplaceholder'
    }));
}

// Update server storage
function updateServerStorage(serverQuotes) {
    const serverData = {
        quotes: serverQuotes,
        lastUpdated: Date.now()
    };
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
}

// Detect data conflicts
function detectDataConflicts(serverQuotes) {
    const conflicts = [];
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    
    // Check for update conflicts
    quotes.forEach(localQuote => {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        if (serverQuote && serverQuote.lastModified > localQuote.lastModified) {
            if (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category) {
                conflicts.push({
                    type: 'update',
                    local: localQuote,
                    server: serverQuote
                });
            }
        }
    });
    
    // Check for server additions
    serverQuotes.forEach(serverQuote => {
        if (!quotes.some(q => q.id === serverQuote.id)) {
            conflicts.push({
                type: 'addition',
                server: serverQuote
            });
        }
    });
    
    return conflicts;
}

// Resolve conflicts with server precedence
async function resolveConflictsWithServerPrecedence(conflicts, serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    let resolvedQuotes = [];
    
    // Start with all server quotes
    resolvedQuotes = [...serverQuotes];
    
    // Add local quotes that don't exist on server
    quotes.forEach(localQuote => {
        if (!serverQuoteMap.has(localQuote.id)) {
            resolvedQuotes.push({ ...localQuote });
        }
    });
    
    // Update quotes
    quotes = resolvedQuotes;
    saveQuotesToStorage();
    updateUIAfterSync();
}

// Merge server data
async function mergeServerData(serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    let mergedQuotes = [...quotes];
    
    // Add server quotes that don't exist locally
    serverQuotes.forEach(serverQuote => {
        if (!mergedQuotes.some(q => q.id === serverQuote.id)) {
            mergedQuotes.push({ ...serverQuote });
        }
    });
    
    // Update quotes
    quotes = mergedQuotes;
    saveQuotesToStorage();
    updateUIAfterSync();
}

// Update UI after sync
function updateUIAfterSync() {
    populateCategories();
    updateStats();
    showRandomQuote();
}

// Update sync UI
function updateSyncUI(message) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.textContent = message;
    }
    console.log('Sync UI:', message);
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    // Create simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);