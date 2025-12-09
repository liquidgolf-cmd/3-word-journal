import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getUserStorageKey,
    loadUserEntries,
    saveUserEntries,
    saveUser,
    loadUser,
    clearUser
} from './storage';

describe('storage utilities', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('getUserStorageKey', () => {
        it('should generate correct storage key for user ID', () => {
            expect(getUserStorageKey('user123')).toBe('threeWordEntries_user123');
            expect(getUserStorageKey('test-user')).toBe('threeWordEntries_test-user');
        });
    });

    describe('loadUserEntries', () => {
        it('should return empty array when no entries exist', () => {
            expect(loadUserEntries('user123')).toEqual([]);
        });

        it('should load entries from localStorage', () => {
            const entries = [
                { id: 1, words: ['word1', 'word2', 'word3'], topic: 'Test' },
                { id: 2, words: ['word4', 'word5', 'word6'], topic: 'Test2' }
            ];
            localStorage.setItem('threeWordEntries_user123', JSON.stringify(entries));
            
            expect(loadUserEntries('user123')).toEqual(entries);
        });

        it('should return empty array on invalid JSON', () => {
            localStorage.setItem('threeWordEntries_user123', 'invalid json');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(loadUserEntries('user123')).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveUserEntries', () => {
        it('should save entries to localStorage', () => {
            const entries = [
                { id: 1, words: ['word1', 'word2', 'word3'], topic: 'Test' }
            ];
            
            saveUserEntries('user123', entries);
            const stored = localStorage.getItem('threeWordEntries_user123');
            
            expect(JSON.parse(stored)).toEqual(entries);
        });

        it('should remove entry from localStorage when entries array is empty', () => {
            localStorage.setItem('threeWordEntries_user123', JSON.stringify([{ id: 1 }]));
            
            saveUserEntries('user123', []);
            
            expect(localStorage.getItem('threeWordEntries_user123')).toBeNull();
        });
    });

    describe('saveUser and loadUser', () => {
        it('should save and load user data', () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                sub: 'user123'
            };
            
            saveUser(userData);
            expect(loadUser()).toEqual(userData);
        });

        it('should return null when no user data exists', () => {
            expect(loadUser()).toBeNull();
        });

        it('should return null on invalid JSON', () => {
            localStorage.setItem('googleUser', 'invalid json');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(loadUser()).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('clearUser', () => {
        it('should remove user data from localStorage', () => {
            localStorage.setItem('googleUser', JSON.stringify({ name: 'Test' }));
            
            clearUser();
            
            expect(localStorage.getItem('googleUser')).toBeNull();
        });
    });
});

