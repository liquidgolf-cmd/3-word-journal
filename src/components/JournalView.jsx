import { useState, useMemo } from 'react';
import EntryCard from './EntryCard';

export default function JournalView({
    entries,
    viewMode,
    setViewMode,
    onEntryClick,
    onEditEntry
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateFilter, setDateFilter] = useState('all');

    // Get all unique tags from entries
    const allTags = useMemo(() => {
        const tagSet = new Set();
        entries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        tagSet.add(tag.trim());
                    }
                });
            }
        });
        return Array.from(tagSet).sort();
    }, [entries]);

    // Filter entries
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            // Search filter - search across words, tags, summary, and story
            const matchesSearch = searchTerm === '' || 
                entry.words.some(w => w.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                (entry.experienceSummary && entry.experienceSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (entry.fullStory && entry.fullStory.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Tag filter - entry must have ALL selected tags (AND logic)
            const matchesTags = selectedTags.length === 0 || 
                (entry.tags && Array.isArray(entry.tags) && 
                 selectedTags.every(selectedTag => entry.tags.includes(selectedTag)));
            
            // Date filter
            let matchesDate = true;
            if (dateFilter !== 'all') {
                const entryDate = new Date(entry.experienceDate || entry.date);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                switch (dateFilter) {
                    case 'today':
                        matchesDate = entryDate >= today && entryDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                        break;
                    case 'thisWeek':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = entryDate >= weekAgo;
                        break;
                    case 'thisMonth':
                        matchesDate = entryDate.getMonth() === now.getMonth() && 
                                     entryDate.getFullYear() === now.getFullYear();
                        break;
                    case 'thisYear':
                        matchesDate = entryDate.getFullYear() === now.getFullYear();
                        break;
                    default:
                        matchesDate = true;
                }
            }
            
            return matchesSearch && matchesTags && matchesDate;
        });
    }, [entries, searchTerm, selectedTags, dateFilter]);

    const toggleTag = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedTags([]);
        setDateFilter('all');
    };

    const hasActiveFilters = searchTerm || selectedTags.length > 0 || dateFilter !== 'all';

    return (
        <div className="journal-view">
            <div className="section-header">
                <h2>Your Journal</h2>
                <div className="view-toggle" role="tablist">
                    <button 
                        className={viewMode === 'grid' ? 'active' : ''}
                        onClick={() => setViewMode('grid')}
                        role="tab"
                        aria-selected={viewMode === 'grid'}
                        aria-label="Grid view"
                    >
                        Grid
                    </button>
                    <button 
                        className={viewMode === 'list' ? 'active' : ''}
                        onClick={() => setViewMode('list')}
                        role="tab"
                        aria-selected={viewMode === 'list'}
                        aria-label="List view"
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search your journal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search journal entries"
                />
                {searchTerm && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
                <div className="tag-filter-section">
                    <div className="tag-filter-header">
                        <label>Filter by Tags:</label>
                        {selectedTags.length > 0 && (
                            <button
                                type="button"
                                className="clear-tags-btn"
                                onClick={() => setSelectedTags([])}
                                aria-label="Clear tag filters"
                            >
                                Clear ({selectedTags.length})
                            </button>
                        )}
                    </div>
                    <div className="tag-filter" role="group" aria-label="Filter by tags">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`tag-filter-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag)}
                                aria-pressed={selectedTags.includes(tag)}
                                aria-label={`Filter by ${tag} tag`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date Filter */}
            <div className="date-filter-section">
                <label htmlFor="date-filter">Filter by Date:</label>
                <select
                    id="date-filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    aria-label="Filter entries by date"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="thisYear">This Year</option>
                </select>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="active-filters">
                    <span>Active filters:</span>
                    {searchTerm && <span className="filter-badge">Search: "{searchTerm}"</span>}
                    {selectedTags.map(tag => (
                        <span key={tag} className="filter-badge">{tag}</span>
                    ))}
                    {dateFilter !== 'all' && (
                        <span className="filter-badge">Date: {dateFilter.replace(/([A-Z])/g, ' $1').trim()}</span>
                    )}
                    <button
                        type="button"
                        className="clear-all-filters"
                        onClick={clearFilters}
                        aria-label="Clear all filters"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Results Count */}
            <div className="results-count">
                Showing {filteredEntries.length} of {entries.length} entries
            </div>

            {/* Entries Display */}
            {filteredEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon" aria-hidden="true">📖</div>
                    <h3>{hasActiveFilters ? 'No entries match your filters' : 'No entries yet'}</h3>
                    <p>
                        {hasActiveFilters 
                            ? 'Try adjusting your search, tags, or date filters'
                            : 'Start capturing your life\'s experiences in three words'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={clearFilters}
                            style={{ marginTop: '1rem' }}
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="entries-grid" role="list">
                    {filteredEntries.map(entry => (
                        <div key={entry.id} className="entry-card-wrapper">
                            <EntryCard 
                                entry={entry} 
                                onClick={() => onEntryClick(entry)}
                            />
                            <button
                                type="button"
                                className="entry-edit-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditEntry(entry);
                                }}
                                aria-label={`Edit entry: ${entry.words.join(', ')}`}
                            >
                                ✏️ Edit
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="entries-list" role="list">
                    {filteredEntries.map(entry => (
                        <div 
                            key={entry.id} 
                            className="entry-list-item"
                            onClick={() => onEntryClick(entry)}
                            role="listitem"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onEntryClick(entry);
                                }
                            }}
                            aria-label={`Entry: ${entry.words.join(', ')}${entry.tags && entry.tags.length > 0 ? ` - Tags: ${entry.tags.join(', ')}` : ''}`}
                        >
                            <div className="entry-date">
                                {new Date(entry.experienceDate || entry.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                            <div className="entry-words">
                                {entry.words.map((word, i) => (
                                    <span key={i} className="word-badge">{word}</span>
                                ))}
                            </div>
                            {entry.tags && entry.tags.length > 0 && (
                                <div className="entry-tags">
                                    {entry.tags.map((tag, i) => (
                                        <span key={i} className="entry-tag-badge">{tag}</span>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                className="entry-edit-button-inline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditEntry(entry);
                                }}
                                aria-label={`Edit entry: ${entry.words.join(', ')}`}
                            >
                                ✏️ Edit
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

