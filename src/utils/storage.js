// Storage utilities for user-specific data
export const getUserStorageKey = (userId) => {
    return `threeWordEntries_${userId}`;
};

export const loadUserEntries = (userId) => {
    const storageKey = getUserStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading entries:', e);
            return [];
        }
    }
    return [];
};

export const saveUserEntries = (userId, entries) => {
    const storageKey = getUserStorageKey(userId);
    if (entries.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(entries));
    } else {
        localStorage.removeItem(storageKey);
    }
};

export const saveUser = (userData) => {
    localStorage.setItem('googleUser', JSON.stringify(userData));
};

export const loadUser = () => {
    const savedUser = localStorage.getItem('googleUser');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            console.error('Error loading user:', e);
            return null;
        }
    }
    return null;
};

export const clearUser = () => {
    localStorage.removeItem('googleUser');
};

// Migration: Convert topic field to tags array
export const migrateEntriesToTags = (entries) => {
    if (!Array.isArray(entries)) {
        return [];
    }
    
    return entries.map(entry => {
        // If entry already has tags, return as-is
        if (entry.tags && Array.isArray(entry.tags)) {
            return entry;
        }
        
        // If entry has topic but no tags, convert topic to tags array
        if (entry.topic && !entry.tags) {
            const migrated = { ...entry };
            migrated.tags = [entry.topic];
            delete migrated.topic;
            return migrated;
        }
        
        // If entry has neither topic nor tags, add empty tags array
        if (!entry.tags) {
            return { ...entry, tags: [] };
        }
        
        return entry;
    });
};

