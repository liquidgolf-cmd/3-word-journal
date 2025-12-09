// Google OAuth utilities
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const initializeGoogleSignIn = (callback) => {
    if (typeof window !== 'undefined' && window.google && window.google.accounts && GOOGLE_CLIENT_ID) {
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: callback,
            });
            return true;
        } catch (e) {
            console.error('Error initializing Google Sign-In:', e);
            return false;
        }
    }
    return false;
};

export const renderGoogleButton = (elementId) => {
    const buttonElement = document.getElementById(elementId);
    if (buttonElement && typeof window !== 'undefined' && window.google && window.google.accounts) {
        try {
            buttonElement.innerHTML = '';
            window.google.accounts.id.renderButton(
                buttonElement,
                { theme: 'outline', size: 'large', width: 250 }
            );
            return true;
        } catch (e) {
            console.error('Error rendering button:', e);
            return false;
        }
    }
    return false;
};

export const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding JWT:', e);
        return null;
    }
};

export const handleLogout = () => {
    if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
    }
};

