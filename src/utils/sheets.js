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

        let attempts = 0;
        const maxAttempts = 100; // 10 seconds total
        const checkGapi = setInterval(() => {
            attempts++;
            if (typeof window !== 'undefined' && window.gapi && window.gapi.load) {
                clearInterval(checkGapi);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkGapi);
                reject(new Error('Google API client library failed to load after 10 seconds. Please refresh the page.'));
            }
        }, 100);
    });
};

// Initialize Google API client
export const initGapi = async (clientId) => {
    await waitForGapi();
    
    // Load the client library if not already loaded
    if (!window.gapi.client) {
        await new Promise((resolve, reject) => {
            window.gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: 10000,
                ontimeout: () => {
                    reject(new Error('Google API client library load timed out'));
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
            
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        window.gapi.client.setToken(tokenResponse);
                        tokenReceived = true;
                        resolve();
                    } else if (tokenResponse && tokenResponse.error) {
                        reject(new Error(`OAuth error: ${tokenResponse.error}`));
                    } else {
                        reject(new Error('Failed to get access token - no token in response'));
                    }
                },
            });

            // Request new token
            tokenClient.requestAccessToken({ prompt: 'consent' });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (!tokenReceived) {
                    reject(new Error('Authorization request timed out. Please try again.'));
                }
            }, 30000);
        } catch (error) {
            console.error('Error requesting auth:', error);
            reject(error);
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
        ['Date', 'Word 1', 'Word 2', 'Word 3', 'Topic', 'Experience Summary', 'Full Story', 'Experience Date', 'Entry ID']
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
            entry.topic || '',
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

