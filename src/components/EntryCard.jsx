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
            aria-label={`Entry: ${entry.words.join(', ')} - ${entry.topic}`}
        >
            <div className="entry-words">
                {entry.words.map((word, i) => (
                    <span key={i} className="word-tag">
                        {word}
                    </span>
                ))}
            </div>
            <div className="entry-meta">
                <span className="entry-topic">{entry.topic}</span>
                <span className="entry-date">{formatDate(entry.experienceDate || entry.date)}</span>
            </div>
            {entry.fullStory && (
                <div className="entry-has-story" aria-label="Has full story">
                    📖
                </div>
            )}
        </div>
    );
}

