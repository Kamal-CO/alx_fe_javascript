// Initial quotes array
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom" },
    { text: "Whoever is happy will make others happy too.", category: "Happiness" },
    { text: "You only live once, but if you do it right, once is enough.", category: "Life" },
    { text: "Be the change that you wish to see in the world.", category: "Inspiration" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const addQuoteBtn = document.getElementById('addQuote');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const categoryFilter = document.getElementById('categoryFilter');
const totalQuotesSpan = document.getElementById('totalQuotes');
const totalCategoriesSpan = document.getElementById('totalCategories');

// Initialize the application
function init() {
    // Load quotes from localStorage if available
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    }
    
    updateStats();
    showRandomQuote();
    
    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
    addQuoteBtn.addEventListener('click', addQuote);
    categoryFilter.addEventListener('change', filterQuotes);
}

// Show a random quote
function showRandomQuote() {
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

// Create and manage the add quote form (required function)
function createAddQuoteForm() {
    return {
        show: function() {
            addQuoteForm.style.display = 'block';
            showFormBtn.textContent = 'Hide Form';
            newQuoteText.focus();
        },
        hide: function() {
            addQuoteForm.style.display = 'none';
            showFormBtn.textContent = 'Add New Quote';
        },
        toggle: function() {
            if (addQuoteForm.style.display === 'block') {
                this.hide();
            } else {
                this.show();
            }
        },
        clear: function() {
            newQuoteText.value = '';
            newQuoteCategory.value = 'Inspiration';
        }
    };
}

// Initialize the form manager
const addQuoteFormManager = createAddQuoteForm()

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
    const category = newQuoteCategory.value.trim();
    
    if (!text) {
        alert('Please enter a quote text.');
        return;
    }
    
    if (!category) {
        alert('Please select a category.');
        return;
    }
    
    const newQuote = { text, category };
    quotes.push(newQuote);
    
    // Save to localStorage
    localStorage.setItem('quotes', JSON.stringify(quotes));
    
    // Clear form
    newQuoteText.value = '';
    newQuoteCategory.value = 'Inspiration';
    
    // Update UI
    updateStats();
    showRandomQuote();
    
    // Show confirmation
    alert('Quote added successfully!');
}

// Filter quotes based on selected category
function filterQuotes() {
    showRandomQuote();
}

// Get quotes filtered by selected category
function getFilteredQuotes() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'all') {
        return quotes;
    }
    
    return quotes.filter(quote => quote.category === selectedCategory);
}

// Update statistics
function updateStats() {
    totalQuotesSpan.textContent = quotes.length;
    
    // Count unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    totalCategoriesSpan.textContent = categories.length;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);