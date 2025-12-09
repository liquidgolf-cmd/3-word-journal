// Google Sheets API utilities
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Wait for gapi to load
const waitForGapi = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.gapi) {
            resolve();
            return;
        }

        let attempts = 0;
        const checkGapi = setInterval(() => {
            attempts++;
            if (typeof window !== 'undefined' && window.gapi) {
                clearInterval(checkGapi);
                resolve();
            } else if (attempts > 50) {
                clearInterval(checkGapi);
                reject(new Error('Google API client library failed to load'));
            }
        }, 100);
    });
};

// Initialize Google API client
export const initGapi = async (clientId) => {
    await waitForGapi();
    
    if (!window.gapi.client) {
        await new Promise((resolve) => {
            window.gapi.load('client', resolve);
        });
    }

    await window.gapi.client.init({
        clientId: clientId,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    });
};

// Request authorization for Google Sheets
export const requestAuth = async (clientId) => {
    await waitForGapi();
    
    return new Promise((resolve, reject) => {
        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        window.gapi.client.setToken(tokenResponse);
                        resolve();
                    } else {
                        reject(new Error('Failed to get access token'));
                    }
                },
            });

            // Check if we already have a token
            if (window.gapi.client.getToken() === null) {
                // Request new token
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                // Already authorized
                resolve();
            }
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
        const response = await window.gapi.client.sheets.spreadsheets.create({
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
        });

        const spreadsheetId = response.result.spreadsheetId;
        
        // Set up headers
        await setHeaders(spreadsheetId);
        
        return spreadsheetId;
    } catch (error) {
        console.error('Error creating spreadsheet:', error);
        throw error;
    }
};

// Set up headers in the spreadsheet
const setHeaders = async (spreadsheetId) => {
    const headers = [
        ['Date', 'Word 1', 'Word 2', 'Word 3', 'Topic', 'Experience Summary', 'Full Story', 'Experience Date', 'Entry ID']
    ];

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Journal Entries!A1:I1',
            valueInputOption: 'RAW',
            resource: {
                values: headers
            }
        });

        // Format header row
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
};

// Sync entries to Google Sheets
export const syncToSheets = async (entries, spreadsheetId = null) => {
    try {
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

        await waitForGapi();
        
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
        throw error;
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

