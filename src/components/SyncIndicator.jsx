import React from 'react';

export default function SyncIndicator({ syncStatus, isSyncing, isPulling }) {
    if (!syncStatus && !isSyncing && !isPulling) {
        return null; // Don't show anything if never synced
    }
    
    const formatLastSync = (timestamp) => {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };
    
    return (
        <div className="sync-indicator" aria-live="polite">
            {isSyncing || isPulling ? (
                <span className="sync-status syncing">
                    {isPulling ? '⏳ Pulling from Sheets...' : '⏳ Syncing to Sheets...'}
                </span>
            ) : syncStatus ? (
                <span className="sync-status synced" title={`Last synced: ${new Date(syncStatus.timestamp || syncStatus.lastSync).toLocaleString()}`}>
                    ✓ Last synced {formatLastSync(syncStatus.timestamp || syncStatus.lastSync)}
                    {syncStatus.entryCount && ` (${syncStatus.entryCount} entries)`}
                </span>
            ) : null}
        </div>
    );
}

