// Google Sheets API utilities
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Wait for gapi to load
const waitForGapi = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.gapi && window.gapi.load) {
            resolve();
            return;
        }

        // Longer timeout on mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const maxAttempts = isMobile ? 200 : 100; // 20 seconds on mobile, 10 seconds on desktop
        const interval = 100;
        
        let attempts = 0;
        const checkGapi = setInterval(() => {
            attempts++;
            if (typeof window !== 'undefined' && window.gapi && window.gapi.load) {
                clearInterval(checkGapi);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkGapi);
                const timeoutSeconds = (maxAttempts * interval) / 1000;
                reject(new Error(`Google API client library failed to load after ${timeoutSeconds} seconds. Please refresh the page and check your internet connection.`));
            }
        }, interval);
    });
};

// Initialize Google API client
export const initGapi = async (clientId) => {
    await waitForGapi();
    
    // Load the client library if not already loaded
    if (!window.gapi.client) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const timeout = isMobile ? 20000 : 10000; // Longer timeout on mobile
        
        await new Promise((resolve, reject) => {
            window.gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: timeout,
                ontimeout: () => {
                    reject(new Error(`Google API client library load timed out after ${timeout / 1000} seconds. Please check your internet connection and try again.`));
                }
            });
        });
    }

    // Only initialize if not already initialized
    if (!window.gapi.client.sheets) {
        try {
            await window.gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS
            });
        } catch (error) {
            // If already initialized, that's okay
            if (!error.message || !error.message.includes('already initialized')) {
                throw error;
            }
        }
    }
};

// Request authorization for Google Sheets
export const requestAuth = async (clientId) => {
    await waitForGapi();
    
    // Check if we already have a valid token
    const existingToken = window.gapi.client.getToken();
    if (existingToken && existingToken.access_token) {
        // Check if token is still valid (not expired)
        // For now, just use it - Google will refresh if needed
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        try {
            let tokenReceived = false;
            let timeoutId = null;
            
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    
                    if (tokenResponse && tokenResponse.access_token) {
                        window.gapi.client.setToken(tokenResponse);
                        tokenReceived = true;
                        resolve();
                    } else if (tokenResponse && tokenResponse.error) {
                        let errorMsg = `OAuth error: ${tokenResponse.error}`;
                        if (tokenResponse.error === 'popup_closed_by_user') {
                            errorMsg = 'Authorization popup was closed. Please try again and complete the authorization.';
                        } else if (tokenResponse.error === 'popup_blocked') {
                            errorMsg = 'Popup was blocked. Please allow popups for this site and try again.';
                        }
                        reject(new Error(errorMsg));
                    } else {
                        reject(new Error('Failed to get access token - no token in response'));
                    }
                },
            });

            // Request new token - use 'select_account' on mobile for better UX
            // Mobile browsers handle this better than 'consent'
            const promptType = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'select_account' : 'consent';
            tokenClient.requestAccessToken({ prompt: promptType });
            
            // Timeout after 60 seconds (longer for mobile)
            timeoutId = setTimeout(() => {
                if (!tokenReceived) {
                    reject(new Error('Authorization request timed out. Please try again and ensure popups are allowed.'));
                }
            }, 60000);
        } catch (error) {
            console.error('Error requesting auth:', error);
            let errorMsg = error.message || 'Failed to request authorization';
            if (errorMsg.includes('popup') || errorMsg.includes('blocked')) {
                errorMsg = 'Popup blocked. Please allow popups for this site in your browser settings and try again.';
            }
            reject(new Error(errorMsg));
        }
    });
};

// Check if user is authorized
export const isAuthorized = () => {
    if (typeof window === 'undefined' || !window.gapi || !window.gapi.client) return false;
    const token = window.gapi.client.getToken();
    return token !== null && token !== undefined;
};

// Create a new spreadsheet
export const createSpreadsheet = async (title = '3 Word Journal') => {
    try {
        await waitForGapi();
        
        // Ensure client is initialized
        if (!window.gapi.client.sheets) {
            throw new Error('Google Sheets API not initialized. Please try again.');
        }
        
        // Check if we have a token
        const token = window.gapi.client.getToken();
        if (!token || !token.access_token) {
            throw new Error('Not authorized. Please grant Google Sheets access.');
        }
        
        const response = await window.gapi.client.sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: title
                },
                sheets: [{
                    properties: {
                        title: 'Journal Entries',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 10
                        }
                    }
                }]
            }
        });

        if (!response.result || !response.result.spreadsheetId) {
            throw new Error('Failed to create spreadsheet - no ID returned');
        }

        const spreadsheetId = response.result.spreadsheetId;
        
        // Set up headers
        await setHeaders(spreadsheetId);
        
        return spreadsheetId;
    } catch (error) {
        console.error('Error creating spreadsheet:', error);
        // Provide more helpful error messages
        if (error.status === 403 || error.status === 401) {
            throw new Error('Permission denied. Please grant Google Sheets access when prompted.');
        } else if (error.status === 400) {
            throw new Error('Invalid request. Please check your Google Sheets API setup.');
        }
        throw error;
    }
};

// Set up headers in the spreadsheet
const setHeaders = async (spreadsheetId) => {
    const headers = [
        ['Date', 'Word 1', 'Word 2', 'Word 3', 'Tags', 'Experience Summary', 'Full Story', 'Experience Date', 'Entry ID']
    ];

    try {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Journal Entries!A1:I1',
            valueInputOption: 'RAW',
            resource: {
                values: headers
            }
        });

        // Format header row (optional - skip if it fails)
        try {
            await window.gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: {
                    requests: [{
                        repeatCell: {
                            range: {
                                sheetId: 0,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }]
                }
            });
        } catch (formatError) {
            // Header formatting is optional, continue even if it fails
            console.warn('Could not format header row:', formatError);
        }
    } catch (error) {
        console.error('Error setting headers:', error);
        // Don't throw - headers are less critical than data
    }
};

