// Add this function to the existing script.js file

/**
 * Fetch quotes from server simulation using JSONPlaceholder API
 * This function implements periodic data fetching from the server
 */
async function fetchQuotesFromServer() {
    try {
        updateSyncUI('syncing', 'Fetching quotes from server...');
        
        // Simulate API call to JSONPlaceholder with proper error handling
        const response = await fetch(JSON_PLACEHOLDER_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        
        // Transform JSONPlaceholder posts to our quote format
        const serverQuotes = posts.slice(0, 7).map((post, index) => {
            // Create meaningful quote categories based on post content
            const categories = ['Inspiration', 'Life', 'Motivation', 'Wisdom', 'Success', 'Philosophy', 'Knowledge'];
            const category = categories[index % categories.length];
            
            // Create quote text from post data
            const quoteText = post.title.length > 50 ? post.title : `${post.title}. ${post.body.substring(0, 100)}...`;
            
            return {
                id: post.id + 1000, // Offset to avoid conflicts with local IDs
                text: quoteText,
                category: category,
                version: 1,
                lastModified: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24 hours
                source: 'jsonplaceholder',
                serverId: post.id
            };
        });

        // Simulate occasional server-side updates (30% chance)
        if (Math.random() < 0.3) {
            simulateServerSideUpdates(serverQuotes);
        }

        updateSyncUI('success', 'Successfully fetched quotes from server');
        addSyncLogEntry(`Fetched ${serverQuotes.length} quotes from JSONPlaceholder API`, 'success');
        
        return {
            success: true,
            quotes: serverQuotes,
            timestamp: Date.now(),
            source: 'jsonplaceholder'
        };
        
    } catch (error) {
        console.error('Failed to fetch from JSONPlaceholder:', error);
        
        // Fallback: Use localStorage as mock server
        try {
            const serverData = localStorage.getItem(SERVER_KEY);
            if (serverData) {
                const parsedData = JSON.parse(serverData);
                updateSyncUI('success', 'Using cached server data');
                addSyncLogEntry('Using cached server data (API unavailable)', 'warning');
                
                return {
                    success: true,
                    quotes: parsedData.quotes || [],
                    timestamp: parsedData.lastUpdated || Date.now(),
                    source: 'cache'
                };
            }
        } catch (cacheError) {
            console.error('Cache fallback failed:', cacheError);
        }

        // Final fallback: Generate mock server quotes
        const mockQuotes = generateMockServerQuotes();
        updateSyncUI('success', 'Using mock server data');
        addSyncLogEntry('Using mock server data (all fallbacks failed)', 'warning');
        
        return {
            success: true,
            quotes: mockQuotes,
            timestamp: Date.now(),
            source: 'mock'
        };
    }
}

/**
 * Generate mock server quotes for complete fallback
 */
function generateMockServerQuotes() {
    const mockQuotes = [
        {
            id: 1001,
            text: "The server reminds you: The journey of a thousand miles begins with a single step.",
            category: "Inspiration",
            version: 1,
            lastModified: Date.now() - 3600000,
            source: 'mock-server'
        },
        {
            id: 1002,
            text: "Server wisdom: Don't watch the clock; do what it does. Keep going.",
            category: "Motivation",
            version: 1,
            lastModified: Date.now() - 7200000,
            source: 'mock-server'
        },
        {
            id: 1003,
            text: "From the server: The only way to do great work is to love what you do.",
            category: "Success",
            version: 1,
            lastModified: Date.now() - 10800000,
            source: 'mock-server'
        },
        {
            id: 1004,
            text: "Server insight: Life is what happens to you while you're busy making other plans.",
            category: "Life",
            version: 1,
            lastModified: Date.now() - 14400000,
            source: 'mock-server'
        },
        {
            id: 1005,
            text: "Server thought: The future belongs to those who believe in the beauty of their dreams.",
            category: "Dreams",
            version: 1,
            lastModified: Date.now() - 18000000,
            source: 'mock-server'
        }
    ];
    
    // Occasionally update a random quote to simulate server changes
    if (Math.random() < 0.4) {
        const randomIndex = Math.floor(Math.random() * mockQuotes.length);
        mockQuotes[randomIndex].version += 1;
        mockQuotes[randomIndex].lastModified = Date.now();
        mockQuotes[randomIndex].text += " [Updated by Server]";
    }
    
    return mockQuotes;
}

/**
 * Simulate server-side updates to create realistic sync scenarios
 */
function simulateServerSideUpdates(serverQuotes) {
    const updates = [];
    
    // Occasionally add a new server-generated quote (25% chance)
    if (Math.random() < 0.25) {
        const newServerQuote = {
            id: Math.max(...serverQuotes.map(q => q.id)) + 1,
            text: "Server-generated wisdom: The best time to plant a tree was 20 years ago. The second best time is now.",
            category: ["Wisdom", "Inspiration", "Life"][Math.floor(Math.random() * 3)],
            version: 1,
            lastModified: Date.now(),
            source: 'server-generated'
        };
        serverQuotes.push(newServerQuote);
        updates.push('added new server quote');
    }
    
    // Occasionally modify an existing quote (20% chance)
    if (Math.random() < 0.2 && serverQuotes.length > 2) {
        const randomIndex = Math.floor(Math.random() * serverQuotes.length);
        serverQuotes[randomIndex].version += 1;
        serverQuotes[randomIndex].lastModified = Date.now();
        serverQuotes[randomIndex].text += " [Server Updated]";
        updates.push('updated existing quote');
    }
    
    // Occasionally remove a quote (10% chance)
    if (Math.random() < 0.1 && serverQuotes.length > 3) {
        const removeIndex = Math.floor(Math.random() * serverQuotes.length);
        const removedQuote = serverQuotes.splice(removeIndex, 1)[0];
        updates.push(`removed quote: "${removedQuote.text.substring(0, 30)}..."`);
    }
    
    if (updates.length > 0) {
        addSyncLogEntry(`Server performed: ${updates.join(', ')}`, 'info');
    }
}

/**
 * Enhanced sync function that uses fetchQuotesFromServer
 */
async function syncQuotes() {
    try {
        updateSyncUI('syncing', 'Starting synchronization with server...');
        addSyncLogEntry('Initiating quote synchronization', 'info');
        
        // Step 1: Fetch latest quotes from server using the required function
        const serverResponse = await fetchQuotesFromServer();
        
        if (!serverResponse.success) {
            throw new Error(`Failed to fetch from server: ${serverResponse.error}`);
        }
        
        const serverQuotes = serverResponse.quotes;
        addSyncLogEntry(`Retrieved ${serverQuotes.length} quotes from server`, 'info');
        
        // Step 2: Detect conflicts between local and server data
        const conflicts = detectDataConflicts(serverQuotes);
        
        if (conflicts.length > 0) {
            addSyncLogEntry(`Found ${conflicts.length} data conflicts`, 'warning');
            showNotification(`Found ${conflicts.length} conflicts during sync`, 'warning');
            
            // Apply conflict resolution strategy (server takes precedence)
            await resolveConflictsWithServerPrecedence(conflicts, serverQuotes);
            
            addSyncLogEntry(`Resolved ${conflicts.length} conflicts automatically`, 'success');
        } else {
            addSyncLogEntry('No conflicts detected', 'info');
        }
        
        // Step 3: Merge server data with local data
        await mergeServerData(serverQuotes);
        
        // Step 4: Update sync tracking and UI
        lastSyncTimestamp = Date.now();
        updateLastSyncTime();
        pendingChanges = false;
        updatePendingChanges();
        
        updateSyncUI('success', 'Synchronization completed successfully');
        addSyncLogEntry('Quote synchronization completed', 'success');
        showNotification('Quotes synchronized successfully', 'success');
        
    } catch (error) {
        console.error('Sync failed:', error);
        updateSyncUI('error', `Sync failed: ${error.message}`);
        showNotification('Sync failed. Please try again.', 'error');
        addSyncLogEntry(`Sync failed: ${error.message}`, 'error');
    }
}

/**
 * Enhanced conflict detection that works with fetchQuotesFromServer data
 */
function detectDataConflicts(serverQuotes) {
    const conflicts = [];
    const serverQuoteMap = new Map(serverQuotes.map(q => [q.id, q]));
    const localQuoteMap = new Map(quotes.map(q => [q.id, q]));
    
    // Check for update conflicts (same quote ID, different content)
    quotes.forEach(localQuote => {
        const serverQuote = serverQuoteMap.get(localQuote.id);
        
        if (serverQuote) {
            // Both local and server have the same quote
            if (serverQuote.lastModified > localQuote.lastModified) {
                // Server has a newer version
                if (serverQuote.text !== localQuote.text || serverQuote.category !== localQuote.category) {
                    conflicts.push({
                        type: 'update',
                        id: localQuote.id,
                        local: { ...localQuote },
                        server: { ...serverQuote },
                        message: `"${localQuote.text.substring(0, 50)}..." was modified on server`,
                        timestamp: new Date().toISOString()
                    });
                }
            } else if (localQuote.lastModified > serverQuote.lastModified) {
                // Local has newer version (potential reverse conflict)
                if (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category) {
                    conflicts.push({
                        type: 'reverse-update',
                        id: localQuote.id,
                        local: { ...localQuote },
                        server: { ...serverQuote },
                        message: `Local version is newer than server for: "${localQuote.text.substring(0, 50)}..."`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
    });
    
    // Check for server additions (quotes on server that don't exist locally)
    serverQuotes.forEach(serverQuote => {
        if (!localQuoteMap.has(serverQuote.id)) {
            conflicts.push({
                type: 'addition',
                id: serverQuote.id,
                server: { ...serverQuote },
                message: `New quote from server: "${serverQuote.text.substring(0, 50)}..."`,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Check for local deletions (quotes locally that were deleted on server)
    quotes.forEach(localQuote => {
        if (!serverQuoteMap.has(localQuote.id) && localQuote.source !== 'local') {
            conflicts.push({
                type: 'deletion',
                id: localQuote.id,
                local: { ...localQuote },
                message: `Quote was deleted on server: "${localQuote.text.substring(0, 50)}..."`,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    return conflicts;
}

/**
 * Update the periodic sync to use the enhanced system
 */
function startPeriodicSync() {
    // Clear existing interval
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Start new interval that uses fetchQuotesFromServer
    syncInterval = setInterval(() => {
        if (hasLocalChanges() || autoSyncCheckbox.checked) {
            syncQuotes(); // This now uses fetchQuotesFromServer internally
        }
    }, SYNC_INTERVAL);
    
    // Do initial sync
    syncQuotes();
    
    updateSyncUI('idle', `Auto-sync enabled (every ${SYNC_INTERVAL/1000}s)`);
    addSyncLogEntry(`Periodic sync started with ${SYNC_INTERVAL/1000} second interval`, 'info');
}

// Add sync log functionality if not present
function addSyncLogEntry(message, type = 'info') {
    if (!window.syncLogEntries) {
        window.syncLogEntries = [];
    }
    
    const entry = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
    };
    
    window.syncLogEntries.unshift(entry);
    
    // Keep only last 50 entries
    if (window.syncLogEntries.length > 50) {
        window.syncLogEntries = window.syncLogEntries.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('syncLogEntries', JSON.stringify(window.syncLogEntries));
    
    console.log(`[Sync Log] ${type.toUpperCase()}: ${message}`);
}

// Initialize sync log on startup
function initializeSyncLog() {
    const savedLog = localStorage.getItem('syncLogEntries');
    if (savedLog) {
        window.syncLogEntries = JSON.parse(savedLog);
    } else {
        window.syncLogEntries = [];
    }
}

// Call this in your main init function
initializeSyncLog();