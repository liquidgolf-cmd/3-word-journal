import React from 'react';

export default function EntryCard({ entry, onClick }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const truncateTitle = (text, maxWords = 7) => {
        if (!text) return '';
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        return words.slice(0, maxWords).join(' ') + '...';
    };

    const tags = entry.tags || [];
    const fullTitle = entry.title || entry.experienceSummary || '';
    const title = truncateTitle(fullTitle, 7);
    const words = entry.words || ['', '', ''];

    return (
        <div 
            className="entry-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-label={`Entry: ${fullTitle} - ${words.join(', ')}${tags.length > 0 ? ` - Tags: ${tags.join(', ')}` : ''}`}
        >
            {title && (
                <div className="entry-title">
                    {title}
                </div>
            )}
            <div className="entry-words">
                {words.map((word, i) => (
                    word ? (
                        <span key={i} className="word-tag">
                            {word}
                        </span>
                    ) : null
                ))}
            </div>
            <div className="entry-meta">
                <span className="entry-date">{formatDate(entry.experienceDate || entry.date)}</span>
                {tags.length > 0 && (
                    <div className="entry-tags">
                        {tags.map((tag, i) => (
                            <span key={i} className="entry-tag-badge">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {entry.fullStory && (
                <div className="entry-has-story" aria-label="Has full story">
                    📖
                </div>
            )}
        </div>
    );
}

