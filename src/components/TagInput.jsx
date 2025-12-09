import { useState, useEffect, useRef } from 'react';

export default function TagInput({ tags, onChange, placeholder = "Add tags (comma-separated)", existingTags = [] }) {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Get unique existing tags for autocomplete
    const allExistingTags = Array.from(new Set(existingTags)).filter(tag => 
        tag && tag.trim() && !tags.includes(tag.trim())
    );

    // Update suggestions based on input
    useEffect(() => {
        if (inputValue.trim() && allExistingTags.length > 0) {
            const filtered = allExistingTags.filter(tag =>
                tag.toLowerCase().includes(inputValue.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, allExistingTags, tags]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            // Remove last tag if backspace on empty input
            removeTag(tags.length - 1);
        } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
            e.preventDefault();
            // Focus first suggestion (could be enhanced with keyboard nav)
        }
    };

    const addTag = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        // Split by comma if multiple tags entered
        const newTags = trimmed.split(',').map(t => t.trim()).filter(t => t.length > 0);
        
        const tagsToAdd = newTags.filter(tag => {
            // Don't add duplicates
            return !tags.includes(tag);
        });

        if (tagsToAdd.length > 0) {
            onChange([...tags, ...tagsToAdd]);
        }
        
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (index) => {
        const newTags = tags.filter((_, i) => i !== index);
        onChange(newTags);
    };

    const selectSuggestion = (suggestion) => {
        addTag(suggestion);
        inputRef.current?.focus();
    };

    return (
        <div className="tag-input-container">
            <div className="tag-input-wrapper">
                {tags.map((tag, index) => (
                    <span key={index} className="tag-chip">
                        {tag}
                        <button
                            type="button"
                            className="tag-remove"
                            onClick={() => removeTag(index)}
                            aria-label={`Remove tag ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="tag-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    aria-label="Add tags"
                />
            </div>
            {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionsRef} className="tag-suggestions">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            className="tag-suggestion-item"
                            onClick={() => selectSuggestion(suggestion)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    selectSuggestion(suggestion);
                                }
                            }}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            {allExistingTags.length > 0 && (
                <div className="tag-hint" style={{
                    fontSize: '0.85rem',
                    color: 'var(--soft-gray)',
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                }}>
                    Type to see suggestions from your existing tags
                </div>
            )}
        </div>
    );
}

