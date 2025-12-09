import React from 'react';

export default function StatsBar({ stats }) {
    // Safety check - provide defaults if stats is undefined
    const safeStats = stats || {
        total: 0,
        tags: 0,
        thisMonth: 0,
        withStories: 0
    };

    return (
        <div className="stats-bar" role="region" aria-label="Journal statistics">
            <div className="stat-card">
                <div className="stat-value">{safeStats.total}</div>
                <div className="stat-label">Total Entries</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{safeStats.tags}</div>
                <div className="stat-label">Tags</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{safeStats.thisMonth}</div>
                <div className="stat-label">This Month</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{safeStats.withStories}</div>
                <div className="stat-label">Full Stories</div>
            </div>
        </div>
    );
}