// Sync entries to Google Sheets
export const syncToSheets = async (entries, spreadsheetId = null) => {
    try {
        await waitForGapi();
        
        // Ensure client is initialized
        if (!window.gapi.client.sheets) {
            throw new Error('Google Sheets API not initialized. Please refresh and try again.');
        }
        
        // Check if we have a token
        const token = window.gapi.client.getToken();
        if (!token || !token.access_token) {
            throw new Error('Not authorized. Please grant Google Sheets access.');
        }
        
        let targetSpreadsheetId = spreadsheetId;

        // Create spreadsheet if it doesn't exist
        if (!targetSpreadsheetId) {
            targetSpreadsheetId = await createSpreadsheet();
            // Store the spreadsheet ID for future syncs
            localStorage.setItem('journalSpreadsheetId', targetSpreadsheetId);
        }

        // Format entries as rows
        const rows = entries.map(entry => [
            new Date(entry.date).toLocaleDateString(),
            entry.words[0] || '',
            entry.words[1] || '',
            entry.words[2] || '',
            (entry.tags && Array.isArray(entry.tags) ? entry.tags.join(', ') : '') || '',
            entry.experienceSummary || '',
            entry.fullStory || '',
            entry.experienceDate ? new Date(entry.experienceDate).toLocaleDateString() : '',
            entry.id.toString()
        ]);
        
        // Clear existing data (except headers)
        await window.gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: targetSpreadsheetId,
            range: 'Journal Entries!A2:I'
        });

        // Add new data
        if (rows.length > 0) {
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: targetSpreadsheetId,
                range: 'Journal Entries!A2',
                valueInputOption: 'RAW',
                resource: {
                    values: rows
                }
            });
        }

        // Get the spreadsheet URL
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}`;

        return {
            success: true,
            spreadsheetId: targetSpreadsheetId,
            url: spreadsheetUrl,
            entryCount: entries.length
        };
    } catch (error) {
        console.error('Error syncing to Sheets:', error);
        
        // Provide more helpful error messages
        if (error.status === 403 || error.status === 401) {
            throw new Error('Permission denied. Please grant Google Sheets access when prompted.');
        } else if (error.status === 400) {
            throw new Error('Invalid request. The spreadsheet may not exist or you may not have access.');
        } else if (error.message) {
            throw error;
        } else {
            throw new Error(`Sync failed: ${error.status || 'Unknown error'}`);
        }
    }
};

// Get stored spreadsheet ID
export const getStoredSpreadsheetId = () => {
    return localStorage.getItem('journalSpreadsheetId');
};

// Clear stored spreadsheet ID
export const clearStoredSpreadsheetId = () => {
    localStorage.removeItem('journalSpreadsheetId');
};

// Sync entries from Google Sheets (read)
export const syncFromSheets = async (spreadsheetId = null) => {
    try {
        await waitForGapi();
        
        // Ensure client is initialized
        if (!window.gapi.client.sheets) {
            throw new Error('Google Sheets API not initialized. Please refresh and try again.');
        }
        
        // Check if we have a token
        const token = window.gapi.client.getToken();
        if (!token || !token.access_token) {
            throw new Error('Not authorized. Please grant Google Sheets access.');
        }
        
        let targetSpreadsheetId = spreadsheetId || getStoredSpreadsheetId();
        
        if (!targetSpreadsheetId) {
            // No spreadsheet exists yet, return empty array
            return [];
        }

        // Read all data from the spreadsheet (skip header row)
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: targetSpreadsheetId,
            range: 'Journal Entries!A2:I'
        });

        if (!response.result || !response.result.values) {
            return [];
        }

        const rows = response.result.values;
        
        // Convert rows back to entry objects
        const entries = rows.map((row, index) => {
            try {
                // Parse date (row[0] or row[7] for experienceDate)
                const dateStr = row[0] || new Date().toISOString();
                const experienceDateStr = row[7] || dateStr;
                
                // Parse dates - handle various formats
                let date = new Date(dateStr);
                let experienceDate = new Date(experienceDateStr);
                
                // If date parsing fails, use current date
                if (isNaN(date.getTime())) {
                    date = new Date();
                }
                if (isNaN(experienceDate.getTime())) {
                    experienceDate = date;
                }
                
                // Parse tags (comma-separated string back to array)
                const tagsStr = row[4] || '';
                const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
                
                return {
                    id: parseInt(row[8]) || Date.now() + index, // Use entry ID from sheet, or generate
                    date: date.toISOString(),
                    words: [
                        row[1] || '',
                        row[2] || '',
                        row[3] || ''
                    ],
                    tags: tags,
                    experienceSummary: row[5] || '',
                    fullStory: row[6] || '',
                    experienceDate: experienceDate.toISOString()
                };
            } catch (error) {
                console.error(`Error parsing row ${index}:`, error);
                return null;
            }
        }).filter(entry => entry !== null && entry.words[0] && entry.words[1] && entry.words[2]); // Filter out invalid entries

        return entries;
    } catch (error) {
        console.error('Error syncing from Sheets:', error);
        
        // Provide more helpful error messages
        if (error.status === 403 || error.status === 401) {
            throw new Error('Permission denied. Please grant Google Sheets access when prompted.');
        } else if (error.status === 400) {
            throw new Error('Invalid request. The spreadsheet may not exist or you may not have access.');
        } else if (error.message) {
            throw error;
        } else {
            throw new Error(`Sync failed: ${error.status || 'Unknown error'}`);
        }
    }
};

