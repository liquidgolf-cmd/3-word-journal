import React from 'react';

export default function TabNavigation({ currentView, onViewChange }) {
    return (
        <div className="tab-navigation" role="tablist" aria-label="Main navigation">
            <button
                className={`tab-button ${currentView === 'input' ? 'active' : ''}`}
                onClick={() => onViewChange('input')}
                role="tab"
                aria-selected={currentView === 'input'}
                aria-controls="input-panel"
                id="input-tab"
            >
                ✍️ New Entry
            </button>
            <button
                className={`tab-button ${currentView === 'journal' ? 'active' : ''}`}
                onClick={() => onViewChange('journal')}
                role="tab"
                aria-selected={currentView === 'journal'}
                aria-controls="journal-panel"
                id="journal-tab"
            >
                📖 Journal
            </button>
        </div>
    );
}

