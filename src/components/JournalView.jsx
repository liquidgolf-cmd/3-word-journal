import { useState, useMemo } from 'react';
import EntryCard from './EntryCard';
import StatsBar from './StatsBar';

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
    const [specificYear, setSpecificYear] = useState('');
    const [showStats, setShowStats] = useState(false);

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
                    case 'specificYear':
                        if (specificYear && specificYear.trim()) {
                            const year = parseInt(specificYear.trim());
                            matchesDate = !isNaN(year) && entryDate.getFullYear() === year;
                        } else {
                            matchesDate = false;
                        }
                        break;
                    default:
                        matchesDate = true;
                }
            }
            
            return matchesSearch && matchesTags && matchesDate;
        });
    }, [entries, searchTerm, selectedTags, dateFilter, specificYear]);

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
        setSpecificYear('');
    };

    const handleTagSelect = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue && !selectedTags.includes(selectedValue)) {
            setSelectedTags([...selectedTags, selectedValue]);
            e.target.value = ''; // Reset dropdown
        }
    };

    const hasActiveFilters = searchTerm || selectedTags.length > 0 || (dateFilter !== 'all' && !(dateFilter === 'specificYear' && !specificYear.trim()));

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get unique tags
        const allTags = new Set();
        entries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        allTags.add(tag.trim());
                    }
                });
            }
        });
        
        return {
            total: entries.length,
            tags: allTags.size,
            thisMonth: entries.filter(entry => {
                const entryDate = new Date(entry.experienceDate || entry.date);
                return entryDate >= thisMonthStart;
            }).length,
            withStories: entries.filter(entry => 
                entry.fullStory && entry.fullStory.trim()
            ).length
        };
    }, [entries]);

    return (
        <div className="journal-view">
            <div className="section-header">
                <h2>Your Journal</h2>
                <div className="header-controls">
                    <button
                        type="button"
                        className={`stats-toggle ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        aria-label={showStats ? 'Hide statistics' : 'Show statistics'}
                        aria-expanded={showStats}
                    >
                        <span className="stats-toggle-icon">📊</span>
                        <span className="stats-toggle-text">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
                    </button>
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
            </div>

            {/* Stats Bar */}
            {showStats && (
                <div className="stats-bar-container">
                    <StatsBar stats={stats} />
                </div>
            )}

            {/* Filters Row */}
            <div className="filters-row">
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
                            <label htmlFor="tag-select">Tags:</label>
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
                        <select
                            id="tag-select"
                            onChange={handleTagSelect}
                            value=""
                            aria-label="Select tag to filter"
                            className="tag-filter-dropdown"
                        >
                            <option value="">Select a tag...</option>
                            {allTags
                                .filter(tag => !selectedTags.includes(tag))
                                .map(tag => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                        </select>
                        {selectedTags.length > 0 && (
                            <div className="selected-tags-list">
                                {selectedTags.map(tag => (
                                    <span key={tag} className="selected-tag-badge">
                                        {tag}
                                        <button
                                            type="button"
                                            className="remove-tag-btn"
                                            onClick={() => toggleTag(tag)}
                                            aria-label={`Remove ${tag} filter`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Date Filter */}
                <div className="date-filter-section">
                    <label htmlFor="date-filter">Date:</label>
                    <select
                        id="date-filter"
                        value={dateFilter}
                        onChange={(e) => {
                            setDateFilter(e.target.value);
                            if (e.target.value !== 'specificYear') {
                                setSpecificYear('');
                            }
                        }}
                        aria-label="Filter entries by date"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="thisYear">This Year</option>
                        <option value="specificYear">Specific Year</option>
                    </select>
                    {dateFilter === 'specificYear' && (
                        <input
                            type="number"
                            id="specific-year-input"
                            value={specificYear}
                            onChange={(e) => setSpecificYear(e.target.value)}
                            placeholder="Enter year (e.g., 2024)"
                            min="1900"
                            max={new Date().getFullYear()}
                            style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid rgba(196, 166, 97, 0.3)',
                                borderRadius: '8px',
                                fontFamily: 'Crimson Pro, serif',
                                fontSize: '1rem',
                                background: 'var(--cream)',
                                color: 'var(--dark-brown)',
                                boxSizing: 'border-box'
                            }}
                            aria-label="Enter specific year to filter"
                        />
                    )}
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="active-filters">
                    <span>Active filters:</span>
                    {searchTerm && <span className="filter-badge">Search: "{searchTerm}"</span>}
                    {selectedTags.map(tag => (
                        <span key={tag} className="filter-badge">{tag}</span>
                    ))}
                    {dateFilter !== 'all' && dateFilter !== 'specificYear' && (
                        <span className="filter-badge">Date: {dateFilter.replace(/([A-Z])/g, ' $1').trim()}</span>
                    )}
                    {dateFilter === 'specificYear' && specificYear.trim() && (
                        <span className="filter-badge">Year: {specificYear}</span>
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

