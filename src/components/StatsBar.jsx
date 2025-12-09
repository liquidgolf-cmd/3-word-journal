import React from 'react';

export default function StatsBar({ stats }) {
    return (
        <div className="stats-bar" role="region" aria-label="Journal statistics">
            <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Entries</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.tags}</div>
                <div className="stat-label">Tags</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.thisMonth}</div>
                <div className="stat-label">This Month</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.withStories}</div>
                <div className="stat-label">Full Stories</div>
            </div>
        </div>
    );
}

