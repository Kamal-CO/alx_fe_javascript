// Initial quotes array (fallback if no localStorage data)
const initialQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Success" },
    { text: "The way to get started is to quit talking and begin doing.", category: "Action" },
    { text: "Don't let yesterday take up too much of today.", category: "Wisdom" }
];

// Load quotes from localStorage or use initial quotes
let quotes = loadQuotesFromStorage();

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categorySelect = document.getElementById('categorySelect');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const showAllBtn = document.getElementById('showAll');
const exportQuotesBtn = document.getElementById('exportQuotes');
const importQuotesBtn = document.getElementById('importQuotes');
const clearStorageBtn = document.getElementById('clearStorage');
const importFile = document.getElementById('importFile');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCategories();
    showRandomQuote();
    setupEventListeners();
    createAddQuoteForm();
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
    const storageInfo = document.createElement('div');
    storageInfo.className = 'storage-info';
    storageInfo.innerHTML = `
        <strong>Storage Info:</strong> 
        ${quotesCount} quotes stored locally | 
        Last updated: ${new Date().toLocaleTimeString()}
    `;
    
    // Insert after the category filter
    const categoryFilter = document.querySelector('.category-filter');
    categoryFilter.parentNode.insertBefore(storageInfo, categoryFilter.nextSibling);
}

// Initialize category filter dropdown using innerHTML
function initializeCategories() {
    const categories = [...new Set(quotes.map(quote => quote.category))];
    let categoriesHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
        categoriesHTML += `<option value="${category}">${category}</option>`;
    });
    
    categorySelect.innerHTML = categoriesHTML;
}

// Display a random quote using innerHTML
function showRandomQuote() {
    const selectedCategory = categorySelect.value;
    let filteredQuotes = quotes;
    
    if (selectedCategory !== 'all') {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<div class="quote-card">No quotes found for this category. Add some quotes!</div>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    displayQuote(randomQuote);
}

// Display a specific quote using innerHTML
function displayQuote(quote) {
    quoteDisplay.innerHTML = `
        <div class="quote-card">
            <p>"${quote.text}"</p>
            <small><strong>Category:</strong> ${quote.category}</small>
        </div>
    `;
    
    // Save to session storage
    saveLastViewedQuote(quote);
}

// Set up all event listeners
function setupEventListeners() {
    newQuoteBtn.addEventListener('click', showRandomQuote);
    categorySelect.addEventListener('change', showRandomQuote);
    showAllBtn.addEventListener('click', displayAllQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotes);
    importQuotesBtn.addEventListener('click', triggerImport);
    clearStorageBtn.addEventListener('click', clearAllData);
    importFile.addEventListener('change', importFromJsonFile);
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
        category: category.charAt(0).toUpperCase() + category.slice(1)
    };
    
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
    // Update categories if it's a new one using innerHTML
    updateCategories(newQuote.category);
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    // Show confirmation and display the new quote
    displayQuote(newQuote);
    showNotification('Quote added successfully!');
}

// Update categories dropdown with new category using innerHTML
function updateCategories(newCategory) {
    const existingCategories = Array.from(categorySelect.options).map(option => option.value);
    
    if (!existingCategories.includes(newCategory)) {
        // Rebuild the entire select with innerHTML
        const categories = [...new Set(quotes.map(quote => quote.category))];
        let categoriesHTML = '<option value="all">All Categories</option>';
        
        categories.forEach(category => {
            const selected = category === categorySelect.value ? 'selected' : '';
            categoriesHTML += `<option value="${category}" ${selected}>${category}</option>`;
        });
        
        categorySelect.innerHTML = categoriesHTML;
        
        // Re-attach event listener after innerHTML replacement
        categorySelect.addEventListener('change', showRandomQuote);
    }
}

// Display all quotes for current category using innerHTML
function displayAllQuotes() {
    const selectedCategory = categorySelect.value;
    let filteredQuotes = quotes;
    
    if (selectedCategory !== 'all') {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<div class="quote-card">No quotes found for this category.</div>';
        return;
    }
    
    let quotesHTML = `<h3>All Quotes (${filteredQuotes.length})</h3>`;
    
    filteredQuotes.forEach((quote, index) => {
        quotesHTML += `
            <div class="quote-card">
                <p>"${quote.text}"</p>
                <small><strong>Category:</strong> ${quote.category}</small>
            </div>
        `;
    });
    
    quoteDisplay.innerHTML = quotesHTML;
}

// Export quotes functionality
function exportQuotes() {
    const selectedCategory = categorySelect.value;
    let quotesToExport = quotes;
    
    if (selectedCategory !== 'all') {
        quotesToExport = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    if (quotesToExport.length === 0) {
        showNotification('No quotes to export for this category!', 'error');
        return;
    }
    
    // Create JSON string
    const quotesJSON = JSON.stringify(quotesToExport, null, 2);
    
    // Create blob and download link
    const blob = new Blob([quotesJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${selectedCategory === 'all' ? 'all' : selectedCategory.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
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
            
            // Validate each quote object
            const validQuotes = importedQuotes.filter(quote => {
                return quote && typeof quote.text === 'string' && typeof quote.category === 'string';
            });
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in the file');
            }
            
            // Add imported quotes
            quotes.push(...validQuotes);
            
            // Save to localStorage
            saveQuotesToStorage();
            
            // Update categories
            const newCategories = [...new Set(validQuotes.map(quote => quote.category))];
            newCategories.forEach(category => updateCategories(category));
            
            // Reset file input
            event.target.value = '';
            
            showNotification(`Successfully imported ${validQuotes.length} quotes!`);
            displayAllQuotes();
            
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
            
            // Clear sessionStorage
            sessionStorage.removeItem('lastViewedQuote');
            
            // Reset quotes to initial data
            quotes = [...initialQuotes];
            
            // Update UI
            initializeCategories();
            showRandomQuote();
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