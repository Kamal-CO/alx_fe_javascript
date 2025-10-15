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
const formContainer = document.getElementById('formContainer');
const categoryFilter = document.getElementById('categoryFilter');
const totalQuotesSpan = document.getElementById('totalQuotes');
const totalCategoriesSpan = document.getElementById('totalCategories');

// Form elements (will be created dynamically)
let addQuoteForm, newQuoteText, newQuoteCategory, addQuoteBtn;

// Initialize the application
function init() {
    // Load quotes from localStorage if available
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    }
    
    // Create the add quote form dynamically
    createAddQuoteForm();
    
    updateStats();
    showRandomQuote();
    
    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
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
    
    // Create category options
    const categories = ['Inspiration', 'Motivation', 'Wisdom', 'Success', 'Life', 'Love', 'Other'];
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        newQuoteCategory.appendChild(option);
    });
    
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

// Add event listener for category filter
categoryFilter.addEventListener('change', filterQuotes);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);