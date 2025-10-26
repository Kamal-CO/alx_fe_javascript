// Initial quotes array (fallback if no localStorage data)
const initialQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration", timestamp: new Date('2024-01-01').getTime() },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership", timestamp: new Date('2024-01-02').getTime() },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life", timestamp: new Date('2024-01-03').getTime() },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", timestamp: new Date('2024-01-04').getTime() },
    { text: "Strive not to be a success, but rather to be of value.", category: "Success", timestamp: new Date('2024-01-05').getTime() },
    { text: "The way to get started is to quit talking and begin doing.", category: "Action", timestamp: new Date('2024-01-06').getTime() },
    { text: "Don't let yesterday take up too much of today.", category: "Wisdom", timestamp: new Date('2024-01-07').getTime() }
];

// Load quotes from localStorage or use initial quotes
let quotes = loadQuotesFromStorage();

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter'); // Changed from categorySelect to categoryFilter
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
    
    // Try to load last viewed quote from session storage
    loadLastViewedQuote();
});

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
    newQuoteBtn.addEventListener('click', showRandomQuote);
    categoryFilter.addEventListener('change', handleCategoryChange); // Updated to categoryFilter
    showAllBtn.addEventListener('click', showAllQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotes);
    importQuotesBtn.addEventListener('click', triggerImport);
    clearStorageBtn.addEventListener('click', clearAllData);
    importFile.addEventListener('change', importFromJsonFile);
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    clearFilterBtn.addEventListener('click', clearAllFilters);
    sortSelect.addEventListener('change', handleSortChange);
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
    categoryFilter.value = 'all'; // Updated to categoryFilter
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
        text: text.charAt(0).toUpperCase() + text.slice(1),
        category: category.charAt(0).toUpperCase() + category.slice(1),
        timestamp: Date.now()
    };
    
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
    // Update categories dropdown
    populateCategories();
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    // Show confirmation
    showNotification('Quote added successfully!');
    
    // Auto-filter to show the new quote
    currentFilter.category = newQuote.category;
    categoryFilter.value = newQuote.category; // Updated to categoryFilter
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

// Export quotes functionality
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
    
    // Create blob and download link
    const blob = new Blob([quotesJSON], { type: 'application/json' });
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
                timestamp: quote.timestamp || Date.now()
            }));
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in the file');
            }
            
            // Add imported quotes
            quotes.push(...validQuotes);
            
            // Save to localStorage
            saveQuotesToStorage();
            
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
            
            // Clear sessionStorage
            sessionStorage.removeItem('lastViewedQuote');
            
            // Reset quotes to initial data
            quotes = [...initialQuotes];
            
            // Reset filters
            clearAllFilters();
            
            // Update UI
            populateCategories();
            displayStorageInfo();
            
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