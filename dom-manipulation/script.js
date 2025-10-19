// Add these constants at the top of the script.js file with other constants

// Server simulation constants
const JSON_PLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SERVER_KEY = 'quoteGeneratorServerData';
const SERVER_TIMESTAMP_KEY = 'quoteGeneratorServerTimestamp';
const SYNC_LOG_KEY = 'quoteGeneratorSyncLog';
const SYNC_INTERVAL = 30000; // 30 seconds

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

// DOM Elements and other existing code remains the same...
// ... [rest of your existing DOM element declarations]

// Current state variables
let currentCategoryFilter = 'all';
let syncInterval;
let lastSyncTimestamp = null;
let pendingChanges = false;
let syncLogEntries = [];

/**
 * Fetch quotes from JSONPlaceholder API - Complete implementation
 */
async function fetchQuotesFromServer() {
    try {
        updateSyncUI('syncing', 'Fetching quotes from JSONPlaceholder API...');
        addSyncLogEntry('Making request to: https://jsonplaceholder.typicode.com/posts', 'info');
        
        // Make actual API call to JSONPlaceholder
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        addSyncLogEntry(`Received ${posts.length} posts from JSONPlaceholder API`, 'success');
        
        // Transform posts to our quote format
        const serverQuotes = transformPostsToQuotes(posts);
        
        // Simulate server-side updates for realistic testing
        simulateServerUpdates(serverQuotes);
        
        // Update server storage in localStorage
        updateServerStorage(serverQuotes);
        
        updateSyncUI('success', `Fetched ${serverQuotes.length} quotes from server`);
        
        return {
            success: true,
            quotes: serverQuotes,
            timestamp: Date.now(),
            source: 'jsonplaceholder'
        };
        
    } catch (error) {
        console.error('Failed to fetch from JSONPlaceholder:', error);
        return handleFetchError(error);
    }
}

/**
 * Transform JSONPlaceholder posts to quote format
 */
function transformPostsToQuotes(posts) {
    const categories = ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success', 'Philosophy', 'Knowledge'];
    
    return posts.slice(0, 8).map((post, index) => {
        // Create meaningful quote text from post data
        let quoteText;
        if (post.title.length > 20) {
            quoteText = post.title;
        } else {
            quoteText = `${post.title}. ${post.body.substring(0, 80)}...`;
        }
        
        // Assign categories based on post content or round-robin
        const categoryIndex = index % categories.length;
        const category = categories[categoryIndex];
        
        return {
            id: post.id + 1000, // Offset to avoid ID conflicts with local quotes
            text: quoteText,
            category: category,
            version: 1,
            lastModified: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24 hours
            source: 'jsonplaceholder',
            originalPostId: post.id,
            userId: post.userId
        };
    });
}

/**
 * Simulate server-side updates to create realistic sync scenarios
 */
function simulateServerUpdates(serverQuotes) {
    const updates = [];
    
    // 25% chance to add a new server-generated quote
    if (Math.random() < 0.25 && serverQuotes.length > 0) {
        const newQuote = {
            id: Math.max(...serverQuotes.map(q => q.id)) + 1,
            text: "Server update: The best preparation for tomorrow is doing your best today.",
            category: "Motivation",
            version: 1,
            lastModified: Date.now(),
            source: 'server-generated'
        };
        serverQuotes.push(newQuote);
        updates.push('added new server quote');
    }
    
    // 20% chance to modify an existing quote
    if (Math.random() < 0.2 && serverQuotes.length > 3) {
        const randomIndex = Math.floor(Math.random() * serverQuotes.length);
        serverQuotes[randomIndex].version += 1;
        serverQuotes[randomIndex].lastModified = Date.now();
        serverQuotes[randomIndex].text += " [Server Updated]";
        updates.push('updated existing quote');
    }
    
    if (updates.length > 0) {
        addSyncLogEntry(`Server simulation: ${updates.join(', ')}`, 'info');
    }
}

/**
 * Update server storage in localStorage
 */
