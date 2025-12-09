import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsBar from './StatsBar';

describe('StatsBar', () => {
    it('should render all stat cards', () => {
        const stats = {
            total: 10,
            topics: 5,
            thisMonth: 3,
            withStories: 2
        };
        
        render(<StatsBar stats={stats} />);
        
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        
        expect(screen.getByText('Total Entries')).toBeInTheDocument();
        expect(screen.getByText('Topics')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('Full Stories')).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
        const stats = {
            total: 0,
            topics: 0,
            thisMonth: 0,
            withStories: 0
        };
        
        render(<StatsBar stats={stats} />);
        
        expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Journal statistics');
    });

    it('should display zero values correctly', () => {
        const stats = {
            total: 0,
            topics: 0,
            thisMonth: 0,
            withStories: 0
        };
        
        render(<StatsBar stats={stats} />);
        
        expect(screen.getAllByText('0')).toHaveLength(4);
    });
});

