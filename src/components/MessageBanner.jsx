import React from 'react';

export default function MessageBanner({ message, type, onDismiss }) {
    if (!message) return null;

    const styles = {
        error: {
            background: 'rgba(220, 53, 69, 0.1)',
            border: '2px solid rgba(220, 53, 69, 0.3)',
            color: '#dc3545'
        },
        success: {
            background: 'rgba(40, 167, 69, 0.1)',
            border: '2px solid rgba(40, 167, 69, 0.3)',
            color: '#28a745'
        }
    };

    const icons = {
        error: '⚠️',
        success: '✓'
    };

    return (
        <div 
            className={`message-banner ${type}`}
            role={type === 'error' ? 'alert' : 'status'}
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                ...styles[type]
            }}
        >
            <span>{icons[type]} {message}</span>
            <button 
                onClick={onDismiss}
                aria-label={`Dismiss ${type} message`}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: styles[type].color
                }}
            >
                ×
            </button>
        </div>
    );
}

