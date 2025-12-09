import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBanner from './MessageBanner';

describe('MessageBanner', () => {
    it('should not render when message is null', () => {
        const { container } = render(
            <MessageBanner message={null} type="error" onDismiss={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render error message', () => {
        render(
            <MessageBanner 
                message="Test error message" 
                type="error" 
                onDismiss={vi.fn()} 
            />
        );
        
        expect(screen.getByText(/⚠️ Test error message/)).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render success message', () => {
        render(
            <MessageBanner 
                message="Success!" 
                type="success" 
                onDismiss={vi.fn()} 
            />
        );
        
        expect(screen.getByText(/✓ Success!/)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
        const user = userEvent.setup();
        const onDismiss = vi.fn();
        
        render(
            <MessageBanner 
                message="Test message" 
                type="error" 
                onDismiss={onDismiss} 
            />
        );
        
        const dismissButton = screen.getByLabelText('Dismiss error message');
        await user.click(dismissButton);
        
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-live attribute for error', () => {
        render(
            <MessageBanner 
                message="Error" 
                type="error" 
                onDismiss={vi.fn()} 
            />
        );
        
        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have correct aria-live attribute for success', () => {
        render(
            <MessageBanner 
                message="Success" 
                type="success" 
                onDismiss={vi.fn()} 
            />
        );
        
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
});

