/**
 * Generate a 5-8 word title from experience text
 * @param {string} text - The experience description text
 * @returns {string} - A title of 5-8 words
 */
export const generateTitle = (text) => {
    if (!text || !text.trim()) {
        return '';
    }
    
    // Remove extra whitespace and split into words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
        return '';
    }
    
    // Take first 8 words, but prefer 5-8 words
    // If text is short, use all words
    if (words.length <= 5) {
        return words.join(' ');
    }
    
    // Try to end at a sentence boundary if possible (within 5-8 words)
    let titleWords = words.slice(0, 8);
    
    // Look for sentence endings (., !, ?) in the first 8 words
    for (let i = 7; i >= 4; i--) {
        if (i < words.length && /[.!?]$/.test(words[i])) {
            titleWords = words.slice(0, i + 1);
            break;
        }
    }
    
    // If no sentence ending found, use 5-8 words
    if (titleWords.length > 8) {
        titleWords = words.slice(0, 8);
    } else if (titleWords.length < 5 && words.length >= 5) {
        titleWords = words.slice(0, 5);
    }
    
    let title = titleWords.join(' ');
    
    // Remove trailing punctuation if it's not sentence-ending punctuation
    title = title.replace(/[,;:]$/, '');
    
    // Add ellipsis if we truncated
    if (words.length > titleWords.length) {
        title += '...';
    }
    
    return title;
};

