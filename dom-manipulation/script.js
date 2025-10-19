// Initialize quotes array with some default quotes
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "motivation" },
    { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "success" },
    { text: "In the middle of difficulty lies opportunity.", category: "wisdom" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "motivation" },
    { text: "It does not matter how slowly you go as long as you do not stop.", category: "success" },
    { text: "The only true wisdom is in knowing you know nothing.", category: "wisdom" },
    { text: "The purpose of our lives is to be happy.", category: "life" },
    { text: "Believe you can and you're halfway there.", category: "motivation" },
    { text: "I have not failed. I've just found 10,000 ways that won't work.", category: "success" }
];

// DOM Elements
const quoteTextElement = document.getElementById('quoteText');
const quoteCategoryElement = document.getElementById('quoteCategory');
const newQuoteButton = document.getElementById('newQuote');
const categorySelect = document.getElementById('categorySelect');
const quoteCountElement = document.getElementById('quoteCount');
const addQuoteBtn = document.getElementById('addQuoteBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateQuoteCount();
    showRandomQuote();
    
    // Add event listener to the new quote button
    newQuoteButton.addEventListener('click', showRandomQuote);
    
    // Add event listener to category selector
    categorySelect.addEventListener('change', showRandomQuote);
    
    // Add event listener to add quote button
    addQuoteBtn.addEventListener('click', addQuote);
});

// Function to show a random quote
function showRandomQuote() {
    const selectedCategory = categorySelect.value;
    let filteredQuotes;
    
    if (selectedCategory === 'all') {
        filteredQuotes = quotes;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    if (filteredQuotes.length === 0) {
        quoteTextElement.textContent = "No quotes available for this category. Add a new quote!";
        quoteCategoryElement.textContent = "Empty";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    quoteTextElement.textContent = `"${randomQuote.text}"`;
    quoteCategoryElement.textContent = randomQuote.category.charAt(0).toUpperCase() + randomQuote.category.slice(1);
}

// Function to add a new quote
function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value.trim();
    const newQuoteCategory = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
    
    if (!newQuoteText || !newQuoteCategory) {
        alert('Please fill in both fields!');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: newQuoteText,
        category: newQuoteCategory
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Update UI
    updateQuoteCount();
    
    // Clear form
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    // Show success message
    alert('Quote added successfully!');
    
    // Update category dropdown if needed
    updateCategoryDropdown();
}

// Function to update the quote count display
function updateQuoteCount() {
    quoteCountElement.textContent = quotes.length;
}

// Function to update the category dropdown with new categories
function updateCategoryDropdown() {
    // Get all unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Clear existing options (except "All Categories")
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.appendChild(option);
    });
}