function updateServerStorage(serverQuotes) {
    const serverData = {
        quotes: serverQuotes,
        lastUpdated: Date.now(),
        source: 'jsonplaceholder'
    };
    localStorage.setItem(SERVER_KEY, JSON.stringify(serverData));
    localStorage.setItem(SERVER_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Handle fetch errors with fallback strategies
 */
function handleFetchError(error) {
    addSyncLogEntry(`API fetch failed: ${error.message}`, 'error');
    
    // Try fallback to cached server data
    try {
        const cachedData = localStorage.getItem(SERVER_KEY);
        if (cachedData) {
            const serverData = JSON.parse(cachedData);
            addSyncLogEntry('Using cached server data as fallback', 'warning');
            
            return {
                success: true,
                quotes: serverData.quotes || [],
                timestamp: serverData.lastUpdated || Date.now(),
                source: 'cache'
            };
        }
    } catch (cacheError) {
        console.error('Cache fallback failed:', cacheError);
    }
    
    // Final fallback: generate mock server quotes
    const mockQuotes = generateMockServerQuotes();
    addSyncLogEntry('Using mock server data as final fallback', 'warning');
    
    return {
        success: true,
        quotes: mockQuotes,
        timestamp: Date.now(),
        source: 'mock'
    };
}

/**
 * Generate mock server quotes for complete fallback
 */
function generateMockServerQuotes() {
    return [
        {
            id: 2001,
            text: "Fallback server quote: The purpose of our lives is to be happy.",
            category: "Life",
            version: 1,
            lastModified: Date.now() - 3600000,
            source: 'mock-fallback'
        },
        {
            id: 2002,
            text: "Fallback server wisdom: Get busy living or get busy dying.",
            category: "Motivation",
            version: 1,
            lastModified: Date.now() - 7200000,
            source: 'mock-fallback'
        },
        {
            id: 2003,
            text: "Fallback server insight: Life is what happens when you're busy making other plans.",
            category: "Philosophy",
            version: 1,
            lastModified: Date.now() - 10800000,
            source: 'mock-fallback'
        }
    ];
}

/**
 * Enhanced sync function that uses the complete server integration
 */
async function syncQuotes() {
    try {
        updateSyncUI('syncing', 'Starting sync with JSONPlaceholder API...');
        addSyncLogEntry('Initiating synchronization process', 'info');
        
        // Fetch from JSONPlaceholder API
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.error);
        }
        
        const serverQuotes = serverResponse.quotes;
        addSyncLogEntry(`Processing ${serverQuotes.length} server quotes`, 'info');
        
        // Detect and handle conflicts
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
    }
}

/**
 * Handle sync conflicts with server precedence
 */
async function handleSyncConflicts(conflicts, serverQuotes) {
    addSyncLogEntry(`Found ${conflicts.length} conflicts, applying server precedence`, 'warning');
    showNotification(`Resolving ${conflicts.length} conflicts automatically`, 'warning');
    
    // Apply server precedence strategy
    const resolvedQuotes = applyServerPrecedence(conflicts, serverQuotes);
    
    // Update quotes and storage
    quotes = resolvedQuotes;
    saveQuotesToStorage();
    updateUIAfterSync();
    
    addSyncLogEntry(`Successfully resolved ${conflicts.length} conflicts`, 'success');
}

/**
 * Apply server precedence conflict resolution
 */
function applyServerPrecedence(conflicts, serverQuotes) {
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    let resolvedQuotes = [];
    
    // Start with all server quotes (server takes precedence)
    resolvedQuotes = [...serverQuotes];
    
    // Add local quotes that don't exist on server
    quotes.forEach(localQuote => {
        if (!serverQuoteMap.has(localQuote.id)) {
            resolvedQuotes.push({ ...localQuote });
        }
    });
    
    return resolvedQuotes;
}

/**
 * Complete the sync process
 */
function completeSyncProcess() {
    lastSyncTimestamp = Date.now();
    updateLastSyncTime();
    pendingChanges = false;
    updatePendingChanges();
    
    updateSyncUI('success', 'Sync completed with JSONPlaceholder');
    showNotification('Successfully synchronized with server', 'success');
    addSyncLogEntry('Synchronization process completed successfully', 'success');
}

/**
 * Handle sync errors
 */
function handleSyncError(error) {
    console.error('Sync error:', error);
    updateSyncUI('error', `Sync failed: ${error.message}`);
    showNotification('Synchronization failed', 'error');
    addSyncLogEntry(`Sync failed: ${error.message}`, 'error');
}

/**
 * Initialize the sync system
 */
function initializeSyncSystem() {
    addSyncLogEntry('Initializing sync system with JSONPlaceholder API', 'info');
    startPeriodicSync();
}

// Make sure to call this in your main init function
// initializeSyncSystem();

/**
 * POST data to JSONPlaceholder API (for completeness)
 */
async function postToServer(data) {
    try {
        // Convert our quotes to JSONPlaceholder post format
        const postsToCreate = data.slice(0, 3).map(quote => ({
            title: `Quote: ${quote.text.substring(0, 40)}...`,
            body: `Category: ${quote.category}\nFull Text: ${quote.text}\nID: ${quote.id}`,
            userId: 1
        }));

        // Make POST requests
        const postPromises = postsToCreate.map(async (post) => {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(post)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        });

        const results = await Promise.all(postPromises);
        addSyncLogEntry(`Posted ${results.length} quotes to JSONPlaceholder API`, 'success');
        
        return { success: true, results };

    } catch (error) {
        console.error('Failed to post to JSONPlaceholder:', error);
        addSyncLogEntry(`POST failed: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}