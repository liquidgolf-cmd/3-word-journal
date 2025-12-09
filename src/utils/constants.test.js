import { describe, it, expect } from 'vitest';
import { TOPICS } from './constants';

describe('constants', () => {
    describe('TOPICS', () => {
        it('should be an array', () => {
            expect(Array.isArray(TOPICS)).toBe(true);
        });

        it('should contain topics', () => {
            expect(TOPICS.length).toBeGreaterThan(0);
        });

        it('should be sorted alphabetically', () => {
            const sorted = [...TOPICS].sort();
            expect(TOPICS).toEqual(sorted);
        });

        it('should contain expected topics', () => {
            expect(TOPICS).toContain('Achievement');
            expect(TOPICS).toContain('Family');
            expect(TOPICS).toContain('Love');
            expect(TOPICS).toContain('Work');
        });

        it('should not contain duplicates', () => {
            const unique = new Set(TOPICS);
            expect(unique.size).toBe(TOPICS.length);
        });

        it('should have all topics as strings', () => {
            TOPICS.forEach(topic => {
                expect(typeof topic).toBe('string');
                expect(topic.length).toBeGreaterThan(0);
            });
        });
    });
});

