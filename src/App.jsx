import { useState, useEffect } from 'react';
import { loadUser, saveUser, clearUser, loadUserEntries, saveUserEntries, migrateEntriesToTags } from './utils/storage';
import { GOOGLE_CLIENT_ID, initializeGoogleSignIn, renderGoogleButton, decodeJWT, handleLogout as authLogout } from './utils/auth';
import { initGapi, requestAuth, syncToSheets, getStoredSpreadsheetId, isAuthorized } from './utils/sheets';
import MessageBanner from './components/MessageBanner';
import TabNavigation from './components/TabNavigation';
import InputView from './components/InputView';
import JournalView from './components/JournalView';

function App() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [entries, setEntries] = useState([]);
    const [currentView, setCurrentView] = useState('input');
    const [editingEntry, setEditingEntry] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [showModal, setShowModal] = useState(false);
    const [modalEntry, setModalEntry] = useState(null);
    const [suggestedWords, setSuggestedWords] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [experienceText, setExperienceText] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editWords, setEditWords] = useState(['', '', '']);
    const [isEditingStory, setIsEditingStory] = useState(false);
    const [editStory, setEditStory] = useState('');
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editTags, setEditTags] = useState([]);
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [editDate, setEditDate] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [sheetsAuthorized, setSheetsAuthorized] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Initialize Google Sign-In and Sheets API, and migrate entries
    useEffect(() => {
        const savedUser = loadUser();
        if (savedUser && savedUser.sub && savedUser.email) {
            setUser(savedUser);
            setIsAuthenticated(true);
            let userEntries = loadUserEntries(savedUser.sub);
            
            // Run migration: convert topic to tags
            const needsMigration = userEntries.some(entry => entry.topic && !entry.tags);
            if (needsMigration) {
                userEntries = migrateEntriesToTags(userEntries);
                saveUserEntries(savedUser.sub, userEntries);
            }
            
            setEntries(userEntries);
        }

        const initGoogle = () => {
            if (GOOGLE_CLIENT_ID) {
                initializeGoogleSignIn(handleCredentialResponse);
                
                if (typeof window !== 'undefined' && window.gapi) {
                    initGapi(GOOGLE_CLIENT_ID).then(() => {
                        setSheetsAuthorized(isAuthorized());
                    }).catch(err => {
                        console.log('Sheets API not initialized yet (will initialize on first sync):', err.message);
                    });
                }
            }
        };

        if (typeof window !== 'undefined' && window.google) {
            initGoogle();
        } else {
            const checkGoogle = setInterval(() => {
                if (typeof window !== 'undefined' && window.google) {
                    clearInterval(checkGoogle);
                    initGoogle();
                }
            }, 100);
            setTimeout(() => clearInterval(checkGoogle), 5000);
        }
    }, []);

    // Render Google Sign-In button
    useEffect(() => {
        if (!isAuthenticated && GOOGLE_CLIENT_ID) {
            const timer = setTimeout(() => {
                renderGoogleButton('google-signin-button');
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    const handleCredentialResponse = (response) => {
        try {
            const userData = decodeJWT(response.credential);
            if (!userData) {
                throw new Error('Failed to decode user data');
            }
            
            const userInfo = {
                name: userData.name,
                email: userData.email,
                picture: userData.picture,
                sub: userData.sub
            };
            
            setUser(userInfo);
            setIsAuthenticated(true);
            saveUser(userInfo);
            let userEntries = loadUserEntries(userData.sub);
            
            // Run migration if needed
            const needsMigration = userEntries.some(entry => entry.topic && !entry.tags);
            if (needsMigration) {
                userEntries = migrateEntriesToTags(userEntries);
                saveUserEntries(userData.sub, userEntries);
            }
            
            setEntries(userEntries);
        } catch (e) {
            console.error('Error processing credential:', e);
            setError('Error signing in. Please try again.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleLogout = () => {
        authLogout();
        setUser(null);
        setIsAuthenticated(false);
        setEntries([]);
        clearUser();
        setCurrentView('input');
        setEditingEntry(null);
    };

    // Save entries when they change
    useEffect(() => {
        if (isAuthenticated && user && entries.length >= 0) {
            saveUserEntries(user.sub, entries);
        }
    }, [entries, isAuthenticated, user]);

    const generateThreeWords = async () => {
        if (!experienceText.trim()) {
            setError('Please describe your experience first');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsGenerating(true);
        setSuggestedWords([]);
        setError(null);

        try {
            const response = await fetch("/api/generate-words", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    experienceText: experienceText
                })
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.words || !Array.isArray(data.words) || data.words.length < 3) {
                throw new Error('Unexpected API response format. Check console for details.');
            }
            
            const words = data.words;
            setSuggestedWords(words);
        } catch (error) {
            console.error('Error generating words:', error);
            let errorMessage = error.message || 'Unknown error occurred';
            
            if (errorMessage.includes('API key') || errorMessage.includes('ANTHROPIC_API_KEY')) {
                errorMessage = 'AI feature requires an API key. Please configure ANTHROPIC_API_KEY in your Vercel environment variables.';
            } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
                errorMessage = 'Invalid API key. Please check your Anthropic API key configuration.';
            } else if (errorMessage.includes('429')) {
                errorMessage = 'API rate limit exceeded. Please try again in a moment.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            setError(`AI word generation failed: ${errorMessage}`);
            setTimeout(() => setError(null), 10000);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteEntry = (id) => {
        setEntries(entries.filter(e => e.id !== id));
        setDeleteConfirmId(null);
        setSuccessMessage('Entry deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        if (showModal && modalEntry && modalEntry.id === id) {
            setShowModal(false);
        }
    };

    const openModal = (entry) => {
        setModalEntry(entry);
        setShowModal(true);
        setIsEditMode(false);
        setEditWords([...entry.words]);
        setIsEditingStory(false);
        setEditStory(entry.fullStory || '');
        setIsEditingTags(false);
        setEditTags(entry.tags || []);
        setIsEditingDate(false);
        setEditDate(entry.experienceDate || entry.date);
    };

    const handleEditEntry = (entry) => {
        setEditingEntry(entry);
        setCurrentView('input');
    };

    const handleSaveComplete = () => {
        setCurrentView('journal');
    };

    const startEdit = () => setIsEditMode(true);
    const cancelEdit = () => {
        setIsEditMode(false);
        setEditWords([...modalEntry.words]);
    };

    const saveEdit = () => {
        if (!editWords[0] || !editWords[1] || !editWords[2]) {
            setError('All three words are required');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, words: editWords }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, words: editWords });
        setIsEditMode(false);
    };

    const startEditStory = () => setIsEditingStory(true);
    const cancelEditStory = () => {
        setIsEditingStory(false);
        setEditStory(modalEntry.fullStory || '');
    };

    const saveStory = () => {
        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, fullStory: editStory }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, fullStory: editStory });
        setIsEditingStory(false);
    };

    const startEditTags = () => setIsEditingTags(true);
    const cancelEditTags = () => {
        setIsEditingTags(false);
        setEditTags(modalEntry.tags || []);
    };

    const saveTags = () => {
        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, tags: editTags }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, tags: editTags });
        setIsEditingTags(false);
    };

    const startEditDate = () => setIsEditingDate(true);
    const cancelEditDate = () => {
        setIsEditingDate(false);
        setEditDate(modalEntry.experienceDate || modalEntry.date);
    };

    const saveDate = () => {
        if (!editDate) {
            setError('Date cannot be empty');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, experienceDate: editDate }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, experienceDate: editDate });
        setIsEditingDate(false);
    };


    // Data Export/Import
    const exportData = () => {
        const dataStr = JSON.stringify(entries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `3-word-journal-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccessMessage('Data exported successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleSyncToSheets = async () => {
        if (entries.length === 0) {
            setError('No entries to sync. Create some entries first!');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsSyncing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
                console.log('Initializing Google Sheets API...');
                await initGapi(GOOGLE_CLIENT_ID);
            }

            if (!isAuthorized()) {
                console.log('Requesting Google Sheets authorization...');
                await requestAuth(GOOGLE_CLIENT_ID);
                setSheetsAuthorized(true);
                console.log('Authorization granted');
            } else {
                console.log('Already authorized for Google Sheets');
            }

            const spreadsheetId = getStoredSpreadsheetId();
            const result = await syncToSheets(entries, spreadsheetId);

            setSuccessMessage(
                `Successfully synced ${result.entryCount} entries to Google Sheets! ` +
                `View your spreadsheet: ${result.url}`
            );
            setTimeout(() => setSuccessMessage(null), 8000);
        } catch (error) {
            console.error('Error syncing to Sheets:', error);
            let errorMessage = error.message || 'Failed to sync to Google Sheets';
            
            if (errorMessage.includes('access_denied') || errorMessage.includes('permission')) {
                errorMessage = 'Permission denied. Please grant access to Google Sheets when prompted.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            
            setError(`Sync failed: ${errorMessage}`);
            setTimeout(() => setError(null), 8000);
        } finally {
            setIsSyncing(false);
        }
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    // Migrate imported entries if needed
                    const migrated = migrateEntriesToTags(imported);
                    setEntries([...migrated, ...entries]);
                    setSuccessMessage(`Successfully imported ${imported.length} entries!`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setError('Invalid file format. Expected an array of entries.');
                    setTimeout(() => setError(null), 5000);
                }
            } catch (err) {
                setError('Error reading file: ' + err.message);
                setTimeout(() => setError(null), 5000);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    // Show login screen if not authenticated
    if (!isAuthenticated || !GOOGLE_CLIENT_ID) {
        return (
            <div className="app-container">
                <header className="header">
                    <h1>3 Word Journal</h1>
                    <p className="subtitle">Capture life's lessons in just three words</p>
                </header>
                <div className="login-prompt">
                    <h2>Sign in to continue</h2>
                    <p>Sign in with your Google account to access your journal entries and sync them across devices.</p>
                    <div id="google-signin-button"></div>
                    {!GOOGLE_CLIENT_ID && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(196, 166, 97, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--warm-brown)',
                            fontSize: '0.9rem',
                            border: '2px solid var(--accent-gold)'
                        }}>
                            <strong>⚠️ Setup Required:</strong><br/>
                            Please set VITE_GOOGLE_CLIENT_ID in your .env file<br/>
                            See GOOGLE_OAUTH_SETUP.md for instructions.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-title">
                    <h1>3 Word Journal</h1>
                    <p className="subtitle">Capture life's lessons in just three words</p>
                </div>
            </header>

            {/* Error and Success Messages */}
            <MessageBanner 
                message={error} 
                type="error" 
                onDismiss={() => setError(null)} 
            />
            <MessageBanner 
                message={successMessage} 
                type="success" 
                onDismiss={() => setSuccessMessage(null)} 
            />

            {/* Actions Bar */}
            <div className="actions-bar">
                <div className="user-info">
                    <img src={user.picture} alt={user.name} className="user-avatar" />
                    <span className="user-name">{user.name}</span>
                    <div className="header-actions">
                        <button 
                            className="btn btn-secondary" 
                            onClick={exportData}
                            aria-label="Export journal data"
                        >
                            📥 Export
                        </button>
                        <label 
                            className="btn btn-secondary"
                            style={{ cursor: 'pointer', margin: 0 }}
                            aria-label="Import journal data"
                        >
                            📤 Import
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={importData}
                                style={{ display: 'none' }}
                                aria-label="Import journal data file"
                            />
                        </label>
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleSyncToSheets}
                            disabled={isSyncing || entries.length === 0}
                            aria-label="Sync to Google Sheets"
                            style={{ 
                                opacity: (isSyncing || entries.length === 0) ? 0.6 : 1,
                                cursor: (isSyncing || entries.length === 0) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSyncing ? (
                                <>⏳ Syncing...</>
                            ) : (
                                <>📊 Sync to Sheets</>
                            )}
                        </button>
                        <button 
                            className="btn-logout" 
                            onClick={handleLogout}
                            aria-label="Sign out"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <TabNavigation currentView={currentView} onViewChange={setCurrentView} />

            {currentView === 'input' ? (
                <InputView
                    entries={entries}
                    setEntries={setEntries}
                    editingEntry={editingEntry}
                    setEditingEntry={setEditingEntry}
                    onSaveComplete={handleSaveComplete}
                    generateThreeWords={generateThreeWords}
                    isGenerating={isGenerating}
                    suggestedWords={suggestedWords}
                    experienceText={experienceText}
                    setExperienceText={setExperienceText}
                    setError={setError}
                    setSuccessMessage={setSuccessMessage}
                />
            ) : (
                <JournalView
                    entries={entries}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onEntryClick={openModal}
                    onEditEntry={handleEditEntry}
                />
            )}

            {/* Entry Detail Modal */}
            {showModal && modalEntry && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setShowModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 id="modal-title">Entry Details</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Date Section */}
                        {isEditingDate ? (
                            <div className="inline-edit-container">
                                <div className="inline-edit-label">Edit Experience Date</div>
                                <input
                                    type="date"
                                    value={editDate.split('T')[0]}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid var(--accent-gold)',
                                        borderRadius: '6px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        marginBottom: '0.75rem'
                                    }}
                                    aria-label="Edit experience date"
                                />
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveDate} style={{ flex: 1 }} aria-label="Save date">
                                        Save Date
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditDate} style={{ flex: 1 }} aria-label="Cancel editing date">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="entry-date" 
                                style={{marginBottom: '0.5rem', fontSize: '1rem', cursor: 'pointer'}} 
                                onClick={startEditDate}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        startEditDate();
                                    }
                                }}
                                aria-label="Click to edit experience date"
                            >
                                <strong>Experience Date:</strong><br/>
                                {new Date(modalEntry.experienceDate || modalEntry.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                <span style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginLeft: '0.5rem'}}>✏️ Click to edit</span>
                            </div>
                        )}

                        {modalEntry.experienceDate && modalEntry.experienceDate !== modalEntry.date && !isEditingDate && (
                            <div className="entry-date" style={{marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.7}}>
                                Recorded: {new Date(modalEntry.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        )}

                        {/* Three Words Section */}
                        {isEditMode ? (
                            <div className="edit-mode-container">
                                <div className="inline-edit-label">Edit Three Words</div>
                                <div className="edit-words-input">
                                    <input
                                        type="text"
                                        value={editWords[0]}
                                        onChange={(e) => setEditWords([e.target.value, editWords[1], editWords[2]])}
                                        maxLength="20"
                                        placeholder="Word 1"
                                        aria-label="Edit first word"
                                    />
                                    <input
                                        type="text"
                                        value={editWords[1]}
                                        onChange={(e) => setEditWords([editWords[0], e.target.value, editWords[2]])}
                                        maxLength="20"
                                        placeholder="Word 2"
                                        aria-label="Edit second word"
                                    />
                                    <input
                                        type="text"
                                        value={editWords[2]}
                                        onChange={(e) => setEditWords([editWords[0], editWords[1], e.target.value])}
                                        maxLength="20"
                                        placeholder="Word 3"
                                        aria-label="Edit third word"
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveEdit} style={{ flex: 1 }} aria-label="Save words">
                                        Save Words
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEdit} style={{ flex: 1 }} aria-label="Cancel editing words">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{marginBottom: '1rem'}}>
                                <div className="entry-words">
                                    {modalEntry.words.map((word, i) => (
                                        <span key={i} className="word-badge">{word}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags Section */}
                        {isEditingTags ? (
                            <div className="inline-edit-container">
                                <div className="inline-edit-label">Edit Tags</div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={editTags.join(', ')}
                                        onChange={(e) => {
                                            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                            setEditTags(tags);
                                        }}
                                        placeholder="Enter tags separated by commas"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid var(--accent-gold)',
                                            borderRadius: '6px',
                                            fontFamily: 'Crimson Pro, serif',
                                            fontSize: '1rem',
                                            marginBottom: '0.75rem'
                                        }}
                                        aria-label="Edit tags"
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveTags} style={{ flex: 1 }} aria-label="Save tags">
                                        Save Tags
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditTags} style={{ flex: 1 }} aria-label="Cancel editing tags">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{marginBottom: '1.5rem'}}>
                                {modalEntry.tags && modalEntry.tags.length > 0 ? (
                                    <div className="entry-tags">
                                        {modalEntry.tags.map((tag, i) => (
                                            <span key={i} className="entry-tag-badge">{tag}</span>
                                        ))}
                                        <span 
                                            style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginLeft: '0.5rem', cursor: 'pointer'}} 
                                            onClick={startEditTags}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    startEditTags();
                                                }
                                            }}
                                        >
                                            ✏️
                                        </span>
                                    </div>
                                ) : (
                                    <div 
                                        style={{display: 'inline-block', cursor: 'pointer', color: 'var(--soft-gray)'}} 
                                        onClick={startEditTags}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                startEditTags();
                                            }
                                        }}
                                    >
                                        + Add tags
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Summary */}
                        {modalEntry.experienceSummary && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(196, 166, 97, 0.1)',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                borderLeft: '3px solid var(--accent-gold)'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--warm-brown)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Quick Summary
                                </div>
                                <div style={{
                                    color: 'var(--warm-brown)',
                                    lineHeight: '1.6'
                                }}>
                                    {modalEntry.experienceSummary}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-actions-grid">
                            <button 
                                className="action-button" 
                                onClick={startEdit}
                                aria-label="Edit words"
                            >
                                ✏️ Edit Words
                            </button>
                            <button 
                                className="action-button" 
                                onClick={startEditTags}
                                aria-label="Change tags"
                            >
                                🏷️ Change Tags
                            </button>
                            <button 
                                className="action-button" 
                                onClick={startEditDate}
                                aria-label="Change date"
                            >
                                📅 Change Date
                            </button>
                            <button 
                                className="action-button" 
                                onClick={() => {
                                    handleEditEntry(modalEntry);
                                    setShowModal(false);
                                }}
                                aria-label="Edit full entry"
                            >
                                ✏️ Edit Entry
                            </button>
                            <button 
                                className="action-button" 
                                onClick={isEditingStory ? cancelEditStory : startEditStory}
                                aria-label={modalEntry.fullStory ? 'Edit story' : 'Add story'}
                            >
                                {modalEntry.fullStory ? '📖 Edit Story' : '📝 Add Story'}
                            </button>
                        </div>

                        {/* Full Story Section */}
                        {isEditingStory ? (
                            <div className="edit-mode-container">
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                    color: 'var(--warm-brown)',
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {modalEntry.fullStory ? 'Edit Full Story' : 'Add Full Story'}
                                </label>
                                <textarea
                                    value={editStory}
                                    onChange={(e) => setEditStory(e.target.value)}
                                    rows="10"
                                    placeholder="Write the full, detailed version of this experience..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        border: '2px solid rgba(196, 166, 97, 0.3)',
                                        borderRadius: '8px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        background: 'white',
                                        color: 'var(--dark-brown)',
                                        lineHeight: '1.6',
                                        marginBottom: '1rem'
                                    }}
                                    aria-label="Full story text"
                                />
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveStory} style={{ flex: 1 }} aria-label="Save story">
                                        Save Story
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditStory} style={{ flex: 1 }} aria-label="Cancel editing story">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : modalEntry.fullStory ? (
                            <div style={{
                                padding: '1.5rem',
                                background: 'var(--cream)',
                                borderRadius: '8px',
                                lineHeight: '1.8',
                                color: 'var(--warm-brown)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--dark-brown)',
                                    marginBottom: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Full Story
                                </div>
                                {modalEntry.fullStory}
                            </div>
                        ) : (
                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(196, 166, 97, 0.05)',
                                borderRadius: '8px',
                                border: '2px dashed rgba(196, 166, 97, 0.3)',
                                textAlign: 'center',
                                color: 'var(--soft-gray)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }} aria-hidden="true">📖</div>
                                <div style={{ fontSize: '0.9rem' }}>No full story yet</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    Click "Add Story" above to write the detailed version
                                </div>
                            </div>
                        )}

                        {/* Delete Button */}
                        {deleteConfirmId === modalEntry.id ? (
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '1rem'
                            }}>
                                <button
                                    className="action-button danger"
                                    onClick={() => {
                                        deleteEntry(modalEntry.id);
                                        setShowModal(false);
                                    }}
                                    style={{ flex: 1 }}
                                    aria-label="Confirm delete entry"
                                >
                                    ✓ Confirm Delete
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{ flex: 1 }}
                                    aria-label="Cancel delete"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                className="action-button danger"
                                onClick={() => setDeleteConfirmId(modalEntry.id)}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem'
                                }}
                                aria-label="Delete entry"
                            >
                                🗑️ Delete Entry
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
