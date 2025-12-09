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

