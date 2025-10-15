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
const clearFilterBtn = document.getElementById('clearFilter');
const activeFilter = document.getElementById('activeFilter');
const currentFilter = document.getElementById('currentFilter');
const quotesListSection = document.getElementById('quotesListSection');
const quotesContainer = document.getElementById('quotesContainer');
const quotesCount = document.getElementById('quotesCount');
const totalQuotesSpan = document.getElementById('totalQuotes');
const totalCategoriesSpan = document.getElementById('totalCategories');
const currentFilterStat = document.getElementById('currentFilterStat');

// Form elements (will be created dynamically)
let addQuoteForm, newQuoteText, newQuoteCategory, addQuoteBtn;

// Current filter state
let currentCategoryFilter = 'all';

// Initialize the application
function init() {
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
    
    // Event listeners
    newQuoteBtn.addEventListener('click', showRandomQuote);
    showFormBtn.addEventListener('click', toggleAddQuoteForm);
    clearFilterBtn.addEventListener('click', clearFilter);
    categoryFilter.addEventListener('change', filterQuotes);
}

// Load quotes from localStorage
function loadQuotesFromStorage() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        try {
            quotes = JSON.parse(savedQuotes);
        } catch (error) {
            console.error('Error parsing saved quotes:', error);
            // Keep default quotes if there's an error
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
    
    const newQuote = { text, category };
    quotes.push(newQuote);
    
    // Save to localStorage
    saveQuotesToStorage();
    
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