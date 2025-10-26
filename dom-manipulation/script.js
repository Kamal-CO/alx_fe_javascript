// Initial quotes array
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Success" },
    { text: "The way to get started is to quit talking and begin doing.", category: "Action" },
    { text: "Don't let yesterday take up too much of today.", category: "Wisdom" }
];

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categorySelect = document.getElementById('categorySelect');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const showAllBtn = document.getElementById('showAll');
const exportQuotesBtn = document.getElementById('exportQuotes');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCategories();
    showRandomQuote();
    setupEventListeners();
    createAddQuoteForm();
});

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
}

// Set up all event listeners
function setupEventListeners() {
    newQuoteBtn.addEventListener('click', showRandomQuote);
    categorySelect.addEventListener('change', showRandomQuote);
    showAllBtn.addEventListener('click', displayAllQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotes);
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
    
    // Update categories if it's a new one using innerHTML
    updateCategories(newQuote.category);
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    // Show confirmation and display the new quote
    displayQuote(newQuote);
    showNotification('Quote added successfully!');
    
    console.log('New quote added:', newQuote);
    console.log('Total quotes:', quotes.length);
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
    a.download = `quotes-${selectedCategory === 'all' ? 'all' : selectedCategory.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${quotesToExport.length} quotes successfully!`);
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